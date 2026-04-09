import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  width?: 'md' | 'lg' | 'xl'
}

export function Modal({ open, onClose, title, children, width = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className={cn(
          'relative bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow-xl)] flex flex-col max-h-[85vh] animate-slide-up',
          width === 'md' && 'w-full max-w-md',
          width === 'lg' && 'w-full max-w-lg',
          width === 'xl' && 'w-full max-w-2xl'
        )}
      >
        {/* Header with gradient accent */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)] bg-gradient-to-r from-[var(--bg-elevated)] to-[var(--bg-secondary)]">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all duration-150"
          >
            <X size={15} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">
          {children}
        </div>
        {/* Footer with subtle shadow */}
        <div className="px-5 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
          <p className="text-xs text-[var(--text-muted)] text-center">Press Escape to close</p>
        </div>
      </div>
    </div>
  )
}
