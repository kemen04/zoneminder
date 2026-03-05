<template>
  <div class="relative w-full h-full bg-black overflow-hidden">
    <!-- go2rtc WebRTC stream -->
    <video-stream
      v-if="streamMethod === 'go2rtc'"
      ref="streamEl"
      class="block w-full h-full"
    />
    <!-- Janus WebRTC stream -->
    <video
      v-else-if="streamMethod === 'janus'"
      ref="janusVideoEl"
      autoplay
      playsinline
      muted
      class="block w-full h-full object-contain"
    />
    <!-- MJPEG stream or snapshot polling -->
    <img
      v-else-if="imgUrl"
      ref="imgEl"
      :src="imgUrl"
      class="block w-full h-full object-contain"
      @load="onImgLoad"
      @error="isConnected = false"
    />
    <!-- Loading overlay -->
    <div
      v-if="!isConnected"
      class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-100/80 backdrop-blur-sm"
    >
      <span class="spinner" />
      <span class="text-sm text-soft">{{ statusText }}</span>
    </div>
    <!-- Stream method indicator -->
    <div
      v-if="isConnected && showMethodBadge"
      class="absolute top-2 right-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-black/60 text-white/80"
    >
      <span class="h-1.5 w-1.5 rounded-full" :class="methodDotClass" />
      {{ methodLabel }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMonitorStore } from '@/stores/monitors'
import { useJanus } from '@/composables/useJanus'

const props = withDefaults(defineProps<{
  monitorId: string
  monitorName: string
  width?: string
  height?: string
  /** "snapshot" polls single JPEGs (grid-friendly), "stream" uses persistent MJPEG */
  mode?: 'snapshot' | 'stream'
  /** Show stream method badge (WebRTC/MJPEG/Snapshot) */
  showMethodBadge?: boolean
  /** Janus enabled for this monitor */
  janusEnabled?: boolean
}>(), {
  mode: 'snapshot',
  showMethodBadge: false,
  janusEnabled: false,
})

const auth = useAuthStore()
const monitorStore = useMonitorStore()
const janus = useJanus()

const streamEl = ref<HTMLElement>()
const imgEl = ref<HTMLImageElement>()
const janusVideoEl = ref<HTMLVideoElement>()
const isConnected = ref(false)
const streamMethod = ref<'go2rtc' | 'janus' | 'mjpeg' | 'snapshot'>('snapshot')
const alive = ref(true)
const paused = ref(false)
const statusText = ref('Connecting...')
const snapshotTick = ref(0)
let snapshotTimer: ReturnType<typeof setInterval> | null = null
let fallbackTimer: number | null = null

// Check if go2rtc is available (once, cached globally)
let go2rtcChecked = false
let go2rtcAvailable = false

async function checkGo2rtc(): Promise<boolean> {
  if (go2rtcChecked) return go2rtcAvailable
  go2rtcChecked = true
  try {
    const res = await fetch('/go2rtc/api', { method: 'GET', signal: AbortSignal.timeout(2000) })
    go2rtcAvailable = res.ok
  } catch {
    go2rtcAvailable = false
  }
  return go2rtcAvailable
}

// Build the base URL for nph-zms, using per-monitor port if configured
function streamBaseUrl(): string {
  const port = monitorStore.streamingPort(props.monitorId)
  if (port > 0) {
    return `${window.location.protocol}//${window.location.hostname}:${port}/zm/cgi-bin/nph-zms`
  }
  return `/zm/cgi-bin/nph-zms`
}

// Can we use persistent MJPEG? Yes if per-monitor ports are configured or mode is "stream"
const canStreamMjpeg = computed(() => {
  return props.mode === 'stream' || monitorStore.minStreamingPort > 0
})

const imgUrl = computed(() => {
  if (!alive.value || paused.value) return ''
  if (!props.monitorId || !auth.accessToken) return ''
  if (streamMethod.value === 'go2rtc' || streamMethod.value === 'janus') return ''
  const w = props.width ?? '640'
  const h = props.height ?? '480'
  const base = streamBaseUrl()

  if (canStreamMjpeg.value && streamMethod.value === 'mjpeg') {
    return `${base}?mode=jpeg&monitor=${props.monitorId}&scale=100&maxfps=5&buffer=1000&w=${w}&h=${h}&token=${auth.accessToken}`
  }

  // Snapshot mode: single JPEG, cache-busted by snapshotTick
  void snapshotTick.value
  return `${base}?mode=single&monitor=${props.monitorId}&scale=100&w=${w}&h=${h}&token=${auth.accessToken}&_t=${snapshotTick.value}`
})

const methodLabel = computed(() => {
  switch (streamMethod.value) {
    case 'go2rtc': return 'WebRTC'
    case 'janus': return 'Janus'
    case 'mjpeg': return 'MJPEG'
    case 'snapshot': return 'Snapshot'
  }
})

const methodDotClass = computed(() => {
  switch (streamMethod.value) {
    case 'go2rtc':
    case 'janus':
      return 'bg-emerald-400'
    case 'mjpeg':
      return 'bg-blue-400'
    case 'snapshot':
      return 'bg-yellow-400'
  }
})

function onImgLoad() {
  isConnected.value = true
}

function stopAllStreams() {
  alive.value = false
  stopSnapshotPolling()

  if (imgEl.value) {
    imgEl.value.src = ''
  }

  if (streamMethod.value === 'go2rtc') disconnectWebRtc()
  if (streamMethod.value === 'janus') janus.disconnect()
  isConnected.value = false
}

// Snapshot polling
function startSnapshotPolling() {
  stopSnapshotPolling()
  snapshotTimer = setInterval(() => {
    snapshotTick.value++
  }, 2000)
}

function stopSnapshotPolling() {
  if (snapshotTimer) {
    clearInterval(snapshotTimer)
    snapshotTimer = null
  }
}

// go2rtc WebRTC stream setup
function connectWebRtc() {
  const el = streamEl.value as HTMLElement & {
    src: string
    background: boolean
    muted: boolean
  } | undefined
  if (!el) return

  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = `${wsProtocol}//${window.location.host}/go2rtc/ws?src=${props.monitorName}_0`

  requestAnimationFrame(() => {
    el.background = true
    el.muted = true
    el.src = wsUrl
    isConnected.value = true
  })

  // Fallback: if no video within 5s, try next method
  fallbackTimer = window.setTimeout(() => {
    const video = el.querySelector('video')
    if (!video || video.readyState < 2) {
      disconnectWebRtc()
      tryNextMethod('go2rtc')
    }
  }, 5000)
}

function disconnectWebRtc() {
  if (fallbackTimer) {
    clearTimeout(fallbackTimer)
    fallbackTimer = null
  }
  const el = streamEl.value as HTMLElement & { src: string } | undefined
  if (el) el.src = ''
  isConnected.value = false
}

// Janus WebRTC stream setup
async function connectJanus() {
  await nextTick()
  const videoEl = janusVideoEl.value
  if (!videoEl) {
    tryNextMethod('janus')
    return
  }

  await janus.connect(props.monitorId, videoEl)

  if (janus.isConnected.value) {
    isConnected.value = true
  } else {
    tryNextMethod('janus')
  }
}

// Try the next streaming method in the hierarchy
function tryNextMethod(failedMethod: string) {
  statusText.value = 'Connecting...'

  if (failedMethod === 'go2rtc') {
    // Try Janus
    if (props.janusEnabled) {
      streamMethod.value = 'janus'
      connectJanus()
      return
    }
    // Fall through to MJPEG/snapshot
  }

  if (failedMethod === 'go2rtc' || failedMethod === 'janus') {
    // Try MJPEG
    if (canStreamMjpeg.value) {
      streamMethod.value = 'mjpeg'
      return // imgUrl computed will handle it
    }
    // Fall through to snapshot
  }

  // Snapshot fallback
  streamMethod.value = 'snapshot'
  startSnapshotPolling()
}

// Streaming hierarchy: go2rtc → Janus → MJPEG → Snapshot
async function init() {
  if (paused.value) return

  const hasGo2rtc = await checkGo2rtc()
  if (hasGo2rtc) {
    streamMethod.value = 'go2rtc'
    await nextTick()
    connectWebRtc()
    return
  }

  if (props.janusEnabled) {
    streamMethod.value = 'janus'
    await nextTick()
    connectJanus()
    return
  }

  if (canStreamMjpeg.value) {
    streamMethod.value = 'mjpeg'
    return
  }

  streamMethod.value = 'snapshot'
  startSnapshotPolling()
}

// Pause/resume for Intersection Observer
function pause() {
  if (paused.value) return
  paused.value = true
  stopSnapshotPolling()
  if (imgEl.value) imgEl.value.src = ''
  if (streamMethod.value === 'go2rtc') disconnectWebRtc()
  if (streamMethod.value === 'janus') janus.disconnect()
  isConnected.value = false
}

function resume() {
  if (!paused.value) return
  paused.value = false
  alive.value = true
  init()
}

watch(() => [props.monitorId, props.monitorName], () => {
  if (paused.value) return
  if (streamMethod.value === 'go2rtc') {
    disconnectWebRtc()
    connectWebRtc()
  } else if (streamMethod.value === 'janus') {
    janus.disconnect()
    connectJanus()
  }
  snapshotTick.value++
})

defineExpose({ pause, resume })

onMounted(init)
onUnmounted(stopAllStreams)
</script>
