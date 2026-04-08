import { contextBridge, ipcRenderer } from 'electron'

// Typed API exposed to renderer via window.api
const api = {
  db: {
    conversations: {
      list: () => ipcRenderer.invoke('db:conversations:list'),
      create: (data: { title: string; mode: string; systemPrompt?: string; providerId?: string; model?: string }) =>
        ipcRenderer.invoke('db:conversations:create', data),
      update: (id: string, data: { title?: string; systemPrompt?: string; providerId?: string; model?: string; workspacePath?: string }) =>
        ipcRenderer.invoke('db:conversations:update', id, data),
      delete: (id: string) => ipcRenderer.invoke('db:conversations:delete', id)
    },
    messages: {
      list: (conversationId: string) => ipcRenderer.invoke('db:messages:list', conversationId),
      append: (msg: {
        id: string
        conversationId: string
        role: string
        content: string
        toolUseId?: string
        seq: number
      }) => ipcRenderer.invoke('db:messages:append', msg)
    }
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (data: Record<string, unknown>) => ipcRenderer.invoke('settings:set', data)
  },
  tools: {
    execute: (name: string, input: Record<string, unknown>, workspacePath: string) =>
      ipcRenderer.invoke('tool:execute', { name, input, workspacePath }),
    onStreamOutput: (callback: (data: { toolUseId: string; chunk: string }) => void) => {
      const handler = (_: Electron.IpcRendererEvent, data: { toolUseId: string; chunk: string }) => callback(data)
      ipcRenderer.on('tool:stream-output', handler)
      return () => ipcRenderer.removeListener('tool:stream-output', handler)
    }
  },
  workspace: {
    select: () => ipcRenderer.invoke('workspace:select')
  }
}

contextBridge.exposeInMainWorld('api', api)
