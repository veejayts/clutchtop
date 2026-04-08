import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { ProviderSettings } from './ProviderSettings'
import { AppearanceSettings } from './AppearanceSettings'
import { useSettingsStore } from '../../store/settings'
import { Select } from '../ui/Select'
import { PROVIDER_LABELS, ALL_PROVIDER_IDS } from '../../providers/registry'
import { cn } from '../../lib/utils'

type Tab = 'providers' | 'appearance' | 'general'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [tab, setTab] = useState<Tab>('providers')
  const { defaultProvider, setDefaultProvider, defaultModel, setDefaultModel, providers, save } = useSettingsStore()

  const tabs: { id: Tab; label: string }[] = [
    { id: 'providers',  label: 'Providers' },
    { id: 'general',    label: 'General' },
    { id: 'appearance', label: 'Appearance' }
  ]

  return (
    <Modal open={open} onClose={onClose} title="Settings" width="lg">
      <div className="flex gap-4 -mt-1">
        {/* Tab nav */}
        <nav className="w-28 flex-shrink-0 flex flex-col gap-0.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'text-left px-3 py-2 rounded-lg text-sm transition-colors',
                tab === t.id
                  ? 'bg-amber-600/20 text-amber-500 font-medium'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {/* Tab content */}
        <div className="flex-1 min-w-0">
          {tab === 'providers' && <ProviderSettings />}
          {tab === 'appearance' && <AppearanceSettings />}
          {tab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[var(--text-secondary)] block mb-1">Default Provider</label>
                <Select
                  value={defaultProvider}
                  onChange={(e) => { setDefaultProvider(e.target.value as typeof defaultProvider); save() }}
                  options={ALL_PROVIDER_IDS.map((id) => ({ value: id, label: PROVIDER_LABELS[id] }))}
                />
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] block mb-1">Default Model</label>
                <Select
                  value={defaultModel}
                  onChange={(e) => { setDefaultModel(e.target.value); save() }}
                  options={(Object.keys(providers[defaultProvider]?.defaultModel ? { [providers[defaultProvider].defaultModel]: '' } : {})).length > 0
                    ? [{ value: providers[defaultProvider]?.defaultModel ?? '', label: providers[defaultProvider]?.defaultModel ?? '' }]
                    : [{ value: defaultModel, label: defaultModel }]
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
