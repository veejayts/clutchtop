import React, { useState, useRef, useEffect } from 'react'
import { Plus, MessageSquare, Code2, Trash2 } from 'lucide-react'
import { useConversationsStore } from '../../store/conversations'
import { useWorkspaceStore } from '../../store/workspace'
import { useMessagesStore } from '../../store/messages'
import { cn, truncate, formatDate } from '../../lib/utils'
import { Button } from '../ui/Button'

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

  return (
    <aside className="w-60 flex-shrink-0 bg-[var(--bg-secondary)] border-r border-[var(--border)] flex flex-col h-full">
      <div className="p-3 border-b border-[var(--border)]">
        <Button onClick={handleNew} className="w-full" size="sm" variant="ghost">
          <Plus size={14} />
          New conversation
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {conversations.filter((c) => c.mode === mode).length === 0 && (
          <p className="text-xs text-[var(--text-secondary)] text-center py-6 px-4">
            No {mode === 'agent' ? 'agent sessions' : 'conversations'} yet. Start one!
          </p>
        )}
        {conversations.filter((c) => c.mode === mode).map((conv) => (
          <div
            key={conv.id}
            className={cn(
              'group flex items-center gap-2 px-3 py-2 mx-1 rounded-lg cursor-pointer select-none transition-colors',
              activeId === conv.id
                ? 'bg-amber-600/20 text-[var(--text-primary)]'
                : 'hover:bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
            onClick={() => setActive(conv.id)}
          >
            <span className="flex-shrink-0 text-[var(--text-secondary)]">
              {conv.mode === 'agent' ? <Code2 size={14} /> : <MessageSquare size={14} />}
            </span>

            {editingId === conv.id ? (
              <input
                ref={editRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null) }}
                className="flex-1 bg-transparent text-xs outline-none text-[var(--text-primary)] min-w-0"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className="flex-1 text-xs truncate"
                onDoubleClick={(e) => { e.stopPropagation(); handleDoubleClick(conv.id, conv.title) }}
              >
                {truncate(conv.title, 30)}
              </span>
            )}

            {streamingStates[conv.id]?.isStreaming && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
            )}

            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); deleteConv(conv.id) }}
                className="p-0.5 rounded text-[var(--text-secondary)] hover:text-red-400 transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-[var(--border)]">
        <p className="text-xs text-[var(--text-secondary)] text-center">Clutchtop v0.1</p>
      </div>
    </aside>
  )
}
