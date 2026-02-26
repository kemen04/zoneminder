<template>
  <div class="space-y-2">
    <div v-if="loading" class="text-center py-8">
      <span class="text-gray-400 text-sm">Loading events...</span>
    </div>
    <div v-else-if="events.length === 0" class="text-center py-8">
      <span class="text-gray-500 text-sm">No events found</span>
    </div>
    <table v-else class="w-full text-sm">
      <thead>
        <tr class="text-left text-gray-400 border-b border-gray-800">
          <th class="pb-2 font-medium">Monitor</th>
          <th class="pb-2 font-medium">Cause</th>
          <th class="pb-2 font-medium">Start</th>
          <th class="pb-2 font-medium">Duration</th>
          <th class="pb-2 font-medium text-right">Score</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="event in events"
          :key="event.Id"
          class="border-b border-gray-800/50 hover:bg-gray-800/50 cursor-pointer transition-colors"
          @click="$emit('select', event)"
        >
          <td class="py-2 text-gray-300">{{ monitorName(event.MonitorId) }}</td>
          <td class="py-2 text-gray-300">{{ event.Cause }}</td>
          <td class="py-2 text-gray-400">{{ formatDate(event.StartDateTime) }}</td>
          <td class="py-2 text-gray-400">{{ formatDuration(event.Length) }}</td>
          <td class="py-2 text-right">
            <span :class="scoreClass(event.MaxScore)">{{ event.MaxScore }}</span>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="pageCount > 1" class="flex items-center justify-between pt-2">
      <button
        :disabled="page <= 1"
        class="px-3 py-1 rounded text-sm bg-gray-800 text-gray-300 hover:bg-gray-700
               disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        @click="$emit('page', page - 1)"
      >
        Previous
      </button>
      <span class="text-sm text-gray-500">Page {{ page }} of {{ pageCount }}</span>
      <button
        :disabled="page >= pageCount"
        class="px-3 py-1 rounded text-sm bg-gray-800 text-gray-300 hover:bg-gray-700
               disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        @click="$emit('page', page + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ZmEvent } from '@/types/event'
import { useMonitorStore } from '@/stores/monitors'

withDefaults(defineProps<{
  events: ZmEvent[]
  loading?: boolean
  page?: number
  pageCount?: number
}>(), {
  loading: false,
  page: 1,
  pageCount: 1,
})

defineEmits<{
  select: [event: ZmEvent]
  page: [page: number]
}>()

const monitorStore = useMonitorStore()

function monitorName(id: string): string {
  return monitorStore.monitorById.get(id)?.Monitor.Name ?? `Monitor ${id}`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(seconds: string): string {
  const s = parseFloat(seconds)
  if (isNaN(s) || s <= 0) return '-'
  if (s < 60) return `${s.toFixed(0)}s`
  const m = Math.floor(s / 60)
  const rem = Math.floor(s % 60)
  return `${m}m ${rem}s`
}

function scoreClass(score: string): string {
  const s = parseInt(score)
  if (s >= 200) return 'text-red-400 font-medium'
  if (s >= 100) return 'text-yellow-400'
  return 'text-gray-400'
}
</script>
