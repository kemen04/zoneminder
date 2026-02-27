<template>
  <div class="h-full flex flex-col lg:flex-row">
    <!-- Event list panel -->
    <div class="flex-1 flex flex-col min-w-0 border-r border-white/5">
      <!-- Toolbar -->
      <div class="flex items-center gap-3 px-4 py-3 border-b border-white/5 glass-subtle flex-wrap">
        <h1 class="text-lg font-semibold text-gray-100 mr-2">Events</h1>

        <!-- Monitor filter -->
        <select v-model="filters.monitorId" class="select-glass">
          <option value="">All Monitors</option>
          <option v-for="m in monitorStore.monitorList" :key="m.Id" :value="m.Id">
            {{ m.Name }}
          </option>
        </select>

        <!-- Quick date filters -->
        <div class="flex items-center gap-1">
          <button
            v-for="qf in quickFilters"
            :key="qf.label"
            class="btn-glass rounded-lg px-2 py-1 text-xs"
            :class="activeQuickFilter === qf.label
              ? 'bg-primary-500/20 text-primary-300 border-primary-500/30'
              : ''"
            @click="applyQuickFilter(qf)"
          >
            {{ qf.label }}
          </button>
        </div>

        <!-- Min score -->
        <input
          v-model="filters.minScore"
          type="number"
          placeholder="Min score"
          class="select-glass w-24"
        />

        <button
          class="btn-gradient rounded-lg px-3 py-1 text-sm"
          @click="fetchEvents"
        >
          Search
        </button>
      </div>

      <!-- Event table -->
      <div class="flex-1 overflow-auto p-4">
        <EventList
          :events="events"
          :loading="loading"
          :page="page"
          :page-count="pageCount"
          @select="selectEvent"
          @page="changePage"
        />
      </div>
    </div>

    <!-- Player panel -->
    <div class="w-full lg:w-[45%] xl:w-[40%] overflow-auto bg-gray-950">
      <div class="p-4">
        <EventPlayer :event="selectedEvent" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import EventList from '@/components/EventList.vue'
import EventPlayer from '@/components/EventPlayer.vue'
import { useMonitorStore } from '@/stores/monitors'
import { useApi } from '@/composables/useApi'
import type { ZmEvent } from '@/types/event'

const route = useRoute()
const monitorStore = useMonitorStore()
const api = useApi()

const events = ref<ZmEvent[]>([])
const selectedEvent = ref<ZmEvent | null>(null)
const loading = ref(false)
const page = ref(1)
const pageCount = ref(1)
const activeQuickFilter = ref('')

const filters = reactive({
  monitorId: '',
  startDate: '',
  endDate: '',
  minScore: '',
})

const quickFilters = [
  { label: 'Today', days: 0 },
  { label: '24h', days: 1 },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
]

function applyQuickFilter(qf: { label: string; days: number }) {
  activeQuickFilter.value = qf.label
  const now = new Date()
  if (qf.days === 0) {
    // Today: start of day
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    filters.startDate = start.toISOString().slice(0, 19)
  } else {
    const start = new Date(now.getTime() - qf.days * 86400_000)
    filters.startDate = start.toISOString().slice(0, 19)
  }
  filters.endDate = ''
  page.value = 1
  fetchEvents()
}

async function fetchEvents() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      sort: 'StartDateTime',
      direction: 'desc',
      limit: '25',
      page: page.value.toString(),
    })
    if (filters.monitorId) params.set('MonitorId', filters.monitorId)
    if (filters.startDate) params.set('StartDateTime >=', filters.startDate)
    if (filters.endDate) params.set('StartDateTime <=', filters.endDate)
    if (filters.minScore) params.set('MaxScore >=', filters.minScore)

    const data = await api.fetch<{
      events: { Event: ZmEvent }[]
      pagination: { pageCount: number; page: number }
    }>(`/events.json?${params.toString()}`)

    events.value = (data.events ?? []).map((e) => e.Event)
    pageCount.value = data.pagination?.pageCount ?? 1
    page.value = data.pagination?.page ?? 1
  } catch {
    events.value = []
  } finally {
    loading.value = false
  }
}

function selectEvent(event: ZmEvent) {
  selectedEvent.value = event
}

function changePage(p: number) {
  page.value = p
  fetchEvents()
}

// Load event from URL query param
watch(
  () => route.query.eventId,
  async (id) => {
    if (id && typeof id === 'string' && !selectedEvent.value) {
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
})
</script>
