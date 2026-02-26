<template>
  <AppShell v-if="auth.isAuthenticated">
    <router-view />
  </AppShell>
  <router-view v-else />
</template>

<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>
