<template>
  <div class="h-full flex flex-col">
    <!-- Toolbar -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-divider glass-subtle">
      <h1 class="text-lg font-semibold text-heading">System Logs</h1>
      <button class="btn-glass rounded-lg px-3 py-1 text-sm" @click="fetchLogs">
        Refresh
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto p-4">
      <LogTable
        :logs="logs"
        :loading="loading"
        :page="page"
        :page-count="pageCount"
        v-model:auto-refresh="autoRefresh"
        @page="changePage"
        @refresh="fetchLogs"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import LogTable from '@/components/LogTable.vue'
import type { LogEntry } from '@/components/LogTable.vue'
import { useApi } from '@/composables/useApi'

const api = useApi()
const logs = ref<LogEntry[]>([])
const loading = ref(false)
const page = ref(1)
const pageCount = ref(1)
const autoRefresh = ref(false)
let refreshTimer: ReturnType<typeof setInterval> | null = null

async function fetchLogs() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: page.value.toString(),
      limit: '100',
      sortField: 'TimeKey',
      sortOrder: 'desc',
    })
    const data = await api.fetch<{
      logs: { Log: LogEntry }[]
      pagination: { pageCount: number; page: number }
    }>(`/logs.json?${params.toString()}`)

    logs.value = (data.logs ?? []).map((l) => l.Log)
    pageCount.value = data.pagination?.pageCount ?? 1
    page.value = data.pagination?.page ?? 1
  } catch {
    logs.value = []
  } finally {
    loading.value = false
  }
}

function changePage(p: number) {
  page.value = p
  fetchLogs()
}

// Auto-refresh
watch(autoRefresh, (enabled) => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
  if (enabled) {
    refreshTimer = setInterval(fetchLogs, 5000)
  }
})

onMounted(() => {
  fetchLogs()
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})
</script>
