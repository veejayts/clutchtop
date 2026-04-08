import { create } from 'zustand'
import type { Message, ContentPart } from '../providers/types'
import { nanoid } from 'nanoid'

interface MessagesStore {
  messages: Record<string, Message[]>    // keyed by conversationId
  streamingText: string                  // live text for current stream
  isStreaming: boolean
  abortController: AbortController | null

  loadMessages: (conversationId: string) => Promise<void>
  appendMessage: (conversationId: string, msg: Message) => Promise<void>
  appendMessageLocal: (conversationId: string, msg: Message) => void
  setStreamingText: (text: string) => void
  appendStreamingText: (delta: string) => void
  finalizeStream: (conversationId: string, content: ContentPart[]) => Promise<Message>
  cancelStream: () => void
  setAbortController: (ac: AbortController | null) => void
  getMessages: (conversationId: string) => Message[]
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
  streamingText: '',
  isStreaming: false,
  abortController: null,

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

  setStreamingText: (text) => set({ streamingText: text, isStreaming: true }),
  appendStreamingText: (delta) => set((s) => ({ streamingText: s.streamingText + delta, isStreaming: true })),

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
    set((s) => ({
      streamingText: '',
      isStreaming: false,
      messages: {
        ...s.messages,
        [conversationId]: [...(s.messages[conversationId] ?? []), msg]
      }
    }))
    return msg
  },

  cancelStream: () => {
    get().abortController?.abort()
    set({ isStreaming: false, streamingText: '', abortController: null })
  },

  setAbortController: (ac) => set({ abortController: ac }),

  getMessages: (conversationId) => get().messages[conversationId] ?? []
}))
