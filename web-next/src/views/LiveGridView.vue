<template>
  <div class="h-full flex flex-col">
    <!-- Toolbar -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-divider glass-subtle">
      <h1 class="text-lg font-semibold text-heading">Live Grid</h1>
      <div class="flex items-center gap-3">
        <!-- Group filter -->
        <select v-model="selectedGroup" class="select-glass">
          <option value="">All Monitors</option>
          <option v-for="group in monitorStore.groups" :key="group.Id" :value="group.Id">
            {{ group.Name }}
          </option>
        </select>
        <!-- Column count -->
        <select v-model="colCount" class="select-glass">
          <option :value="1">1 Column</option>
          <option :value="2">2 Columns</option>
          <option :value="3">3 Columns</option>
          <option :value="4">4 Columns</option>
          <option :value="6">6 Columns</option>
        </select>
      </div>
    </div>

    <!-- Grid -->
    <div ref="gridContainer" class="flex-1 overflow-auto p-4">
      <div v-if="monitorStore.isLoading && filteredMonitors.length === 0" class="grid gap-4" :style="{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }">
        <div v-for="n in colCount * 2" :key="n" class="aspect-video rounded-xl skeleton" />
      </div>
      <div v-else-if="filteredMonitors.length === 0" class="flex items-center justify-center h-64">
        <span class="text-muted">No monitors found</span>
      </div>
      <div
        v-else
        class="grid gap-4"
        :style="{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }"
      >
        <div
          v-for="(mws, i) in filteredMonitors"
          :key="mws.Monitor.Id"
          :ref="(el) => setCardRef(mws.Monitor.Id, el as HTMLElement | null)"
          class="aspect-video animate-fade-in"
          :style="{ animationDelay: `${Math.min(i * 50, 500)}ms` }"
        >
          <MonitorCard
            :ref="(el) => setStreamRef(mws.Monitor.Id, el)"
            :monitor="mws.Monitor"
            :status="mws.Monitor_Status"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import MonitorCard from '@/components/MonitorCard.vue'
import { useMonitorStore } from '@/stores/monitors'

const monitorStore = useMonitorStore()
const selectedGroup = ref('')
const colCount = ref(3)
const gridContainer = ref<HTMLElement>()

const filteredMonitors = computed(() => {
  if (!selectedGroup.value) return monitorStore.monitors
  const group = monitorStore.groups.find((g) => g.Id === selectedGroup.value)
  if (!group || !group.MonitorIds) return monitorStore.monitors
  const ids = new Set(group.MonitorIds.split(','))
  return monitorStore.monitors.filter((m) => ids.has(m.Monitor.Id))
})

// Intersection Observer for lazy stream loading
const cardRefs = new Map<string, HTMLElement>()
const streamRefs = new Map<string, InstanceType<typeof MonitorCard>>()
let observer: IntersectionObserver | null = null

function setCardRef(id: string, el: HTMLElement | null) {
  if (el) {
    cardRefs.set(id, el)
  } else {
    cardRefs.delete(id)
  }
}

function setStreamRef(id: string, el: unknown) {
  if (el) {
    streamRefs.set(id, el as InstanceType<typeof MonitorCard>)
  } else {
    streamRefs.delete(id)
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
        const streamComponent = streamRefs.get(id)
        // MonitorCard doesn't expose pause/resume directly —
        // the MonitorStream inside it does via its ref.
        // For now we use a simple visibility approach:
        // cards not in viewport will have their streams paused via CSS containment
        // and the stream component's built-in pause/resume
        const streamEl = (streamComponent as unknown as { $el?: HTMLElement })?.$el
        const monitorStream = streamEl?.querySelector('[data-stream]') as unknown as { pause?: () => void; resume?: () => void } | null

        if (monitorStream) {
          if (entry.isIntersecting) {
            monitorStream.resume?.()
          } else {
            monitorStream.pause?.()
          }
        }
      }
    },
    {
      root: gridContainer.value,
      rootMargin: '100px',
      threshold: 0.1,
    },
  )

  // Observe all card elements
  for (const [id, el] of cardRefs) {
    el.dataset.monitorId = id
    observer.observe(el)
  }
}

// Re-setup observer when monitors change
watch(filteredMonitors, async () => {
  await nextTick()
  setupObserver()
})

onMounted(() => {
  monitorStore.startPolling()
})

onUnmounted(() => {
  monitorStore.stopPolling()
  if (observer) {
    observer.disconnect()
    observer = null
  }
})
</script>
