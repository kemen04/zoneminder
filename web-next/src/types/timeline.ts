export interface TimelineSegment {
  eventId: string
  monitorId: string
  startMs: number
  endMs: number
  maxScore: number
  cause: string
  name: string
  defaultVideo: string
  length: number
  frames: number
}

export interface TimelineWindow {
  startMs: number
  endMs: number
}

export type ZoomLevel = 1 | 6 | 12 | 24 | 168
