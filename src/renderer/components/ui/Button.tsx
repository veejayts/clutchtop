import React from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'icon'
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary' && 'bg-amber-600 hover:bg-amber-500 text-white',
        variant === 'ghost' && 'hover:bg-white/10 dark:hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
        variant === 'danger' && 'hover:bg-red-500/20 text-red-400 hover:text-red-300',
        size === 'sm' && 'text-xs px-2.5 py-1.5 gap-1.5',
        size === 'md' && 'text-sm px-3.5 py-2 gap-2',
        size === 'icon' && 'w-8 h-8 p-0',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
