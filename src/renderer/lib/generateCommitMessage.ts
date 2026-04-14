import type { AIProvider } from '../providers/types'

/**
 * Uses the LLM to generate a meaningful commit message based on git changes.
 * Returns a single-line commit message. Returns null on any failure.
 */
export async function generateCommitMessage(
  provider: AIProvider,
  model: string,
  changesSummary: {
    files: { added: string[]; modified: string[]; deleted: string[]; renamed: string[] }
    diffStat: string
    diffContent: string
  }
): Promise<string | null> {
  console.log('[generateCommitMessage] starting, provider:', provider.id, 'model:', model)
  try {
    const { files, diffStat, diffContent } = changesSummary

    // Build a concise description of the changes
    const parts: string[] = []
    if (files.added.length > 0) parts.push(`Added: ${files.added.join(', ')}`)
    if (files.modified.length > 0) parts.push(`Modified: ${files.modified.join(', ')}`)
    if (files.deleted.length > 0) parts.push(`Deleted: ${files.deleted.join(', ')}`)
    if (files.renamed.length > 0) parts.push(`Renamed: ${files.renamed.join(', ')}`)

    const fileListSummary = parts.join('\n')

    const prompt = `Here are the changes in this commit:

File changes:
${fileListSummary}

Diff stats:
${diffStat}

Diff content (truncated):
${diffContent}

Generate a concise, meaningful git commit message that summarizes these changes. Use the imperative mood (e.g., "Add feature" not "Added feature"). Keep it under 72 characters for the subject line. If the changes warrant it, add a blank line then a brief body explaining the "why" behind the change. Reply with ONLY the commit message text — no quotes, no explanation, no prefixes like "Commit message:".`

    let message = ''
    for await (const chunk of provider.stream({
      model,
      messages: [
        {
          id: 'commit-msg-req',
          role: 'user',
          content: [{ type: 'text', text: prompt }],
          createdAt: new Date().toISOString()
        }
      ],
      systemPrompt:
        'You are an expert at writing clear, concise git commit messages following conventional commit best practices. Always use imperative mood. Keep subject lines under 72 chars.',
      maxTokens: 200
    })) {
      if (chunk.type === 'text_delta' && chunk.textDelta) {
        message += chunk.textDelta
      }
      // Do not break early — let the loop exhaust naturally so the stream
      // closes cleanly instead of being aborted mid-flight.
    }

    const cleaned = message.trim().replace(/^["']|["']$/g, '').trim()
    console.log('[generateCommitMessage] result:', cleaned || '(empty)')
    return cleaned || null
  } catch (err) {
    console.error('[generateCommitMessage] failed:', err)
    return null
  }
}