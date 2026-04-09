import React, { useEffect, useRef } from 'react'
import { useMessagesStore } from '../../store/messages'
import { useChat } from '../../hooks/useChat'
import { MessageItem } from './MessageItem'
import { StreamingIndicator } from './StreamingIndicator'
import { MessageInput } from './MessageInput'

interface ChatPaneProps {
  conversationId: string
}

export function ChatPane({ conversationId }: ChatPaneProps) {
  const rawMessages = useMessagesStore((s) => s.messages[conversationId])
  const messages = rawMessages ?? []
  const streamingState = useMessagesStore((s) => s.streamingStates[conversationId])
  const isStreaming = streamingState?.isStreaming ?? false
  const { send, cancel } = useChat(conversationId)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load messages when conversation changes
  const loadMessages = useMessagesStore((s) => s.loadMessages)
  useEffect(() => {
    loadMessages(conversationId)
  }, [conversationId, loadMessages])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isStreaming])

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)]">
      {/* Messages area with subtle background pattern */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Subtle grid pattern background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle, var(--text-secondary) 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        ></div>
        
        <div className="relative flex flex-col">
          {messages.length === 0 && !isStreaming && (
            <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)]">
              <div className="w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center mb-4 shadow-sm">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[var(--text-secondary)]">
                  <path d="M8 10h8M8 14h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Start a conversation</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Send a message to begin chatting</p>
            </div>
          )}
          
          {messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} />
          ))}
          
          <StreamingIndicator conversationId={conversationId} />
          <div ref={bottomRef} />
        </div>
      </div>
      
      <MessageInput onSend={send} isStreaming={isStreaming} onCancel={cancel} />
    </div>
  )
}
