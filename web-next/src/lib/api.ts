import type { LoginResponse } from '@/types/api'

const BASE = '/zm/api'

export async function login(user: string, pass: string): Promise<LoginResponse> {
  const res = await fetch(`${BASE}/host/login.json`, {
    method: 'POST',
    credentials: 'omit',
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
    credentials: 'omit',
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
  const method = (options?.method ?? 'GET').toUpperCase()

  let url: string
  let fetchOpts: RequestInit = { ...options, credentials: 'omit' }

  if (method === 'GET') {
    // GET: token must go in URL (ZM API reads $_GET['token'])
    const sep = path.includes('?') ? '&' : '?'
    url = `${BASE}${path}${sep}token=${encodeURIComponent(token)}`
  } else {
    // POST/PUT/DELETE: append token to body to keep it out of server logs
    url = `${BASE}${path}`
    const existingBody = options?.body ? String(options.body) : ''
    const tokenParam = `token=${encodeURIComponent(token)}`
    fetchOpts.body = existingBody ? `${existingBody}&${tokenParam}` : tokenParam
    fetchOpts.headers = {
      ...Object.fromEntries(new Headers(options?.headers).entries()),
      'Content-Type': 'application/x-www-form-urlencoded',
    }
  }

  const res = await fetch(url, fetchOpts)
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
