import { getDb } from './client'

// ---- Conversations ----

export interface ConversationRow {
  id: string
  title: string
  mode: string
  system_prompt: string | null
  provider_id: string | null
  model: string | null
  workspace_path: string | null
  created_at: string
  updated_at: string
}

export function listConversations(): ConversationRow[] {
  return getDb()
    .prepare('SELECT * FROM conversations ORDER BY updated_at DESC')
    .all() as ConversationRow[]
}

export function createConversation(data: {
  id: string
  title: string
  mode: string
  systemPrompt?: string
  providerId?: string
  model?: string
}): ConversationRow {
  const now = new Date().toISOString()
  getDb()
    .prepare(
      `INSERT INTO conversations (id, title, mode, system_prompt, provider_id, model, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(data.id, data.title, data.mode, data.systemPrompt ?? null, data.providerId ?? null, data.model ?? null, now, now)
  return getDb().prepare('SELECT * FROM conversations WHERE id = ?').get(data.id) as ConversationRow
}

export function updateConversation(
  id: string,
  data: { title?: string; systemPrompt?: string; providerId?: string; model?: string; workspacePath?: string }
): void {
  const sets: string[] = []
  const vals: unknown[] = []

  if (data.title !== undefined)        { sets.push('title = ?');          vals.push(data.title) }
  if (data.systemPrompt !== undefined) { sets.push('system_prompt = ?');  vals.push(data.systemPrompt) }
  if (data.providerId !== undefined)   { sets.push('provider_id = ?');    vals.push(data.providerId) }
  if (data.model !== undefined)        { sets.push('model = ?');          vals.push(data.model) }
  if (data.workspacePath !== undefined){ sets.push('workspace_path = ?'); vals.push(data.workspacePath) }

  if (sets.length === 0) return
  sets.push('updated_at = ?')
  vals.push(new Date().toISOString())
  vals.push(id)

  getDb().prepare(`UPDATE conversations SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
}

export function deleteConversation(id: string): void {
  getDb().prepare('DELETE FROM conversations WHERE id = ?').run(id)
}

// ---- Messages ----

export interface MessageRow {
  id: string
  conversation_id: string
  role: string
  content: string
  tool_use_id: string | null
  seq: number
  created_at: string
}

export function listMessages(conversationId: string): MessageRow[] {
  return getDb()
    .prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY seq ASC')
    .all(conversationId) as MessageRow[]
}

export function appendMessage(msg: {
  id: string
  conversationId: string
  role: string
  content: string
  toolUseId?: string
  seq: number
}): void {
  const now = new Date().toISOString()
  getDb()
    .prepare(
      `INSERT INTO messages (id, conversation_id, role, content, tool_use_id, seq, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(msg.id, msg.conversationId, msg.role, msg.content, msg.toolUseId ?? null, msg.seq, now)

  // update conversation updated_at
  getDb().prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(now, msg.conversationId)
}
