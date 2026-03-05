<template>
  <Teleport to="body">
    <Transition name="alarm-slide">
      <div
        v-if="alarm.hasAlarms.value"
        class="fixed top-0 left-0 right-0 z-[100] flex items-center gap-3 px-4 py-2 bg-red-600/95 text-white text-sm backdrop-blur-sm shadow-lg"
      >
        <!-- Pulsing dot -->
        <span class="h-2.5 w-2.5 rounded-full bg-white animate-pulse shrink-0" />

        <!-- Message -->
        <span class="flex-1">
          <strong>{{ alarm.alarmCount.value }}</strong> camera{{ alarm.alarmCount.value > 1 ? 's' : '' }} in alarm:
          <span class="opacity-90">
            {{ alarmNames }}
          </span>
        </span>

        <!-- Quick links to alarmed monitors -->
        <router-link
          v-for="m in alarm.alarmedMonitors.value.slice(0, 3)"
          :key="m.Monitor.Id"
          :to="`/watch/${m.Monitor.Id}`"
          class="btn-glass rounded-lg px-2 py-1 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          {{ m.Monitor.Name }}
        </router-link>

        <!-- Audio toggle -->
        <button
          class="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          :title="alarm.audioEnabled.value ? 'Mute alerts' : 'Enable audio alerts'"
          @click="alarm.toggleAudio()"
        >
          <svg v-if="alarm.audioEnabled.value" class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clip-rule="evenodd" />
          </svg>
          <svg v-else class="h-4 w-4 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>

        <!-- Notification toggle -->
        <button
          class="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          :title="alarm.notificationsEnabled.value ? 'Disable notifications' : 'Enable browser notifications'"
          @click="alarm.requestNotificationPermission()"
        >
          <svg class="h-4 w-4" :class="alarm.notificationsEnabled.value ? '' : 'opacity-50'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAlarmPolling } from '@/composables/useAlarmPolling'

const alarm = useAlarmPolling()

const alarmNames = computed(() =>
  alarm.alarmedMonitors.value.map((m) => m.Monitor.Name).join(', '),
)
</script>

<style scoped>
.alarm-slide-enter-active,
.alarm-slide-leave-active {
  transition: transform 300ms ease, opacity 300ms ease;
}
.alarm-slide-enter-from,
.alarm-slide-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
