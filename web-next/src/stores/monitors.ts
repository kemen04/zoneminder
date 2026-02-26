import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import { apiFetch } from '@/lib/api'
import type { MonitorStatus, MonitorWithStatus, Group } from '@/types/monitor'

export const useMonitorStore = defineStore('monitors', () => {
  const monitors = ref<MonitorWithStatus[]>([])
  const groups = ref<Group[]>([])
  const minStreamingPort = ref(0)
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

  /** Returns the per-monitor streaming port, or 0 if not configured */
  function streamingPort(monitorId: string): number {
    if (!minStreamingPort.value) return 0
    return minStreamingPort.value + parseInt(monitorId)
  }

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

  async function fetchStreamingConfig() {
    const auth = useAuthStore()
    try {
      const token = await auth.ensureValidToken()
      const data = await apiFetch<{ config: { Name: string; Value: string } }>(
        '/configs/view/ZM_MIN_STREAMING_PORT.json',
        token,
      )
      const val = parseInt(data.config?.Value)
      minStreamingPort.value = isNaN(val) ? 0 : val
    } catch {
      minStreamingPort.value = 0
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
    fetchStreamingConfig()
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
    minStreamingPort,
    streamingPort,
    isLoading,
    error,
    fetchMonitors,
    fetchGroups,
    fetchStreamingConfig,
    fetchMonitorStatus,
    startPolling,
    stopPolling,
  }
})
