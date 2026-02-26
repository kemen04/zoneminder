import { ref, onMounted, onUnmounted, watch, type Ref } from 'vue'

export interface UseStreamOptions {
  monitorName: string
  serverUrl: string
  muted?: boolean
}

export function useStream(
  elRef: Ref<HTMLElement | undefined>,
  options: Ref<UseStreamOptions>,
) {
  const isConnected = ref(false)
  const mode = ref('')

  function buildStreamUrl(serverUrl: string, monitorName: string): string {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = new URL(`${wsProtocol}//${serverUrl}`)
    url.pathname = `/go2rtc/ws`
    url.search = `src=${monitorName}_0`
    return url.href
  }

  function connect() {
    const el = elRef.value as HTMLElement & {
      src: string
      background: boolean
      muted: boolean
    } | undefined
    if (!el) return

    // Defer to let the custom element's shadow DOM initialize
    requestAnimationFrame(() => {
      el.background = true
      el.muted = options.value.muted ?? true
      el.src = buildStreamUrl(options.value.serverUrl, options.value.monitorName)
      isConnected.value = true
    })
  }

  function disconnect() {
    const el = elRef.value as HTMLElement & { src: string } | undefined
    if (el) {
      el.src = ''
    }
    isConnected.value = false
    mode.value = ''
  }

  onMounted(connect)
  onUnmounted(disconnect)

  watch(
    () => [options.value.monitorName, options.value.serverUrl],
    () => {
      disconnect()
      connect()
    },
  )

  return { isConnected, mode, connect, disconnect }
}
