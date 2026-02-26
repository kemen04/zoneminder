export interface ZmEvent {
  Id: string
  MonitorId: string
  StorageId: string
  Name: string
  Cause: string
  StartDateTime: string
  EndDateTime: string | null
  Width: string
  Height: string
  Length: string
  Frames: string
  AlarmFrames: string
  DefaultVideo: string
  SaveJPEGs: string
  TotScore: string
  AvgScore: string
  MaxScore: string
  Archived: string
  Videoed: string
  Uploaded: string
  Emailed: string
  Messaged: string
  Executed: string
  Notes: string
  MaxScoreFrameId: string
  DiskSpace: string | null
}

export interface Frame {
  Id: string
  EventId: string
  FrameId: string
  Type: string
  TimeStamp: string
  Delta: string
  Score: string
}

export interface EventsResponse {
  events: { Event: ZmEvent }[]
  pagination: {
    page: number
    current: number
    count: number
    prevPage: boolean
    nextPage: boolean
    pageCount: number
    limit: number
  }
}
