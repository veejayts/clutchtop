import Anthropic from '@anthropic-ai/sdk'
import type { AIProvider, Message, ToolDefinition, StreamChunk, ProviderConfig } from './types'

function toAnthropicMessages(messages: Message[]): Anthropic.MessageParam[] {
  const result: Anthropic.MessageParam[] = []

  for (const msg of messages) {
    if (msg.role === 'user') {
      const textParts = msg.content.filter((p) => p.type === 'text')
      const text = textParts.map((p) => (p as { text: string }).text).join('\n')
      result.push({ role: 'user', content: text })
    } else if (msg.role === 'assistant') {
      const content: Anthropic.ContentBlock[] = []
      for (const part of msg.content) {
        if (part.type === 'text') {
          content.push({ type: 'text', text: part.text })
        } else if (part.type === 'tool_use') {
          content.push({
            type: 'tool_use',
            id: part.toolUseId,
            name: part.toolName,
            input: part.toolInput
          })
        }
      }
      result.push({ role: 'assistant', content })
    } else if (msg.role === 'tool_result') {
      const toolResults: Anthropic.ToolResultBlockParam[] = []
      for (const part of msg.content) {
        if (part.type === 'tool_result') {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: part.toolUseId,
            content: part.content,
            is_error: part.isError
          })
        }
      }
      result.push({ role: 'user', content: toolResults })
    }
  }

  return result
}

export class AnthropicProvider implements AIProvider {
  readonly id = 'anthropic'
  readonly displayName = 'Anthropic'
  private client: Anthropic

  constructor(private config: ProviderConfig) {
    this.client = new Anthropic({ apiKey: config.apiKey || 'sk-placeholder', dangerouslyAllowBrowser: true })
  }

  async listModels(): Promise<string[]> {
    return [
      'claude-opus-4-5',
      'claude-sonnet-4-5',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229'
    ]
  }

  async *stream(params: {
    model: string
    messages: Message[]
    systemPrompt?: string
    tools?: ToolDefinition[]
    maxTokens?: number
    signal?: AbortSignal
  }): AsyncIterable<StreamChunk> {
    if (!this.config.apiKey) {
      throw new Error('No Anthropic API key configured. Please add your API key in Settings.')
    }

    const anthropicMessages = toAnthropicMessages(params.messages)
    const anthropicTools: Anthropic.Tool[] | undefined = params.tools?.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema as Anthropic.Tool['input_schema']
    }))

    const stream = this.client.messages.stream({
      model: params.model,
      max_tokens: params.maxTokens ?? 8096,
      system: params.systemPrompt,
      messages: anthropicMessages,
      tools: anthropicTools
    }, { signal: params.signal })

    for await (const event of stream) {
      if (event.type === 'content_block_start') {
        if (event.content_block.type === 'tool_use') {
          yield {
            type: 'tool_use_start',
            toolUseId: event.content_block.id,
            toolName: event.content_block.name
          }
        }
      } else if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          yield { type: 'text_delta', textDelta: event.delta.text }
        } else if (event.delta.type === 'input_json_delta') {
          yield { type: 'tool_use_delta', toolInputDelta: event.delta.partial_json }
        }
      } else if (event.type === 'content_block_stop') {
        // If we were accumulating a tool, signal end (handled in useCodeAgent)
        yield { type: 'tool_use_end' }
      } else if (event.type === 'message_stop') {
        yield { type: 'message_stop' }
      }
    }
  }
}
