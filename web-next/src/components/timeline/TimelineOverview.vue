<template>
  <div ref="scrollContainer" class="flex-1 overflow-auto" @scroll="onScroll">
    <!-- Time axis (sticky at top) -->
    <div class="sticky top-0 z-10 flex h-6 border-b border-divider glass-subtle">
      <div class="w-32 lg:w-40 shrink-0" />
      <div ref="axisContainer" class="relative flex-1">
        <canvas ref="axisCanvas" class="absolute inset-0 w-full h-full" />
      </div>
    </div>

    <!-- Virtual scroll spacer -->
    <div :style="{ height: totalHeight + 'px', position: 'relative' }">
      <div :style="{ transform: `translateY(${offsetY}px)` }">
        <TimelineMonitorRow
          v-for="item in visibleItems"
          :key="item.monitor.Monitor.Id"
          :monitor-id="item.monitor.Monitor.Id"
          :monitor-name="item.monitor.Monitor.Name"
          :segments="item.segments"
          :window="timelineWindow"
          :selected-event-id="selectedEventId"
          @select-monitor="(id: string, clickedMs: number) => $emit('select-monitor', id, clickedMs)"
          @select-event="(eventId: string, clickedMs: number) => $emit('select-event', { monitorId: item.monitor.Monitor.Id, eventId, clickedMs })"
        />
      </div>
    </div>

    <!-- Loading indicator -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <span class="spinner" />
      <span class="ml-2 text-sm text-muted">Loading events...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import TimelineMonitorRow from './TimelineMonitorRow.vue'
import type { MonitorWithStatus } from '@/types/monitor'
import type { TimelineSegment, TimelineWindow } from '@/types/timeline'
import { drawTimeAxis, drawNowMarker } from '@/composables/useTimelineRenderer'
import { useThemeStore } from '@/stores/theme'

const props = defineProps<{
  monitors: MonitorWithStatus[]
  eventsByMonitor: Map<string, TimelineSegment[]>
  timelineWindow: TimelineWindow
  selectedEventId: string | null
  loading: boolean
}>()

defineEmits<{
  'select-monitor': [id: string, clickedMs: number]
  'select-event': [payload: { monitorId: string; eventId: string; clickedMs: number }]
}>()

const theme = useThemeStore()
const scrollContainer = ref<HTMLDivElement>()
const axisContainer = ref<HTMLDivElement>()
const axisCanvas = ref<HTMLCanvasElement>()

const ROW_HEIGHT = 48
const BUFFER = 5

const scrollTop = ref(0)
const containerHeight = ref(800)

const totalHeight = computed(() => props.monitors.length * ROW_HEIGHT)

const startIndex = computed(() =>
  Math.max(0, Math.floor(scrollTop.value / ROW_HEIGHT) - BUFFER),
)

const endIndex = computed(() =>
  Math.min(
    props.monitors.length,
    Math.ceil((scrollTop.value + containerHeight.value) / ROW_HEIGHT) + BUFFER,
  ),
)

const offsetY = computed(() => startIndex.value * ROW_HEIGHT)

const visibleItems = computed(() => {
  const items: { monitor: MonitorWithStatus; segments: TimelineSegment[] }[] = []
  for (let i = startIndex.value; i < endIndex.value; i++) {
    const monitor = props.monitors[i]
    if (!monitor) continue
    items.push({
      monitor,
      segments: props.eventsByMonitor.get(monitor.Monitor.Id) ?? [],
    })
  }
  return items
})

function onScroll() {
  if (scrollContainer.value) {
    scrollTop.value = scrollContainer.value.scrollTop
    containerHeight.value = scrollContainer.value.clientHeight
  }
}

function renderAxis() {
  const canvas = axisCanvas.value
  const container = axisContainer.value
  if (!canvas || !container) return

  const dpr = window.devicePixelRatio || 1
  const w = container.clientWidth
  const h = container.clientHeight

  canvas.width = w * dpr
  canvas.height = h * dpr

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.scale(dpr, dpr)
  const isDark = theme.isDark
  drawTimeAxis(ctx, props.timelineWindow, w, h, isDark)
  drawNowMarker(ctx, props.timelineWindow, w, h, isDark)
}

let axisObserver: ResizeObserver | null = null

watch(() => props.timelineWindow, renderAxis, { deep: true })

onMounted(() => {
  onScroll()
  renderAxis()
  if (axisContainer.value) {
    axisObserver = new ResizeObserver(renderAxis)
    axisObserver.observe(axisContainer.value)
  }
})

onBeforeUnmount(() => {
  axisObserver?.disconnect()
})
</script>
