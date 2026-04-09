import React from 'react'
import { useSettingsStore } from '../../store/settings'
import { PROVIDER_LABELS, ALL_PROVIDER_IDS } from '../../providers/registry'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

const DEFAULT_MODELS: Record<string, string[]> = {
  anthropic:  ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
  openai:     ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  gemini:     ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
  ollama:     ['llama3.2', 'mistral', 'codellama', 'phi3'],
  openrouter: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'google/gemini-1.5-pro', 'meta-llama/llama-3.1-70b-instruct', 'minimax/minimax-01', 'moonshot/moonshot-v1-8k', 'xiaomi/mimo-vl-7b-rl']
}

export function ProviderSettings() {
  const { providers, updateProviderConfig, save } = useSettingsStore()

  return (
    <div className="space-y-6">
      {ALL_PROVIDER_IDS.map((id) => {
        const config = providers[id] ?? { defaultModel: '' }
        const models = DEFAULT_MODELS[id] ?? []
        const needsApiKey = id !== 'ollama'
        const needsBaseUrl = id === 'ollama' || id === 'openrouter'

        return (
          <div key={id} className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{PROVIDER_LABELS[id]}</h3>
            <div className="space-y-2">
              {needsApiKey && (
                <div>
                  <label className="text-xs text-[var(--text-secondary)] block mb-1">API Key</label>
                  <Input
                    type="password"
                    value={config.apiKey ?? ''}
                    onChange={(e) => updateProviderConfig(id, { apiKey: e.target.value })}
                    onBlur={() => save()}
                    placeholder={`Enter ${PROVIDER_LABELS[id]} API key`}
                  />
                </div>
              )}
              {needsBaseUrl && (
                <div>
                  <label className="text-xs text-[var(--text-secondary)] block mb-1">Base URL</label>
                  <Input
                    value={config.baseUrl ?? ''}
                    onChange={(e) => updateProviderConfig(id, { baseUrl: e.target.value })}
                    onBlur={() => save()}
                    placeholder={id === 'ollama' ? 'http://localhost:11434' : 'https://openrouter.ai/api/v1'}
                  />
                </div>
              )}
              <div>
                <label className="text-xs text-[var(--text-secondary)] block mb-1">Default Model</label>
                <Select
                  value={config.defaultModel}
                  onChange={(e) => { updateProviderConfig(id, { defaultModel: e.target.value }); save() }}
                  options={models.map((m) => ({ value: m, label: m }))}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
