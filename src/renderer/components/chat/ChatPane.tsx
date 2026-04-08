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
  const isStreaming = useMessagesStore((s) => s.isStreaming)
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
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && !isStreaming && (
          <div className="h-full flex items-center justify-center text-[var(--text-secondary)] text-sm">
            Send a message to start the conversation
          </div>
        )}
        {messages.map((msg) => (
          <MessageItem key={msg.id} message={msg} />
        ))}
        <StreamingIndicator />
        <div ref={bottomRef} />
      </div>
      <MessageInput onSend={send} isStreaming={isStreaming} onCancel={cancel} />
    </div>
  )
}
