<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="text-left text-xs uppercase tracking-wider text-soft border-b border-divider">
          <th
            v-for="col in columns"
            :key="col.key"
            class="pb-2 px-3 font-medium cursor-pointer select-none hover:text-heading transition-colors"
            :class="col.align === 'right' ? 'text-right' : ''"
            @click="toggleSort(col.key)"
          >
            <span class="inline-flex items-center gap-1">
              {{ col.label }}
              <span v-if="sortField === col.key" class="text-primary-400">
                {{ sortDir === 'asc' ? '&#9650;' : '&#9660;' }}
              </span>
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="mws in sortedMonitors"
          :key="mws.Monitor.Id"
          class="border-b border-divider hover:bg-hover cursor-pointer transition-colors"
          @click="$router.push(`/watch/${mws.Monitor.Id}`)"
        >
          <!-- Status dot -->
          <td class="py-2.5 px-3">
            <span class="inline-flex items-center gap-2">
              <span
                class="h-2 w-2 rounded-full shrink-0"
                :class="statusDotClass(mws)"
              />
              <span class="text-heading font-medium">{{ mws.Monitor.Name }}</span>
            </span>
          </td>
          <!-- Function -->
          <td class="py-2.5 px-3">
            <select
              :value="mws.Monitor.Function"
              class="select-glass text-xs py-0.5"
              @click.stop
              @change="changeFunction(mws.Monitor.Id, ($event.target as HTMLSelectElement).value)"
            >
              <option v-for="(label, val) in functionOptions" :key="val" :value="val">
                {{ label }}
              </option>
            </select>
          </td>
          <!-- Source -->
          <td class="py-2.5 px-3 text-soft truncate max-w-[200px]" :title="sourceDisplay(mws.Monitor)">
            {{ sourceDisplay(mws.Monitor) }}
          </td>
          <!-- Resolution -->
          <td class="py-2.5 px-3 text-soft">
            {{ mws.Monitor.Width }}x{{ mws.Monitor.Height }}
          </td>
          <!-- FPS -->
          <td class="py-2.5 px-3 text-right">
            <span v-if="mws.Monitor_Status?.CaptureFPS" class="text-body">
              {{ parseFloat(mws.Monitor_Status.CaptureFPS).toFixed(1) }}
            </span>
            <span v-else class="text-muted">-</span>
          </td>
          <!-- Events -->
          <td class="py-2.5 px-3 text-right text-body">
            {{ eventCount(mws.Monitor.Id) }}
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="monitors.length === 0" class="text-center py-8 text-muted text-sm">
      No monitors found
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMonitorStore } from '@/stores/monitors'
import type { Monitor, MonitorWithStatus } from '@/types/monitor'

const props = defineProps<{
  monitors: MonitorWithStatus[]
}>()

const monitorStore = useMonitorStore()

const functionOptions: Record<string, string> = {
  None: 'Disabled',
  Monitor: 'Monitor',
  Modect: 'Detect',
  Record: 'Record',
  Mocord: 'Record + Detect',
  Nodect: 'Passive',
}

const columns = [
  { key: 'name', label: 'Monitor' },
  { key: 'function', label: 'Function' },
  { key: 'source', label: 'Source' },
  { key: 'resolution', label: 'Resolution' },
  { key: 'fps', label: 'FPS', align: 'right' },
  { key: 'events', label: 'Events', align: 'right' },
]

const sortField = ref('name')
const sortDir = ref<'asc' | 'desc'>('asc')

function toggleSort(key: string) {
  if (sortField.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = key
    sortDir.value = 'asc'
  }
}

const sortedMonitors = computed(() => {
  const list = [...props.monitors]
  const dir = sortDir.value === 'asc' ? 1 : -1

  list.sort((a, b) => {
    let va: string | number = ''
    let vb: string | number = ''

    switch (sortField.value) {
      case 'name':
        va = a.Monitor.Name.toLowerCase()
        vb = b.Monitor.Name.toLowerCase()
        break
      case 'function':
        va = a.Monitor.Function
        vb = b.Monitor.Function
        break
      case 'source':
        va = sourceDisplay(a.Monitor)
        vb = sourceDisplay(b.Monitor)
        break
      case 'resolution':
        va = parseInt(a.Monitor.Width) * parseInt(a.Monitor.Height)
        vb = parseInt(b.Monitor.Width) * parseInt(b.Monitor.Height)
        break
      case 'fps':
        va = parseFloat(a.Monitor_Status?.CaptureFPS ?? '0')
        vb = parseFloat(b.Monitor_Status?.CaptureFPS ?? '0')
        break
      case 'events':
        va = eventCount(a.Monitor.Id)
        vb = eventCount(b.Monitor.Id)
        break
    }

    if (va < vb) return -dir
    if (va > vb) return dir
    return 0
  })

  return list
})

function statusDotClass(mws: MonitorWithStatus): string {
  const status = mws.Monitor_Status?.Status?.toLowerCase()
  if (mws.Monitor.Function === 'None') return 'bg-gray-500'
  if (status === 'alarm' || status === 'signal') return 'bg-red-400 pulse-glow-red'
  if (status === 'connected' || status === 'running') return 'bg-emerald-400 pulse-glow-green'
  return 'bg-gray-500'
}

function sourceDisplay(monitor: Monitor): string {
  if (monitor.Path) return monitor.Path
  if (monitor.Host) return monitor.Host
  return monitor.Type || '-'
}

function eventCount(_monitorId: string): number {
  // Event counts come from the monitors API in TotalEvents field if available
  // For now return a placeholder — the API doesn't always include this
  return 0
}

async function changeFunction(monitorId: string, func: string) {
  await monitorStore.updateMonitorFunction(monitorId, func)
}
</script>
