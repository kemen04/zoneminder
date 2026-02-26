<template>
  <div class="relative w-full h-full bg-black overflow-hidden">
    <!-- go2rtc WebRTC stream -->
    <video-stream
      v-if="useWebRtc"
      ref="streamEl"
      class="block w-full h-full"
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
    <div
      v-if="!isConnected"
      class="absolute inset-0 flex items-center justify-center bg-gray-900/80"
    >
      <span class="text-sm text-gray-400">{{ statusText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMonitorStore } from '@/stores/monitors'

const props = withDefaults(defineProps<{
  monitorId: string
  monitorName: string
  width?: string
  height?: string
  /** "snapshot" polls single JPEGs (grid-friendly), "stream" uses persistent MJPEG */
  mode?: 'snapshot' | 'stream'
}>(), {
  mode: 'snapshot',
})

const auth = useAuthStore()
const monitorStore = useMonitorStore()
const streamEl = ref<HTMLElement>()
const imgEl = ref<HTMLImageElement>()
const isConnected = ref(false)
const useWebRtc = ref(false)
const alive = ref(true)
const statusText = ref('Connecting...')
const snapshotTick = ref(0)
let snapshotTimer: ReturnType<typeof setInterval> | null = null

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
  if (!alive.value) return ''
  if (!props.monitorId || !auth.accessToken || useWebRtc.value) return ''
  const w = props.width ?? '640'
  const h = props.height ?? '480'
  const base = streamBaseUrl()

  if (canStreamMjpeg.value) {
    return `${base}?mode=jpeg&monitor=${props.monitorId}&scale=100&maxfps=5&buffer=1000&w=${w}&h=${h}&token=${auth.accessToken}`
  }

  // Snapshot mode: single JPEG, cache-busted by snapshotTick
  void snapshotTick.value
  return `${base}?mode=single&monitor=${props.monitorId}&scale=100&w=${w}&h=${h}&token=${auth.accessToken}&_t=${snapshotTick.value}`
})

function onImgLoad() {
  isConnected.value = true
}

function stopAllStreams() {
  alive.value = false
  stopSnapshotPolling()

  // Force-disconnect MJPEG by blanking the img src
  if (imgEl.value) {
    imgEl.value.src = ''
  }

  if (useWebRtc.value) disconnectWebRtc()
  isConnected.value = false
}

// Snapshot polling (only when not using per-monitor ports or go2rtc)
function startSnapshotPolling() {
  if (canStreamMjpeg.value || useWebRtc.value) return
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

// WebRTC stream setup
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

  // Fallback: if no video within 5s, switch to MJPEG/snapshot
  fallbackTimer = window.setTimeout(() => {
    const video = el.querySelector('video')
    if (!video || video.readyState < 2) {
      disconnectWebRtc()
      useWebRtc.value = false
      statusText.value = 'Connecting...'
      startSnapshotPolling()
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

let fallbackTimer: number | null = null

async function init() {
  const hasGo2rtc = await checkGo2rtc()
  if (hasGo2rtc) {
    useWebRtc.value = true
    await new Promise((r) => setTimeout(r, 50))
    connectWebRtc()
  } else {
    useWebRtc.value = false
    startSnapshotPolling()
  }
}

watch(() => [props.monitorId, props.monitorName], () => {
  if (useWebRtc.value) {
    disconnectWebRtc()
    connectWebRtc()
  }
  snapshotTick.value++
})

onMounted(init)
onUnmounted(stopAllStreams)
</script>
