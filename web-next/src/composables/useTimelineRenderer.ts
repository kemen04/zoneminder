import type { TimelineSegment, TimelineWindow } from '@/types/timeline'

/** Convert epoch ms to canvas x coordinate */
export function msToX(ms: number, window: TimelineWindow, width: number): number {
  const range = window.endMs - window.startMs
  if (range <= 0) return 0
  return ((ms - window.startMs) / range) * width
}

/** Convert canvas x coordinate to epoch ms */
export function xToMs(x: number, window: TimelineWindow, width: number): number {
  const range = window.endMs - window.startMs
  return window.startMs + (x / width) * range
}

/** Map maxScore to a color */
export function segmentColor(score: number): string {
  if (score >= 200) return '#ef4444' // red-500
  if (score >= 100) return '#f97316' // orange-500
  if (score >= 50) return '#f59e0b'  // amber-500
  return '#3b82f6'                   // blue-500
}

/** Selected variant (brighter) */
function segmentColorSelected(score: number): string {
  if (score >= 200) return '#f87171' // red-400
  if (score >= 100) return '#fb923c' // orange-400
  if (score >= 50) return '#fbbf24'  // amber-400
  return '#60a5fa'                   // blue-400
}

/** Hit test: find the segment at canvas x */
export function hitTest(
  x: number,
  segments: TimelineSegment[],
  window: TimelineWindow,
  width: number,
): TimelineSegment | null {
  const ms = xToMs(x, window, width)
  for (const seg of segments) {
    if (ms >= seg.startMs && ms <= seg.endMs) return seg
  }
  return null
}

/** Draw event segments for a single monitor row */
export function drawMonitorRow(
  ctx: CanvasRenderingContext2D,
  segments: TimelineSegment[],
  window: TimelineWindow,
  width: number,
  height: number,
  selectedEventId?: string | null,
): void {
  ctx.clearRect(0, 0, width, height)

  const segH = Math.round(height * 0.7)
  const segY = Math.round((height - segH) / 2)
  const radius = Math.min(3, segH / 2)

  for (const seg of segments) {
    // Skip segments entirely outside the window
    if (seg.endMs < window.startMs || seg.startMs > window.endMs) continue

    const x1 = Math.max(0, msToX(seg.startMs, window, width))
    const x2 = Math.min(width, msToX(seg.endMs, window, width))
    const w = Math.max(1, x2 - x1) // minimum 1px

    const isSelected = seg.eventId === selectedEventId

    ctx.fillStyle = isSelected
      ? segmentColorSelected(seg.maxScore)
      : segmentColor(seg.maxScore)

    // Rounded rect
    ctx.beginPath()
    ctx.roundRect(x1, segY, w, segH, radius)
    ctx.fill()

    // Selected: white border
    if (isSelected) {
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.roundRect(x1, segY, w, segH, radius)
      ctx.stroke()
    }
  }
}

interface TickConfig {
  tickInterval: number
  labelInterval: number
}

function getTickConfig(rangeHours: number): TickConfig {
  if (rangeHours <= 1) return { tickInterval: 5 * 60_000, labelInterval: 15 * 60_000 }
  if (rangeHours <= 6) return { tickInterval: 30 * 60_000, labelInterval: 60 * 60_000 }
  if (rangeHours <= 24) return { tickInterval: 60 * 60_000, labelInterval: 3 * 60 * 60_000 }
  return { tickInterval: 6 * 60 * 60_000, labelInterval: 24 * 60 * 60_000 }
}

/** Draw the time axis below event segments */
export function drawTimeAxis(
  ctx: CanvasRenderingContext2D,
  window: TimelineWindow,
  width: number,
  height: number,
  isDark: boolean,
): void {
  ctx.clearRect(0, 0, width, height)

  const rangeMs = window.endMs - window.startMs
  const rangeHours = rangeMs / (60 * 60_000)
  const { tickInterval, labelInterval } = getTickConfig(rangeHours)

  const tickColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'
  const labelColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'

  // Align first tick to a multiple of tickInterval
  const firstTick = Math.ceil(window.startMs / tickInterval) * tickInterval

  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.font = '10px Inter, system-ui, sans-serif'

  for (let ms = firstTick; ms <= window.endMs; ms += tickInterval) {
    const x = msToX(ms, window, width)
    const isLabel = ms % labelInterval === 0

    // Tick mark
    ctx.strokeStyle = tickColor
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(Math.round(x) + 0.5, 0)
    ctx.lineTo(Math.round(x) + 0.5, isLabel ? 8 : 4)
    ctx.stroke()

    // Label
    if (isLabel) {
      ctx.fillStyle = labelColor
      const d = new Date(ms)
      let label: string
      if (rangeHours > 24) {
        label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      } else {
        label = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      }
      ctx.fillText(label, x, 10)
    }
  }
}

/** Draw the "now" marker as a dashed gray line */
export function drawNowMarker(
  ctx: CanvasRenderingContext2D,
  window: TimelineWindow,
  width: number,
  height: number,
  isDark: boolean,
): void {
  const now = Date.now()
  if (now < window.startMs || now > window.endMs) return

  const x = Math.round(msToX(now, window, width)) + 0.5
  ctx.setLineDash([4, 3])
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x, 0)
  ctx.lineTo(x, height)
  ctx.stroke()
  ctx.setLineDash([])
}
