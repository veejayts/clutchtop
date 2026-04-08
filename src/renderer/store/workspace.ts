import { create } from 'zustand'

interface WorkspaceStore {
  workspacePath: string | null
  mode: 'chat' | 'code'
  setMode: (mode: 'chat' | 'code') => void
  selectWorkspace: () => Promise<string | null>
  setWorkspacePath: (path: string | null) => void
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  workspacePath: null,
  mode: 'chat',

  setMode: (mode) => set({ mode }),
  setWorkspacePath: (path) => set({ workspacePath: path }),

  selectWorkspace: async () => {
    const path = await window.api.workspace.select()
    if (path) set({ workspacePath: path })
    return path
  }
}))
