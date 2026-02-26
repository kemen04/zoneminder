import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('starts unauthenticated', () => {
    const auth = useAuthStore()
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.accessToken).toBe('')
    expect(auth.username).toBe('')
  })

  it('login sets tokens and persists to localStorage', async () => {
    const mockResponse = {
      version: '1.39.0',
      apiversion: '2.0',
      access_token: 'test-access',
      access_token_expires: 7200,
      refresh_token: 'test-refresh',
      refresh_token_expires: 86400,
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }) as unknown as typeof fetch

    const auth = useAuthStore()
    await auth.login('admin', 'password')

    expect(auth.isAuthenticated).toBe(true)
    expect(auth.accessToken).toBe('test-access')
    expect(auth.refreshToken).toBe('test-refresh')
    expect(auth.username).toBe('admin')
    expect(localStorage.getItem('zm-auth')).toBeTruthy()
  })

  it('logout clears state and storage', async () => {
    const auth = useAuthStore()
    // Manually set authenticated state
    auth.accessToken = 'test'
    auth.refreshToken = 'test-refresh'
    auth.username = 'admin'
    localStorage.setItem('zm-auth', '{}')

    auth.logout()

    expect(auth.isAuthenticated).toBe(false)
    expect(auth.accessToken).toBe('')
    expect(localStorage.getItem('zm-auth')).toBeNull()
  })

  it('login failure sets loginError', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      text: () => Promise.resolve('Invalid credentials'),
    }) as unknown as typeof fetch

    const auth = useAuthStore()
    await expect(auth.login('admin', 'wrong')).rejects.toThrow()
    expect(auth.loginError).toBe('Invalid credentials')
    expect(auth.isAuthenticated).toBe(false)
  })
})
