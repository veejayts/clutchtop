import React, { useState } from 'react'
import { MessageSquare, Terminal, Settings, Sun, Moon, Monitor } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspace'
import { useSettingsStore } from '../../store/settings'
import { SettingsModal } from '../settings/SettingsModal'
import { cn } from '../../lib/utils'

export function TopBar() {
  const { mode, setMode } = useWorkspaceStore()
  const { theme, setTheme, save } = useSettingsStore()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const cycleTheme = async () => {
    const next = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark'
    setTheme(next)
    await save()
  }

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor

  return (
    <>
      <header className="h-12 flex items-center justify-between px-4 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex-shrink-0 drag-region rounded-tl-2xl">
        {/* Mode toggle — improved pill segmented control */}
        <div className="flex items-center gap-1 bg-[var(--bg-primary)] rounded-xl p-1 border border-[var(--border)] shadow-[var(--shadow-sm)]">
          <button
            onClick={() => setMode('chat')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
              mode === 'chat'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            )}
          >
            <MessageSquare size={14} className={mode === 'chat' ? 'text-white' : ''} />
            <span>Chat</span>
          </button>
          <button
            onClick={() => setMode('agent')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
              mode === 'agent'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            )}
          >
            <Terminal size={14} className={mode === 'agent' ? 'text-white' : ''} />
            <span>Agent</span>
          </button>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={cycleTheme}
            title={`Theme: ${theme}`}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:shadow-md transition-all duration-200"
          >
            <ThemeIcon size={15} />
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            title="Settings (Ctrl+,)"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:shadow-md transition-all duration-200"
          >
            <Settings size={15} />
          </button>
        </div>
      </header>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}
