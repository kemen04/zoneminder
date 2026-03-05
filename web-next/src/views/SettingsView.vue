<template>
  <div class="h-full flex flex-col">
    <!-- Toolbar -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-divider glass-subtle">
      <h1 class="text-lg font-semibold text-heading">Settings</h1>
      <div class="flex items-center gap-3">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search settings..."
          class="select-glass w-64"
        />
        <button
          v-if="pendingChanges.size > 0"
          class="btn-gradient rounded-lg px-4 py-1.5 text-sm"
          :disabled="saving"
          @click="saveAll"
        >
          {{ saving ? 'Saving...' : `Save (${pendingChanges.size})` }}
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 flex min-h-0">
      <!-- Category tabs (sidebar) -->
      <div class="w-48 border-r border-divider overflow-y-auto py-2 px-2 shrink-0 hidden sm:block">
        <button
          v-for="cat in categories"
          :key="cat"
          class="w-full text-left rounded-lg px-3 py-2 text-sm transition-colors"
          :class="activeCategory === cat
            ? 'bg-primary-500/10 text-primary-400 font-medium'
            : 'text-soft hover:bg-hover hover:text-heading'"
          @click="activeCategory = cat"
        >
          {{ cat }}
          <span v-if="categoryChangeCount(cat) > 0" class="ml-1 text-xs text-primary-400">
            ({{ categoryChangeCount(cat) }})
          </span>
        </button>
      </div>
      <!-- Mobile category select -->
      <div class="sm:hidden px-4 py-2 border-b border-divider">
        <select v-model="activeCategory" class="select-glass w-full">
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>

      <!-- Settings list -->
      <div class="flex-1 overflow-y-auto p-4">
        <div v-if="loading" class="flex items-center justify-center py-12">
          <span class="spinner" />
          <span class="ml-3 text-soft text-sm">Loading settings...</span>
        </div>
        <div v-else-if="visibleConfigs.length === 0" class="text-center py-12 text-muted text-sm">
          No settings found{{ searchQuery ? ' matching your search' : '' }}
        </div>
        <div v-else>
          <SettingField
            v-for="config in visibleConfigs"
            :key="config.Id"
            :config="config"
            @change="onFieldChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import SettingField from '@/components/SettingField.vue'
import type { ZmConfig } from '@/components/SettingField.vue'
import { useApi } from '@/composables/useApi'

const api = useApi()
const configs = ref<ZmConfig[]>([])
const loading = ref(false)
const saving = ref(false)
const searchQuery = ref('')
const activeCategory = ref('System')
const pendingChanges = ref<Map<string, string>>(new Map())

const categories = computed(() => {
  const cats = new Set(configs.value.map((c) => c.Category).filter(Boolean))
  // Order common categories first
  const preferred = ['System', 'Config', 'Display', 'Images', 'Logging', 'Network', 'Email', 'Upload', 'X10']
  const ordered = preferred.filter((c) => cats.has(c))
  for (const c of cats) {
    if (!ordered.includes(c)) ordered.push(c)
  }
  return ordered
})

const visibleConfigs = computed(() => {
  let result = configs.value.filter((c) => c.Category === activeCategory.value)

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = configs.value.filter(
      (c) =>
        c.Name.toLowerCase().includes(q) ||
        c.Help?.toLowerCase().includes(q) ||
        c.Prompt?.toLowerCase().includes(q),
    )
  }

  return result
})

function categoryChangeCount(cat: string): number {
  return configs.value
    .filter((c) => c.Category === cat)
    .filter((c) => pendingChanges.value.has(c.Id))
    .length
}

function onFieldChange(id: string, value: string) {
  const config = configs.value.find((c) => c.Id === id)
  if (config && value === config.Value) {
    pendingChanges.value.delete(id)
  } else {
    pendingChanges.value.set(id, value)
  }
  // Trigger reactivity
  pendingChanges.value = new Map(pendingChanges.value)
}

async function fetchConfigs() {
  loading.value = true
  try {
    const data = await api.fetch<{ configs: { Config: ZmConfig }[] }>('/configs.json')
    configs.value = (data.configs ?? []).map((c) => c.Config)
    if (categories.value.length > 0 && !categories.value.includes(activeCategory.value)) {
      activeCategory.value = categories.value[0]
    }
  } catch {
    configs.value = []
  } finally {
    loading.value = false
  }
}

async function saveAll() {
  saving.value = true
  try {
    for (const [id, value] of pendingChanges.value) {
      await api.fetch(`/configs/${id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `Config[Value]=${encodeURIComponent(value)}`,
      })
      // Update local state
      const config = configs.value.find((c) => c.Id === id)
      if (config) config.Value = value
    }
    pendingChanges.value.clear()
  } catch {
    // Some saves may have failed
  } finally {
    saving.value = false
  }
}

onMounted(fetchConfigs)
</script>
