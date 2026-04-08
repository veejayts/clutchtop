import OpenAI from 'openai'
import type { AIProvider, Message, ToolDefinition, StreamChunk, ProviderConfig } from './types'

function toOpenAIMessages(messages: Message[]): OpenAI.Chat.ChatCompletionMessageParam[] {
  const result: OpenAI.Chat.ChatCompletionMessageParam[] = []

  for (const msg of messages) {
    if (msg.role === 'user') {
      const text = msg.content.filter((p) => p.type === 'text').map((p) => (p as { text: string }).text).join('\n')
      result.push({ role: 'user', content: text })
    } else if (msg.role === 'assistant') {
      const textParts = msg.content.filter((p) => p.type === 'text')
      const toolParts = msg.content.filter((p) => p.type === 'tool_use')
      result.push({
        role: 'assistant',
        content: textParts.map((p) => (p as { text: string }).text).join('') || null,
        tool_calls: toolParts.length > 0 ? toolParts.map((p) => {
          const tp = p as { toolUseId: string; toolName: string; toolInput: Record<string, unknown> }
          return {
            id: tp.toolUseId,
            type: 'function' as const,
            function: { name: tp.toolName, arguments: JSON.stringify(tp.toolInput) }
          }
        }) : undefined
      })
    } else if (msg.role === 'tool_result') {
      for (const part of msg.content) {
        if (part.type === 'tool_result') {
          result.push({
            role: 'tool',
            tool_call_id: part.toolUseId,
            content: part.content
          })
        }
      }
    }
  }

  return result
}

export class OpenAIProvider implements AIProvider {
  readonly id = 'openai'
  readonly displayName = 'OpenAI'
  protected client: OpenAI

  constructor(protected config: ProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey ?? '',
      baseURL: config.baseUrl,
      dangerouslyAllowBrowser: true
    })
  }

  async listModels(): Promise<string[]> {
    try {
      const models = await this.client.models.list()
      return models.data.map((m) => m.id).filter((id) => id.startsWith('gpt-'))
    } catch {
      return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo']
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
    const oaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = []
    if (params.systemPrompt) {
      oaiMessages.push({ role: 'system', content: params.systemPrompt })
    }
    oaiMessages.push(...toOpenAIMessages(params.messages))

    const oaiTools: OpenAI.Chat.ChatCompletionTool[] | undefined = params.tools?.map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.inputSchema
      }
    }))

    const stream = await this.client.chat.completions.create({
      model: params.model,
      max_tokens: params.maxTokens ?? 4096,
      messages: oaiMessages,
      tools: oaiTools,
      stream: true
    }, { signal: params.signal })

    // Track in-progress tool calls
    const toolCalls: Record<number, { id: string; name: string; args: string }> = {}

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta

      if (delta?.content) {
        yield { type: 'text_delta', textDelta: delta.content }
      }

      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index
          if (!toolCalls[idx]) {
            toolCalls[idx] = { id: tc.id ?? '', name: tc.function?.name ?? '', args: '' }
            yield { type: 'tool_use_start', toolUseId: tc.id ?? '', toolName: tc.function?.name ?? '' }
          }
          if (tc.function?.arguments) {
            toolCalls[idx].args += tc.function.arguments
            yield { type: 'tool_use_delta', toolInputDelta: tc.function.arguments }
          }
        }
      }

      if (chunk.choices[0]?.finish_reason === 'tool_calls') {
        for (const tc of Object.values(toolCalls)) {
          let parsed: Record<string, unknown> = {}
          try { parsed = JSON.parse(tc.args) } catch { /* ignore */ }
          yield { type: 'tool_use_end', toolUseId: tc.id, toolName: tc.name, toolInputFull: parsed }
        }
        yield { type: 'message_stop' }
      } else if (chunk.choices[0]?.finish_reason === 'stop') {
        yield { type: 'message_stop' }
      }
    }
  }
}
