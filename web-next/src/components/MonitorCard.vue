<template>
  <div
    class="group relative rounded-lg overflow-hidden bg-gray-900 border border-gray-800
           hover:border-gray-600 transition-colors cursor-pointer"
    @click="$router.push(`/watch/${monitor.Id}`)"
  >
    <MonitorStream
      :monitor-id="monitor.Id"
      :monitor-name="monitor.Name"
      :width="monitor.Width"
      :height="monitor.Height"
    />
    <div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-white truncate">
          {{ monitor.Name }}
        </span>
        <StatusBadge
          :status="status?.Status ?? 'Unknown'"
          :fps="status?.CaptureFPS"
        />
      </div>
      <div class="flex items-center gap-2 mt-0.5">
        <span class="text-xs text-gray-400">{{ monitor.Function }}</span>
        <span class="text-xs text-gray-500">{{ monitor.Width }}x{{ monitor.Height }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MonitorStream from './MonitorStream.vue'
import StatusBadge from './StatusBadge.vue'
import type { Monitor, MonitorStatus } from '@/types/monitor'

defineProps<{
  monitor: Monitor
  status?: MonitorStatus | null
}>()
</script>
