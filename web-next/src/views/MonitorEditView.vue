<template>
  <div class="h-full flex flex-col">
    <!-- Toolbar -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-divider glass-subtle">
      <div class="flex items-center gap-3">
        <button class="btn-glass rounded-lg px-2 py-1 text-sm" @click="$router.back()">
          &larr; Back
        </button>
        <h1 class="text-lg font-semibold text-heading">
          {{ isNew ? 'Add Monitor' : `Edit: ${form.Name || 'Monitor'}` }}
        </h1>
      </div>
      <div class="flex items-center gap-3">
        <button
          v-if="!isNew"
          class="btn-glass rounded-lg px-3 py-1.5 text-sm text-red-400 hover:text-red-300"
          @click="handleDelete"
        >
          Delete
        </button>
        <button
          class="btn-gradient rounded-lg px-4 py-1.5 text-sm"
          :disabled="saving"
          @click="handleSave"
        >
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 flex min-h-0">
      <!-- Tab nav -->
      <div class="w-40 border-r border-divider overflow-y-auto py-2 px-2 shrink-0 hidden sm:block">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="w-full text-left rounded-lg px-3 py-2 text-sm transition-colors"
          :class="activeTab === tab.id
            ? 'bg-primary-500/10 text-primary-400 font-medium'
            : 'text-soft hover:bg-hover hover:text-heading'"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
      <!-- Mobile tab select -->
      <div class="sm:hidden px-4 py-2 border-b border-divider w-full">
        <select v-model="activeTab" class="select-glass w-full">
          <option v-for="tab in tabs" :key="tab.id" :value="tab.id">{{ tab.label }}</option>
        </select>
      </div>

      <!-- Tab content -->
      <div class="flex-1 overflow-y-auto p-4">
        <div v-if="loading" class="flex items-center justify-center py-12">
          <span class="spinner" />
          <span class="ml-3 text-soft text-sm">Loading monitor...</span>
        </div>
        <div v-else class="max-w-3xl">
          <GeneralTab v-if="activeTab === 'general'" v-model="form" />
          <SourceTab v-else-if="activeTab === 'source'" v-model="form" :preview-monitor-id="isNew ? undefined : monitorId" />
          <RecordingTab v-else-if="activeTab === 'recording'" v-model="form" />
          <AnalysisTab v-else-if="activeTab === 'analysis'" v-model="form" />
          <TimestampTab v-else-if="activeTab === 'timestamp'" v-model="form" />

          <!-- Validation errors -->
          <div v-if="errors.length > 0" class="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div class="text-sm font-medium text-red-400 mb-1">Please fix the following:</div>
            <ul class="list-disc list-inside text-sm text-red-300 space-y-0.5">
              <li v-for="err in errors" :key="err">{{ err }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMonitorStore } from '@/stores/monitors'
import GeneralTab from '@/components/monitor-edit/GeneralTab.vue'
import SourceTab from '@/components/monitor-edit/SourceTab.vue'
import RecordingTab from '@/components/monitor-edit/RecordingTab.vue'
import AnalysisTab from '@/components/monitor-edit/AnalysisTab.vue'
import TimestampTab from '@/components/monitor-edit/TimestampTab.vue'

const route = useRoute()
const router = useRouter()
const monitorStore = useMonitorStore()

const monitorId = computed(() => route.params.id as string | undefined)
const isNew = computed(() => route.name === 'monitor-new')

const activeTab = ref('general')
const loading = ref(false)
const saving = ref(false)
const errors = ref<string[]>([])

const tabs = [
  { id: 'general', label: 'General' },
  { id: 'source', label: 'Source' },
  { id: 'recording', label: 'Recording' },
  { id: 'analysis', label: 'Analysis' },
  { id: 'timestamp', label: 'Advanced' },
]

const defaultForm: Record<string, string> = {
  Name: '',
  Function: 'Monitor',
  Enabled: '1',
  Type: 'Ffmpeg',
  Protocol: 'rtsp',
  Method: '',
  Host: '',
  Port: '',
  Path: '',
  SecondPath: '',
  SubPath: '',
  Width: '1920',
  Height: '1080',
  Colours: '4',
  Orientation: 'ROTATE_0',
  Deinterlacing: '0',
  DecoderHWAccelName: '',
  DecoderHWAccelDevice: '',
  SaveJPEGs: '3',
  VideoWriter: '2',
  OutputCodec: '',
  OutputContainer: '',
  Encoder: '',
  EncoderParameters: '',
  RecordAudio: '0',
  SectionLength: '600',
  MinSectionLength: '10',
  MaxFPS: '',
  AlarmMaxFPS: '',
  FrameSkip: '0',
  MotionFrameSkip: '0',
  AnalysisFPSLimit: '',
  AnalysisUpdateDelay: '0',
  FPSReportInterval: '100',
  RefBlendPerc: '6',
  AlarmRefBlendPerc: '6',
  Exif: '0',
  RTSPDescribe: '0',
  LinkedMonitors: '',
  Notes: '',
}

const form = reactive<Record<string, string>>({ ...defaultForm })

function validate(): string[] {
  const errs: string[] = []
  if (!form.Name?.trim()) errs.push('Monitor name is required')
  if (!form.Width || parseInt(form.Width) <= 0) errs.push('Width must be greater than 0')
  if (!form.Height || parseInt(form.Height) <= 0) errs.push('Height must be greater than 0')
  return errs
}

async function handleSave() {
  errors.value = validate()
  if (errors.value.length > 0) return

  saving.value = true
  try {
    if (isNew.value) {
      const id = await monitorStore.createMonitor(form)
      if (id) {
        router.push(`/monitors/${id}/edit`)
      }
    } else if (monitorId.value) {
      await monitorStore.updateMonitor(monitorId.value, form)
    }
  } catch {
    errors.value = ['Failed to save monitor. Please try again.']
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!monitorId.value) return
  if (!confirm(`Delete monitor "${form.Name}"? This cannot be undone.`)) return

  saving.value = true
  try {
    const success = await monitorStore.deleteMonitor(monitorId.value)
    if (success) {
      router.push('/')
    }
  } catch {
    errors.value = ['Failed to delete monitor.']
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (!isNew.value && monitorId.value) {
    loading.value = true
    try {
      if (!monitorStore.monitors.length) {
        await monitorStore.fetchMonitors()
      }
      const mws = monitorStore.monitorById.get(monitorId.value)
      if (mws) {
        const m = mws.Monitor
        Object.keys(defaultForm).forEach((key) => {
          if (key in m) {
            form[key] = (m as unknown as Record<string, string>)[key] ?? defaultForm[key]
          }
        })
      }
    } finally {
      loading.value = false
    }
  }
})
</script>
