import React, { useEffect, useRef } from 'react'
import { useMessagesStore } from '../../store/messages'
import { useCodeAgent } from '../../hooks/useCodeAgent'
import { MessageItem } from '../chat/MessageItem'
import { StreamingIndicator } from '../chat/StreamingIndicator'
import { MessageInput } from '../chat/MessageInput'
import { WorkspacePicker } from './WorkspacePicker'
import { useConversationsStore } from '../../store/conversations'

interface CodePaneProps {
  conversationId: string
}

export function CodePane({ conversationId }: CodePaneProps) {
  const messages = useMessagesStore((s) => s.messages[conversationId] ?? [])
  const isStreaming = useMessagesStore((s) => s.isStreaming)
  const { run, cancel } = useCodeAgent(conversationId)
  const loadMessages = useMessagesStore((s) => s.loadMessages)
  const conv = useConversationsStore((s) => s.conversations.find((c) => c.id === conversationId))
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadMessages(conversationId)
  }, [conversationId, loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isStreaming])

  const hasWorkspace = Boolean(conv?.workspacePath)

  return (
    <div className="flex flex-col h-full">
      <WorkspacePicker conversationId={conversationId} />
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && !isStreaming && (
          <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)] text-sm gap-2">
            <p>{hasWorkspace ? 'Ask the agent to help with your code' : 'Select a workspace folder to get started'}</p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageItem key={msg.id} message={msg} />
        ))}
        <StreamingIndicator />
        <div ref={bottomRef} />
      </div>
      <MessageInput
        onSend={run}
        isStreaming={isStreaming}
        onCancel={cancel}
        placeholder={hasWorkspace ? 'Ask the agent…' : 'Select a workspace first…'}
      />
    </div>
  )
}
