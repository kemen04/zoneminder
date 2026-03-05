<template>
  <div class="flex flex-col sm:flex-row sm:items-start gap-2 py-3 border-b border-divider last:border-0">
    <div class="sm:w-1/3">
      <label class="text-sm font-medium text-heading">{{ config.Name }}</label>
      <p v-if="config.Help" class="text-xs text-muted mt-0.5">{{ config.Help }}</p>
    </div>
    <div class="sm:w-2/3">
      <!-- Boolean -->
      <label v-if="config.Type === 'boolean'" class="flex items-center gap-2 cursor-pointer">
        <input
          :checked="localValue === '1'"
          type="checkbox"
          class="accent-primary-500 h-4 w-4"
          @change="localValue = ($event.target as HTMLInputElement).checked ? '1' : '0'"
        />
        <span class="text-sm text-body">{{ localValue === '1' ? 'Enabled' : 'Disabled' }}</span>
      </label>
      <!-- Select (if Hint has options) -->
      <select
        v-else-if="options.length > 0"
        v-model="localValue"
        class="select-glass w-full max-w-md"
      >
        <option v-for="opt in options" :key="opt" :value="opt">{{ opt }}</option>
      </select>
      <!-- Integer -->
      <input
        v-else-if="config.Type === 'integer'"
        v-model="localValue"
        type="number"
        class="select-glass w-full max-w-md"
      />
      <!-- Text area for long values -->
      <textarea
        v-else-if="(config.Value?.length ?? 0) > 60"
        v-model="localValue"
        rows="3"
        class="select-glass w-full max-w-md resize-y"
      />
      <!-- Default text input -->
      <input
        v-else
        v-model="localValue"
        type="text"
        class="select-glass w-full max-w-md"
      />
      <div v-if="isChanged" class="mt-1 text-xs text-primary-400">Modified</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

export interface ZmConfig {
  Id: string
  Name: string
  Value: string
  Type: string
  DefaultValue: string
  Hint: string
  Pattern: string
  Format: string
  Prompt: string
  Help: string
  Category: string
  Readonly: string
  Requires: string
}

const props = defineProps<{
  config: ZmConfig
}>()

const emit = defineEmits<{
  change: [id: string, value: string]
}>()

const localValue = ref(props.config.Value)

const isChanged = computed(() => localValue.value !== props.config.Value)

const options = computed(() => {
  if (!props.config.Hint) return []
  // Hint format: "opt1|opt2|opt3" or "opt1;opt2;opt3"
  const delim = props.config.Hint.includes('|') ? '|' : ';'
  const opts = props.config.Hint.split(delim).map((o) => o.trim()).filter(Boolean)
  return opts.length > 1 ? opts : []
})

watch(localValue, (val) => {
  if (val !== props.config.Value) {
    emit('change', props.config.Id, val)
  }
})

watch(() => props.config.Value, (val) => {
  localValue.value = val
})
</script>
