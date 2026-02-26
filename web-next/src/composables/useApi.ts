import { useAuthStore } from '@/stores/auth'
import { apiFetch, TokenExpiredError } from '@/lib/api'
import { useRouter } from 'vue-router'

export function useApi() {
  const auth = useAuthStore()
  const router = useRouter()

  async function fetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
    try {
      const token = await auth.ensureValidToken()
      return await apiFetch<T>(path, token, options)
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        auth.logout()
        router.push('/login')
      }
      throw e
    }
  }

  return { fetch }
}
