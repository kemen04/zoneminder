import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'
import router from './router'
import { useThemeStore } from './stores/theme'
import './style.css'

// Load ZoneMinder's video-stream web components at runtime
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.type = 'module'
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

async function loadVideoComponents() {
  try {
    await loadScript('/zm/js/video-rtc.js')
    await loadScript('/zm/js/video-stream.js')
  } catch (e) {
    console.warn('video-stream components not available:', e)
  }
}

loadVideoComponents()

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
// Initialize theme before first paint so .dark class is set early
useThemeStore()

app.use(router)
app.use(VueQueryPlugin)

app.mount('#app')
