<template>
  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- Video player (top ~60%) -->
    <div class="flex-[3] min-h-0">
      <TimelinePlayer
        :event="selectedSegment"
        :playhead-ms="playheadMs"
        @timeupdate="onTimeUpdate"
      />
    </div>

    <!-- Event info bar -->
    <div v-if="selectedSegment" class="flex items-center gap-4 px-4 py-2 border-y border-divider glass-subtle">
      <span class="text-sm font-medium text-heading">{{ monitorName }}</span>
      <span class="text-xs text-soft">{{ selectedSegment.name }}</span>
      <span class="text-xs text-muted">{{ selectedSegment.cause }}</span>
      <span class="text-xs text-muted">Score: {{ selectedSegment.maxScore }}</span>
      <div class="flex-1" />
      <span class="text-xs text-muted">{{ playheadTime }}</span>
    </div>

    <!-- Timeline canvas (bottom ~40%) -->
    <div class="flex-[2] min-h-0 relative">
      <div ref="canvasContainer" class="absolute inset-0">
        <!-- Event segments canvas -->
        <canvas
          ref="segmentsCanvas"
          class="absolute inset-0 w-full cursor-crosshair"
          :style="{ height: 'calc(100% - 24px)' }"
          @mousedown="onScrubStart"
          @mousemove="onScrubMove"
          @mouseup="onScrubEnd"
          @mouseleave="onScrubEnd"
        />

        <!-- Time axis canvas (bottom 24px) -->
        <canvas
          ref="axisCanvas"
          class="absolute bottom-0 left-0 w-full"
          style="height: 24px"
        />

        <!-- Playhead line -->
        <div
          v-if="playheadX !== null"
          class="absolute top-0 w-px bg-red-500 pointer-events-none"
          :style="{ left: playheadX + 'px', height: 'calc(100% - 24px)' }"
        >
          <!-- Dot at top -->
          <div class="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-red-500" />
          <!-- Time label -->
          <div class="absolute -top-5 -translate-x-1/2 left-0 text-[10px] text-red-400 whitespace-nowrap">
            {{ playheadTime }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import TimelinePlayer from './TimelinePlayer.vue'
import type { TimelineSegment, TimelineWindow } from '@/types/timeline'
import { drawMonitorRow, drawTimeAxis, drawNowMarker, msToX, xToMs, hitTest } from '@/composables/useTimelineRenderer'
import { useThemeStore } from '@/stores/theme'

const props = defineProps<{
  monitorId: string
  monitorName: string
  segments: TimelineSegment[]
  timelineWindow: TimelineWindow
  selectedEventId: string | null
  playheadMs: number
}>()

const emit = defineEmits<{
  'update:playheadMs': [ms: number]
  'select-event': [eventId: string]
}>()

const theme = useThemeStore()
const canvasContainer = ref<HTMLDivElement>()
const segmentsCanvas = ref<HTMLCanvasElement>()
const axisCanvas = ref<HTMLCanvasElement>()
let isScrubbing = false
let resizeObserver: ResizeObserver | null = null

const selectedSegment = computed(() => {
  if (!props.selectedEventId) return null
  return props.segments.find((s) => s.eventId === props.selectedEventId) ?? null
})

const playheadX = computed(() => {
  const container = canvasContainer.value
  if (!container) return null
  const x = msToX(props.playheadMs, props.timelineWindow, container.clientWidth)
  if (x < 0 || x > container.clientWidth) return null
  return x
})

const playheadTime = computed(() => {
  return new Date(props.playheadMs).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
})

function render() {
  renderSegments()
  renderAxis()
}

function renderSegments() {
  const canvas = segmentsCanvas.value
  const container = canvasContainer.value
  if (!canvas || !container) return

  const dpr = window.devicePixelRatio || 1
  const w = container.clientWidth
  const h = container.clientHeight - 24 // Subtract axis height

  canvas.width = w * dpr
  canvas.height = h * dpr

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.scale(dpr, dpr)
  drawMonitorRow(ctx, props.segments, props.timelineWindow, w, h, props.selectedEventId)
  const isDark = theme.isDark
  drawNowMarker(ctx, props.timelineWindow, w, h, isDark)
}

function renderAxis() {
  const canvas = axisCanvas.value
  const container = canvasContainer.value
  if (!canvas || !container) return

  const dpr = window.devicePixelRatio || 1
  const w = container.clientWidth
  const h = 24

  canvas.width = w * dpr
  canvas.height = h * dpr

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.scale(dpr, dpr)
  const isDark = theme.isDark
  drawTimeAxis(ctx, props.timelineWindow, w, h, isDark)
}

function scrubAt(e: MouseEvent) {
  const container = canvasContainer.value
  if (!container) return

  const rect = container.getBoundingClientRect()
  const x = e.clientX - rect.left
  const ms = xToMs(x, props.timelineWindow, container.clientWidth)
  emit('update:playheadMs', ms)

  // Check if we landed on a segment
  const seg = hitTest(x, props.segments, props.timelineWindow, container.clientWidth)
  if (seg && seg.eventId !== props.selectedEventId) {
    emit('select-event', seg.eventId)
  }
}

function onScrubStart(e: MouseEvent) {
  isScrubbing = true
  scrubAt(e)
}

function onScrubMove(e: MouseEvent) {
  if (!isScrubbing) return
  scrubAt(e)
}

function onScrubEnd() {
  isScrubbing = false
}

function onTimeUpdate(epochMs: number) {
  emit('update:playheadMs', epochMs)
}

watch([() => props.segments, () => props.timelineWindow, () => props.selectedEventId], render, { deep: true })

onMounted(() => {
  render()
  if (canvasContainer.value) {
    resizeObserver = new ResizeObserver(render)
    resizeObserver.observe(canvasContainer.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>
