import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Terminal, FileText, Globe, Search } from 'lucide-react'
import { cn } from '../../lib/utils'

const TOOL_ICONS: Record<string, React.ReactNode> = {
  runCommand: <Terminal size={12} />,
  readFile: <FileText size={12} />,
  writeFile: <FileText size={12} />,
  listDir: <FileText size={12} />,
  webFetch: <Globe size={12} />,
  grepSearch: <Search size={12} />,
  globSearch: <Search size={12} />
}

interface ToolCallCardProps {
  toolName: string
  input: Record<string, unknown> | null
  output: string | null
  isError?: boolean
  completed: boolean
}

export function ToolCallCard({ toolName, input, output, isError, completed }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false)

  const shortDesc = input
    ? (input.command as string) ?? (input.path as string) ?? (input.url as string) ?? (input.pattern as string) ?? ''
    : ''

  return (
    <div className={cn(
      'rounded-lg border text-xs font-mono overflow-hidden my-1',
      isError ? 'border-red-500/30 bg-red-500/5' : 'border-[var(--border)] bg-[var(--bg-primary)]'
    )}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors"
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span className="text-amber-500">{TOOL_ICONS[toolName] ?? <Terminal size={12} />}</span>
        <span className="text-[var(--text-secondary)]">{toolName}</span>
        {shortDesc && (
          <span className="flex-1 truncate text-[var(--text-primary)] opacity-70">{shortDesc}</span>
        )}
        {!completed && (
          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        )}
        {completed && !isError && (
          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-green-500" />
        )}
        {isError && (
          <span className="flex-shrink-0 text-red-400 text-[10px]">error</span>
        )}
      </button>

      {expanded && (
        <div className="border-t border-[var(--border)]">
          {input && (
            <div className="px-3 py-2 bg-[var(--bg-secondary)]">
              <p className="text-[var(--text-secondary)] text-[10px] mb-1 uppercase tracking-wider">Input</p>
              <pre className="text-[var(--text-primary)] whitespace-pre-wrap break-all text-[11px]">
                {JSON.stringify(input, null, 2)}
              </pre>
            </div>
          )}
          {output && (
            <div className={cn('px-3 py-2', isError ? 'bg-red-500/5' : 'bg-[var(--bg-primary)]')}>
              <p className="text-[var(--text-secondary)] text-[10px] mb-1 uppercase tracking-wider">Output</p>
              <pre className={cn('whitespace-pre-wrap break-all text-[11px] max-h-48 overflow-y-auto', isError ? 'text-red-300' : 'text-[var(--text-primary)]')}>
                {output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
