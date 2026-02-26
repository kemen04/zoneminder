import { ref, onUnmounted } from 'vue'
import { useApi } from './useApi'
import type { MonitorStatus } from '@/types/monitor'

export function useMonitorStatus(monitorId: string, intervalMs = 5000) {
  const api = useApi()
  const status = ref<MonitorStatus | null>(null)
  const error = ref<string | null>(null)
  let timer: ReturnType<typeof setInterval> | null = null

  async function poll() {
    try {
      const data = await api.fetch<{ monitor: { MonitorStatus: MonitorStatus } }>(
        `/monitors/daemonStatus/${monitorId}.json`,
      )
      status.value = data.monitor?.MonitorStatus ?? null
      error.value = null
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch status'
    }
  }

  function start() {
    poll()
    timer = setInterval(poll, intervalMs)
  }

  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  start()
  onUnmounted(stop)

  return { status, error, poll, stop }
}
