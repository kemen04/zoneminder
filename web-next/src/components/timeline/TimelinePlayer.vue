<template>
  <div class="flex flex-col glass rounded-xl shadow-md overflow-hidden border border-divider h-full">
    <div class="relative flex-1 min-h-0 bg-black">
      <!-- MP4 video (events with DefaultVideo) -->
      <video
        v-if="hasVideo && !videoError"
        ref="videoEl"
        :src="videoUrl"
        controls
        autoplay
        class="w-full h-full object-contain"
        @loadeddata="onVideoLoaded"
        @timeupdate="onTimeUpdate"
        @error="videoError = true"
      />

      <!-- MJPEG streaming playback (events stored as JPEGs) -->
      <img
        v-else-if="event && mjpegUrl"
        :src="mjpegUrl"
        class="w-full h-full object-contain"
      />

      <!-- No event selected -->
      <div v-else class="flex items-center justify-center h-full text-muted text-sm">
        Click an event segment on the timeline
      </div>
    </div>

    <!-- Controls -->
    <div v-if="event" class="flex items-center gap-2 px-3 py-2 border-t border-divider shrink-0">
      <!-- Play/Pause for MJPEG -->
      <button
        v-if="!hasVideo || videoError"
        class="btn-glass rounded-lg px-2 py-1 text-xs"
        @click="mjpegPaused = !mjpegPaused"
      >
        {{ mjpegPaused ? '&#9654; Play' : '&#9646;&#9646; Pause' }}
      </button>

      <!-- Frame step (video only) -->
      <template v-if="hasVideo && !videoError">
        <button class="btn-glass rounded-lg px-2 py-1 text-xs" @click="frameStep(-1)">&#9198;</button>
        <button class="btn-glass rounded-lg px-2 py-1 text-xs" @click="frameStep(1)">&#9197;</button>
      </template>

      <!-- Playback speed -->
      <select v-model="playbackRate" class="select-glass text-xs py-0.5 w-16" @change="onRateChange">
        <option :value="0.5">0.5x</option>
        <option :value="1">1x</option>
        <option :value="2">2x</option>
        <option :value="4">4x</option>
      </select>

      <div class="flex-1" />

      <!-- Event info -->
      <span class="text-xs text-soft truncate">{{ event.name }} &mdash; {{ event.cause }}</span>
      <span class="text-xs text-muted">Score: {{ event.maxScore }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { TimelineSegment } from '@/types/timeline'

const props = defineProps<{
  event: TimelineSegment | null
  playheadMs: number
}>()

const emit = defineEmits<{
  timeupdate: [epochMs: number]
}>()

const auth = useAuthStore()
const videoEl = ref<HTMLVideoElement>()
const playbackRate = ref(1)
const videoError = ref(false)
const mjpegPaused = ref(false)
let lastEmittedMs = 0

const hasVideo = computed(() => !!props.event?.defaultVideo)

const videoUrl = computed(() => {
  if (!props.event?.defaultVideo) return ''
  return `/zm/index.php?view=view_video&eid=${props.event.eventId}&token=${auth.accessToken}`
})

/** MJPEG streaming URL for event playback via nph-zms */
const mjpegUrl = computed(() => {
  if (!props.event || mjpegPaused.value) return ''
  const rate = Math.round(playbackRate.value * 100)
  const params = new URLSearchParams({
    source: 'event',
    mode: 'jpeg',
    event: props.event.eventId,
    frame: '1',
    scale: '100',
    rate: rate.toString(),
    maxfps: '30',
    token: auth.accessToken,
  })
  return `/zm/cgi-bin/nph-zms?${params.toString()}`
})

function onVideoLoaded() {
  if (videoEl.value) {
    videoEl.value.playbackRate = playbackRate.value
    seekToPlayhead()
  }
}

function onTimeUpdate() {
  if (!videoEl.value || !props.event) return
  const epochMs = props.event.startMs + videoEl.value.currentTime * 1000
  lastEmittedMs = epochMs
  emit('timeupdate', epochMs)
}

function seekToPlayhead() {
  if (!videoEl.value || !props.event) return
  const offsetMs = props.playheadMs - props.event.startMs
  if (offsetMs >= 0 && offsetMs <= props.event.length * 1000) {
    videoEl.value.currentTime = offsetMs / 1000
  }
}

function onRateChange() {
  if (videoEl.value && hasVideo.value && !videoError.value) {
    videoEl.value.playbackRate = playbackRate.value
  }
  // MJPEG rate change is handled reactively via mjpegUrl recomputing
}

function frameStep(direction: number) {
  if (!videoEl.value) return
  videoEl.value.pause()
  const fps = props.event?.frames && props.event?.length
    ? props.event.frames / props.event.length
    : 15
  videoEl.value.currentTime += direction / fps
}

// When event changes, reset state
watch(() => props.event?.eventId, () => {
  videoError.value = false
  mjpegPaused.value = false
  lastEmittedMs = 0
  if (videoEl.value) {
    videoEl.value.load()
  }
})

// When playhead changes externally (scrubbing), seek video.
// Skip if the change came from our own timeupdate emission.
watch(() => props.playheadMs, (ms) => {
  if (!props.event) return
  if (Math.abs(ms - lastEmittedMs) < 500) return
  if (ms >= props.event.startMs && ms <= props.event.endMs) {
    seekToPlayhead()
  }
})
</script>
