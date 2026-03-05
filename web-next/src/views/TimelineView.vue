<template>
  <div class="h-full flex flex-col">
    <TimelineToolbar
      :zoom="store.zoomHours"
      :window-start-ms="store.window.startMs"
      :show-back="!!store.selectedMonitorId"
      :group-filter="store.groupFilter"
      :groups="monitorStore.groups"
      @zoom="onZoom"
      @snap-now="onSnapNow"
      @jump-date="onJumpDate"
      @back="onBack"
      @group="onGroup"
    />

    <!-- Overview mode -->
    <TimelineOverview
      v-if="!store.selectedMonitorId"
      :monitors="filteredMonitors"
      :events-by-monitor="store.eventsByMonitor"
      :timeline-window="store.window"
      :selected-event-id="store.selectedEventId"
      :loading="store.isLoading"
      @select-monitor="onSelectMonitor"
      @select-event="onSelectEvent"
    />

    <!-- Detail mode -->
    <TimelineDetail
      v-else
      :monitor-id="store.selectedMonitorId"
      :monitor-name="selectedMonitorName"
      :segments="store.selectedSegments"
      :timeline-window="store.window"
      :selected-event-id="store.selectedEventId"
      :playhead-ms="store.playheadMs"
      @update:playhead-ms="store.playheadMs = $event"
      @select-event="store.selectEvent($event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TimelineToolbar from '@/components/timeline/TimelineToolbar.vue'
import TimelineOverview from '@/components/timeline/TimelineOverview.vue'
import TimelineDetail from '@/components/timeline/TimelineDetail.vue'
import { useTimelineStore } from '@/stores/timeline'
import { useMonitorStore } from '@/stores/monitors'
import type { ZoomLevel } from '@/types/timeline'

const route = useRoute()
const router = useRouter()
const store = useTimelineStore()
const monitorStore = useMonitorStore()

const filteredMonitors = computed(() => {
  if (!store.groupFilter) return monitorStore.monitors
  return monitorStore.monitorsByGroup.get(store.groupFilter) ?? []
})

const selectedMonitorName = computed(() => {
  if (!store.selectedMonitorId) return ''
  return monitorStore.monitorById.get(store.selectedMonitorId)?.Monitor.Name ?? ''
})

let panDebounce: ReturnType<typeof setTimeout> | null = null

function onZoom(hours: ZoomLevel) {
  store.setZoom(hours)
  store.invalidateCache()
  refetchVisible()
}

function onSnapNow() {
  store.snapToNow()
  store.invalidateCache()
  refetchVisible()
}

function onJumpDate(ms: number) {
  store.playheadMs = ms
  store.setZoom(store.zoomHours)
  store.invalidateCache()
  refetchVisible()
}

function onBack() {
  store.selectMonitor(null)
  router.replace('/timeline')
}

function onGroup(id: string) {
  store.groupFilter = id
  refetchVisible()
}

function onSelectMonitor(id: string, clickedMs?: number) {
  store.selectMonitor(id)
  if (clickedMs) store.playheadMs = clickedMs
  router.replace(`/timeline/${id}`)
  store.fetchEventsForMonitor(id)

  // Auto-select the nearest event to the clicked/current time
  autoSelectNearestEvent(id)
}

function onSelectEvent(payload: { monitorId: string; eventId: string; clickedMs: number }) {
  store.selectMonitor(payload.monitorId)
  store.selectEvent(payload.eventId)
  store.playheadMs = payload.clickedMs
  router.replace(`/timeline/${payload.monitorId}`)
}

/** Find and select the event closest to the current playhead */
function autoSelectNearestEvent(monitorId: string) {
  const segments = store.eventsByMonitor.get(monitorId)
  if (!segments?.length) return

  const t = store.playheadMs
  let best = segments[0]
  let bestDist = Infinity

  for (const seg of segments) {
    let dist: number
    if (t < seg.startMs) dist = seg.startMs - t
    else if (t > seg.endMs) dist = t - seg.endMs
    else dist = 0
    if (dist < bestDist) {
      bestDist = dist
      best = seg
    }
  }

  store.selectEvent(best.eventId)
  // If playhead isn't inside an event, snap it to the nearest one
  if (t < best.startMs || t > best.endMs) {
    store.playheadMs = best.startMs
  }
}

function refetchVisible() {
  const ids = store.selectedMonitorId
    ? [store.selectedMonitorId]
    : filteredMonitors.value.map((m) => m.Monitor.Id)
  store.fetchVisibleEvents(ids)
}

function onKeydown(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return

  const panAmount = (store.window.endMs - store.window.startMs) * 0.2

  switch (e.key) {
    case 'ArrowLeft':
      store.panBy(-panAmount)
      debouncedRefetch()
      e.preventDefault()
      break
    case 'ArrowRight':
      store.panBy(panAmount)
      debouncedRefetch()
      e.preventDefault()
      break
    case '+':
    case '=': {
      const levels: ZoomLevel[] = [1, 6, 12, 24, 168]
      const idx = levels.indexOf(store.zoomHours)
      if (idx > 0) onZoom(levels[idx - 1])
      e.preventDefault()
      break
    }
    case '-': {
      const levels: ZoomLevel[] = [1, 6, 12, 24, 168]
      const idx = levels.indexOf(store.zoomHours)
      if (idx < levels.length - 1) onZoom(levels[idx + 1])
      e.preventDefault()
      break
    }
    case 'Escape':
      if (store.selectedMonitorId) onBack()
      e.preventDefault()
      break
  }
}

function debouncedRefetch() {
  if (panDebounce) clearTimeout(panDebounce)
  panDebounce = setTimeout(() => {
    store.invalidateCache()
    refetchVisible()
  }, 200)
}

// Route param handling for /timeline/:monitorId
// Not immediate — onMounted initializes window first, then fetches.
// This watcher handles subsequent navigation (e.g., browser back/forward).
watch(
  () => route.params.monitorId,
  (id) => {
    if (id && typeof id === 'string') {
      store.selectMonitor(id)
      store.fetchEventsForMonitor(id)
    } else if (!id) {
      store.selectMonitor(null)
    }
  },
)

onMounted(async () => {
  // Initialize time window FIRST so fetches have valid dates
  store.initWindow()

  // Ensure monitors are loaded
  if (!monitorStore.monitors.length) {
    await monitorStore.fetchMonitors()
    await monitorStore.fetchGroups()
  }

  // Handle initial route param (e.g., /timeline/5)
  const id = route.params.monitorId
  if (id && typeof id === 'string') {
    store.selectMonitor(id)
  }

  // Fetch events for visible monitors
  refetchVisible()

  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  if (panDebounce) clearTimeout(panDebounce)
})
</script>
