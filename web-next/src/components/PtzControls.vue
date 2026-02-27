<template>
  <div class="flex flex-col items-center gap-1 select-none">
    <button
      class="ptz-btn"
      title="Tilt Up"
      @mousedown="sendCommand('Up')"
      @mouseup="sendCommand('UpStop')"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
      </svg>
    </button>
    <div class="flex items-center gap-1">
      <button
        class="ptz-btn"
        title="Pan Left"
        @mousedown="sendCommand('Left')"
        @mouseup="sendCommand('LeftStop')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
      </button>
      <button
        class="ptz-btn"
        title="Home"
        @click="sendCommand('Home')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 3a1 1 0 01.707.293l7 7a1 1 0 01-1.414 1.414L10 5.414 3.707 11.707a1 1 0 01-1.414-1.414l7-7A1 1 0 0110 3z" />
          <path d="M10 7.586l6 6V17a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3H9v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3.414l6-6z" />
        </svg>
      </button>
      <button
        class="ptz-btn"
        title="Pan Right"
        @mousedown="sendCommand('Right')"
        @mouseup="sendCommand('RightStop')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
    <button
      class="ptz-btn"
      title="Tilt Down"
      @mousedown="sendCommand('Down')"
      @mouseup="sendCommand('DownStop')"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </button>
    <div class="flex items-center gap-2 mt-2">
      <button
        class="ptz-btn text-xs px-3"
        title="Zoom Out"
        @mousedown="sendCommand('ZoomWide')"
        @mouseup="sendCommand('ZoomStop')"
      >
        &minus;
      </button>
      <span class="text-xs text-gray-500">Zoom</span>
      <button
        class="ptz-btn text-xs px-3"
        title="Zoom In"
        @mousedown="sendCommand('ZoomTele')"
        @mouseup="sendCommand('ZoomStop')"
      >
        +
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  monitorId: string
}>()

const auth = useAuthStore()

async function sendCommand(command: string) {
  try {
    const token = await auth.ensureValidToken()
    // PTZ commands go through the AJAX control endpoint
    const params = new URLSearchParams({
      view: 'request',
      request: 'control',
      id: props.monitorId,
      control: 'move',
      command: command,
      token: token,
    })
    await fetch(`/zm/cgi-bin/nph-zms?${params.toString()}`, { method: 'GET' }).catch(() => {
      // Fallback to AJAX endpoint
      return fetch(`/zm/ajax/control.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      })
    })
  } catch (e) {
    console.error('PTZ command failed:', e)
  }
}
</script>

<style scoped>
@reference "../style.css";

.ptz-btn {
  @apply flex items-center justify-center w-10 h-10 rounded-xl text-gray-300
         transition-all duration-150;
  background: rgb(255 255 255 / 0.06);
  border: 1px solid rgb(255 255 255 / 0.08);
}
.ptz-btn:hover {
  background: rgb(255 255 255 / 0.1);
  border-color: rgb(255 255 255 / 0.15);
  color: white;
  transform: scale(1.05);
}
.ptz-btn:active {
  transform: scale(0.97);
}
</style>
