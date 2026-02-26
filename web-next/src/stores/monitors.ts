import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import { apiFetch } from '@/lib/api'
import type { MonitorStatus, MonitorWithStatus, Group } from '@/types/monitor'

export const useMonitorStore = defineStore('monitors', () => {
  const monitors = ref<MonitorWithStatus[]>([])
  const groups = ref<Group[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  let pollTimer: ReturnType<typeof setInterval> | null = null

  const monitorList = computed(() =>
    monitors.value.map((m) => m.Monitor),
  )

  const monitorById = computed(() => {
    const map = new Map<string, MonitorWithStatus>()
    monitors.value.forEach((m) => map.set(m.Monitor.Id, m))
    return map
  })

  async function fetchMonitors() {
    const auth = useAuthStore()
    isLoading.value = true
    error.value = null
    try {
      const token = await auth.ensureValidToken()
      const data = await apiFetch<{ monitors: MonitorWithStatus[] }>(
        '/monitors.json',
        token,
      )
      monitors.value = data.monitors ?? []
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch monitors'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchGroups() {
    const auth = useAuthStore()
    try {
      const token = await auth.ensureValidToken()
      const data = await apiFetch<{ groups: { Group: Group }[] }>(
        '/groups.json',
        token,
      )
      groups.value = (data.groups ?? []).map((g) => g.Group)
    } catch {
      // Groups are optional, don't surface error
    }
  }

  async function fetchMonitorStatus(monitorId: string): Promise<MonitorStatus | null> {
    const auth = useAuthStore()
    try {
      const token = await auth.ensureValidToken()
      const data = await apiFetch<{ monitor: { MonitorStatus: MonitorStatus } }>(
        `/monitors/daemonStatus/${monitorId}.json`,
        token,
      )
      return data.monitor?.MonitorStatus ?? null
    } catch {
      return null
    }
  }

  function startPolling(intervalMs = 10_000) {
    stopPolling()
    fetchMonitors()
    pollTimer = setInterval(fetchMonitors, intervalMs)
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  return {
    monitors,
    groups,
    monitorList,
    monitorById,
    isLoading,
    error,
    fetchMonitors,
    fetchGroups,
    fetchMonitorStatus,
    startPolling,
    stopPolling,
  }
})
