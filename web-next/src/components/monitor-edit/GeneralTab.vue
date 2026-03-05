<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Name</label>
        <input v-model="form.Name" type="text" class="select-glass w-full" placeholder="Camera name" />
      </div>
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Function</label>
        <select v-model="form.Function" class="select-glass w-full">
          <option v-for="(label, val) in functionOptions" :key="val" :value="val">{{ label }}</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Enabled</label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input v-model="enabledBool" type="checkbox" class="accent-primary-500 h-4 w-4" />
          <span class="text-sm text-body">{{ enabledBool ? 'Yes' : 'No' }}</span>
        </label>
      </div>
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Type</label>
        <select v-model="form.Type" class="select-glass w-full">
          <option value="Ffmpeg">FFmpeg</option>
          <option value="Libvlc">Libvlc</option>
          <option value="Remote">Remote</option>
          <option value="Local">Local</option>
          <option value="File">File</option>
          <option value="cURL">cURL</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Linked Monitors</label>
        <input v-model="form.LinkedMonitors" type="text" class="select-glass w-full" placeholder="e.g., 1,2,3" />
      </div>
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Notes</label>
        <textarea v-model="form.Notes" rows="2" class="select-glass w-full resize-y" placeholder="Optional description" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const form = defineModel<Record<string, string>>({ required: true })

const functionOptions: Record<string, string> = {
  None: 'Disabled',
  Monitor: 'Monitor',
  Modect: 'Detect',
  Record: 'Record',
  Mocord: 'Record + Detect',
  Nodect: 'Passive',
}

const enabledBool = computed({
  get: () => form.value.Enabled === '1',
  set: (v) => { form.value.Enabled = v ? '1' : '0' },
})
</script>
