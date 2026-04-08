import { GoogleGenerativeAI, type Content, type FunctionDeclaration } from '@google/generative-ai'
import type { AIProvider, Message, ToolDefinition, StreamChunk, ProviderConfig } from './types'

function toGeminiHistory(messages: Message[]): Content[] {
  const history: Content[] = []

  for (const msg of messages) {
    if (msg.role === 'user') {
      const text = msg.content.filter((p) => p.type === 'text').map((p) => (p as { text: string }).text).join('\n')
      history.push({ role: 'user', parts: [{ text }] })
    } else if (msg.role === 'assistant') {
      const textParts = msg.content.filter((p) => p.type === 'text')
      const toolParts = msg.content.filter((p) => p.type === 'tool_use')
      const parts: Content['parts'] = []

      if (textParts.length > 0) {
        parts.push({ text: textParts.map((p) => (p as { text: string }).text).join('') })
      }
      for (const tp of toolParts) {
        const t = tp as { toolName: string; toolInput: Record<string, unknown> }
        parts.push({ functionCall: { name: t.toolName, args: t.toolInput } })
      }
      history.push({ role: 'model', parts })
    } else if (msg.role === 'tool_result') {
      const parts: Content['parts'] = []
      for (const part of msg.content) {
        if (part.type === 'tool_result') {
          parts.push({ functionResponse: { name: part.toolUseId, response: { result: part.content } } })
        }
      }
      history.push({ role: 'function', parts })
    }
  }

  return history
}

export class GeminiProvider implements AIProvider {
  readonly id = 'gemini'
  readonly displayName = 'Google Gemini'
  private genai: GoogleGenerativeAI

  constructor(private config: ProviderConfig) {
    this.genai = new GoogleGenerativeAI(config.apiKey ?? '')
  }

  async listModels(): Promise<string[]> {
    return ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro']
  }

  async *stream(params: {
    model: string
    messages: Message[]
    systemPrompt?: string
    tools?: ToolDefinition[]
    maxTokens?: number
    signal?: AbortSignal
  }): AsyncIterable<StreamChunk> {
    const model = this.genai.getGenerativeModel({
      model: params.model,
      systemInstruction: params.systemPrompt,
      tools: params.tools?.length
        ? [{
            functionDeclarations: params.tools.map((t): FunctionDeclaration => ({
              name: t.name,
              description: t.description,
              parameters: t.inputSchema as FunctionDeclaration['parameters']
            }))
          }]
        : undefined
    })

    const history = toGeminiHistory(params.messages.slice(0, -1))
    const lastMsg = params.messages.at(-1)
    const lastText = lastMsg?.content
      .filter((p) => p.type === 'text')
      .map((p) => (p as { text: string }).text)
      .join('\n') ?? ''

    const chat = model.startChat({ history })
    const result = await chat.sendMessageStream(lastText)

    for await (const chunk of result.stream) {
      const text = chunk.text()
      if (text) yield { type: 'text_delta', textDelta: text }

      const calls = chunk.functionCalls()
      if (calls?.length) {
        for (const call of calls) {
          const id = `fc_${call.name}_${Date.now()}`
          yield { type: 'tool_use_start', toolUseId: id, toolName: call.name }
          yield { type: 'tool_use_end', toolUseId: id, toolName: call.name, toolInputFull: call.args as Record<string, unknown> }
        }
      }
    }

    yield { type: 'message_stop' }
  }
}
