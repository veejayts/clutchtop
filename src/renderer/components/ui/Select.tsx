import React from 'react'
import { cn } from '../../lib/utils'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[]
  icon?: React.ReactNode
}

export function Select({ options, className, icon, ...props }: SelectProps) {
  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
        {icon}
      </div>
      <select
        className={cn(
          'w-full appearance-none rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5 pr-10 text-sm text-[var(--text-primary)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1 focus:ring-offset-[var(--bg-primary)]',
          'focus:border-transparent transition-all duration-150 cursor-pointer',
          'hover:border-[var(--border-focus)] hover:bg-[var(--bg-hover)]',
          'shadow-sm hover:shadow-md',
          'backdrop-blur-sm',
          icon && 'pl-10',
          className
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">
            {o.label}
          </option>
        ))}
      </select>
      {/* Custom chevron arrow */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="opacity-70">
          <path 
            d="M3.5 5.5L7 9L10.5 5.5" 
            stroke="currentColor" 
            strokeWidth="1.75" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  )
}
