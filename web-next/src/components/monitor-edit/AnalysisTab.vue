<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Analysis FPS Limit</label>
        <input v-model="form.AnalysisFPSLimit" type="text" class="select-glass w-full" placeholder="e.g., 5" />
      </div>
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Analysis Update Delay</label>
        <input v-model="form.AnalysisUpdateDelay" type="text" class="select-glass w-full" placeholder="0" />
      </div>
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Frame Skip</label>
        <input v-model="form.FrameSkip" type="number" class="select-glass w-full" placeholder="0" />
      </div>
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Motion Frame Skip</label>
        <input v-model="form.MotionFrameSkip" type="number" class="select-glass w-full" placeholder="0" />
      </div>
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Reference Blend %</label>
        <input v-model="form.RefBlendPerc" type="number" class="select-glass w-full" placeholder="6" />
      </div>
      <div>
        <label class="block text-sm font-medium text-heading mb-1">Alarm Reference Blend %</label>
        <input v-model="form.AlarmRefBlendPerc" type="number" class="select-glass w-full" placeholder="6" />
      </div>
      <div>
        <label class="block text-sm font-medium text-heading mb-1">FPS Report Interval</label>
        <input v-model="form.FPSReportInterval" type="number" class="select-glass w-full" placeholder="100" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const form = defineModel<Record<string, string>>({ required: true })
</script>
