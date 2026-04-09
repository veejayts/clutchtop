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
    <div className={cn('flex gap-3 py-4 px-4', isUser ? 'justify-end' : 'justify-start')}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-md">
          <span className="text-white text-xs font-bold">AI</span>
        </div>
      )}
      
      {/* Message bubble */}
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm transition-all duration-200',
          isUser
            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-br-sm shadow-md'
            : 'bg-[var(--bg-card)] text-[var(--text-primary)] rounded-bl-sm border border-[var(--border)] hover:shadow-md'
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
                      <code className="bg-black/20 rounded px-1.5 py-0.5 text-xs font-mono" {...props}>
                        {children}
                      </code>
                    )
                  },
                  p({ children }) {
                    return <p className="mb-2 last:mb-0">{children}</p>
                  },
                  ul({ children }) {
                    return <ul className="list-disc list-inside mb-2 space-y-1 ml-1">{children}</ul>
                  },
                  ol({ children }) {
                    return <ol className="list-decimal list-inside mb-2 space-y-1 ml-1">{children}</ol>
                  },
                  blockquote({ children }) {
                    return <blockquote className="border-l-2 border-amber-500/50 pl-3 italic text-[var(--text-secondary)]">{children}</blockquote>
                  },
                  a({ href, children }) {
                    return (
                      <a 
                        href={href} 
                        className="text-amber-500 hover:text-amber-400 underline decoration-amber-500/50 hover:decoration-amber-400 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    )
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
      
      {/* User avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center flex-shrink-0 shadow-sm border border-[var(--border)]">
          <span className="text-xs font-medium text-[var(--text-secondary)]">U</span>
        </div>
      )}
    </div>
  )
}
