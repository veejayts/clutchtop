import React, { useState } from 'react'
import { MessageSquare, Bot, Settings, Sun, Moon, Monitor } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspace'
import { useSettingsStore } from '../../store/settings'
import { SettingsModal } from '../settings/SettingsModal'
import { Button } from '../ui/Button'
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
      <header className="h-11 flex items-center justify-between px-4 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex-shrink-0 drag-region">
        {/* Mode toggle */}
        <div className="flex items-center gap-1 bg-[var(--bg-primary)] rounded-lg p-1">
          <button
            onClick={() => setMode('chat')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors',
              mode === 'chat'
                ? 'bg-amber-600 text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            <MessageSquare size={13} />
            Chat
          </button>
          <button
            onClick={() => setMode('agent')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors',
              mode === 'agent'
                ? 'bg-amber-600 text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            <Bot size={13} />
            Agent
          </button>
        </div>

        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={cycleTheme} title={`Theme: ${theme}`}>
            <ThemeIcon size={15} />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setSettingsOpen(true)} title="Settings (Ctrl+,)">
            <Settings size={15} />
          </Button>
        </div>
      </header>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}
