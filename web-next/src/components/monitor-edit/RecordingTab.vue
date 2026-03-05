<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Save JPEGs</label>
        <select v-model="form.SaveJPEGs" class="select-glass w-full">
          <option value="0">Disabled</option>
          <option value="1">Frames only</option>
          <option value="2">Analysis images only</option>
          <option value="3">Frames + Analysis</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Video Writer</label>
        <select v-model="form.VideoWriter" class="select-glass w-full">
          <option value="0">Disabled</option>
          <option value="1">X264 Encode</option>
          <option value="2">H264 Passthrough</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Output Codec</label>
        <input v-model="form.OutputCodec" type="text" class="select-glass w-full" placeholder="e.g., h264" />
      </div>
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Output Container</label>
        <input v-model="form.OutputContainer" type="text" class="select-glass w-full" placeholder="e.g., mp4" />
      </div>
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Encoder</label>
        <input v-model="form.Encoder" type="text" class="select-glass w-full" placeholder="e.g., libx264, h264_vaapi" />
      </div>
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Record Audio</label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input :checked="form.RecordAudio === '1'" type="checkbox" class="accent-primary-500 h-4 w-4" @change="form.RecordAudio = ($event.target as HTMLInputElement).checked ? '1' : '0'" />
          <span class="text-sm text-body">Enabled</span>
        </label>
      </div>
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Section Length (seconds)</label>
        <input v-model="form.SectionLength" type="number" class="select-glass w-full" placeholder="600" />
      </div>
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Min Section Length (seconds)</label>
        <input v-model="form.MinSectionLength" type="number" class="select-glass w-full" placeholder="10" />
      </div>
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Max FPS</label>
        <input v-model="form.MaxFPS" type="text" class="select-glass w-full" placeholder="e.g., 15" />
      </div>
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Alarm Max FPS</label>
        <input v-model="form.AlarmMaxFPS" type="text" class="select-glass w-full" placeholder="e.g., 30" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const form = defineModel<Record<string, string>>({ required: true })
</script>
