import React, { useState, useRef, useEffect } from 'react'
import { Plus, MessageSquare, Terminal, Trash2, Zap } from 'lucide-react'
import { useConversationsStore } from '../../store/conversations'
import { useWorkspaceStore } from '../../store/workspace'
import { useMessagesStore } from '../../store/messages'
import { cn, truncate } from '../../lib/utils'

export function Sidebar() {
  const { conversations, activeId, create, delete: deleteConv, setActive, update } = useConversationsStore()
  const { mode } = useWorkspaceStore()
  const streamingStates = useMessagesStore((s) => s.streamingStates)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const editRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId && editRef.current) editRef.current.focus()
  }, [editingId])

  const handleNew = async () => {
    await create({ mode })
  }

  const handleDoubleClick = (id: string, title: string) => {
    setEditingId(id)
    setEditTitle(title)
  }

  const commitEdit = async () => {
    if (editingId && editTitle.trim()) {
      await update(editingId, { title: editTitle.trim() })
    }
    setEditingId(null)
  }

  const filtered = conversations.filter((c) => c.mode === mode)

  return (
    <aside className="w-60 flex-shrink-0 bg-[var(--bg-secondary)] border-r border-[var(--border)] flex flex-col h-full rounded-r-2xl shadow-[var(--shadow-sm)]">
      {/* Logo / branding */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-md">
          <Zap size={14} className="text-white" fill="white" />
        </div>
        <span className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">Clutchtop</span>
      </div>

      {/* New conversation button */}
      <div className="px-3 pb-3">
        <button
          onClick={handleNew}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border)] transition-all duration-200 group hover:shadow-md active:scale-[0.98]"
        >
          <div className="w-6 h-6 rounded-lg bg-[var(--accent-dim)] flex items-center justify-center group-hover:bg-[var(--accent)] transition-colors">
            <Plus size={12} className="text-[var(--accent)] group-hover:text-white transition-colors" />
          </div>
          <span>New conversation</span>
          <span className="ml-auto text-xs text-[var(--text-muted)] font-normal bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded border border-[var(--border)]">⌘N</span>
        </button>
      </div>

      {/* Section label */}
      {filtered.length > 0 && (
        <div className="px-4 mb-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            {mode === 'agent' ? 'Recent Sessions' : 'Recent Chats'}
          </p>
        </div>
      )}

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2.5 pb-2 space-y-0.5">
        {filtered.length === 0 && (
          <div className="px-3 py-8 text-center">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-hover)] flex items-center justify-center mx-auto mb-3">
              <MessageSquare size={14} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              No {mode === 'agent' ? 'sessions' : 'chats'} yet
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Start by clicking "New conversation"
            </p>
          </div>
        )}
        {filtered.map((conv) => (
          <div
            key={conv.id}
            className={cn(
              'group flex items-center gap-2 px-2.5 py-2 rounded-xl cursor-pointer select-none transition-all duration-150',
              activeId === conv.id
                ? 'bg-[var(--accent-dim)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] hover:shadow-sm'
            )}
            onClick={() => setActive(conv.id)}
          >
            <div className={cn(
              'w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
              activeId === conv.id ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-hover)] text-[var(--text-muted)]'
            )}>
              {conv.mode === 'agent'
                ? <Terminal size={13} />
                : <MessageSquare size={13} />
              }
            </div>

            {editingId === conv.id ? (
              <input
                ref={editRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitEdit()
                  if (e.key === 'Escape') setEditingId(null)
                }}
                className="flex-1 bg-transparent text-sm outline-none text-[var(--text-primary)] min-w-0 px-1 -mx-1 rounded"
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <span
                className="flex-1 text-sm truncate leading-5"
                onDoubleClick={(e) => { e.stopPropagation(); handleDoubleClick(conv.id, conv.title) }}
              >
                {truncate(conv.title, 24)}
              </span>
            )}

            {streamingStates[conv.id]?.isStreaming && (
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse-soft flex-shrink-0" />
            )}

            <button
              onClick={(e) => { e.stopPropagation(); deleteConv(conv.id) }}
              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 flex-shrink-0"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)] rounded-b-2xl">
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-[var(--text-muted)] font-medium">v0.1.0</p>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]"></div>
            <span className="text-[10px] text-[var(--text-muted)]">Connected</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
