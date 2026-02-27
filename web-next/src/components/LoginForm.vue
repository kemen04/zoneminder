<template>
  <form class="w-full max-w-sm space-y-4" @submit.prevent="handleSubmit">
    <div>
      <label for="username" class="block text-sm font-medium text-body mb-1">
        Username
      </label>
      <input
        id="username"
        v-model="user"
        type="text"
        autocomplete="username"
        required
        class="w-full rounded-lg border px-3 py-2
               placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary-500
               focus:border-transparent transition-colors"
        style="background: var(--input-bg); border-color: var(--input-border); color: var(--input-text);"
        placeholder="admin"
      />
    </div>
    <div>
      <label for="password" class="block text-sm font-medium text-body mb-1">
        Password
      </label>
      <input
        id="password"
        v-model="pass"
        type="password"
        autocomplete="current-password"
        required
        class="w-full rounded-lg border px-3 py-2
               placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary-500
               focus:border-transparent transition-colors"
        style="background: var(--input-bg); border-color: var(--input-border); color: var(--input-text);"
      />
    </div>
    <div v-if="auth.loginError" class="rounded-lg glass bg-red-900/30 border border-red-500/30 p-3">
      <p class="text-sm text-red-300">{{ auth.loginError }}</p>
    </div>
    <button
      type="submit"
      :disabled="auth.isLoggingIn"
      class="w-full btn-gradient rounded-lg px-4 py-2 text-sm font-semibold
             focus:outline-none focus:ring-2 focus:ring-primary-500
             focus:ring-offset-2
             flex items-center justify-center gap-2"
      :style="{ '--tw-ring-offset-color': 'var(--ring-offset-bg)' }"
    >
      <span v-if="auth.isLoggingIn" class="spinner" style="width: 1rem; height: 1rem; border-width: 2px;" />
      {{ auth.isLoggingIn ? 'Signing in...' : 'Sign in' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const user = ref('')
const pass = ref('')

async function handleSubmit() {
  try {
    await auth.login(user.value, pass.value)
    router.push('/')
  } catch {
    // Error is displayed via auth.loginError
  }
}
</script>
