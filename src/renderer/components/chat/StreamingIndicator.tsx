import React from 'react'
import ReactMarkdown from 'react-markdown'
import { useMessagesStore } from '../../store/messages'
import { CodeBlock } from '../ui/CodeBlock'

export function StreamingIndicator({ conversationId }: { conversationId: string }) {
  const streamingText = useMessagesStore((s) => s.streamingStates[conversationId]?.text ?? '')
  const isStreaming = useMessagesStore((s) => s.streamingStates[conversationId]?.isStreaming ?? false)

  if (!isStreaming) return null

  return (
    <div className="flex gap-3 py-3 px-4">
      <div className="w-7 h-7 rounded-full bg-amber-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold mt-0.5">
        AI
      </div>
      <div className="max-w-[80%] rounded-xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border)]">
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
          <span className="flex gap-1 items-center h-5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        )}
        <span className="inline-block w-0.5 h-4 bg-amber-500 ml-0.5 animate-pulse align-middle" />
      </div>
    </div>
  )
}
