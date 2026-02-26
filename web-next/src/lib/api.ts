import type { LoginResponse } from '@/types/api'

const BASE = '/zm/api'

export async function login(user: string, pass: string): Promise<LoginResponse> {
  const res = await fetch(`${BASE}/host/login.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `user=${encodeURIComponent(user)}&pass=${encodeURIComponent(pass)}`,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Login failed: ${res.status}`)
  }
  return res.json()
}

export async function refreshAccessToken(refreshToken: string): Promise<LoginResponse> {
  const res = await fetch(`${BASE}/host/login.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `token=${encodeURIComponent(refreshToken)}`,
  })
  if (!res.ok) {
    throw new Error('Token refresh failed')
  }
  return res.json()
}

export async function apiFetch<T = unknown>(
  path: string,
  token: string,
  options?: RequestInit,
): Promise<T> {
  const sep = path.includes('?') ? '&' : '?'
  const url = `${BASE}${path}${sep}token=${encodeURIComponent(token)}`
  const res = await fetch(url, options)
  if (res.status === 401) {
    throw new TokenExpiredError()
  }
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export class TokenExpiredError extends Error {
  constructor() {
    super('Token expired')
    this.name = 'TokenExpiredError'
  }
}
