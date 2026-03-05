import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import { apiFetch } from '@/lib/api'
import type { ZmEvent, EventsResponse } from '@/types/event'
import type { TimelineSegment, TimelineWindow, ZoomLevel } from '@/types/timeline'

function eventToSegment(ev: ZmEvent): TimelineSegment {
  const startMs = new Date(ev.StartDateTime).getTime()
  const lengthSec = parseFloat(ev.Length) || 0
  const endMs = ev.EndDateTime
    ? new Date(ev.EndDateTime).getTime()
    : startMs + lengthSec * 1000

  return {
    eventId: ev.Id,
    monitorId: ev.MonitorId,
    startMs,
    endMs: Math.max(endMs, startMs + 1000), // at least 1s
    maxScore: parseInt(ev.MaxScore) || 0,
    cause: ev.Cause,
    name: ev.Name,
    defaultVideo: ev.DefaultVideo,
    length: lengthSec,
    frames: parseInt(ev.Frames) || 0,
  }
}

export const useTimelineStore = defineStore('timeline', () => {
  const zoomHours = ref<ZoomLevel>(24)
  const window = ref<TimelineWindow>({ startMs: 0, endMs: 0 })
  const selectedMonitorId = ref<string | null>(null)
  const selectedEventId = ref<string | null>(null)
  const playheadMs = ref(Date.now())
  const isLoading = ref(false)
  const groupFilter = ref('')

  // Cache: monitorId -> segments (for current window)
  const eventsByMonitor = ref<Map<string, TimelineSegment[]>>(new Map())

  // Track which monitor+range combos we've already fetched
  const fetchedRanges = ref<Map<string, { startMs: number; endMs: number }>>(new Map())

  const selectedSegments = computed(() =>
    selectedMonitorId.value
      ? eventsByMonitor.value.get(selectedMonitorId.value) ?? []
      : [],
  )

  function setZoom(hours: ZoomLevel) {
    zoomHours.value = hours
    const center = playheadMs.value || Date.now()
    const halfRange = (hours * 60 * 60 * 1000) / 2
    window.value = {
      startMs: center - halfRange,
      endMs: center + halfRange,
    }
  }

  function initWindow() {
    const now = Date.now()
    playheadMs.value = now
    const halfRange = (zoomHours.value * 60 * 60 * 1000) / 2
    window.value = { startMs: now - halfRange, endMs: now + halfRange }
  }

  function panBy(deltaMs: number) {
    window.value = {
      startMs: window.value.startMs + deltaMs,
      endMs: window.value.endMs + deltaMs,
    }
  }

  function snapToNow() {
    playheadMs.value = Date.now()
    setZoom(zoomHours.value)
  }

  function selectMonitor(id: string | null) {
    selectedMonitorId.value = id
    selectedEventId.value = null
  }

  function selectEvent(eventId: string | null) {
    selectedEventId.value = eventId
  }

  /** Fetch events for a single monitor within the current window.
   *  Avoids comparison operators in the URL (they cause 500 errors on many
   *  ZM setups due to mod_security / PHP $_GET mangling). Instead, fetches
   *  recent events by MonitorId and filters by time window client-side.
   */
  async function fetchEventsForMonitor(monitorId: string): Promise<void> {
    const auth = useAuthStore()
    const w = window.value

    // Guard: don't fetch if window hasn't been initialized yet
    if (w.startMs === 0 && w.endMs === 0) return

    // Check if we already fetched a range that covers the current window
    const cached = fetchedRanges.value.get(monitorId)
    if (cached && cached.startMs <= w.startMs && cached.endMs >= w.endMs) {
      return
    }

    try {
      const token = await auth.ensureValidToken()

      const allSegments: TimelineSegment[] = []
      let page = 1
      let hasMore = true
      let reachedWindowStart = false

      // Fetch pages of events sorted newest-first. Stop when we've gone
      // past the start of the visible window (older than window.startMs).
      while (hasMore && !reachedWindowStart) {
        const params = new URLSearchParams({
          MonitorId: monitorId,
          sort: 'StartDateTime',
          direction: 'desc',
          limit: '200',
          page: page.toString(),
        })

        const data = await apiFetch<EventsResponse>(
          `/events.json?${params.toString()}`,
          token,
        )

        const events = (data.events ?? []).map((e) => e.Event)

        for (const ev of events) {
          const seg = eventToSegment(ev)
          // Keep segments that overlap the visible window
          if (seg.endMs >= w.startMs && seg.startMs <= w.endMs) {
            allSegments.push(seg)
          }
          // If this event ends before the window start, all remaining
          // events (older) are also outside the window — stop fetching
          if (seg.endMs < w.startMs) {
            reachedWindowStart = true
            break
          }
        }

        hasMore = data.pagination?.nextPage === true && events.length > 0
        page++

        // Safety: don't paginate more than 10 pages
        if (page > 10) break
      }

      // Sort segments chronologically (we fetched newest-first)
      allSegments.sort((a, b) => a.startMs - b.startMs)

      eventsByMonitor.value.set(monitorId, allSegments)
      fetchedRanges.value.set(monitorId, { startMs: w.startMs, endMs: w.endMs })
      // Trigger reactivity
      eventsByMonitor.value = new Map(eventsByMonitor.value)
    } catch (e) {
      console.warn(`Failed to fetch events for monitor ${monitorId}:`, e)
      // Set empty segments so we don't retry immediately
      eventsByMonitor.value.set(monitorId, [])
      eventsByMonitor.value = new Map(eventsByMonitor.value)
    }
  }

  /** Batch fetch for multiple monitors, max 6 concurrent */
  async function fetchVisibleEvents(monitorIds: string[]): Promise<void> {
    isLoading.value = true
    const batchSize = 6

    try {
      for (let i = 0; i < monitorIds.length; i += batchSize) {
        const batch = monitorIds.slice(i, i + batchSize)
        await Promise.all(batch.map((id) => fetchEventsForMonitor(id)))
      }
    } finally {
      isLoading.value = false
    }
  }

  /** Clear cache and refetch (e.g., after zoom/pan) */
  function invalidateCache() {
    fetchedRanges.value.clear()
  }

  return {
    zoomHours,
    window,
    selectedMonitorId,
    selectedEventId,
    playheadMs,
    isLoading,
    groupFilter,
    eventsByMonitor,
    selectedSegments,
    setZoom,
    initWindow,
    panBy,
    snapToNow,
    selectMonitor,
    selectEvent,
    fetchEventsForMonitor,
    fetchVisibleEvents,
    invalidateCache,
  }
})
