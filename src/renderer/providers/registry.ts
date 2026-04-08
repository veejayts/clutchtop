import { AnthropicProvider } from './anthropic'
import { OpenAIProvider } from './openai'
import { GeminiProvider } from './gemini'
import { OllamaProvider } from './ollama'
import { OpenRouterProvider } from './openrouter'
import type { AIProvider, ProviderId, ProviderConfig } from './types'

export function createProvider(id: ProviderId, config: ProviderConfig): AIProvider {
  switch (id) {
    case 'anthropic':   return new AnthropicProvider(config)
    case 'openai':      return new OpenAIProvider(config)
    case 'gemini':      return new GeminiProvider(config)
    case 'ollama':      return new OllamaProvider(config)
    case 'openrouter':  return new OpenRouterProvider(config)
    default:
      throw new Error(`Unknown provider: ${id}`)
  }
}

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  anthropic:  'Anthropic',
  openai:     'OpenAI',
  gemini:     'Google Gemini',
  ollama:     'Ollama (Local)',
  openrouter: 'OpenRouter'
}

export const ALL_PROVIDER_IDS: ProviderId[] = ['anthropic', 'openai', 'gemini', 'ollama', 'openrouter']
