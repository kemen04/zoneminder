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
      />
      <div v-else class="flex items-center justify-center h-full text-muted text-sm">
        Select an event to play
      </div>
    </div>

    <!-- Controls bar -->
    <div v-if="event" class="flex items-center gap-2 px-3 py-2 border-b border-divider">
      <!-- Prev/Next -->
      <button class="btn-glass rounded-lg px-2 py-1 text-xs" title="Previous event (k)" @click="$emit('prev')">
        &#9664; Prev
      </button>
      <button class="btn-glass rounded-lg px-2 py-1 text-xs" title="Next event (j)" @click="$emit('next')">
        Next &#9654;
      </button>

      <div class="flex-1" />

      <!-- Frame step -->
      <button class="btn-glass rounded-lg px-2 py-1 text-xs" title="Previous frame (Left arrow)" @click="frameStep(-1)">
        &#9198;
      </button>
      <button class="btn-glass rounded-lg px-2 py-1 text-xs" title="Next frame (Right arrow)" @click="frameStep(1)">
        &#9197;
      </button>

      <!-- Playback speed -->
      <select v-model="playbackRate" class="select-glass text-xs py-0.5 w-16" @change="updatePlaybackRate">
        <option :value="0.25">0.25x</option>
        <option :value="0.5">0.5x</option>
        <option :value="1">1x</option>
        <option :value="1.5">1.5x</option>
        <option :value="2">2x</option>
        <option :value="4">4x</option>
      </select>

      <!-- Delete -->
      <button
        class="btn-glass rounded-lg px-2 py-1 text-xs text-red-400 hover:text-red-300"
        title="Delete event (Del)"
        @click="$emit('delete', event)"
      >
        Delete
      </button>
    </div>

    <!-- Event info -->
    <div v-if="event" class="p-3 space-y-2">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-medium text-heading">{{ event.Name }}</h3>
        <span class="text-xs text-muted">{{ event.Cause }}</span>
      </div>
      <div class="flex items-center gap-4 text-xs text-soft">
        <span>{{ formatDate(event.StartDateTime) }}</span>
        <span>{{ formatDuration(event.Length) }}</span>
        <span>{{ event.Frames }} frames</span>
        <span>Score: {{ event.MaxScore }}</span>
      </div>
      <div v-if="event.Notes" class="text-xs text-muted">
        {{ event.Notes }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { ZmEvent } from '@/types/event'

const props = defineProps<{
  event: ZmEvent | null
}>()

defineEmits<{
  prev: []
  next: []
  delete: [event: ZmEvent]
}>()

const auth = useAuthStore()
const videoEl = ref<HTMLVideoElement>()
const playbackRate = ref(1)

const videoUrl = computed(() => {
  if (!props.event || !props.event.DefaultVideo) return ''
  return `/zm/api/events/${props.event.Id}/video.mp4?token=${auth.accessToken}`
})

function onVideoLoaded() {
  if (videoEl.value) {
    videoEl.value.playbackRate = playbackRate.value
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
  // Approximate frame duration — assume ~15fps if we don't know better
  const fps = props.event?.Frames && props.event?.Length
    ? parseFloat(props.event.Frames) / parseFloat(props.event.Length)
    : 15
  videoEl.value.currentTime += direction / fps
}

function onKeydown(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return
  if (!videoEl.value) return

  switch (e.key) {
    case ' ':
      if (videoEl.value.paused) {
        videoEl.value.play()
      } else {
        videoEl.value.pause()
      }
      e.preventDefault()
      break
    case 'ArrowLeft':
      frameStep(-1)
      e.preventDefault()
      break
    case 'ArrowRight':
      frameStep(1)
      e.preventDefault()
      break
  }
}

watch(() => props.event, () => {
  if (videoEl.value) {
    videoEl.value.load()
  }
})

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString()
}

function formatDuration(seconds: string): string {
  const s = parseFloat(seconds)
  if (isNaN(s) || s <= 0) return '-'
  if (s < 60) return `${s.toFixed(1)}s`
  const m = Math.floor(s / 60)
  const rem = Math.floor(s % 60)
  return `${m}m ${rem}s`
}
</script>
