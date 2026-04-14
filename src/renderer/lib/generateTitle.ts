import type { AIProvider } from '../providers/types'

/**
 * Asks the provider to generate a short conversation title based on the
 * first user message and assistant response. Returns null on any failure.
 */
export async function generateTitle(
  provider: AIProvider,
  model: string,
  userMessage: string,
  assistantMessage: string
): Promise<string | null> {
  try {
    const prompt =
      `User: ${userMessage.slice(0, 500)}\n\nAssistant: ${assistantMessage.slice(0, 300)}`

    let title = ''
    for await (const chunk of provider.stream({
      model,
      messages: [{ id: 'title-req', role: 'user', content: [{ type: 'text', text: prompt }], createdAt: new Date().toISOString() }],
      systemPrompt:
        'Generate a short title (3-6 words) that captures the topic of this conversation. Reply with only the title — no punctuation at the end, no quotes, no explanation.',
      maxTokens: 20
    })) {
      if (chunk.type === 'text_delta' && chunk.textDelta) {
        title += chunk.textDelta
      }
      // Do not break early — let the loop exhaust naturally so the stream
      // closes cleanly instead of being aborted mid-flight.
    }

    const cleaned = title.trim().replace(/^["']|["']$/g, '').trim()
    return cleaned || null
  } catch (err) {
    console.error('[generateTitle] failed:', err)
    return null
  }
}
