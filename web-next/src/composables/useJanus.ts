import { ref, onUnmounted } from 'vue'

/**
 * Janus WebRTC connection helper.
 * Connects to ZoneMinder's Janus gateway for WebRTC streaming.
 */
export function useJanus() {
  const isConnected = ref(false)
  const error = ref<string | null>(null)
  let pc: RTCPeerConnection | null = null
  let sessionId: number | null = null
  let handleId: number | null = null
  let keepAliveTimer: ReturnType<typeof setInterval> | null = null

  const JANUS_PATH = '/janus'

  async function janusRequest(path: string, body?: Record<string, unknown>): Promise<Record<string, unknown>> {
    const url = `${JANUS_PATH}${path}`
    const res = await fetch(url, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) throw new Error(`Janus error: ${res.status}`)
    return res.json() as Promise<Record<string, unknown>>
  }

  function transaction(): string {
    return crypto.randomUUID()
  }

  async function connect(monitorId: string, videoEl: HTMLVideoElement): Promise<void> {
    try {
      error.value = null

      // Create session
      const sessionResp = await janusRequest('', {
        janus: 'create',
        transaction: transaction(),
      })
      sessionId = (sessionResp.data as { id: number })?.id
      if (!sessionId) throw new Error('Failed to create Janus session')

      // Attach to streaming plugin
      const attachResp = await janusRequest(`/${sessionId}`, {
        janus: 'attach',
        plugin: 'janus.plugin.streaming',
        transaction: transaction(),
      })
      handleId = (attachResp.data as { id: number })?.id
      if (!handleId) throw new Error('Failed to attach to streaming plugin')

      // Start keep-alive
      keepAliveTimer = setInterval(async () => {
        if (!sessionId) return
        try {
          await janusRequest(`/${sessionId}`, {
            janus: 'keepalive',
            transaction: transaction(),
          })
        } catch {
          // ignore keepalive failures
        }
      }, 25_000)

      // Create peer connection
      // No STUN needed — ZM cameras are on LAN, no NAT traversal required
      pc = new RTCPeerConnection({ iceServers: [] })

      pc.ontrack = (event) => {
        if (event.streams[0]) {
          videoEl.srcObject = event.streams[0]
          isConnected.value = true
        }
      }

      pc.oniceconnectionstatechange = () => {
        if (pc?.iceConnectionState === 'failed' || pc?.iceConnectionState === 'disconnected') {
          isConnected.value = false
          error.value = 'Connection lost'
        }
      }

      // Add receive-only transceivers
      pc.addTransceiver('video', { direction: 'recvonly' })
      pc.addTransceiver('audio', { direction: 'recvonly' })

      // Watch the stream — monitor IDs map to Janus stream IDs
      const watchResp = await janusRequest(`/${sessionId}/${handleId}`, {
        janus: 'message',
        transaction: transaction(),
        body: { request: 'watch', id: parseInt(monitorId) },
      })

      const jsep = (watchResp as { jsep?: RTCSessionDescriptionInit }).jsep
      if (!jsep) throw new Error('No SDP offer from Janus')

      await pc.setRemoteDescription(new RTCSessionDescription(jsep))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      // Send answer back
      await janusRequest(`/${sessionId}/${handleId}`, {
        janus: 'message',
        transaction: transaction(),
        body: { request: 'start' },
        jsep: { type: answer.type, sdp: answer.sdp },
      })
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Janus connection failed'
      isConnected.value = false
      disconnect()
    }
  }

  function disconnect() {
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer)
      keepAliveTimer = null
    }

    if (pc) {
      pc.close()
      pc = null
    }

    // Best-effort destroy session
    if (sessionId) {
      janusRequest(`/${sessionId}`, {
        janus: 'destroy',
        transaction: transaction(),
      }).catch(() => {})
      sessionId = null
      handleId = null
    }

    isConnected.value = false
  }

  onUnmounted(disconnect)

  return {
    isConnected,
    error,
    connect,
    disconnect,
  }
}
