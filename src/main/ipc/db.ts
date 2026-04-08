import { ipcMain } from 'electron'
import {
  listConversations,
  createConversation,
  updateConversation,
  deleteConversation,
  listMessages,
  appendMessage
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
}
