<template>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <!-- Daemon Status -->
    <div class="glass rounded-xl p-4 border border-divider">
      <div class="flex items-center gap-3">
        <div
          class="h-10 w-10 rounded-lg flex items-center justify-center"
          :class="daemonRunning ? 'bg-emerald-500/10' : 'bg-red-500/10'"
        >
          <span
            class="h-3 w-3 rounded-full"
            :class="daemonRunning ? 'bg-emerald-400 pulse-glow-green' : 'bg-red-400 pulse-glow-red'"
          />
        </div>
        <div>
          <div class="text-xs text-soft uppercase tracking-wider">Daemon</div>
          <div class="text-sm font-medium text-heading">
            {{ daemonRunning ? 'Running' : 'Stopped' }}
          </div>
        </div>
      </div>
    </div>

    <!-- System Load -->
    <div class="glass rounded-xl p-4 border border-divider">
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-lg flex items-center justify-center bg-primary-500/10">
          <svg class="h-5 w-5 text-primary-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 7H7v6h6V7z" />
            <path fill-rule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clip-rule="evenodd" />
          </svg>
        </div>
        <div>
          <div class="text-xs text-soft uppercase tracking-wider">Load</div>
          <div class="text-sm font-medium text-heading">{{ loadDisplay }}</div>
        </div>
      </div>
    </div>

    <!-- Disk Usage -->
    <div class="glass rounded-xl p-4 border border-divider">
      <div class="space-y-2">
        <div class="text-xs text-soft uppercase tracking-wider">Disk Usage</div>
        <div v-if="diskLoading" class="flex items-center gap-2 text-sm text-muted">
          <span class="spinner" /> Loading...
        </div>
        <div v-else-if="Object.keys(diskUsage).length === 0" class="text-sm text-muted">
          No data
        </div>
        <div v-for="(info, path) in diskUsage" :key="path" class="space-y-1">
          <div class="flex items-center justify-between text-xs">
            <span class="text-body truncate max-w-[120px]" :title="String(path)">{{ path }}</span>
            <span class="text-soft">{{ diskPercent(info) }}%</span>
          </div>
          <div class="h-1.5 rounded-full bg-hover overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="diskBarColor(diskPercent(info))"
              :style="{ width: `${diskPercent(info)}%` }"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMonitorStore } from '@/stores/monitors'

const monitorStore = useMonitorStore()
const daemonRunning = ref(false)
const loadDisplay = ref('...')
const diskUsage = ref<Record<string, { total: number; used: number; space: number }>>({})
const diskLoading = ref(true)

function diskPercent(info: { total: number; used: number; space: number }): number {
  if (!info.total) return 0
  return Math.round((info.used / info.total) * 100)
}

function diskBarColor(percent: number): string {
  if (percent >= 90) return 'bg-red-400'
  if (percent >= 70) return 'bg-yellow-400'
  return 'bg-emerald-400'
}

onMounted(() => {
  monitorStore.fetchDaemonStatus().then((v) => { daemonRunning.value = v })
  monitorStore.fetchLoad().then((v) => { loadDisplay.value = v || 'N/A' })
  monitorStore.fetchDiskUsage().then((v) => { diskUsage.value = v; diskLoading.value = false })
})
</script>
