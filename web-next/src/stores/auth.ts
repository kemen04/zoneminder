import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, refreshAccessToken, TokenExpiredError } from '@/lib/api'

const STORAGE_KEY = 'zm-auth'

interface StoredAuth {
  accessToken: string
  refreshToken: string
  accessExpiresAt: number
  refreshExpiresAt: number
  username: string
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref('')
  const refreshToken = ref('')
  const accessExpiresAt = ref(0)
  const refreshExpiresAt = ref(0)
  const username = ref('')
  const isLoggingIn = ref(false)
  const loginError = ref('')

  const isAuthenticated = computed(() => !!accessToken.value)

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const stored: StoredAuth = JSON.parse(raw)
      if (stored.refreshExpiresAt < Date.now()) {
        localStorage.removeItem(STORAGE_KEY)
        return
      }
      accessToken.value = stored.accessToken
      refreshToken.value = stored.refreshToken
      accessExpiresAt.value = stored.accessExpiresAt
      refreshExpiresAt.value = stored.refreshExpiresAt
      username.value = stored.username
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  function saveToStorage() {
    const data: StoredAuth = {
      accessToken: accessToken.value,
      refreshToken: refreshToken.value,
      accessExpiresAt: accessExpiresAt.value,
      refreshExpiresAt: refreshExpiresAt.value,
      username: username.value,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  async function login(user: string, pass: string) {
    isLoggingIn.value = true
    loginError.value = ''
    try {
      const res = await apiLogin(user, pass)
      accessToken.value = res.access_token
      refreshToken.value = res.refresh_token
      accessExpiresAt.value = Date.now() + res.access_token_expires * 1000
      refreshExpiresAt.value = Date.now() + res.refresh_token_expires * 1000
      username.value = user
      saveToStorage()
    } catch (e) {
      loginError.value = e instanceof Error ? e.message : 'Login failed'
      throw e
    } finally {
      isLoggingIn.value = false
    }
  }

  async function ensureValidToken(): Promise<string> {
    if (accessExpiresAt.value > Date.now() + 60_000) {
      return accessToken.value
    }
    if (!refreshToken.value || refreshExpiresAt.value < Date.now()) {
      logout()
      throw new TokenExpiredError()
    }
    try {
      const res = await refreshAccessToken(refreshToken.value)
      accessToken.value = res.access_token
      accessExpiresAt.value = Date.now() + res.access_token_expires * 1000
      saveToStorage()
      return accessToken.value
    } catch {
      logout()
      throw new TokenExpiredError()
    }
  }

  function logout() {
    accessToken.value = ''
    refreshToken.value = ''
    accessExpiresAt.value = 0
    refreshExpiresAt.value = 0
    username.value = ''
    localStorage.removeItem(STORAGE_KEY)
  }

  // Initialize from storage on creation
  loadFromStorage()

  return {
    accessToken,
    refreshToken,
    username,
    isAuthenticated,
    isLoggingIn,
    loginError,
    login,
    logout,
    ensureValidToken,
  }
})
