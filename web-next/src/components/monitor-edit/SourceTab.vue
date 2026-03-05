<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Protocol</label>
        <select v-model="form.Protocol" class="select-glass w-full">
          <option value="">None</option>
          <option value="http">HTTP</option>
          <option value="https">HTTPS</option>
          <option value="rtsp">RTSP</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Method</label>
        <select v-model="form.Method" class="select-glass w-full">
          <option value="">Default</option>
          <option value="simple">Simple</option>
          <option value="regexp">RegExp</option>
          <option value="rtpRtsp">RTP/RTSP</option>
          <option value="rtpRtspHttp">RTP/RTSP/HTTP</option>
          <option value="rtpMulticast">RTP/Multicast</option>
          <option value="rtpUni">RTP/Unicast</option>
        </select>
      </div>
      <div class="sm:col-span-2">
        <label class="block text-sm font-medium text-heading mb-1">Host / URL</label>
        <input v-model="form.Host" type="text" class="select-glass w-full" placeholder="e.g., 192.168.1.100 or user:pass@host" />
      </div>
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Port</label>
        <input v-model="form.Port" type="text" class="select-glass w-full" placeholder="e.g., 554" />
      </div>
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Path</label>
        <input v-model="form.Path" type="text" class="select-glass w-full" placeholder="e.g., /stream1" />
      </div>
      <div class="sm:col-span-2">
        <label class="block text-sm font-medium text-heading mb-1">Second Path (substream)</label>
        <input v-model="form.SecondPath" type="text" class="select-glass w-full" placeholder="Optional alternate stream path" />
      </div>
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Width</label>
        <input v-model="form.Width" type="number" class="select-glass w-full" placeholder="640" />
      </div>
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Height</label>
        <input v-model="form.Height" type="number" class="select-glass w-full" placeholder="480" />
      </div>
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Colours</label>
        <select v-model="form.Colours" class="select-glass w-full">
          <option value="1">Greyscale (1)</option>
          <option value="3">24-bit colour (3)</option>
          <option value="4">32-bit colour (4)</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Orientation</label>
        <select v-model="form.Orientation" class="select-glass w-full">
          <option value="ROTATE_0">Normal</option>
          <option value="ROTATE_90">Rotate 90</option>
          <option value="ROTATE_180">Rotate 180</option>
          <option value="ROTATE_270">Rotate 270</option>
          <option value="FLIP_HORI">Flip Horizontal</option>
          <option value="FLIP_VERT">Flip Vertical</option>
        </select>
      </div>
    </div>

    <!-- Live preview -->
    <div v-if="form.Host" class="mt-4">
      <h3 class="text-sm font-medium text-heading mb-2">Preview</h3>
      <div class="aspect-video bg-black rounded-xl overflow-hidden max-w-lg">
        <MonitorStream
          v-if="previewMonitorId"
          :key="previewMonitorId"
          :monitor-id="previewMonitorId"
          :monitor-name="form.Name || 'preview'"
          mode="snapshot"
        />
        <div v-else class="flex items-center justify-center h-full text-muted text-sm">
          Save the monitor to see a preview
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MonitorStream from '@/components/MonitorStream.vue'

const form = defineModel<Record<string, string>>({ required: true })

defineProps<{
  previewMonitorId?: string
}>()
</script>
