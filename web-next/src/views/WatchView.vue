<template>
  <div class="h-full flex flex-col lg:flex-row">
    <!-- Main stream area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Toolbar -->
      <div class="flex items-center gap-3 px-4 py-3 border-b border-divider glass-subtle">
        <!-- Group filter -->
        <select v-model="selectedGroup" class="select-glass">
          <option value="">All Monitors</option>
          <option v-for="group in monitorStore.groups" :key="group.Id" :value="group.Id">
            {{ group.Name }}
          </option>
        </select>
        <!-- Monitor select with optgroup by group -->
        <select v-model="selectedMonitorId" class="select-glass flex-1 max-w-xs">
          <option value="" disabled>Select monitor</option>
          <template v-if="monitorStore.groups.length > 0 && !selectedGroup">
            <optgroup
              v-for="group in monitorStore.groups"
              :key="group.Id"
              :label="group.Name"
            >
              <option
                v-for="m in groupMonitors(group.Id)"
                :key="m.Id"
                :value="m.Id"
              >
                {{ m.Name }}
              </option>
            </optgroup>
            <optgroup label="Ungrouped">
              <option
                v-for="m in ungroupedMonitors"
                :key="m.Id"
                :value="m.Id"
              >
                {{ m.Name }}
              </option>
            </optgroup>
          </template>
          <template v-else>
            <option v-for="m in filteredMonitorList" :key="m.Id" :value="m.Id">
              {{ m.Name }}
            </option>
          </template>
        </select>
        <StatusBadge
          v-if="currentStatus"
          :status="currentStatus.Status"
          :fps="currentStatus.CaptureFPS"
        />
        <div class="flex-1" />
        <button
          class="btn-glass rounded-lg px-3 py-1 text-sm transition-colors"
          :class="{ 'bg-primary-500/20 text-primary-300 border-primary-500/30': cycling }"
          @click="toggleCycle"
        >
          {{ cycling ? 'Stop Cycle' : 'Auto Cycle' }}
        </button>
      </div>

      <!-- Stream -->
      <div class="flex-1 relative bg-black">
        <MonitorStream
          v-if="selectedMonitorId"
          :key="selectedMonitorId"
          :monitor-id="selectedMonitorId"
          :monitor-name="currentMonitor?.Name ?? ''"
          :width="currentMonitor?.Width"
          :height="currentMonitor?.Height"
          :janus-enabled="currentMonitor?.JanusEnabled === '1'"
          mode="stream"
          show-method-badge
          class="w-full h-full"
        />
        <div v-else class="flex items-center justify-center h-full text-muted">
          Select a monitor to watch
        </div>
      </div>

      <!-- Monitor info + PTZ -->
      <div v-if="currentMonitor" class="flex items-center gap-4 px-4 py-3 border-t border-divider glass-subtle">
        <div class="flex-1 space-y-1">
          <h2 class="text-sm font-medium text-heading">{{ currentMonitor.Name }}</h2>
          <div class="flex items-center gap-4 text-xs text-soft">
            <span>{{ currentMonitor.Type }}</span>
            <span>{{ friendlyFunction(currentMonitor.Function) }}</span>
            <span>{{ currentMonitor.Width }}x{{ currentMonitor.Height }}</span>
          </div>
        </div>
        <PtzControls
          v-if="currentMonitor.Controllable === '1'"
          :monitor-id="currentMonitor.Id"
        />
      </div>
    </div>

    <!-- Event sidebar -->
    <aside class="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-divider overflow-auto glass-subtle">
      <div class="px-4 py-3 border-b border-divider">
        <h3 class="text-sm font-medium text-body">Recent Events</h3>
      </div>
      <div class="p-4">
        <EventList
          :events="recentEvents"
          :loading="eventsLoading"
          @select="openEvent"
        />
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, computed, watch, watchEffect, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import MonitorStream from '@/components/MonitorStream.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import PtzControls from '@/components/PtzControls.vue'
import EventList from '@/components/EventList.vue'
import { useMonitorStore } from '@/stores/monitors'
import { useApi } from '@/composables/useApi'
import type { Monitor, MonitorStatus } from '@/types/monitor'
import type { ZmEvent } from '@/types/event'

const route = useRoute()
const router = useRouter()
const monitorStore = useMonitorStore()
const { monitors: monitorsRef } = storeToRefs(monitorStore)
const api = useApi()

const selectedMonitorId = ref(
  typeof route.params.id === 'string' ? route.params.id : '',
)
const selectedGroup = ref('')
const recentEvents = ref<ZmEvent[]>([])
const eventsLoading = ref(false)
const cycling = ref(false)
let cycleTimer: ReturnType<typeof setInterval> | null = null

const currentMonitor = shallowRef<Monitor | null>(null)
const currentStatus = shallowRef<MonitorStatus | null>(null)

/** Monitors filtered by current group */
const filteredMonitorList = computed(() => {
  if (!selectedGroup.value) return monitorStore.monitorList
  const group = monitorStore.groups.find((g) => g.Id === selectedGroup.value)
  if (!group?.MonitorIds) return monitorStore.monitorList
  const ids = new Set(group.MonitorIds.split(','))
  return monitorStore.monitorList.filter((m) => ids.has(m.Id))
})

function groupMonitors(groupId: string) {
  const group = monitorStore.groups.find((g) => g.Id === groupId)
  if (!group?.MonitorIds) return []
  const ids = new Set(group.MonitorIds.split(','))
  return monitorStore.monitorList.filter((m) => ids.has(m.Id))
}

const ungroupedMonitors = computed(() => {
  const allGroupedIds = new Set<string>()
  for (const g of monitorStore.groups) {
    if (g.MonitorIds) {
      for (const id of g.MonitorIds.split(',')) allGroupedIds.add(id)
    }
  }
  return monitorStore.monitorList.filter((m) => !allGroupedIds.has(m.Id))
})

const FUNCTION_LABELS: Record<string, string> = {
  None: 'Disabled',
  Monitor: 'Monitor',
  Modect: 'Detect',
  Record: 'Record',
  Mocord: 'Record + Detect',
  Nodect: 'Passive',
}

function friendlyFunction(func: string): string {
  return FUNCTION_LABELS[func] ?? func
}

watchEffect(() => {
  const id = selectedMonitorId.value
  if (!id) {
    currentMonitor.value = null
    currentStatus.value = null
    return
  }
  const mws = monitorsRef.value.find((m) => m.Monitor.Id === id)
  currentMonitor.value = mws?.Monitor ?? null
  currentStatus.value = mws?.Monitor_Status ?? null
})

async function fetchRecentEvents() {
  if (!selectedMonitorId.value) {
    recentEvents.value = []
    return
  }
  eventsLoading.value = true
  try {
    const data = await api.fetch<{ events: { Event: ZmEvent }[] }>(
      `/events.json?MonitorId=${selectedMonitorId.value}&sort=StartDateTime&direction=desc&limit=20`,
    )
    recentEvents.value = (data.events ?? []).map((e) => e.Event)
  } catch {
    recentEvents.value = []
  } finally {
    eventsLoading.value = false
  }
}

function openEvent(event: ZmEvent) {
  router.push(`/events?eventId=${event.Id}`)
}

function toggleCycle() {
  if (cycling.value) {
    stopCycle()
  } else {
    startCycle()
  }
}

function startCycle() {
  cycling.value = true
  cycleTimer = setInterval(() => {
    const monitors = filteredMonitorList.value
    if (monitors.length < 2) return
    const idx = monitors.findIndex((m) => m.Id === selectedMonitorId.value)
    selectedMonitorId.value = monitors[(idx + 1) % monitors.length].Id
  }, 10_000)
}

function stopCycle() {
  cycling.value = false
  if (cycleTimer) {
    clearInterval(cycleTimer)
    cycleTimer = null
  }
}

watch(selectedMonitorId, () => {
  fetchRecentEvents()
})

// Sync route param
watch(
  () => route.params.id,
  (id) => {
    if (id && typeof id === 'string') {
      selectedMonitorId.value = id
    }
  },
  { immediate: true },
)

onMounted(async () => {
  if (!monitorsRef.value.length) {
    await monitorStore.fetchMonitors()
  }
  if (!monitorStore.groups.length) {
    await monitorStore.fetchGroups()
  }
  // Route param takes priority; fall back to first monitor
  if (!selectedMonitorId.value && monitorsRef.value.length > 0) {
    selectedMonitorId.value = monitorsRef.value[0].Monitor.Id
  }
})

onUnmounted(() => {
  stopCycle()
})
</script>
