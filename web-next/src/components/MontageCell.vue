<template>
  <div
    ref="cellEl"
    class="relative h-full rounded-xl overflow-hidden bg-surface-100 cursor-pointer group"
    :class="{ 'ring-2 ring-red-500 animate-pulse': isAlarmed }"
    @click="$emit('select', monitor.Id)"
  >
    <MonitorStream
      ref="streamRef"
      :monitor-id="monitor.Id"
      :monitor-name="monitor.Name"
      :width="monitor.Width"
      :height="monitor.Height"
      :janus-enabled="monitor.JanusEnabled === '1'"
      :mode="lowRes ? 'snapshot' : 'stream'"
      :show-method-badge="false"
    />
    <!-- Name overlay -->
    <div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-100 group-hover:opacity-100 transition-opacity">
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium text-white truncate">{{ monitor.Name }}</span>
        <StatusBadge
          :status="status?.Status ?? 'Unknown'"
          :fps="status?.CaptureFPS"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import MonitorStream from './MonitorStream.vue'
import StatusBadge from './StatusBadge.vue'
import type { Monitor, MonitorStatus } from '@/types/monitor'

const props = defineProps<{
  monitor: Monitor
  status?: MonitorStatus | null
  lowRes?: boolean
}>()

defineEmits<{
  select: [monitorId: string]
}>()

const cellEl = ref<HTMLElement>()
const streamRef = ref<InstanceType<typeof MonitorStream>>()

const isAlarmed = computed(() => {
  const s = props.status?.Status?.toLowerCase()
  return s === 'alarm' || s === 'signal'
})

function pause() {
  streamRef.value?.pause()
}

function resume() {
  streamRef.value?.resume()
}

defineExpose({ pause, resume, cellEl })
</script>
