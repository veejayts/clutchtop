import React from 'react'
import { FolderOpen } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspace'
import { useConversationsStore } from '../../store/conversations'
import { Button } from '../ui/Button'
import { truncate } from '../../lib/utils'

interface WorkspacePickerProps {
  conversationId: string
}

export function WorkspacePicker({ conversationId }: WorkspacePickerProps) {
  const { selectWorkspace } = useWorkspaceStore()
  const { update, conversations } = useConversationsStore()
  const conv = conversations.find((c) => c.id === conversationId)
  const workspacePath = conv?.workspacePath ?? null

  const handleSelect = async () => {
    const path = await selectWorkspace()
    if (path) {
      await update(conversationId, { workspacePath: path })
    }
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
      <FolderOpen size={14} className="text-amber-500 flex-shrink-0" />
      <span className="text-xs text-[var(--text-secondary)] flex-1 truncate">
        {workspacePath ? truncate(workspacePath, 50) : 'No workspace selected'}
      </span>
      <Button size="sm" variant="ghost" onClick={handleSelect}>
        {workspacePath ? 'Change' : 'Select workspace'}
      </Button>
    </div>
  )
}
