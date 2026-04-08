import type { AIProvider, Message, ToolDefinition, StreamChunk, ProviderConfig } from './types'

interface OllamaChunk {
  message?: { content?: string; tool_calls?: Array<{ function: { name: string; arguments: Record<string, unknown> } }> }
  done?: boolean
}

function toOllamaMessages(messages: Message[], systemPrompt?: string): object[] {
  const result: object[] = []
  if (systemPrompt) result.push({ role: 'system', content: systemPrompt })

  for (const msg of messages) {
    if (msg.role === 'user') {
      const text = msg.content.filter((p) => p.type === 'text').map((p) => (p as { text: string }).text).join('\n')
      result.push({ role: 'user', content: text })
    } else if (msg.role === 'assistant') {
      const text = msg.content.filter((p) => p.type === 'text').map((p) => (p as { text: string }).text).join('')
      result.push({ role: 'assistant', content: text })
    } else if (msg.role === 'tool_result') {
      for (const part of msg.content) {
        if (part.type === 'tool_result') {
          result.push({ role: 'tool', content: part.content })
        }
      }
    }
  }

  return result
}

export class OllamaProvider implements AIProvider {
  readonly id = 'ollama'
  readonly displayName = 'Ollama (Local)'

  constructor(private config: ProviderConfig) {}

  private get baseUrl(): string {
    return (this.config.baseUrl ?? 'http://localhost:11434').replace(/\/$/, '')
  }

  async listModels(): Promise<string[]> {
    try {
      const resp = await fetch(`${this.baseUrl}/api/tags`)
      const json = await resp.json()
      return (json.models as Array<{ name: string }>).map((m) => m.name)
    } catch {
      return ['llama3.2', 'mistral', 'codellama', 'phi3']
    }
  }

  async *stream(params: {
    model: string
    messages: Message[]
    systemPrompt?: string
    tools?: ToolDefinition[]
    maxTokens?: number
    signal?: AbortSignal
  }): AsyncIterable<StreamChunk> {
    const body = {
      model: params.model,
      messages: toOllamaMessages(params.messages, params.systemPrompt),
      stream: true,
      options: { num_predict: params.maxTokens ?? 4096 },
      tools: params.tools?.map((t) => ({
        type: 'function',
        function: { name: t.name, description: t.description, parameters: t.inputSchema }
      }))
    }

    const resp = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: params.signal
    })

    if (!resp.ok || !resp.body) {
      yield { type: 'error', error: `Ollama error: ${resp.status}` }
      return
    }

    const reader = resp.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const lines = decoder.decode(value, { stream: true }).split('\n').filter(Boolean)
      for (const line of lines) {
        let chunk: OllamaChunk
        try { chunk = JSON.parse(line) } catch { continue }

        if (chunk.message?.content) {
          yield { type: 'text_delta', textDelta: chunk.message.content }
        }

        if (chunk.message?.tool_calls?.length) {
          for (const tc of chunk.message.tool_calls) {
            const id = `ollama_${tc.function.name}_${Date.now()}`
            yield { type: 'tool_use_start', toolUseId: id, toolName: tc.function.name }
            yield { type: 'tool_use_end', toolUseId: id, toolName: tc.function.name, toolInputFull: tc.function.arguments }
          }
        }

        if (chunk.done) {
          yield { type: 'message_stop' }
        }
      }
    }
  }
}
