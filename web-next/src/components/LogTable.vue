<template>
  <div class="space-y-3">
    <!-- Filters -->
    <div class="flex items-center gap-3 flex-wrap">
      <!-- Level filter -->
      <select v-model="levelFilter" class="select-glass">
        <option value="">All Levels</option>
        <option v-for="level in levels" :key="level" :value="level">{{ level }}</option>
      </select>
      <!-- Component filter -->
      <input
        v-model="componentFilter"
        type="text"
        placeholder="Component..."
        class="select-glass w-32"
      />
      <!-- Message search -->
      <input
        v-model="messageFilter"
        type="text"
        placeholder="Search messages..."
        class="select-glass flex-1 min-w-[200px]"
      />
      <!-- Auto-refresh -->
      <label class="flex items-center gap-1.5 text-xs text-soft cursor-pointer">
        <input v-model="autoRefresh" type="checkbox" class="accent-primary-500 h-3.5 w-3.5" />
        Auto-refresh
      </label>
    </div>

    <!-- Table -->
    <div v-if="loading" class="flex items-center justify-center gap-3 py-12">
      <span class="spinner" />
      <span class="text-soft text-sm">Loading logs...</span>
    </div>
    <div v-else-if="filteredLogs.length === 0" class="text-center py-12">
      <span class="text-muted text-sm">No log entries found</span>
    </div>
    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-xs uppercase tracking-wider text-soft border-b border-divider">
            <th class="pb-2 px-3 font-medium w-36">Time</th>
            <th class="pb-2 px-3 font-medium w-20">Level</th>
            <th class="pb-2 px-3 font-medium w-28">Component</th>
            <th class="pb-2 px-3 font-medium">Message</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="log in filteredLogs"
            :key="log.Id"
            class="border-b border-divider cursor-pointer transition-colors"
            :class="[rowClass(log.Level), expandedId === log.Id ? 'bg-hover' : 'hover:bg-hover']"
            @click="toggleExpand(log.Id)"
          >
            <td class="py-2 px-3 text-soft whitespace-nowrap">{{ formatTime(log.TimeKey) }}</td>
            <td class="py-2 px-3">
              <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" :class="levelBadgeClass(log.Level)">
                {{ levelName(log.Level) }}
              </span>
            </td>
            <td class="py-2 px-3 text-body truncate max-w-[180px]" :title="log.Component">
              {{ log.Component }}
            </td>
            <td class="py-2 px-3 text-body">
              <div :class="expandedId === log.Id ? '' : 'truncate max-w-[500px]'">
                {{ log.Message }}
              </div>
              <div v-if="expandedId === log.Id && log.File" class="mt-1 text-xs text-muted">
                {{ log.File }}:{{ log.Line }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="pageCount > 1" class="flex items-center justify-between pt-2">
      <button
        :disabled="page <= 1"
        class="btn-glass rounded-lg px-3 py-1 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        @click="$emit('page', page - 1)"
      >
        Previous
      </button>
      <span class="text-sm text-muted">Page {{ page }} of {{ pageCount }}</span>
      <button
        :disabled="page >= pageCount"
        class="btn-glass rounded-lg px-3 py-1 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        @click="$emit('page', page + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

export interface LogEntry {
  Id: string
  TimeKey: string
  Component: string
  ServerId: string
  Pid: string
  Level: string
  Code: string
  Message: string
  File: string
  Line: string
}

const props = withDefaults(defineProps<{
  logs: LogEntry[]
  loading?: boolean
  page?: number
  pageCount?: number
}>(), {
  loading: false,
  page: 1,
  pageCount: 1,
})

defineEmits<{
  page: [page: number]
  refresh: []
}>()

const levelFilter = ref('')
const componentFilter = ref('')
const messageFilter = ref('')
const autoRefresh = defineModel<boolean>('autoRefresh', { default: false })
const expandedId = ref('')

const levels = ['Debug', 'Info', 'Warning', 'Error', 'Fatal', 'Panic']

const filteredLogs = computed(() => {
  let result = props.logs
  if (levelFilter.value) {
    result = result.filter((l) => levelName(l.Level) === levelFilter.value)
  }
  if (componentFilter.value) {
    const q = componentFilter.value.toLowerCase()
    result = result.filter((l) => l.Component.toLowerCase().includes(q))
  }
  if (messageFilter.value) {
    const q = messageFilter.value.toLowerCase()
    result = result.filter((l) => l.Message.toLowerCase().includes(q))
  }
  return result
})

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? '' : id
}

// ZM log levels: -5=Panic, -4=Fatal, -3=Error, -2=Warning, -1=Info, 0=Debug, 1+=Debug+
function levelName(level: string): string {
  const n = parseInt(level)
  if (n <= -5) return 'Panic'
  if (n === -4) return 'Fatal'
  if (n === -3) return 'Error'
  if (n === -2) return 'Warning'
  if (n === -1) return 'Info'
  return 'Debug'
}

function levelBadgeClass(level: string): string {
  const name = levelName(level)
  switch (name) {
    case 'Panic':
    case 'Fatal':
      return 'bg-red-500/20 text-red-300'
    case 'Error':
      return 'bg-red-500/10 text-red-400'
    case 'Warning':
      return 'bg-yellow-500/10 text-yellow-400'
    case 'Info':
      return 'bg-primary-500/10 text-primary-400'
    default:
      return 'bg-hover text-soft'
  }
}

function rowClass(level: string): string {
  const name = levelName(level)
  switch (name) {
    case 'Panic':
    case 'Fatal':
      return 'bg-red-500/5'
    case 'Error':
      return 'bg-red-500/3'
    case 'Warning':
      return 'bg-yellow-500/3'
    default:
      return ''
  }
}

function formatTime(timeKey: string): string {
  // TimeKey is a float timestamp
  const ts = parseFloat(timeKey)
  if (isNaN(ts)) return timeKey
  const d = new Date(ts * 1000)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
</script>
