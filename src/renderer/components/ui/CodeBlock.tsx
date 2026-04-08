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
    <div className="relative group rounded-lg overflow-hidden border border-[var(--border)] my-2">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-primary)] border-b border-[var(--border)]">
        <span className="text-xs text-[var(--text-secondary)]">{language ?? 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm bg-[var(--bg-secondary)]">
        <code className="text-[var(--text-primary)] font-mono">{code}</code>
      </pre>
    </div>
  )
}
