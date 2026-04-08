export interface ConversationRow {
  id: string
  title: string
  mode: 'chat' | 'code'
  systemPrompt: string | null
  providerId: string | null
  model: string | null
  workspacePath: string | null
  createdAt: string
  updatedAt: string
}

export interface MessageRow {
  id: string
  conversationId: string
  role: string
  content: string
  toolUseId: string | null
  seq: number
  createdAt: string
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system'
  defaultProvider: string
  defaultModel: string
  providers: Record<string, { apiKey?: string; baseUrl?: string; defaultModel: string }>
}

declare global {
  interface Window {
    api: {
      db: {
        conversations: {
          list: () => Promise<ConversationRow[]>
          create: (data: { title: string; mode: string; systemPrompt?: string; providerId?: string; model?: string }) => Promise<ConversationRow>
          update: (id: string, data: { title?: string; systemPrompt?: string; providerId?: string; model?: string; workspacePath?: string }) => Promise<void>
          delete: (id: string) => Promise<void>
        }
        messages: {
          list: (conversationId: string) => Promise<MessageRow[]>
          append: (msg: {
            id: string
            conversationId: string
            role: string
            content: string
            toolUseId?: string
            seq: number
          }) => Promise<void>
        }
      }
      settings: {
        get: () => Promise<AppSettings>
        set: (data: Partial<AppSettings>) => Promise<void>
      }
      tools: {
        execute: (name: string, input: Record<string, unknown>, workspacePath: string) => Promise<{ content: string; isError: boolean }>
        onStreamOutput: (callback: (data: { toolUseId: string; chunk: string }) => void) => () => void
      }
      workspace: {
        select: () => Promise<string | null>
      }
    }
  }
}
