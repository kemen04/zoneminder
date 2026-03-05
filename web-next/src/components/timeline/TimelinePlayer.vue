<template>
  <div class="flex flex-col glass rounded-xl shadow-md overflow-hidden border border-divider">
    <div class="relative aspect-video bg-black">
      <video
        v-if="videoUrl"
        ref="videoEl"
        :src="videoUrl"
        controls
        autoplay
        class="w-full h-full object-contain"
        @loadeddata="onVideoLoaded"
        @timeupdate="onTimeUpdate"
      />
      <div v-else class="flex items-center justify-center h-full text-muted text-sm">
        Select an event on the timeline
      </div>
    </div>

    <!-- Controls -->
    <div v-if="event" class="flex items-center gap-2 px-3 py-2 border-t border-divider">
      <!-- Frame step -->
      <button class="btn-glass rounded-lg px-2 py-1 text-xs" @click="frameStep(-1)">&#9198;</button>
      <button class="btn-glass rounded-lg px-2 py-1 text-xs" @click="frameStep(1)">&#9197;</button>

      <!-- Playback speed -->
      <select v-model="playbackRate" class="select-glass text-xs py-0.5 w-16" @change="updatePlaybackRate">
        <option :value="0.25">0.25x</option>
        <option :value="0.5">0.5x</option>
        <option :value="1">1x</option>
        <option :value="1.5">1.5x</option>
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
// Track whether we're currently seeking to avoid loops
let isSeeking = false

const videoUrl = computed(() => {
  if (!props.event || !props.event.defaultVideo) return ''
  return `/zm/index.php?view=view_video&eid=${props.event.eventId}&token=${auth.accessToken}`
})

function onVideoLoaded() {
  if (videoEl.value) {
    videoEl.value.playbackRate = playbackRate.value
    // If playhead is within this event, seek to that position
    seekToPlayhead()
  }
}

function onTimeUpdate() {
  if (isSeeking || !videoEl.value || !props.event) return
  // Convert video currentTime to absolute epoch ms
  const epochMs = props.event.startMs + videoEl.value.currentTime * 1000
  emit('timeupdate', epochMs)
}

function seekToPlayhead() {
  if (!videoEl.value || !props.event) return
  const offsetMs = props.playheadMs - props.event.startMs
  if (offsetMs >= 0 && offsetMs <= props.event.length * 1000) {
    isSeeking = true
    videoEl.value.currentTime = offsetMs / 1000
    setTimeout(() => { isSeeking = false }, 100)
  }
}

function updatePlaybackRate() {
  if (videoEl.value) {
    videoEl.value.playbackRate = playbackRate.value
  }
}

function frameStep(direction: number) {
  if (!videoEl.value) return
  videoEl.value.pause()
  const fps = props.event?.frames && props.event?.length
    ? props.event.frames / props.event.length
    : 15
  videoEl.value.currentTime += direction / fps
}

// When event changes, reload video
watch(() => props.event?.eventId, () => {
  if (videoEl.value) {
    videoEl.value.load()
  }
})

// When playhead changes externally (scrubbing), seek if within current event
watch(() => props.playheadMs, (ms) => {
  if (!props.event || isSeeking) return
  if (ms >= props.event.startMs && ms <= props.event.endMs) {
    seekToPlayhead()
  }
})
</script>
