export type Role = 'user' | 'assistant' | 'tool_result'

export interface TextPart {
  type: 'text'
  text: string
}

export interface ToolUsePart {
  type: 'tool_use'
  toolUseId: string
  toolName: string
  toolInput: Record<string, unknown>
}

export interface ToolResultPart {
  type: 'tool_result'
  toolUseId: string
  content: string
  isError?: boolean
}

export type ContentPart = TextPart | ToolUsePart | ToolResultPart

export interface Message {
  id: string
  role: Role
  content: ContentPart[]
  createdAt: string
}

export interface ToolDefinition {
  name: string
  description: string
  inputSchema: Record<string, unknown> // JSON Schema object
}

export interface StreamChunk {
  type: 'text_delta' | 'tool_use_start' | 'tool_use_delta' | 'tool_use_end' | 'message_stop' | 'error'
  textDelta?: string
  toolUseId?: string
  toolName?: string
  toolInputDelta?: string
  toolInputFull?: Record<string, unknown>
  error?: string
}

export interface ProviderConfig {
  apiKey?: string
  baseUrl?: string
  defaultModel: string
}

export interface AIProvider {
  readonly id: string
  readonly displayName: string
  listModels(): Promise<string[]>
  stream(params: {
    model: string
    messages: Message[]
    systemPrompt?: string
    tools?: ToolDefinition[]
    maxTokens?: number
    signal?: AbortSignal
  }): AsyncIterable<StreamChunk>
}

export type ProviderId = 'anthropic' | 'openai' | 'gemini' | 'ollama' | 'openrouter'
