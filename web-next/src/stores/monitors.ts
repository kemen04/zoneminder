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

  /** Monitors organized by group ID. Key '' holds all monitors. */
  const monitorsByGroup = computed(() => {
    const map = new Map<string, MonitorWithStatus[]>()
    map.set('', monitors.value)
    for (const group of groups.value) {
      if (!group.MonitorIds) continue
      const ids = new Set(group.MonitorIds.split(','))
      map.set(group.Id, monitors.value.filter((m) => ids.has(m.Monitor.Id)))
    }
    return map
  })

  /** Monitors currently in alarm state */
  const alarmedMonitors = computed(() =>
    monitors.value.filter((m) => {
      const status = m.Monitor_Status?.Status?.toLowerCase()
      return status === 'alarm' || status === 'signal'
    }),
  )

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

  async function fetchDaemonStatus(): Promise<boolean> {
    const auth = useAuthStore()
    try {
      const token = await auth.ensureValidToken()
      const data = await apiFetch<{ result: number }>(
        '/host/daemonCheck.json',
        token,
      )
      return data.result === 1
    } catch {
      return false
    }
  }

  async function fetchDiskUsage(): Promise<Record<string, { space: string; color: string }>> {
    const auth = useAuthStore()
    try {
      const token = await auth.ensureValidToken()
      const data = await apiFetch<{ usage: Record<string, { space: string; color: string }> }>(
        '/host/getDiskPercent.json',
        token,
      )
      return data.usage ?? {}
    } catch {
      return {}
    }
  }

  async function fetchLoad(): Promise<{ load: number[]; cpus: number }> {
    const auth = useAuthStore()
    try {
      const token = await auth.ensureValidToken()
      const data = await apiFetch<{ load: number[]; cpus?: number }>(
        '/host/getLoad.json',
        token,
      )
      return {
        load: Array.isArray(data.load) ? data.load : [],
        cpus: data.cpus ?? 0,
      }
    } catch {
      return { load: [], cpus: 0 }
    }
  }

  async function updateMonitorFunction(monitorId: string, func: string): Promise<boolean> {
    const auth = useAuthStore()
    try {
      const token = await auth.ensureValidToken()
      await apiFetch(
        `/monitors/${monitorId}.json`,
        token,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `Monitor[Function]=${encodeURIComponent(func)}`,
        },
      )
      // Update local state
      const mws = monitorById.value.get(monitorId)
      if (mws) mws.Monitor.Function = func as Monitor['Function']
      return true
    } catch {
      return false
    }
  }

  async function createMonitor(data: Record<string, string>): Promise<string | null> {
    const auth = useAuthStore()
    try {
      const token = await auth.ensureValidToken()
      const body = Object.entries(data)
        .map(([k, v]) => `Monitor[${k}]=${encodeURIComponent(v)}`)
        .join('&')
      const resp = await apiFetch<{ id: string }>(
        '/monitors.json',
        token,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
        },
      )
      await fetchMonitors()
      return resp.id ?? null
    } catch {
      return null
    }
  }

  async function updateMonitor(monitorId: string, data: Record<string, string>): Promise<boolean> {
    const auth = useAuthStore()
    try {
      const token = await auth.ensureValidToken()
      const body = Object.entries(data)
        .map(([k, v]) => `Monitor[${k}]=${encodeURIComponent(v)}`)
        .join('&')
      await apiFetch(
        `/monitors/${monitorId}.json`,
        token,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
        },
      )
      await fetchMonitors()
      return true
    } catch {
      return false
    }
  }

  async function deleteMonitor(monitorId: string): Promise<boolean> {
    const auth = useAuthStore()
    try {
      const token = await auth.ensureValidToken()
      await apiFetch(
        `/monitors/${monitorId}.json`,
        token,
        { method: 'DELETE' },
      )
      monitors.value = monitors.value.filter((m) => m.Monitor.Id !== monitorId)
      return true
    } catch {
      return false
    }
  }

  function startPolling(intervalMs = 10_000) {
    stopPolling()
    fetchMonitors()
    fetchStreamingConfig()
    fetchGroups()
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
    monitorsByGroup,
    alarmedMonitors,
    minStreamingPort,
    streamingPort,
    isLoading,
    error,
    fetchMonitors,
    fetchGroups,
    fetchStreamingConfig,
    fetchMonitorStatus,
    fetchDaemonStatus,
    fetchDiskUsage,
    fetchLoad,
    updateMonitorFunction,
    createMonitor,
    updateMonitor,
    deleteMonitor,
    startPolling,
    stopPolling,
  }
})

// Need import for type in updateMonitorFunction
import type { Monitor } from '@/types/monitor'
