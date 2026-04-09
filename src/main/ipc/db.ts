import { ipcMain } from 'electron'
import {
  listConversations,
  createConversation,
  updateConversation,
  deleteConversation,
  listMessages,
  appendMessage,
  listRecentWorkspaces,
  touchRecentWorkspace,
  listOpenRouterModels,
  replaceOpenRouterModels
} from '../db/queries'

export function registerDbHandlers(): void {
  ipcMain.handle('db:conversations:list', () => {
    return listConversations()
  })

  ipcMain.handle('db:conversations:create', (_e, data) => {
    return createConversation({ id: crypto.randomUUID(), ...data })
  })

  ipcMain.handle('db:conversations:update', (_e, id, data) => {
    updateConversation(id, data)
  })

  ipcMain.handle('db:conversations:delete', (_e, id) => {
    deleteConversation(id)
  })

  ipcMain.handle('db:messages:list', (_e, conversationId) => {
    return listMessages(conversationId)
  })

  ipcMain.handle('db:messages:append', (_e, msg) => {
    appendMessage(msg)
  })

  // ---- Recent Workspaces ----

  ipcMain.handle('db:workspaces:list', () => {
    return listRecentWorkspaces()
  })

  ipcMain.handle('db:workspaces:touch', (_e, path: string) => {
    touchRecentWorkspace(path)
  })

  // ---- OpenRouter Models ----

  ipcMain.handle('db:openrouter:models:list', () => {
    return listOpenRouterModels()
  })

  ipcMain.handle('db:openrouter:models:fetch', async (_e, apiKey: string) => {
    const resp = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` }
    })
    if (!resp.ok) {
      throw new Error(`OpenRouter API error: ${resp.status} ${resp.statusText}`)
    }
    const json = await resp.json() as { data: Array<{
      id: string
      name: string
      description?: string
      context_length?: number
      pricing?: { prompt?: string; completion?: string }
    }> }

    const models = json.data.map((m) => ({
      id: m.id,
      name: m.name ?? m.id,
      description: m.description ?? null,
      context_length: m.context_length ?? null,
      pricing_prompt: m.pricing?.prompt != null ? parseFloat(m.pricing.prompt) : null,
      pricing_completion: m.pricing?.completion != null ? parseFloat(m.pricing.completion) : null
    }))

    replaceOpenRouterModels(models)
    return listOpenRouterModels()
  })
}
