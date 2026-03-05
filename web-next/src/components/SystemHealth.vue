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

    <!-- CPU Load -->
    <div class="glass rounded-xl p-4 border border-divider">
      <div class="space-y-2">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-lg flex items-center justify-center" :class="cpuIconBg">
            <svg class="h-5 w-5" :class="cpuIconColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 7H7v6h6V7z" />
              <path fill-rule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="flex-1">
            <div class="text-xs text-soft uppercase tracking-wider">CPU Load</div>
            <div class="text-sm font-medium text-heading">{{ cpuLabel }}</div>
          </div>
        </div>
        <div v-if="cpuPct >= 0" class="h-1.5 rounded-full bg-hover overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="cpuBarColor"
            :style="{ width: `${Math.min(cpuPct, 100)}%` }"
          />
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
        <div v-else-if="diskEntries.length === 0" class="text-sm text-muted">
          No data
        </div>
        <template v-else>
          <!-- Per-monitor bars (proportional to largest) -->
          <div v-for="entry in diskEntries" :key="entry.name" class="space-y-1">
            <div class="flex items-center justify-between text-xs">
              <span class="text-body truncate max-w-[120px]" :title="entry.name">{{ entry.name }}</span>
              <span class="text-soft">{{ entry.label }}</span>
            </div>
            <div class="h-1.5 rounded-full bg-hover overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="entry.name === 'Total' ? 'bg-red-400' : 'bg-primary-400'"
                :style="{ width: `${entry.pct}%` }"
              />
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMonitorStore } from '@/stores/monitors'

const monitorStore = useMonitorStore()
const daemonRunning = ref(false)
const loadAvg = ref<number[]>([])
const cpuCores = ref(0)
const diskUsage = ref<Record<string, { space: string; color: string }>>({})
const diskLoading = ref(true)

// 1-min load average as a percentage of server CPU cores
const cpuPct = computed(() => {
  if (!loadAvg.value.length || !cpuCores.value) return -1
  return Math.round((loadAvg.value[0] / cpuCores.value) * 100)
})

const cpuLabel = computed(() => {
  if (!loadAvg.value.length) return '...'
  const load1 = loadAvg.value[0].toFixed(2)
  if (!cpuCores.value) return load1
  const pct = cpuPct.value
  const status = pct <= 50 ? 'Low' : pct <= 80 ? 'Moderate' : pct <= 100 ? 'High' : 'Overloaded'
  return `${status} (${pct}%) — ${load1}`
})

const cpuBarColor = computed(() => {
  const pct = cpuPct.value
  if (pct > 100) return 'bg-red-400'
  if (pct > 80) return 'bg-yellow-400'
  return 'bg-emerald-400'
})

const cpuIconBg = computed(() => {
  const pct = cpuPct.value
  if (pct > 100) return 'bg-red-500/10'
  if (pct > 80) return 'bg-yellow-500/10'
  return 'bg-primary-500/10'
})

const cpuIconColor = computed(() => {
  const pct = cpuPct.value
  if (pct > 100) return 'text-red-400'
  if (pct > 80) return 'text-yellow-400'
  return 'text-primary-400'
})

/** Format GB value for display */
function formatSpace(gb: number): string {
  if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`
  if (gb >= 1) return `${gb.toFixed(1)} GB`
  return `${(gb * 1024).toFixed(0)} MB`
}

/** Build display entries: each monitor + Total, bars proportional to max */
const diskEntries = computed(() => {
  const raw = diskUsage.value
  if (!raw || Object.keys(raw).length === 0) return []

  const entries = Object.entries(raw).map(([name, info]) => ({
    name,
    space: parseFloat(info.space) || 0,
  }))

  const maxSpace = Math.max(...entries.map((e) => e.space), 0.001)

  // Put Total last, others sorted by space descending
  const monitors = entries.filter((e) => e.name !== 'Total').sort((a, b) => b.space - a.space)
  const total = entries.find((e) => e.name === 'Total')

  const result = monitors.map((e) => ({
    name: e.name,
    label: formatSpace(e.space),
    pct: Math.round((e.space / maxSpace) * 100),
  }))

  if (total) {
    result.push({
      name: 'Total',
      label: formatSpace(total.space),
      pct: 100,
    })
  }

  return result
})

onMounted(() => {
  monitorStore.fetchDaemonStatus().then((v) => { daemonRunning.value = v })
  monitorStore.fetchLoad().then((v) => { loadAvg.value = v.load; cpuCores.value = v.cpus })
  monitorStore.fetchDiskUsage().then((v) => { diskUsage.value = v; diskLoading.value = false })
})
</script>
