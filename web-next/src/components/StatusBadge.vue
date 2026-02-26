<template>
  <span :class="badgeClasses" class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
    <span class="mr-1 h-1.5 w-1.5 rounded-full" :class="dotClass" />
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
      return 'bg-green-900/60 text-green-300'
    case 'signal':
    case 'alarm':
      return 'bg-red-900/60 text-red-300'
    case 'notrunning':
    case 'idle':
      return 'bg-gray-800 text-gray-400'
    default:
      return 'bg-gray-800 text-gray-400'
  }
})

const dotClass = computed(() => {
  switch (props.status?.toLowerCase()) {
    case 'connected':
    case 'running':
      return 'bg-green-400'
    case 'signal':
    case 'alarm':
      return 'bg-red-400 animate-pulse'
    default:
      return 'bg-gray-500'
  }
})
</script>
