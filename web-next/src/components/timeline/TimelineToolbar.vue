<template>
  <div class="flex items-center gap-2 px-4 py-2 border-b border-divider glass-subtle flex-wrap">
    <!-- Back button (detail mode) -->
    <button
      v-if="showBack"
      class="btn-glass rounded-lg px-2 py-1 text-xs"
      @click="emit('back')"
    >
      &larr; All Cameras
    </button>

    <h1 class="text-lg font-semibold text-heading mr-2">Timeline</h1>

    <!-- Zoom buttons -->
    <div class="flex items-center gap-1">
      <button
        v-for="z in zoomLevels"
        :key="z.value"
        class="btn-glass rounded-lg px-2 py-1 text-xs"
        :class="z.value === zoom ? 'bg-primary-500/20 text-primary-300' : ''"
        @click="emit('zoom', z.value)"
      >
        {{ z.label }}
      </button>
    </div>

    <!-- Now button -->
    <button
      class="btn-glass rounded-lg px-2 py-1 text-xs"
      @click="emit('snap-now')"
    >
      Now
    </button>

    <!-- Date picker -->
    <input
      type="date"
      :value="dateValue"
      class="select-glass text-xs py-0.5 px-2"
      @change="onDateChange"
    />

    <div class="flex-1" />

    <!-- Group filter -->
    <select
      v-if="groups.length > 0"
      :value="groupFilter"
      class="select-glass text-xs py-0.5 w-36"
      @change="emit('group', ($event.target as HTMLSelectElement).value)"
    >
      <option value="">All Monitors</option>
      <option v-for="g in groups" :key="g.Id" :value="g.Id">{{ g.Name }}</option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ZoomLevel } from '@/types/timeline'
import type { Group } from '@/types/monitor'

const props = defineProps<{
  zoom: ZoomLevel
  windowStartMs: number
  showBack: boolean
  groupFilter: string
  groups: Group[]
}>()

const emit = defineEmits<{
  zoom: [level: ZoomLevel]
  'snap-now': []
  'jump-date': [ms: number]
  back: []
  group: [id: string]
}>()

const zoomLevels = [
  { value: 1 as ZoomLevel, label: '1h' },
  { value: 6 as ZoomLevel, label: '6h' },
  { value: 12 as ZoomLevel, label: '12h' },
  { value: 24 as ZoomLevel, label: '24h' },
  { value: 168 as ZoomLevel, label: '7d' },
]

const dateValue = computed(() => {
  const d = new Date(props.windowStartMs)
  return d.toISOString().slice(0, 10)
})

function onDateChange(e: Event) {
  const val = (e.target as HTMLInputElement).value
  if (!val) return
  const d = new Date(val + 'T12:00:00')
  emit('jump-date', d.getTime())
}
</script>
