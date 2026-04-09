export interface ConversationRow {
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

export interface MessageRow {
  id: string
  conversationId: string
  role: string
  content: string
  toolUseId: string | null
  seq: number
  createdAt: string
}

export interface RecentWorkspaceRow {
  path: string
  last_used_at: string
}

export interface OpenRouterModelRow {
  id: string
  name: string
  description: string | null
  context_length: number | null
  pricing_prompt: number | null
  pricing_completion: number | null
  fetched_at: string
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system'
  defaultProvider: string
  defaultModel: string
  providers: Record<string, { apiKey?: string; baseUrl?: string; defaultModel: string }>
}

export interface GitStatus {
  isGit: boolean
  status: string
  branch: string | null
}

export interface GitDiff {
  staged: string
  unstaged: string
  status: string
}

export interface GitChangesSummary {
  hasChanges: boolean
  files?: {
    added: string[]
    modified: string[]
    deleted: string[]
    renamed: string[]
  }
  diffStat?: string
  diffContent?: string
  summary?: string
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
        workspaces: {
          list: () => Promise<RecentWorkspaceRow[]>
          touch: (path: string) => Promise<void>
        }
        openrouter: {
          models: {
            list: () => Promise<OpenRouterModelRow[]>
            fetch: (apiKey: string) => Promise<OpenRouterModelRow[]>
          }
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
        gitBranch: (path: string) => Promise<string | null>
      }
      git: {
        status: (workspacePath: string) => Promise<GitStatus>
        diff: (workspacePath: string) => Promise<GitDiff>
        changesSummary: (workspacePath: string) => Promise<GitChangesSummary>
      }
    }
  }
}