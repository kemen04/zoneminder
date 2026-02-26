<template>
  <div class="h-full flex flex-col">
    <!-- Toolbar -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-800">
      <h1 class="text-lg font-semibold text-gray-100">Live Grid</h1>
      <div class="flex items-center gap-3">
        <!-- Group filter -->
        <select
          v-model="selectedGroup"
          class="rounded-md bg-gray-800 border border-gray-700 text-sm text-gray-300 px-2 py-1
                 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Monitors</option>
          <option v-for="group in monitorStore.groups" :key="group.Id" :value="group.Id">
            {{ group.Name }}
          </option>
        </select>
        <!-- Column count -->
        <select
          v-model="colCount"
          class="rounded-md bg-gray-800 border border-gray-700 text-sm text-gray-300 px-2 py-1
                 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option :value="1">1 Column</option>
          <option :value="2">2 Columns</option>
          <option :value="3">3 Columns</option>
          <option :value="4">4 Columns</option>
          <option :value="6">6 Columns</option>
        </select>
      </div>
    </div>

    <!-- Grid -->
    <div class="flex-1 overflow-auto p-4">
      <div v-if="monitorStore.isLoading && filteredMonitors.length === 0" class="flex items-center justify-center h-64">
        <span class="text-gray-400">Loading monitors...</span>
      </div>
      <div v-else-if="filteredMonitors.length === 0" class="flex items-center justify-center h-64">
        <span class="text-gray-500">No monitors found</span>
      </div>
      <div
        v-else
        class="grid gap-3"
        :style="{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }"
      >
        <div v-for="mws in filteredMonitors" :key="mws.Monitor.Id" class="aspect-video">
          <MonitorCard
            :monitor="mws.Monitor"
            :status="mws.Monitor_Status"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import MonitorCard from '@/components/MonitorCard.vue'
import { useMonitorStore } from '@/stores/monitors'

const monitorStore = useMonitorStore()
const selectedGroup = ref('')
const colCount = ref(3)

const filteredMonitors = computed(() => {
  if (!selectedGroup.value) return monitorStore.monitors
  const group = monitorStore.groups.find((g) => g.Id === selectedGroup.value)
  if (!group || !group.MonitorIds) return monitorStore.monitors
  const ids = new Set(group.MonitorIds.split(','))
  return monitorStore.monitors.filter((m) => ids.has(m.Monitor.Id))
})

onMounted(() => {
  monitorStore.startPolling()
  monitorStore.fetchGroups()
})

onUnmounted(() => {
  monitorStore.stopPolling()
})
</script>
