<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Embed EXIF Data</label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input :checked="form.Exif === '1'" type="checkbox" class="accent-primary-500 h-4 w-4" @change="form.Exif = ($event.target as HTMLInputElement).checked ? '1' : '0'" />
          <span class="text-sm text-body">Enabled</span>
        </label>
      </div>
      <div>
        <label class="block text-sm font-medium text-heading mb-1">RTSP Describe</label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input :checked="form.RTSPDescribe === '1'" type="checkbox" class="accent-primary-500 h-4 w-4" @change="form.RTSPDescribe = ($event.target as HTMLInputElement).checked ? '1' : '0'" />
          <span class="text-sm text-body">Enabled</span>
        </label>
      </div>
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Decoder HW Accel</label>
        <input v-model="form.DecoderHWAccelName" type="text" class="select-glass w-full" placeholder="e.g., auto, vaapi, cuda" />
      </div>
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Decoder HW Device</label>
        <input v-model="form.DecoderHWAccelDevice" type="text" class="select-glass w-full" placeholder="e.g., /dev/dri/renderD128" />
      </div>
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Deinterlacing</label>
        <select v-model="form.Deinterlacing" class="select-glass w-full">
          <option value="0">Disabled</option>
          <option value="1">Four Field (top first)</option>
          <option value="2">Four Field (bottom first)</option>
          <option value="3">Discard</option>
          <option value="4">Linear</option>
          <option value="5">Blend</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const form = defineModel<Record<string, string>>({ required: true })
</script>
