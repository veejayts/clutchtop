import React, { useState, useRef, useCallback } from 'react'
import { Send, Square } from 'lucide-react'
import { cn } from '../../lib/utils'

interface MessageInputProps {
  onSend: (text: string) => void
  isStreaming: boolean
  onCancel: () => void
  placeholder?: string
}

export function MessageInput({ onSend, isStreaming, onCancel, placeholder }: MessageInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(() => {
    const text = value.trim()
    if (!text || isStreaming) return
    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    onSend(text)
  }, [value, isStreaming, onSend])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    // Auto-resize
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
  }

  return (
    <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--bg-primary)]">
      <div className="flex items-end gap-2 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] px-3 py-2 focus-within:border-amber-500/50 transition-colors">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? 'Message…'}
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none py-1 min-h-[28px] max-h-[200px]"
          disabled={false}
        />
        <button
          onClick={isStreaming ? onCancel : handleSend}
          disabled={!isStreaming && !value.trim()}
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors mb-0.5',
            isStreaming
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : value.trim()
                ? 'bg-amber-600 text-white hover:bg-amber-500'
                : 'bg-[var(--border)] text-[var(--text-secondary)] cursor-not-allowed'
          )}
        >
          {isStreaming ? <Square size={14} /> : <Send size={14} />}
        </button>
      </div>
      <p className="text-xs text-[var(--text-secondary)] mt-1.5 text-center">
        Enter to send · Shift+Enter for newline
      </p>
    </div>
  )
}
