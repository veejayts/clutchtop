import React from 'react'
import ReactMarkdown from 'react-markdown'
import { useMessagesStore } from '../../store/messages'
import { CodeBlock } from '../ui/CodeBlock'

export function StreamingIndicator({ conversationId }: { conversationId: string }) {
  const streamingText = useMessagesStore((s) => s.streamingStates[conversationId]?.text ?? '')
  const isStreaming = useMessagesStore((s) => s.streamingStates[conversationId]?.isStreaming ?? false)

  if (!isStreaming) return null

  return (
    <div className="flex gap-3 py-4 px-4">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-md">
        <span className="text-white text-xs font-bold">AI</span>
      </div>
      <div className="max-w-[75%] rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] shadow-sm">
        {streamingText ? (
          <ReactMarkdown
            components={{
              code({ inline, className, children }: { inline?: boolean; className?: string; children?: React.ReactNode }) {
                const lang = /language-(\w+)/.exec(className ?? '')?.[1]
                if (!inline) {
                  return <CodeBlock code={String(children).replace(/\n$/, '')} language={lang} />
                }
                return <code className="bg-black/20 rounded px-1 py-0.5 text-xs font-mono">{children}</code>
              }
            }}
          >
            {streamingText}
          </ReactMarkdown>
        ) : (
          <div className="flex items-center gap-2 py-1">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-[var(--text-muted)] ml-2">Thinking...</span>
          </div>
        )}
        <span className="inline-block w-0.5 h-4 bg-amber-500 ml-1 animate-pulse align-middle rounded-full" />
      </div>
    </div>
  )
}
