import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export type ThemeMode = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'zm-theme'
const mql = window.matchMedia('(prefers-color-scheme: dark)')

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>(
    (localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'system',
  )

  const systemDark = ref(mql.matches)

  function onSystemChange(e: MediaQueryListEvent) {
    systemDark.value = e.matches
  }
  mql.addEventListener('change', onSystemChange)

  const isDark = computed(() =>
    mode.value === 'system' ? systemDark.value : mode.value === 'dark',
  )

  function applyClass() {
    document.documentElement.classList.toggle('dark', isDark.value)
  }

  function toggle() {
    const order: ThemeMode[] = ['system', 'light', 'dark']
    const idx = order.indexOf(mode.value)
    mode.value = order[(idx + 1) % order.length]
  }

  watch(mode, (v) => {
    localStorage.setItem(STORAGE_KEY, v)
    applyClass()
  })

  watch(systemDark, () => {
    if (mode.value === 'system') applyClass()
  })

  // Apply immediately on store creation
  applyClass()

  return { mode, isDark, toggle }
})
