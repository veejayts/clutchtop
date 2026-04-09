import { useCallback } from 'react'
import { nanoid } from 'nanoid'
import { useMessagesStore } from '../store/messages'
import { useConversationsStore } from '../store/conversations'
import { useSettingsStore } from '../store/settings'
import { useProvider } from './useProvider'
import type { Message, ContentPart } from '../providers/types'

export function useChat(conversationId: string) {
  const messagesStore = useMessagesStore()
  const convsStore = useConversationsStore()
  const settings = useSettingsStore()
  const conversation = convsStore.conversations.find((c) => c.id === conversationId)
  const providerId = (conversation?.providerId ?? settings.defaultProvider) as Parameters<typeof useProvider>[0]
  const provider = useProvider(providerId)

  const send = useCallback(async (userText: string) => {
    const streamingState = messagesStore.getStreamingState(conversationId)
    if (!userText.trim() || streamingState.isStreaming) return

    const model = conversation?.model ?? settings.providers[providerId]?.defaultModel ?? settings.defaultModel

    // Build user message
    const userMsg: Message = {
      id: nanoid(),
      role: 'user',
      content: [{ type: 'text', text: userText }],
      createdAt: new Date().toISOString()
    }
    await messagesStore.appendMessage(conversationId, userMsg)

    // Auto-title on first message
    const msgs = messagesStore.getMessages(conversationId)
    if (msgs.length === 1) {
      const title = userText.slice(0, 60)
      await convsStore.update(conversationId, { title })
    }

    const ac = new AbortController()
    messagesStore.setAbortController(conversationId, ac)

    const allMessages = messagesStore.getMessages(conversationId)

    try {
      const textParts: ContentPart[] = []
      messagesStore.setStreamingText(conversationId, '')

      for await (const chunk of provider.stream({
        model,
        messages: allMessages,
        systemPrompt: conversation?.systemPrompt ?? undefined,
        signal: ac.signal
      })) {
        if (chunk.type === 'text_delta' && chunk.textDelta) {
          messagesStore.appendStreamingText(conversationId, chunk.textDelta)
          textParts.push({ type: 'text', text: chunk.textDelta })
        } else if (chunk.type === 'message_stop') {
          break
        } else if (chunk.type === 'error') {
          messagesStore.appendStreamingText(conversationId, `\n[Error: ${chunk.error}]`)
          break
        }
      }

      // Coalesce text parts
      const fullText = textParts.map((p) => (p as { text: string }).text).join('')
      await messagesStore.finalizeStream(conversationId, [{ type: 'text', text: fullText }])
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        const currentText = messagesStore.getStreamingState(conversationId).text
        messagesStore.appendStreamingText(conversationId, `\n[Error: ${(err as Error).message}]`)
        await messagesStore.finalizeStream(conversationId, [{ type: 'text', text: currentText + `\n[Error: ${(err as Error).message}]` }])
      } else {
        messagesStore.setAbortController(conversationId, null)
      }
    }
  }, [conversationId, messagesStore, convsStore, settings, provider, conversation, providerId])

  const streamingState = messagesStore.getStreamingState(conversationId)
  return { 
    send, 
    isStreaming: streamingState.isStreaming, 
    streamingText: streamingState.text,
    cancel: () => messagesStore.cancelStream(conversationId) 
  }
}