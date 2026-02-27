<template>
  <div class="relative flex min-h-screen items-center justify-center bg-page px-4 overflow-hidden">
    <!-- Ambient glow -->
    <div class="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary-600/10 blur-3xl" />
    <div class="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary-600/10 blur-3xl" />

    <div class="relative w-full max-w-sm space-y-8">
      <div class="glass rounded-2xl p-8 shadow-lg">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold logo-gradient">ZoneMinder</h1>
          <p class="mt-2 text-sm text-muted">Sign in to your account</p>
        </div>
        <LoginForm />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LoginForm from '@/components/LoginForm.vue'
</script>
