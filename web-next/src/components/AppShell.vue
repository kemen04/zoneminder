<template>
  <div class="flex h-screen bg-gray-950">
    <!-- Sidebar -->
    <aside
      :class="[sidebarOpen ? 'w-56' : 'w-16']"
      class="flex flex-col glass-strong transition-all duration-300"
    >
      <!-- Logo -->
      <div class="flex h-14 items-center px-4 border-b border-white/5">
        <span v-if="sidebarOpen" class="text-lg font-bold bg-gradient-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent">ZoneMinder</span>
        <span v-else class="text-lg font-bold bg-gradient-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent">ZM</span>
      </div>

      <!-- Nav -->
      <nav class="flex-1 py-3 space-y-1 px-2">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          active-class="nav-link-active"
        >
          <component :is="item.icon" class="h-5 w-5 shrink-0" />
          <span v-if="sidebarOpen" class="truncate">{{ item.label }}</span>
        </router-link>
      </nav>

      <!-- Footer -->
      <div class="border-t border-white/5 p-2 space-y-1">
        <button
          :title="sidebarOpen ? 'Collapse' : 'Expand'"
          class="nav-link w-full"
          @click="sidebarOpen = !sidebarOpen"
        >
          <SidebarIcon class="h-5 w-5 shrink-0 transition-transform duration-300" :class="{ 'rotate-180': !sidebarOpen }" />
          <span v-if="sidebarOpen">Collapse</span>
        </button>
        <button class="nav-link w-full text-red-400" @click="handleLogout">
          <LogoutIcon class="h-5 w-5 shrink-0" />
          <span v-if="sidebarOpen">Sign out</span>
        </button>
      </div>
    </aside>

    <!-- Main content -->
    <main class="flex-1 overflow-auto">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, h, type FunctionalComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const sidebarOpen = ref(true)

function handleLogout() {
  auth.logout()
  router.push('/login')
}

// Simple SVG icon components
const GridIcon: FunctionalComponent = () =>
  h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 20 20', fill: 'currentColor' }, [
    h('path', { d: 'M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' }),
  ])

const CameraIcon: FunctionalComponent = () =>
  h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 20 20', fill: 'currentColor' }, [
    h('path', { d: 'M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z' }),
  ])

const EventIcon: FunctionalComponent = () =>
  h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 20 20', fill: 'currentColor' }, [
    h('path', { 'fill-rule': 'evenodd', d: 'M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z', 'clip-rule': 'evenodd' }),
  ])

const SidebarIcon: FunctionalComponent = () =>
  h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 20 20', fill: 'currentColor' }, [
    h('path', { 'fill-rule': 'evenodd', d: 'M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z', 'clip-rule': 'evenodd' }),
  ])

const LogoutIcon: FunctionalComponent = () =>
  h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 20 20', fill: 'currentColor' }, [
    h('path', { 'fill-rule': 'evenodd', d: 'M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z', 'clip-rule': 'evenodd' }),
  ])

const navItems = [
  { to: '/', label: 'Live Grid', icon: GridIcon },
  { to: '/watch', label: 'Watch', icon: CameraIcon },
  { to: '/events', label: 'Events', icon: EventIcon },
]
</script>

<style scoped>
@reference "../style.css";

.nav-link {
  @apply flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400
         hover:bg-white/5 hover:text-gray-200 transition-colors;
}
.nav-link-active {
  @apply bg-white/8 text-primary-400 border-l-2 border-primary-400;
}
</style>
