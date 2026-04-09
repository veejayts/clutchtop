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
      'rounded-xl border text-xs font-mono overflow-hidden my-2 shadow-sm transition-all duration-200',
      isError 
        ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50' 
        : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--border-focus)] hover:shadow-md'
    )}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-[var(--bg-hover)] transition-all duration-200"
      >
        <div className={cn(
          'w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors',
          isError ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-500'
        )}>
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </div>
        <span className="text-amber-500">{TOOL_ICONS[toolName] ?? <Terminal size={12} />}</span>
        <span className="text-[var(--text-secondary)] font-medium">{toolName}</span>
        {shortDesc && (
          <span className="flex-1 truncate text-[var(--text-primary)] opacity-70 text-[11px]">— {shortDesc}</span>
        )}
        {!completed && (
          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-500 animate-pulse-soft" />
        )}
        {completed && !isError && (
          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500"></span>
        )}
        {isError && (
          <span className="flex-shrink-0 text-red-400 text-[10px] font-medium">Error</span>
        )}
      </button>

      {expanded && (
        <div className="border-t border-[var(--border)] bg-[var(--bg-secondary)] rounded-b-xl">
          {input && (
            <div className="px-4 py-3">
              <p className="text-[var(--text-secondary)] text-[10px] mb-2 uppercase tracking-wider font-medium">Input</p>
              <pre className="text-[var(--text-primary)] whitespace-pre-wrap break-all text-[11px] leading-relaxed bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border)]">
                {JSON.stringify(input, null, 2)}
              </pre>
            </div>
          )}
          {output && (
            <div className={cn('px-4 py-3', isError ? 'bg-red-500/5' : '')}>
              <p className="text-[var(--text-secondary)] text-[10px] mb-2 uppercase tracking-wider font-medium">Output</p>
              <pre className={cn(
                'whitespace-pre-wrap break-all text-[11px] max-h-48 overflow-y-auto leading-relaxed p-3 rounded-lg',
                isError 
                  ? 'bg-red-500/10 text-red-300 border border-red-500/20' 
                  : 'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border)]'
              )}>
                {output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
