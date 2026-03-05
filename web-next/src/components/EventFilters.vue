<template>
  <div class="flex items-center gap-3 flex-wrap">
    <!-- Monitor filter -->
    <select :value="modelValue.monitorId" class="select-glass" @change="update('monitorId', ($event.target as HTMLSelectElement).value)">
      <option value="">All Monitors</option>
      <option v-for="m in monitorStore.monitorList" :key="m.Id" :value="m.Id">
        {{ m.Name }}
      </option>
    </select>

    <!-- Quick date filters -->
    <div class="flex items-center gap-1">
      <button
        v-for="qf in quickFilters"
        :key="qf.label"
        class="btn-glass rounded-lg px-2 py-1 text-xs"
        :class="activeQuick === qf.label
          ? 'bg-primary-500/20 text-primary-300 border-primary-500/30'
          : ''"
        @click="applyQuickFilter(qf)"
      >
        {{ qf.label }}
      </button>
    </div>

    <!-- Custom date range -->
    <input
      :value="modelValue.startDate"
      type="datetime-local"
      class="select-glass text-xs"
      placeholder="Start date"
      @change="update('startDate', ($event.target as HTMLInputElement).value)"
    />
    <input
      :value="modelValue.endDate"
      type="datetime-local"
      class="select-glass text-xs"
      placeholder="End date"
      @change="update('endDate', ($event.target as HTMLInputElement).value)"
    />

    <!-- Min score -->
    <input
      :value="modelValue.minScore"
      type="number"
      placeholder="Min score"
      class="select-glass w-24"
      @change="update('minScore', ($event.target as HTMLInputElement).value)"
    />

    <!-- Alarm only toggle -->
    <label class="flex items-center gap-1.5 text-xs text-soft cursor-pointer">
      <input
        :checked="modelValue.alarmOnly"
        type="checkbox"
        class="accent-primary-500 h-3.5 w-3.5"
        @change="update('alarmOnly', ($event.target as HTMLInputElement).checked)"
      />
      Alarms only
    </label>

    <button class="btn-gradient rounded-lg px-3 py-1 text-sm" @click="$emit('search')">
      Search
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useMonitorStore } from '@/stores/monitors'

export interface EventFilterValues {
  monitorId: string
  startDate: string
  endDate: string
  minScore: string
  alarmOnly: boolean
}

const props = defineProps<{
  modelValue: EventFilterValues
}>()

const emit = defineEmits<{
  'update:modelValue': [value: EventFilterValues]
  search: []
}>()

const monitorStore = useMonitorStore()
const activeQuick = ref('')

const quickFilters = [
  { label: 'Today', days: 0 },
  { label: '24h', days: 1 },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
]

function update(key: string, value: string | boolean) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

function applyQuickFilter(qf: { label: string; days: number }) {
  activeQuick.value = qf.label
  const now = new Date()
  let startDate: string
  if (qf.days === 0) {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    startDate = start.toISOString().slice(0, 19)
  } else {
    const start = new Date(now.getTime() - qf.days * 86400_000)
    startDate = start.toISOString().slice(0, 19)
  }
  emit('update:modelValue', { ...props.modelValue, startDate, endDate: '' })
  emit('search')
}
</script>
