<template>
  <div class="h-full flex flex-col">
    <!-- Toolbar -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-divider glass-subtle flex-wrap gap-2">
      <h1 class="text-lg font-semibold text-heading">Live View</h1>
      <div class="flex items-center gap-3 flex-wrap">
        <!-- Group filter -->
        <select v-model="selectedGroup" class="select-glass">
          <option value="">All Monitors</option>
          <option v-for="group in monitorStore.groups" :key="group.Id" :value="group.Id">
            {{ group.Name }}
          </option>
        </select>
        <!-- Layout preset -->
        <select v-model="layout" class="select-glass">
          <option value="auto">Auto-fit</option>
          <option value="1x1">1x1</option>
          <option value="2x2">2x2</option>
          <option value="3x3">3x3</option>
          <option value="4x4">4x4</option>
        </select>
        <!-- Low-res toggle -->
        <label class="flex items-center gap-2 text-sm text-soft cursor-pointer">
          <input v-model="lowRes" type="checkbox" class="accent-primary-500 h-4 w-4" />
          <span>Snapshots</span>
        </label>
        <!-- Page nav -->
        <div v-if="totalPages > 1" class="flex items-center gap-2">
          <button
            class="btn-glass rounded-lg px-2 py-1 text-xs"
            :disabled="currentPage <= 1"
            @click="currentPage--"
          >
            Prev
          </button>
          <span class="text-xs text-muted">{{ currentPage }} / {{ totalPages }}</span>
          <button
            class="btn-glass rounded-lg px-2 py-1 text-xs"
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Grid -->
    <div ref="gridContainer" class="flex-1 overflow-auto p-4">
      <div v-if="monitorStore.isLoading && filteredMonitors.length === 0" class="flex items-center justify-center h-full">
        <span class="spinner" />
        <span class="ml-3 text-soft text-sm">Loading monitors...</span>
      </div>
      <div v-else-if="filteredMonitors.length === 0" class="flex items-center justify-center h-full">
        <span class="text-muted">No monitors found</span>
      </div>
      <div
        v-else
        class="grid gap-3 h-full"
        :style="gridStyle"
      >
        <div
          v-for="mws in pagedMonitors"
          :key="mws.Monitor.Id"
          class="aspect-video"
        >
          <MontageCell
            :ref="(el) => setCellRef(mws.Monitor.Id, el)"
            :monitor="mws.Monitor"
            :status="mws.Monitor_Status"
            :low-res="lowRes"
            @select="expandMonitor"
          />
        </div>
      </div>

      <!-- Expanded overlay -->
      <div
        v-if="expandedId"
        class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
        @click="expandedId = ''"
      >
        <div class="w-full max-w-6xl max-h-[90vh] aspect-video" @click.stop>
          <MonitorStream
            :key="expandedId"
            :monitor-id="expandedId"
            :monitor-name="expandedMonitor?.Name ?? ''"
            :width="expandedMonitor?.Width"
            :height="expandedMonitor?.Height"
            :janus-enabled="expandedMonitor?.JanusEnabled === '1'"
            mode="stream"
            show-method-badge
            class="w-full h-full rounded-xl overflow-hidden"
          />
        </div>
        <button
          class="absolute top-4 right-4 text-white/80 hover:text-white text-2xl"
          @click="expandedId = ''"
        >
          &#10005;
        </button>
        <div class="absolute bottom-4 text-white text-sm">
          {{ expandedMonitor?.Name }} &mdash; Click anywhere or press Escape to close
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import MontageCell from '@/components/MontageCell.vue'
import MonitorStream from '@/components/MonitorStream.vue'
import { useMonitorStore } from '@/stores/monitors'

const monitorStore = useMonitorStore()

const selectedGroup = ref('')
const layout = ref('auto')
const lowRes = ref(false)
const currentPage = ref(1)
const expandedId = ref('')
const gridContainer = ref<HTMLElement>()

const MAX_PER_PAGE = 16

const filteredMonitors = computed(() => {
  if (!selectedGroup.value) return monitorStore.monitors
  const group = monitorStore.groups.find((g) => g.Id === selectedGroup.value)
  if (!group?.MonitorIds) return monitorStore.monitors
  const ids = new Set(group.MonitorIds.split(','))
  return monitorStore.monitors.filter((m) => ids.has(m.Monitor.Id))
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredMonitors.value.length / MAX_PER_PAGE)),
)

const pagedMonitors = computed(() => {
  const start = (currentPage.value - 1) * MAX_PER_PAGE
  return filteredMonitors.value.slice(start, start + MAX_PER_PAGE)
})

const colCount = computed(() => {
  switch (layout.value) {
    case '1x1': return 1
    case '2x2': return 2
    case '3x3': return 3
    case '4x4': return 4
    default: {
      const n = pagedMonitors.value.length
      if (n <= 1) return 1
      if (n <= 4) return 2
      if (n <= 9) return 3
      return 4
    }
  }
})

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${colCount.value}, minmax(0, 1fr))`,
}))

const expandedMonitor = computed(() => {
  if (!expandedId.value) return null
  return monitorStore.monitorById.get(expandedId.value)?.Monitor ?? null
})

function expandMonitor(monitorId: string) {
  expandedId.value = monitorId
}

// Reset page when group changes
watch(selectedGroup, () => {
  currentPage.value = 1
})

// Intersection Observer for lazy loading
const cellRefs = new Map<string, InstanceType<typeof MontageCell>>()
let observer: IntersectionObserver | null = null

function setCellRef(id: string, el: unknown) {
  if (el) {
    cellRefs.set(id, el as InstanceType<typeof MontageCell>)
  } else {
    cellRefs.delete(id)
  }
}

function setupObserver() {
  if (observer) observer.disconnect()
  if (!gridContainer.value) return

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).dataset.monitorId
        if (!id) continue
        const cell = cellRefs.get(id)
        if (!cell) continue
        if (entry.isIntersecting) {
          cell.resume()
        } else {
          cell.pause()
        }
      }
    },
    {
      root: gridContainer.value,
      rootMargin: '50px',
      threshold: 0.1,
    },
  )

  nextTick(() => {
    for (const [id, cell] of cellRefs) {
      if (cell.cellEl) {
        cell.cellEl.dataset.monitorId = id
        observer!.observe(cell.cellEl)
      }
    }
  })
}

watch(pagedMonitors, async () => {
  await nextTick()
  setupObserver()
}, { immediate: true })

// Escape key to close expanded
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && expandedId.value) {
    expandedId.value = ''
  }
}

onMounted(() => {
  monitorStore.startPolling()
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  monitorStore.stopPolling()
  document.removeEventListener('keydown', onKeydown)
  if (observer) {
    observer.disconnect()
    observer = null
  }
})
</script>
