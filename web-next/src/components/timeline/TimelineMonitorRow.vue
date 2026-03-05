<template>
  <div
    class="flex items-center h-12 cursor-pointer hover:bg-hover transition-colors group"
    @click="$emit('select-monitor', monitorId, (props.window.startMs + props.window.endMs) / 2)"
  >
    <!-- Monitor name label -->
    <div class="w-32 lg:w-40 shrink-0 px-3 truncate text-sm text-body group-hover:text-heading transition-colors">
      {{ monitorName }}
    </div>

    <!-- Canvas area -->
    <div ref="containerEl" class="relative flex-1 h-full">
      <canvas
        ref="canvasEl"
        class="absolute inset-0 w-full h-full"
        @mousemove="onMouseMove"
        @mouseleave="onMouseLeave"
        @click.stop="onCanvasClick"
      />

      <!-- Now marker -->
      <div
        v-if="nowX !== null"
        class="absolute top-0 bottom-0 w-px pointer-events-none"
        :style="{ left: nowX + 'px', borderLeft: '1px dashed var(--muted-text)', opacity: 0.3 }"
      />

      <!-- Tooltip -->
      <div
        v-if="tooltip"
        class="absolute z-10 glass-strong rounded-lg px-2 py-1 text-xs text-heading shadow-md pointer-events-none border border-divider whitespace-nowrap"
        :style="{ left: tooltip.x + 'px', top: '-32px' }"
      >
        {{ tooltip.text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import type { TimelineSegment, TimelineWindow } from '@/types/timeline'
import { drawMonitorRow, hitTest, msToX, xToMs } from '@/composables/useTimelineRenderer'

const props = defineProps<{
  monitorId: string
  monitorName: string
  segments: TimelineSegment[]
  window: TimelineWindow
  selectedEventId?: string | null
}>()

const emit = defineEmits<{
  'select-monitor': [id: string, clickedMs: number]
  'select-event': [eventId: string, clickedMs: number]
}>()

const canvasEl = ref<HTMLCanvasElement>()
const containerEl = ref<HTMLDivElement>()
const tooltip = ref<{ x: number; text: string } | null>(null)
let resizeObserver: ResizeObserver | null = null

const nowX = computed(() => {
  const now = Date.now()
  if (now < props.window.startMs || now > props.window.endMs) return null
  const el = containerEl.value
  if (!el) return null
  return msToX(now, props.window, el.clientWidth)
})

function render() {
  const canvas = canvasEl.value
  const container = containerEl.value
  if (!canvas || !container) return

  const dpr = window.devicePixelRatio || 1
  const w = container.clientWidth
  const h = container.clientHeight

  canvas.width = w * dpr
  canvas.height = h * dpr

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.scale(dpr, dpr)
  drawMonitorRow(ctx, props.segments, props.window, w, h, props.selectedEventId)
}

function onMouseMove(e: MouseEvent) {
  const canvas = canvasEl.value
  const container = containerEl.value
  if (!canvas || !container) return

  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const seg = hitTest(x, props.segments, props.window, container.clientWidth)

  if (seg) {
    const time = new Date(seg.startMs).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    tooltip.value = {
      x: Math.min(x, container.clientWidth - 120),
      text: `${seg.cause} - Score: ${seg.maxScore} @ ${time}`,
    }
  } else {
    tooltip.value = null
  }
}

function onMouseLeave() {
  tooltip.value = null
}

function onCanvasClick(e: MouseEvent) {
  const canvas = canvasEl.value
  const container = containerEl.value
  if (!canvas || !container) return

  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const clickedMs = xToMs(x, props.window, container.clientWidth)

  // Direct hit on a segment
  const seg = hitTest(x, props.segments, props.window, container.clientWidth)
  if (seg) {
    emit('select-event', seg.eventId, clickedMs)
    return
  }

  // No direct hit — find the nearest segment within a reasonable pixel range
  const nearest = findNearest(clickedMs, props.segments, props.window, container.clientWidth)
  if (nearest) {
    emit('select-event', nearest.eventId, clickedMs)
  } else {
    emit('select-monitor', props.monitorId, clickedMs)
  }
}

/** Find the segment nearest to clickedMs if within 8px tolerance */
function findNearest(
  clickedMs: number,
  segments: TimelineSegment[],
  win: TimelineWindow,
  width: number,
): TimelineSegment | null {
  const tolerancePx = 8
  const msPerPx = (win.endMs - win.startMs) / width
  const toleranceMs = tolerancePx * msPerPx
  let best: TimelineSegment | null = null
  let bestDist = Infinity

  for (const seg of segments) {
    // Distance from click to segment (0 if inside)
    let dist: number
    if (clickedMs < seg.startMs) dist = seg.startMs - clickedMs
    else if (clickedMs > seg.endMs) dist = clickedMs - seg.endMs
    else dist = 0

    if (dist < bestDist && dist <= toleranceMs) {
      bestDist = dist
      best = seg
    }
  }
  return best
}

watch([() => props.segments, () => props.window, () => props.selectedEventId], render, { deep: true })

onMounted(() => {
  render()
  if (containerEl.value) {
    resizeObserver = new ResizeObserver(render)
    resizeObserver.observe(containerEl.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>
