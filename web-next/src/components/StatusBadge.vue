<template>
  <span :class="badgeClasses" class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
    <span class="mr-1.5 h-2 w-2 rounded-full" :class="dotClass" />
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: string
  fps?: string
}>()

const label = computed(() => {
  if (props.fps && parseFloat(props.fps) > 0) {
    return `${parseFloat(props.fps).toFixed(1)} fps`
  }
  return props.status || 'Unknown'
})

const badgeClasses = computed(() => {
  switch (props.status?.toLowerCase()) {
    case 'connected':
    case 'running':
      return 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20'
    case 'signal':
    case 'alarm':
      return 'bg-red-500/10 text-red-300 ring-1 ring-red-500/20'
    case 'notrunning':
    case 'idle':
      return 'bg-white/5 text-gray-400 ring-1 ring-white/10'
    default:
      return 'bg-white/5 text-gray-400 ring-1 ring-white/10'
  }
})

const dotClass = computed(() => {
  switch (props.status?.toLowerCase()) {
    case 'connected':
    case 'running':
      return 'bg-emerald-400 pulse-glow-green'
    case 'signal':
    case 'alarm':
      return 'bg-red-400 pulse-glow-red'
    default:
      return 'bg-gray-500'
  }
})
</script>
