export interface FetchInput {
  url: string
  maxLength?: number
}

export async function webFetch(input: FetchInput): Promise<string> {
  const maxLength = input.maxLength ?? 50000
  const response = await fetch(input.url, {
    headers: { 'User-Agent': 'Clutchtop/0.1' },
    signal: AbortSignal.timeout(15000)
  })

  if (!response.ok) {
    return `HTTP ${response.status}: ${response.statusText}`
  }

  const contentType = response.headers.get('content-type') ?? ''
  const text = await response.text()

  if (contentType.includes('text/html')) {
    // Strip HTML tags for a plain text view
    const stripped = text
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
    return stripped.slice(0, maxLength)
  }

  return text.slice(0, maxLength)
}
