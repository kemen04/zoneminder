<template>
  <form class="w-full max-w-sm space-y-4" @submit.prevent="handleSubmit">
    <div>
      <label for="username" class="block text-sm font-medium text-gray-300 mb-1">
        Username
      </label>
      <input
        id="username"
        v-model="user"
        type="text"
        autocomplete="username"
        required
        class="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-2 text-gray-100
               placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500
               focus:border-transparent"
        placeholder="admin"
      />
    </div>
    <div>
      <label for="password" class="block text-sm font-medium text-gray-300 mb-1">
        Password
      </label>
      <input
        id="password"
        v-model="pass"
        type="password"
        autocomplete="current-password"
        required
        class="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-2 text-gray-100
               placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500
               focus:border-transparent"
      />
    </div>
    <div v-if="auth.loginError" class="rounded-md bg-red-900/50 border border-red-700 p-3">
      <p class="text-sm text-red-300">{{ auth.loginError }}</p>
    </div>
    <button
      type="submit"
      :disabled="auth.isLoggingIn"
      class="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white
             hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500
             focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50
             disabled:cursor-not-allowed transition-colors"
    >
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
