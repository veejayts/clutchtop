import React, { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
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
  const [orModels, setOrModels] = useState<{ id: string; name: string }[]>([])
  const [orFetchedAt, setOrFetchedAt] = useState<string | null>(null)
  const [orFetching, setOrFetching] = useState(false)
  const [orError, setOrError] = useState<string | null>(null)

  // Load stored OpenRouter models from DB on mount
  useEffect(() => {
    window.api.db.openrouter.models.list().then((rows) => {
      if (rows.length > 0) {
        setOrModels(rows.map((r) => ({ id: r.id, name: r.name })))
        setOrFetchedAt(rows[0].fetched_at)
      }
    }).catch(() => { /* DB not yet seeded */ })
  }, [])

  const handleFetchOrModels = async () => {
    const apiKey = providers['openrouter']?.apiKey
    if (!apiKey) {
      setOrError('Enter your OpenRouter API key first.')
      return
    }
    setOrFetching(true)
    setOrError(null)
    try {
      const rows = await window.api.db.openrouter.models.fetch(apiKey)
      setOrModels(rows.map((r) => ({ id: r.id, name: r.name })))
      setOrFetchedAt(rows[0]?.fetched_at ?? null)
    } catch (err) {
      setOrError((err as Error).message ?? 'Fetch failed')
    } finally {
      setOrFetching(false)
    }
  }

  return (
    <div className="space-y-5">
      {ALL_PROVIDER_IDS.map((id) => {
        const config = providers[id] ?? { defaultModel: '' }
        const needsApiKey = id !== 'ollama'
        const needsBaseUrl = id === 'ollama' || id === 'openrouter'
        const isOpenRouter = id === 'openrouter'
        const modelOptions = isOpenRouter && orModels.length > 0
          ? orModels.map((m) => ({ value: m.id, label: m.name }))
          : (DEFAULT_MODELS[id] ?? []).map((m) => ({ value: m, label: m }))

        return (
          <div 
            key={id} 
            className="space-y-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--border-focus)] transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{PROVIDER_LABELS[id]}</h3>
            </div>
            <div className="space-y-3">
              {needsApiKey && (
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] block mb-2">API Key</label>
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
                  <label className="text-xs font-medium text-[var(--text-secondary)] block mb-2">Base URL</label>
                  <Input
                    value={config.baseUrl ?? ''}
                    onChange={(e) => updateProviderConfig(id, { baseUrl: e.target.value })}
                    onBlur={() => save()}
                    placeholder={id === 'ollama' ? 'http://localhost:11434' : 'https://openrouter.ai/api/v1'}
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] block mb-2">Default Model</label>
                <Select
                  value={config.defaultModel}
                  onChange={(e) => { updateProviderConfig(id, { defaultModel: e.target.value }); save() }}
                  options={modelOptions}
                />
              </div>

              {isOpenRouter && (
                <div className="pt-2 space-y-2">
                  <button
                    onClick={handleFetchOrModels}
                    disabled={orFetching}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-amber-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm"
                  >
                    <RefreshCw size={12} className={orFetching ? 'animate-spin' : ''} />
                    {orFetching ? 'Fetching models...' : 'Refresh model list'}
                  </button>
                  {orFetchedAt && !orError && (
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {orModels.length} models · last fetched {new Date(orFetchedAt).toLocaleString()}
                    </p>
                  )}
                  {orError && (
                    <p className="text-[10px] text-red-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                      {orError}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
