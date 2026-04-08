import { create } from 'zustand'
import type { ProviderId } from '../providers/types'

export interface ProviderConfig {
  apiKey?: string
  baseUrl?: string
  defaultModel: string
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system'
  defaultProvider: ProviderId
  defaultModel: string
  providers: Record<string, ProviderConfig>
}

interface SettingsStore extends AppSettings {
  loaded: boolean
  load: () => Promise<void>
  setTheme: (theme: AppSettings['theme']) => void
  setDefaultProvider: (id: ProviderId) => void
  setDefaultModel: (model: string) => void
  updateProviderConfig: (id: string, config: Partial<ProviderConfig>) => void
  save: () => Promise<void>
}

const DEFAULT_PROVIDERS: Record<string, ProviderConfig> = {
  anthropic:  { apiKey: '', defaultModel: 'claude-3-5-sonnet-20241022' },
  openai:     { apiKey: '', defaultModel: 'gpt-4o' },
  gemini:     { apiKey: '', defaultModel: 'gemini-1.5-pro' },
  ollama:     { baseUrl: 'http://localhost:11434', defaultModel: 'llama3.2' },
  openrouter: { apiKey: '', baseUrl: 'https://openrouter.ai/api/v1', defaultModel: 'anthropic/claude-3.5-sonnet' }
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  loaded: false,
  theme: 'dark',
  defaultProvider: 'anthropic',
  defaultModel: 'claude-3-5-sonnet-20241022',
  providers: DEFAULT_PROVIDERS,

  load: async () => {
    const s = await window.api.settings.get()
    set({
      loaded: true,
      theme: s.theme ?? 'dark',
      defaultProvider: (s.defaultProvider as ProviderId) ?? 'anthropic',
      defaultModel: s.defaultModel ?? 'claude-3-5-sonnet-20241022',
      providers: { ...DEFAULT_PROVIDERS, ...(s.providers ?? {}) }
    })
  },

  setTheme: (theme) => set({ theme }),
  setDefaultProvider: (id) => set({ defaultProvider: id }),
  setDefaultModel: (model) => set({ defaultModel: model }),

  updateProviderConfig: (id, config) => {
    const current = get().providers[id] ?? { defaultModel: '' }
    set({ providers: { ...get().providers, [id]: { ...current, ...config } } })
  },

  save: async () => {
    const { theme, defaultProvider, defaultModel, providers } = get()
    await window.api.settings.set({ theme, defaultProvider, defaultModel, providers })
  }
}))
