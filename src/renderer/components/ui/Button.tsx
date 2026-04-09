import React from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'secondary'
  size?: 'sm' | 'md' | 'icon'
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg-primary)] disabled:opacity-40 disabled:cursor-not-allowed select-none',
        variant === 'primary' && 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-sm active:scale-[0.98]',
        variant === 'secondary' && 'bg-[var(--bg-hover)] hover:bg-[var(--border)] text-[var(--text-primary)] border border-[var(--border)]',
        variant === 'ghost' && 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
        variant === 'danger' && 'text-red-400 hover:text-red-300 hover:bg-red-500/10',
        size === 'sm' && 'text-xs px-2.5 py-1.5 gap-1.5 h-7',
        size === 'md' && 'text-sm px-3.5 py-2 gap-2 h-8',
        size === 'icon' && 'w-7 h-7 p-0 rounded-md',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
