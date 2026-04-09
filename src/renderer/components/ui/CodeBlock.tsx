import React from 'react'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface CodeBlockProps {
  code: string
  language?: string
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group rounded-xl overflow-hidden border border-[var(--border)] my-3 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Header with language badge */}
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span className="text-xs font-medium text-[var(--text-secondary)]">{language ?? 'code'}</span>
        </div>
        <button
          onClick={handleCopy}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all duration-200',
            copied
              ? 'text-green-500 bg-green-500/10'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
          )}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      
      {/* Code content */}
      <div className="relative">
        <pre className="p-4 overflow-x-auto text-sm bg-[var(--bg-primary)] min-h-[40px]">
          <code className="text-[var(--text-primary)] font-mono leading-relaxed">{code}</code>
        </pre>
        
        {/* Subtle corner accent */}
        <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-lg pointer-events-none"></div>
      </div>
    </div>
  )
}

// Helper function for class names
function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}
