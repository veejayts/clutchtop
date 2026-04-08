import React from 'react'
import ReactMarkdown from 'react-markdown'
import { cn } from '../../lib/utils'
import { CodeBlock } from '../ui/CodeBlock'
import { ToolCallCard } from '../code/ToolCallCard'
import type { Message } from '../../providers/types'

interface MessageItemProps {
  message: Message
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user'
  const isToolResult = message.role === 'tool_result'

  if (isToolResult) {
    return (
      <div className="flex flex-col gap-2 py-2">
        {message.content.map((part, i) => {
          if (part.type === 'tool_result') {
            return (
              <div key={i} className="ml-8">
                <ToolCallCard
                  toolName={part.toolUseId}
                  input={null}
                  output={part.content}
                  isError={part.isError}
                  completed
                />
              </div>
            )
          }
          return null
        })}
      </div>
    )
  }

  return (
    <div className={cn('flex gap-3 py-3 px-4', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-amber-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold mt-0.5">
          AI
        </div>
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-amber-600 text-white rounded-br-sm'
            : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-bl-sm border border-[var(--border)]'
        )}
      >
        {message.content.map((part, i) => {
          if (part.type === 'text') {
            return (
              <ReactMarkdown
                key={i}
                components={{
                  code({ inline, className, children, ...props }: { inline?: boolean; className?: string; children?: React.ReactNode }) {
                    const lang = /language-(\w+)/.exec(className ?? '')?.[1]
                    if (!inline) {
                      return <CodeBlock code={String(children).replace(/\n$/, '')} language={lang} />
                    }
                    return (
                      <code className="bg-black/20 rounded px-1 py-0.5 text-xs font-mono" {...props}>
                        {children}
                      </code>
                    )
                  },
                  p({ children }) {
                    return <p className="mb-2 last:mb-0">{children}</p>
                  },
                  ul({ children }) {
                    return <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
                  },
                  ol({ children }) {
                    return <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
                  },
                  blockquote({ children }) {
                    return <blockquote className="border-l-2 border-amber-500 pl-3 italic opacity-80">{children}</blockquote>
                  }
                }}
              >
                {part.text}
              </ReactMarkdown>
            )
          }
          if (part.type === 'tool_use') {
            return (
              <ToolCallCard
                key={i}
                toolName={part.toolName}
                input={part.toolInput}
                output={null}
                completed={false}
              />
            )
          }
          return null
        })}
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-[var(--border)] flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5 text-[var(--text-secondary)]">
          U
        </div>
      )}
    </div>
  )
}
