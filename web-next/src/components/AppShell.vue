<template>
  <div class="flex h-screen bg-page">
    <!-- Alarm Banner -->
    <AlarmBanner />

    <!-- Sidebar -->
    <aside
      :class="[sidebarOpen ? 'w-56' : 'w-16']"
      class="flex flex-col glass-strong transition-all duration-300"
    >
      <!-- Logo -->
      <div class="flex h-14 items-center px-4 border-b border-divider">
        <span v-if="sidebarOpen" class="text-lg font-bold logo-gradient">ZoneMinder</span>
        <span v-else class="text-lg font-bold logo-gradient">ZM</span>
      </div>

      <!-- Nav -->
      <nav class="flex-1 py-3 space-y-1 px-2 overflow-y-auto">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          active-class="nav-link-active"
        >
          <component :is="item.icon" class="h-5 w-5 shrink-0" />
          <span v-if="sidebarOpen" class="truncate">{{ item.label }}</span>
          <!-- Alarm badge -->
          <span
            v-if="item.badge && item.badge > 0"
            class="ml-auto inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold"
          >
            {{ item.badge }}
          </span>
        </router-link>
      </nav>

      <!-- Footer -->
      <div class="border-t border-divider p-2 space-y-1">
        <button
          :title="themeTitle"
          class="nav-link w-full"
          @click="theme.toggle()"
        >
          <component :is="themeIcon" class="h-5 w-5 shrink-0" />
          <span v-if="sidebarOpen">{{ themeLabel }}</span>
        </button>
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
import { ref, computed, h, type FunctionalComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useMonitorStore } from '@/stores/monitors'
import AlarmBanner from '@/components/AlarmBanner.vue'

const auth = useAuthStore()
const theme = useThemeStore()
const monitorStore = useMonitorStore()
const router = useRouter()
const sidebarOpen = ref(true)

function handleLogout() {
  auth.logout()
  router.push('/login')
}

const themeLabel = computed(() => {
  switch (theme.mode) {
    case 'system': return 'System'
    case 'light': return 'Light'
    case 'dark': return 'Dark'
  }
})

const themeTitle = computed(() => `Theme: ${themeLabel.value}`)

// Theme icons
const SunIcon: FunctionalComponent = () =>
  h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 20 20', fill: 'currentColor' }, [
    h('path', { 'fill-rule': 'evenodd', d: 'M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z', 'clip-rule': 'evenodd' }),
  ])

const MoonIcon: FunctionalComponent = () =>
  h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 20 20', fill: 'currentColor' }, [
    h('path', { d: 'M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z' }),
  ])

const MonitorIcon: FunctionalComponent = () =>
  h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 20 20', fill: 'currentColor' }, [
    h('path', { 'fill-rule': 'evenodd', d: 'M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.07.28.22.882H15a1 1 0 110 2H5a1 1 0 110-2h2.81l.22-.882.07-.28L8.22 15H6a2 2 0 01-2-2V5zm2 0h10v8H5V5z', 'clip-rule': 'evenodd' }),
  ])

const themeIcon = computed(() => {
  switch (theme.mode) {
    case 'light': return SunIcon
    case 'dark': return MoonIcon
    case 'system': return MonitorIcon
  }
})

// Simple SVG icon components
const DashboardIcon: FunctionalComponent = () =>
  h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 20 20', fill: 'currentColor' }, [
    h('path', { d: 'M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z' }),
  ])

const GridIcon: FunctionalComponent = () =>
  h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 20 20', fill: 'currentColor' }, [
    h('path', { d: 'M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' }),
  ])

const CameraIcon: FunctionalComponent = () =>
  h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 20 20', fill: 'currentColor' }, [
    h('path', { d: 'M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z' }),
  ])

const MontageIcon: FunctionalComponent = () =>
  h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 20 20', fill: 'currentColor' }, [
    h('path', { d: 'M2 4a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1V4zm9 0a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-1 1h-5a1 1 0 01-1-1V4zM2 13a1 1 0 011-1h5a1 1 0 011 1v4a1 1 0 01-1 1H3a1 1 0 01-1-1v-4zm9 0a1 1 0 011-1h5a1 1 0 011 1v4a1 1 0 01-1 1h-5a1 1 0 01-1-1v-4z' }),
  ])

const EventIcon: FunctionalComponent = () =>
  h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 20 20', fill: 'currentColor' }, [
    h('path', { 'fill-rule': 'evenodd', d: 'M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z', 'clip-rule': 'evenodd' }),
  ])

const LogIcon: FunctionalComponent = () =>
  h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 20 20', fill: 'currentColor' }, [
    h('path', { 'fill-rule': 'evenodd', d: 'M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z', 'clip-rule': 'evenodd' }),
  ])

const SettingsIcon: FunctionalComponent = () =>
  h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 20 20', fill: 'currentColor' }, [
    h('path', { 'fill-rule': 'evenodd', d: 'M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z', 'clip-rule': 'evenodd' }),
  ])

const SidebarIcon: FunctionalComponent = () =>
  h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 20 20', fill: 'currentColor' }, [
    h('path', { 'fill-rule': 'evenodd', d: 'M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z', 'clip-rule': 'evenodd' }),
  ])

const LogoutIcon: FunctionalComponent = () =>
  h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 20 20', fill: 'currentColor' }, [
    h('path', { 'fill-rule': 'evenodd', d: 'M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z', 'clip-rule': 'evenodd' }),
  ])

const alarmCount = computed(() => monitorStore.alarmedMonitors.length)

const navItems = computed(() => [
  { to: '/', label: 'Dashboard', icon: DashboardIcon },
  { to: '/live', label: 'Live Grid', icon: GridIcon },
  { to: '/watch', label: 'Watch', icon: CameraIcon },
  { to: '/montage', label: 'Montage', icon: MontageIcon },
  { to: '/events', label: 'Events', icon: EventIcon, badge: alarmCount.value },
  { to: '/logs', label: 'Logs', icon: LogIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
])
</script>

<style scoped>
@reference "../style.css";

.nav-link {
  @apply flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-soft
         hover:bg-hover hover:text-heading transition-colors;
}
.nav-link-active {
  @apply bg-active text-primary-400 border-l-2 border-primary-400;
}
</style>
