export interface Monitor {
  Id: string
  Name: string
  ServerId: string
  StorageId: string
  Type: string
  Function: MonitorFunction
  Enabled: string
  LinkedMonitors: string
  Triggers: string
  Device: string
  Channel: string
  Format: string
  V4LMultiBuffer: string
  V4LCapturesPerFrame: string
  Protocol: string
  Method: string
  Host: string
  Port: string
  SubPath: string
  Path: string
  SecondPath: string
  Width: string
  Height: string
  Colours: string
  Palette: string
  Orientation: string
  Deinterlacing: string
  DecoderHWAccelName: string
  DecoderHWAccelDevice: string
  SaveJPEGs: string
  VideoWriter: string
  OutputCodec: string
  Encoder: string
  OutputContainer: string
  EncoderParameters: string
  RecordAudio: string
  Controllable: string
  ControlId: string
  ControlDevice: string
  ControlAddress: string
  AutoStopTimeout: string
  Movable: string
  TrackMotion: string
  TrackDelay: string
  ReturnLocation: string
  ReturnDelay: string
  SectionLength: string
  MinSectionLength: string
  FrameSkip: string
  MotionFrameSkip: string
  AnalysisFPSLimit: string
  AnalysisUpdateDelay: string
  MaxFPS: string
  AlarmMaxFPS: string
  FPSReportInterval: string
  RefBlendPerc: string
  AlarmRefBlendPerc: string
  Exif: string
  RTSPDescribe: string
  RTSP2WebEnabled: string
  RTSP2WebType: string
  GroupIds?: string[]
  JanusEnabled: string
  JanusAudioEnabled: string
}

export type MonitorFunction =
  | 'None'
  | 'Monitor'
  | 'Modect'
  | 'Record'
  | 'Mocord'
  | 'Nodect'

export interface MonitorStatus {
  MonitorId: string
  Status: string
  CaptureFPS: string
  AnalysisFPS: string
  CaptureBandwidth: string
}

export interface MonitorWithStatus {
  Monitor: Monitor
  Monitor_Status: MonitorStatus
}

export interface Group {
  Id: string
  Name: string
  ParentId: string | null
  MonitorIds?: string
}
