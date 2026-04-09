import React from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useSettingsStore } from '../../store/settings'
import { cn } from '../../lib/utils'
import type { AppSettings } from '../../store/settings'

const THEMES: { id: AppSettings['theme']; label: string; description: string; Icon: React.ComponentType<{ size: number }> }[] = [
  { id: 'light', label: 'Light', description: 'Clean and bright', Icon: Sun },
  { id: 'dark',  label: 'Dark',  description: 'Easy on the eyes', Icon: Moon },
  { id: 'system', label: 'System', description: 'Follows your OS', Icon: Monitor }
]

export function AppearanceSettings() {
  const { theme, setTheme, save } = useSettingsStore()

  const handleTheme = async (t: AppSettings['theme']) => {
    setTheme(t)
    await save()
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)] block mb-3">Theme</label>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map(({ id, label, description, Icon }) => (
            <button
              key={id}
              onClick={() => handleTheme(id)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200',
                theme === id
                  ? 'border-amber-500 bg-gradient-to-br from-amber-500/10 to-amber-600/10 text-amber-500 shadow-md'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-focus)] hover:bg-[var(--bg-hover)] hover:shadow-sm'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
                theme === id ? 'bg-amber-500 text-white' : 'bg-[var(--bg-hover)]'
              )}>
                <Icon size={18} />
              </div>
              <div className="text-center">
                <span className="text-xs font-medium block">{label}</span>
                <span className="text-[10px] text-[var(--text-muted)] block">{description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Accent color preview */}
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)] block mb-3">Accent Color</label>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 shadow-md flex items-center justify-center">
            <span className="text-white text-xs font-medium">Warm Amber</span>
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            <p>Current accent color</p>
            <p className="text-[10px]">#d97706</p>
          </div>
        </div>
      </div>
    </div>
  )
}
