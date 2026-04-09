import React from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
}

export function Input({ className, icon, ...props }: InputProps) {
  return (
    <div className="relative group">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors">
          {icon}
        </div>
      )}
      <input
        className={cn(
          'w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1 focus:ring-offset-[var(--bg-primary)] focus:border-transparent',
          'transition-all duration-150 hover:border-[var(--border-focus)] hover:bg-[var(--bg-hover)]',
          'shadow-sm hover:shadow-md',
          icon && 'pl-10',
          className
        )}
        {...props}
      />
    </div>
  )
}
