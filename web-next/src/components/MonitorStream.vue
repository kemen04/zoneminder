<template>
  <div class="relative w-full h-full bg-black overflow-hidden">
    <!-- go2rtc WebRTC stream -->
    <video-stream
      v-if="useWebRtc"
      ref="streamEl"
      class="block w-full h-full"
    />
    <!-- MJPEG fallback -->
    <img
      v-else-if="mjpegUrl"
      :src="mjpegUrl"
      class="block w-full h-full object-contain"
      @load="isConnected = true"
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

const props = defineProps<{
  monitorId: string
  monitorName: string
  width?: string
  height?: string
}>()

const auth = useAuthStore()
const streamEl = ref<HTMLElement>()
const isConnected = ref(false)
const useWebRtc = ref(false)
const statusText = ref('Connecting...')

// Check if go2rtc is available (once, cached)
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

// MJPEG stream URL
const mjpegUrl = computed(() => {
  if (!props.monitorId || !auth.accessToken || useWebRtc.value) return ''
  const w = props.width ?? '640'
  const h = props.height ?? '480'
  return `/zm/cgi-bin/nph-zms?mode=jpeg&monitor=${props.monitorId}&scale=100&maxfps=5&buffer=1000&w=${w}&h=${h}&token=${auth.accessToken}`
})

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

  // Fallback: if no video within 5s, switch to MJPEG
  fallbackTimer = window.setTimeout(() => {
    const video = el.querySelector('video')
    if (!video || video.readyState < 2) {
      disconnectWebRtc()
      useWebRtc.value = false
      statusText.value = 'Connecting...'
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
    // Wait for the video-stream element to render
    await new Promise((r) => setTimeout(r, 50))
    connectWebRtc()
  } else {
    useWebRtc.value = false
  }
}

watch(() => [props.monitorId, props.monitorName], () => {
  if (useWebRtc.value) {
    disconnectWebRtc()
    connectWebRtc()
  }
  // MJPEG re-renders automatically via computed
})

onMounted(init)

onUnmounted(() => {
  if (useWebRtc.value) disconnectWebRtc()
})
</script>
