<template>
  <div class="h-full flex flex-col lg:flex-row">
    <!-- Event list panel -->
    <div class="flex-1 flex flex-col min-w-0 border-r border-divider">
      <!-- Toolbar -->
      <div class="flex items-center gap-3 px-4 py-3 border-b border-divider glass-subtle flex-wrap">
        <h1 class="text-lg font-semibold text-heading mr-2">Events</h1>
        <EventFilters v-model="filters" @search="fetchEvents" />
      </div>

      <!-- Bulk actions -->
      <div v-if="selectedIds.size > 0" class="flex items-center gap-3 px-4 py-2 bg-primary-500/5 border-b border-divider">
        <span class="text-sm text-body">{{ selectedIds.size }} selected</span>
        <button class="btn-glass rounded-lg px-2 py-1 text-xs text-red-400" @click="bulkDelete">
          Delete Selected
        </button>
        <button class="btn-glass rounded-lg px-2 py-1 text-xs" @click="selectedIds.clear()">
          Clear
        </button>
      </div>

      <!-- View toggle -->
      <div class="flex items-center justify-between px-4 py-2 border-b border-divider">
        <div class="flex items-center gap-2">
          <button
            class="btn-glass rounded-lg px-2 py-1 text-xs"
            :class="viewMode === 'list' ? 'bg-primary-500/20 text-primary-300' : ''"
            @click="viewMode = 'list'"
          >
            List
          </button>
          <button
            class="btn-glass rounded-lg px-2 py-1 text-xs"
            :class="viewMode === 'grid' ? 'bg-primary-500/20 text-primary-300' : ''"
            @click="viewMode = 'grid'"
          >
            Thumbnails
          </button>
        </div>
        <span class="text-xs text-muted">j/k: navigate, Space: play, Del: delete</span>
      </div>

      <!-- Error banner -->
      <div v-if="error" class="mx-4 mt-3 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
        <span>{{ error }}</span>
        <button class="text-xs underline ml-4" @click="fetchEvents">Retry</button>
      </div>

      <!-- Event list/grid -->
      <div ref="eventListContainer" class="flex-1 overflow-auto p-4">
        <!-- Thumbnail grid view -->
        <div v-if="viewMode === 'grid'" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div
            v-for="(event, i) in events"
            :key="event.Id"
            class="group relative rounded-lg overflow-hidden bg-surface-100 cursor-pointer transition-all"
            :class="{ 'ring-2 ring-primary-400': selectedEvent?.Id === event.Id, 'ring-2 ring-primary-300/50': selectedIds.has(event.Id) }"
            @click="selectEvent(event, i)"
          >
            <div class="aspect-video bg-black">
              <img
                :src="thumbnailUrl(event)"
                :alt="event.Name"
                class="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div class="p-2">
              <div class="text-xs font-medium text-heading truncate">{{ monitorName(event.MonitorId) }}</div>
              <div class="text-[10px] text-soft">{{ formatDate(event.StartDateTime) }}</div>
              <div class="flex items-center justify-between mt-1">
                <span class="text-[10px] text-soft">{{ event.Cause }}</span>
                <span :class="scoreClass(event.MaxScore)" class="text-[10px]">{{ event.MaxScore }}</span>
              </div>
            </div>
            <!-- Checkbox -->
            <div class="absolute top-1.5 left-1.5">
              <input
                type="checkbox"
                :checked="selectedIds.has(event.Id)"
                class="accent-primary-500 h-3.5 w-3.5"
                @click.stop
                @change="toggleSelect(event.Id)"
              />
            </div>
          </div>
        </div>

        <!-- List view -->
        <div v-else>
          <EventList
            :events="events"
            :loading="loading"
            :page="page"
            :page-count="pageCount"
            :selected-id="selectedEvent?.Id"
            :selected-ids="selectedIds"
            @select="(e, i) => selectEvent(e, i)"
            @toggle-select="toggleSelect"
            @page="changePage"
          />
        </div>
      </div>
    </div>

    <!-- Player panel -->
    <div class="w-full lg:w-[45%] xl:w-[40%] overflow-auto bg-page">
      <div class="p-4">
        <EventPlayer
          :event="selectedEvent"
          @prev="prevEvent"
          @next="nextEvent"
          @delete="deleteEvent"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import EventFilters from '@/components/EventFilters.vue'
import EventList from '@/components/EventList.vue'
import EventPlayer from '@/components/EventPlayer.vue'
import { useMonitorStore } from '@/stores/monitors'
import { useApi } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'
import type { ZmEvent } from '@/types/event'
import type { EventFilterValues } from '@/components/EventFilters.vue'
import { isNumericId } from '@/lib/validate'

const route = useRoute()
const monitorStore = useMonitorStore()
const auth = useAuthStore()
const api = useApi()

const events = ref<ZmEvent[]>([])
const selectedEvent = ref<ZmEvent | null>(null)
const selectedIds = ref<Set<string>>(new Set())
const selectedIndex = ref(-1)
const loading = ref(false)
const error = ref('')
const page = ref(1)
const pageCount = ref(1)
const viewMode = ref<'list' | 'grid'>('list')
const eventListContainer = ref<HTMLElement>()

const filters = ref<EventFilterValues>({
  monitorId: '',
  startDate: '',
  endDate: '',
  minScore: '',
  alarmOnly: false,
})

function monitorName(id: string): string {
  return monitorStore.monitorById.get(id)?.Monitor.Name ?? `Monitor ${id}`
}

function thumbnailUrl(event: ZmEvent): string {
  return `/zm/index.php?view=image&eid=${event.Id}&fid=snapshot&token=${auth.accessToken}`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function scoreClass(score: string): string {
  const s = parseInt(score)
  if (s >= 200) return 'text-red-400 font-medium'
  if (s >= 100) return 'text-yellow-400'
  return 'text-soft'
}

async function fetchEvents() {
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams({
      sort: 'StartDateTime',
      direction: 'desc',
      limit: '25',
      page: page.value.toString(),
    })
    const f = filters.value
    if (f.monitorId) params.set('MonitorId', f.monitorId)
    if (f.startDate) params.set('StartDateTime >=', f.startDate)
    if (f.endDate) params.set('StartDateTime <=', f.endDate)
    if (f.minScore) params.set('MaxScore >=', f.minScore)
    if (f.alarmOnly) params.set('AlarmFrames >=', '1')

    const data = await api.fetch<{
      events: { Event: ZmEvent }[]
      pagination: { pageCount: number; page: number }
    }>(`/events.json?${params.toString()}`)

    events.value = (data.events ?? []).map((e) => e.Event)
    pageCount.value = data.pagination?.pageCount ?? 1
    page.value = data.pagination?.page ?? 1
  } catch (e) {
    console.error('Failed to fetch events:', e)
    error.value = e instanceof Error ? e.message : 'Failed to load events'
    events.value = []
  } finally {
    loading.value = false
  }
}

function selectEvent(event: ZmEvent, index?: number) {
  selectedEvent.value = event
  selectedIndex.value = index ?? events.value.findIndex((e) => e.Id === event.Id)
}

function toggleSelect(id: string) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
  // Trigger reactivity
  selectedIds.value = new Set(selectedIds.value)
}

function prevEvent() {
  if (selectedIndex.value > 0) {
    selectedIndex.value--
    selectedEvent.value = events.value[selectedIndex.value]
  }
}

function nextEvent() {
  if (selectedIndex.value < events.value.length - 1) {
    selectedIndex.value++
    selectedEvent.value = events.value[selectedIndex.value]
  }
}

async function deleteEvent(event: ZmEvent) {
  if (!confirm(`Delete event "${event.Name}" from ${monitorName(event.MonitorId)}?`)) return
  try {
    await api.fetch(`/events/${event.Id}.json`, { method: 'DELETE' })
    events.value = events.value.filter((e) => e.Id !== event.Id)
    if (selectedEvent.value?.Id === event.Id) {
      selectedEvent.value = events.value[selectedIndex.value] ?? events.value[selectedIndex.value - 1] ?? null
    }
  } catch {
    // ignore
  }
}

async function bulkDelete() {
  const count = selectedIds.value.size
  if (!confirm(`Delete ${count} event${count > 1 ? 's' : ''}? This cannot be undone.`)) return
  const ids = [...selectedIds.value]
  for (const id of ids) {
    try {
      await api.fetch(`/events/${id}.json`, { method: 'DELETE' })
    } catch {
      // continue
    }
  }
  events.value = events.value.filter((e) => !selectedIds.value.has(e.Id))
  selectedIds.value.clear()
  if (selectedEvent.value && !events.value.find((e) => e.Id === selectedEvent.value!.Id)) {
    selectedEvent.value = events.value[0] ?? null
  }
}

function changePage(p: number) {
  page.value = p
  fetchEvents()
}

// Keyboard navigation
function onKeydown(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return

  switch (e.key) {
    case 'j':
      nextEvent()
      e.preventDefault()
      break
    case 'k':
      prevEvent()
      e.preventDefault()
      break
    case ' ':
      // Toggle play/pause handled by EventPlayer
      break
    case 'ArrowLeft':
      // Frame step back - handled by EventPlayer
      break
    case 'ArrowRight':
      // Frame step forward - handled by EventPlayer
      break
    case 'Delete':
    case 'Backspace':
      if (selectedEvent.value) {
        deleteEvent(selectedEvent.value)
        e.preventDefault()
      }
      break
  }
}

// Load event from URL query param
watch(
  () => route.query.eventId,
  async (id) => {
    if (isNumericId(id) && !selectedEvent.value) {
      try {
        const data = await api.fetch<{ event: { Event: ZmEvent } }>(`/events/${id}.json`)
        selectedEvent.value = data.event?.Event ?? null
      } catch {
        // ignore
      }
    }
  },
  { immediate: true },
)

onMounted(() => {
  if (!monitorStore.monitors.length) {
    monitorStore.fetchMonitors()
  }
  fetchEvents()
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>
