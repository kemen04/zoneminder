<template>
  <div class="h-full flex flex-col">
    <!-- Toolbar -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-divider glass-subtle">
      <h1 class="text-lg font-semibold text-heading">Dashboard</h1>
      <div class="flex items-center gap-3">
        <!-- Group filter -->
        <select v-model="selectedGroup" class="select-glass">
          <option value="">All Monitors</option>
          <option v-for="group in monitorStore.groups" :key="group.Id" :value="group.Id">
            {{ group.Name }}
          </option>
        </select>
        <router-link to="/monitors/new" class="btn-gradient rounded-lg px-3 py-1.5 text-sm inline-flex items-center gap-1.5">
          <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          Add Monitor
        </router-link>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto p-4 space-y-6">
      <!-- System Health -->
      <SystemHealth />

      <!-- Summary cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="glass rounded-xl p-4 border border-divider">
          <div class="text-xs text-soft uppercase tracking-wider">Monitors</div>
          <div class="text-2xl font-bold text-heading mt-1">{{ filteredMonitors.length }}</div>
        </div>
        <div class="glass rounded-xl p-4 border border-divider">
          <div class="text-xs text-soft uppercase tracking-wider">Active</div>
          <div class="text-2xl font-bold text-emerald-400 mt-1">{{ activeCount }}</div>
        </div>
        <div class="glass rounded-xl p-4 border border-divider">
          <div class="text-xs text-soft uppercase tracking-wider">Alarms</div>
          <div class="text-2xl font-bold mt-1" :class="alarmCount > 0 ? 'text-red-400' : 'text-heading'">
            {{ alarmCount }}
          </div>
        </div>
        <div class="glass rounded-xl p-4 border border-divider">
          <div class="text-xs text-soft uppercase tracking-wider">Disabled</div>
          <div class="text-2xl font-bold text-muted mt-1">{{ disabledCount }}</div>
        </div>
      </div>

      <!-- Monitor Table -->
      <div class="glass rounded-xl border border-divider p-4">
        <div v-if="monitorStore.isLoading && filteredMonitors.length === 0" class="flex items-center justify-center py-12">
          <span class="spinner" />
          <span class="ml-3 text-soft text-sm">Loading monitors...</span>
        </div>
        <MonitorTable v-else :monitors="filteredMonitors" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import SystemHealth from '@/components/SystemHealth.vue'
import MonitorTable from '@/components/MonitorTable.vue'
import { useMonitorStore } from '@/stores/monitors'

const monitorStore = useMonitorStore()
const selectedGroup = ref('')

const filteredMonitors = computed(() => {
  if (!selectedGroup.value) return monitorStore.monitors
  const group = monitorStore.groups.find((g) => g.Id === selectedGroup.value)
  if (!group?.MonitorIds) return monitorStore.monitors
  const ids = new Set(group.MonitorIds.split(','))
  return monitorStore.monitors.filter((m) => ids.has(m.Monitor.Id))
})

const activeCount = computed(() =>
  filteredMonitors.value.filter((m) => {
    const s = m.Monitor_Status?.Status?.toLowerCase()
    return s === 'connected' || s === 'running'
  }).length,
)

const alarmCount = computed(() =>
  filteredMonitors.value.filter((m) => {
    const s = m.Monitor_Status?.Status?.toLowerCase()
    return s === 'alarm' || s === 'signal'
  }).length,
)

const disabledCount = computed(() =>
  filteredMonitors.value.filter((m) => m.Monitor.Function === 'None').length,
)

onMounted(() => {
  monitorStore.startPolling()
})

onUnmounted(() => {
  monitorStore.stopPolling()
})
</script>
