import { create } from 'zustand'

interface WorkspaceStore {
  workspacePath: string | null
  mode: 'chat' | 'agent'
  agentMode: 'plan' | 'execute'
  setMode: (mode: 'chat' | 'agent') => void
  setAgentMode: (m: 'plan' | 'execute') => void
  selectWorkspace: () => Promise<string | null>
  setWorkspacePath: (path: string | null) => void
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  workspacePath: null,
  mode: 'chat',
  agentMode: 'execute',

  setMode: (mode) => set({ mode }),
  setAgentMode: (m) => set({ agentMode: m }),
  setWorkspacePath: (path) => set({ workspacePath: path }),

  selectWorkspace: async () => {
    const path = await window.api.workspace.select()
    if (path) set({ workspacePath: path })
    return path
  }
}))
