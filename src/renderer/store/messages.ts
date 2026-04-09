import { create } from 'zustand'
import type { Message, ContentPart } from '../providers/types'
import { nanoid } from 'nanoid'

interface StreamingState {
  text: string
  isStreaming: boolean
  abortController: AbortController | null
}

interface MessagesStore {
  messages: Record<string, Message[]>    // keyed by conversationId
  streamingStates: Record<string, StreamingState>  // keyed by conversationId

  loadMessages: (conversationId: string) => Promise<void>
  appendMessage: (conversationId: string, msg: Message) => Promise<void>
  appendMessageLocal: (conversationId: string, msg: Message) => void
  setStreamingText: (conversationId: string, text: string) => void
  appendStreamingText: (conversationId: string, delta: string) => void
  finalizeStream: (conversationId: string, content: ContentPart[]) => Promise<Message>
  cancelStream: (conversationId: string) => void
  setAbortController: (conversationId: string, ac: AbortController | null) => void
  getMessages: (conversationId: string) => Message[]
  getStreamingState: (conversationId: string) => StreamingState
  clearConversationState: (conversationId: string) => void
}

function rowToMessage(row: Record<string, unknown>): Message {
  let content: ContentPart[]
  try {
    content = JSON.parse(row.content as string) as ContentPart[]
  } catch {
    content = [{ type: 'text', text: row.content as string }]
  }
  return {
    id: row.id as string,
    role: row.role as Message['role'],
    content,
    createdAt: row.created_at as string
  }
}

export const useMessagesStore = create<MessagesStore>((set, get) => ({
  messages: {},
  streamingStates: {},

  loadMessages: async (conversationId) => {
    const rows = await window.api.db.messages.list(conversationId)
    const msgs = rows.map(rowToMessage)
    set((s) => ({ messages: { ...s.messages, [conversationId]: msgs } }))
  },

  appendMessage: async (conversationId, msg) => {
    const existing = get().messages[conversationId] ?? []
    const seq = existing.length
    await window.api.db.messages.append({
      id: msg.id,
      conversationId,
      role: msg.role,
      content: JSON.stringify(msg.content),
      seq
    })
    set((s) => ({
      messages: {
        ...s.messages,
        [conversationId]: [...(s.messages[conversationId] ?? []), msg]
      }
    }))
  },

  appendMessageLocal: (conversationId, msg) => {
    set((s) => ({
      messages: {
        ...s.messages,
        [conversationId]: [...(s.messages[conversationId] ?? []), msg]
      }
    }))
  },

  setStreamingText: (conversationId, text) => {
    set((s) => ({
      streamingStates: {
        ...s.streamingStates,
        [conversationId]: {
          ...(s.streamingStates[conversationId] ?? { text: '', isStreaming: false, abortController: null }),
          text,
          isStreaming: true
        }
      }
    }))
  },

  appendStreamingText: (conversationId, delta) => {
    set((s) => {
      const current = s.streamingStates[conversationId] ?? { text: '', isStreaming: false, abortController: null }
      return {
        streamingStates: {
          ...s.streamingStates,
          [conversationId]: {
            ...current,
            text: current.text + delta,
            isStreaming: true
          }
        }
      }
    })
  },

  finalizeStream: async (conversationId, content) => {
    const msg: Message = {
      id: nanoid(),
      role: 'assistant',
      content,
      createdAt: new Date().toISOString()
    }
    const existing = get().messages[conversationId] ?? []
    const seq = existing.length
    await window.api.db.messages.append({
      id: msg.id,
      conversationId,
      role: msg.role,
      content: JSON.stringify(msg.content),
      seq
    })
    set((s) => {
      const current = s.streamingStates[conversationId]
      return {
        streamingStates: {
          ...s.streamingStates,
          [conversationId]: {
            text: '',
            isStreaming: false,
            abortController: current?.abortController ?? null
          }
        },
        messages: {
          ...s.messages,
          [conversationId]: [...(s.messages[conversationId] ?? []), msg]
        }
      }
    })
    return msg
  },

  cancelStream: (conversationId) => {
    const current = get().streamingStates[conversationId]
    current?.abortController?.abort()
    set((s) => ({
      streamingStates: {
        ...s.streamingStates,
        [conversationId]: {
          text: '',
          isStreaming: false,
          abortController: null
        }
      }
    }))
  },

  setAbortController: (conversationId, ac) => {
    set((s) => ({
      streamingStates: {
        ...s.streamingStates,
        [conversationId]: {
          ...(s.streamingStates[conversationId] ?? { text: '', isStreaming: false, abortController: null }),
          abortController: ac
        }
      }
    }))
  },

  getMessages: (conversationId) => get().messages[conversationId] ?? [],

  getStreamingState: (conversationId) => {
    const state = get().streamingStates[conversationId]
    return state ?? { text: '', isStreaming: false, abortController: null }
  },

  clearConversationState: (conversationId) => {
    set((s) => {
      const newMessages = { ...s.messages }
      const newStreamingStates = { ...s.streamingStates }
      delete newMessages[conversationId]
      delete newStreamingStates[conversationId]
      return { messages: newMessages, streamingStates: newStreamingStates }
    })
  }
}))