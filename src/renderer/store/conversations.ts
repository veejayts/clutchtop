import { create } from 'zustand'
import { useMessagesStore } from './messages'

export interface Conversation {
  id: string
  title: string
  mode: 'chat' | 'agent'
  systemPrompt: string | null
  providerId: string | null
  model: string | null
  workspacePath: string | null
  createdAt: string
  updatedAt: string
}

function rowToConversation(row: Record<string, unknown>): Conversation {
  return {
    id: row.id as string,
    title: row.title as string,
    mode: (row.mode as string) === 'agent' ? 'agent' : ((row.mode as string) === 'code' ? 'agent' : 'chat'),
    systemPrompt: (row.system_prompt as string | null) ?? null,
    providerId: (row.provider_id as string | null) ?? null,
    model: (row.model as string | null) ?? null,
    workspacePath: (row.workspace_path as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }
}

interface ConversationsStore {
  conversations: Conversation[]
  activeId: string | null
  loaded: boolean
  load: () => Promise<void>
  create: (data?: { title?: string; mode?: 'chat' | 'agent' }) => Promise<Conversation>
  update: (id: string, data: Partial<Pick<Conversation, 'title' | 'systemPrompt' | 'providerId' | 'model' | 'workspacePath'>>) => Promise<void>
  delete: (id: string) => Promise<void>
  setActive: (id: string | null) => void
  getActive: () => Conversation | null
}

export const useConversationsStore = create<ConversationsStore>((set, get) => ({
  conversations: [],
  activeId: null,
  loaded: false,

  load: async () => {
    const rows = await window.api.db.conversations.list()
    set({ conversations: rows.map(rowToConversation), loaded: true })
  },

  create: async (data) => {
    const title = data?.title ?? 'New conversation'
    const mode = data?.mode ?? 'chat'
    const row = await window.api.db.conversations.create({ title, mode })
    const conv = rowToConversation(row as unknown as Record<string, unknown>)
    useMessagesStore.getState().cancelStream()
    set((s) => ({ conversations: [conv, ...s.conversations], activeId: conv.id }))
    return conv
  },

  update: async (id, data) => {
    await window.api.db.conversations.update(id, {
      title: data.title,
      systemPrompt: data.systemPrompt ?? undefined,
      providerId: data.providerId ?? undefined,
      model: data.model ?? undefined,
      workspacePath: data.workspacePath ?? undefined
    })
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === id ? { ...c, ...data } : c
      )
    }))
  },

  delete: async (id) => {
    await window.api.db.conversations.delete(id)
    set((s) => {
      const remaining = s.conversations.filter((c) => c.id !== id)
      const newActive = s.activeId === id ? (remaining[0]?.id ?? null) : s.activeId
      return { conversations: remaining, activeId: newActive }
    })
  },

  setActive: (id) => {
    useMessagesStore.getState().cancelStream()
    set({ activeId: id })
  },

  getActive: () => {
    const { conversations, activeId } = get()
    return conversations.find((c) => c.id === activeId) ?? null
  }
}))
