import { OpenAIProvider } from './openai'
import type { ProviderConfig } from './types'

export class OpenRouterProvider extends OpenAIProvider {
  override readonly id = 'openrouter'
  override readonly displayName = 'OpenRouter'

  constructor(config: ProviderConfig) {
    super({
      ...config,
      baseUrl: config.baseUrl ?? 'https://openrouter.ai/api/v1'
    })
  }

  override async listModels(): Promise<string[]> {
    try {
      const resp = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { Authorization: `Bearer ${this.config.apiKey}` }
      })
      const json = await resp.json()
      return (json.data as Array<{ id: string }>).map((m) => m.id).slice(0, 50)
    } catch {
      return [
        'anthropic/claude-3.5-sonnet',
        'anthropic/claude-3-opus',
        'openai/gpt-4o',
        'google/gemini-1.5-pro',
        'meta-llama/llama-3.1-70b-instruct'
      ]
    }
  }
}
