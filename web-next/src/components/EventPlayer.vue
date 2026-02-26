<template>
  <div class="flex flex-col bg-gray-900 rounded-lg overflow-hidden">
    <div class="relative aspect-video bg-black">
      <video
        v-if="videoUrl"
        ref="videoEl"
        :src="videoUrl"
        controls
        autoplay
        class="w-full h-full object-contain"
      />
      <div v-else class="flex items-center justify-center h-full text-gray-500 text-sm">
        Select an event to play
      </div>
    </div>
    <div v-if="event" class="p-3 space-y-2">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-medium text-gray-200">{{ event.Name }}</h3>
        <span class="text-xs text-gray-500">{{ event.Cause }}</span>
      </div>
      <div class="flex items-center gap-4 text-xs text-gray-400">
        <span>{{ formatDate(event.StartDateTime) }}</span>
        <span>{{ formatDuration(event.Length) }}</span>
        <span>{{ event.Frames }} frames</span>
        <span>Score: {{ event.MaxScore }}</span>
      </div>
      <div v-if="event.Notes" class="text-xs text-gray-500">
        {{ event.Notes }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { ZmEvent } from '@/types/event'

const props = defineProps<{
  event: ZmEvent | null
}>()

const auth = useAuthStore()
const videoEl = ref<HTMLVideoElement>()

const videoUrl = computed(() => {
  if (!props.event || !props.event.DefaultVideo) return ''
  return `/zm/api/events/${props.event.Id}/video.mp4?token=${auth.accessToken}`
})

watch(() => props.event, () => {
  if (videoEl.value) {
    videoEl.value.load()
  }
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
