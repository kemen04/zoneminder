import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useMonitorStore } from '@/stores/monitors'

export function useAlarmPolling() {
  const monitorStore = useMonitorStore()
  const audioEnabled = ref(false)
  const notificationsEnabled = ref(false)
  const previousAlarmIds = ref<Set<string>>(new Set())
  let audioContext: AudioContext | null = null

  const alarmedMonitors = computed(() => monitorStore.alarmedMonitors)
  const alarmCount = computed(() => alarmedMonitors.value.length)
  const hasAlarms = computed(() => alarmCount.value > 0)

  // Detect new alarms (monitors that just entered alarm state)
  watch(alarmedMonitors, (current, previous) => {
    const prevIds = new Set((previous ?? []).map((m) => m.Monitor.Id))
    const newAlarms = current.filter((m) => !prevIds.has(m.Monitor.Id))

    if (newAlarms.length === 0) return

    // Play audio alert
    if (audioEnabled.value) {
      playAlertSound()
    }

    // Send browser notification
    if (notificationsEnabled.value && Notification.permission === 'granted') {
      for (const alarm of newAlarms) {
        new Notification('ZoneMinder Alarm', {
          body: `${alarm.Monitor.Name} triggered an alarm`,
          icon: '/zm-next/favicon.ico',
          tag: `alarm-${alarm.Monitor.Id}`,
        })
      }
    }
  })

  function playAlertSound() {
    try {
      if (!audioContext) {
        audioContext = new AudioContext()
      }
      const oscillator = audioContext.createOscillator()
      const gain = audioContext.createGain()
      oscillator.connect(gain)
      gain.connect(audioContext.destination)
      oscillator.frequency.value = 800
      gain.gain.value = 0.3
      oscillator.start()
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch {
      // Audio not available
    }
  }

  async function requestNotificationPermission() {
    if (!('Notification' in window)) return false
    if (Notification.permission === 'granted') {
      notificationsEnabled.value = true
      return true
    }
    if (Notification.permission === 'denied') return false
    const perm = await Notification.requestPermission()
    notificationsEnabled.value = perm === 'granted'
    return notificationsEnabled.value
  }

  function toggleAudio() {
    audioEnabled.value = !audioEnabled.value
    // Resume audio context if suspended (browser policy)
    if (audioEnabled.value && audioContext?.state === 'suspended') {
      audioContext.resume()
    }
  }

  // Load preferences
  onMounted(() => {
    try {
      const prefs = JSON.parse(localStorage.getItem('zm-alarm-prefs') ?? '{}')
      audioEnabled.value = prefs.audio ?? false
      notificationsEnabled.value = prefs.notifications ?? false
    } catch {
      // ignore
    }
  })

  // Save preferences
  watch([audioEnabled, notificationsEnabled], () => {
    localStorage.setItem('zm-alarm-prefs', JSON.stringify({
      audio: audioEnabled.value,
      notifications: notificationsEnabled.value,
    }))
  })

  onUnmounted(() => {
    if (audioContext) {
      audioContext.close()
      audioContext = null
    }
  })

  return {
    alarmedMonitors,
    alarmCount,
    hasAlarms,
    audioEnabled,
    notificationsEnabled,
    toggleAudio,
    requestNotificationPermission,
  }
}
