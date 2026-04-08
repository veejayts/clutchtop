import React from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useSettingsStore } from '../../store/settings'
import { cn } from '../../lib/utils'
import type { AppSettings } from '../../store/settings'

const THEMES: { id: AppSettings['theme']; label: string; Icon: React.ComponentType<{ size: number }> }[] = [
  { id: 'light', label: 'Light', Icon: Sun },
  { id: 'dark',  label: 'Dark',  Icon: Moon },
  { id: 'system', label: 'System', Icon: Monitor }
]

export function AppearanceSettings() {
  const { theme, setTheme, save } = useSettingsStore()

  const handleTheme = async (t: AppSettings['theme']) => {
    setTheme(t)
    await save()
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-[var(--text-secondary)] block mb-3">Theme</label>
        <div className="flex gap-2">
          {THEMES.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => handleTheme(id)}
              className={cn(
                'flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors',
                theme === id
                  ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]'
              )}
            >
              <Icon size={18} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
