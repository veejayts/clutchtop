import React, { useEffect, useRef, useState } from 'react'
import { FolderOpen, GitBranch, ChevronDown, Zap, BookOpen } from 'lucide-react'
import { useMessagesStore } from '../../store/messages'
import { useCodeAgent } from '../../hooks/useCodeAgent'
import { MessageItem } from '../chat/MessageItem'
import { StreamingIndicator } from '../chat/StreamingIndicator'
import { MessageInput } from '../chat/MessageInput'
import { useConversationsStore } from '../../store/conversations'
import { useWorkspaceStore } from '../../store/workspace'
import { cn, truncate } from '../../lib/utils'

interface CodePaneProps {
  conversationId: string
}

export function CodePane({ conversationId }: CodePaneProps) {
  const rawMessages = useMessagesStore((s) => s.messages[conversationId])
  const messages = rawMessages ?? []
  const isStreaming = useMessagesStore((s) => s.isStreaming)
  const { run, cancel } = useCodeAgent(conversationId)
  const loadMessages = useMessagesStore((s) => s.loadMessages)
  const { conversations, update } = useConversationsStore()
  const conv = conversations.find((c) => c.id === conversationId)
  const { agentMode, setAgentMode, selectWorkspace } = useWorkspaceStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  const [gitBranch, setGitBranch] = useState<string | null>(null)
  const [agentModeOpen, setAgentModeOpen] = useState(false)
  const [recentWorkspaces, setRecentWorkspaces] = useState<string[]>([])
  const [workspaceOpen, setWorkspaceOpen] = useState(false)

  const workspacePath = conv?.workspacePath ?? null
  const hasWorkspace = Boolean(workspacePath)

  // Load messages
  useEffect(() => {
    loadMessages(conversationId)
  }, [conversationId, loadMessages])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isStreaming])

  // Detect git branch whenever workspace changes
  useEffect(() => {
    if (!workspacePath) { setGitBranch(null); return }
    window.api.workspace.gitBranch(workspacePath).then(setGitBranch).catch(() => setGitBranch(null))
  }, [workspacePath])

  // Load recent workspaces
  useEffect(() => {
    window.api.db.workspaces.list().then((rows) => setRecentWorkspaces(rows.map((r) => r.path))).catch(() => {})
  }, [])

  const handlePickWorkspace = async () => {
    const path = await selectWorkspace()
    if (path) {
      await update(conversationId, { workspacePath: path })
      await window.api.db.workspaces.touch(path)
      setRecentWorkspaces((prev) => [path, ...prev.filter((p) => p !== path)].slice(0, 20))
    }
    setWorkspaceOpen(false)
  }

  const handleSelectRecent = async (path: string) => {
    await update(conversationId, { workspacePath: path })
    await window.api.db.workspaces.touch(path)
    setWorkspaceOpen(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Message area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && !isStreaming && (
          <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)] text-sm gap-3 px-6">
            {!hasWorkspace ? (
              <>
                <FolderOpen size={32} className="text-amber-500/60" />
                <p className="text-center">Select a workspace folder to get started</p>
                <button
                  onClick={handlePickWorkspace}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  Select workspace
                </button>
                {recentWorkspaces.length > 0 && (
                  <div className="w-full max-w-sm mt-2">
                    <p className="text-[10px] text-[var(--text-secondary)] mb-1.5 text-center">Recent workspaces</p>
                    <div className="space-y-1">
                      {recentWorkspaces.slice(0, 5).map((p) => (
                        <button
                          key={p}
                          onClick={() => handleSelectRecent(p)}
                          className="w-full text-left text-xs px-3 py-1.5 rounded-md bg-[var(--bg-secondary)] hover:bg-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors truncate"
                          title={p}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p>Ask the agent to help with your code</p>
            )}
          </div>
        )}
        {messages.map((msg) => (
          <MessageItem key={msg.id} message={msg} />
        ))}
        <StreamingIndicator />
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput
        onSend={run}
        isStreaming={isStreaming}
        onCancel={cancel}
        placeholder={hasWorkspace ? 'Ask the agent…' : 'Select a workspace first…'}
      />

      {/* Bottom status bar: workspace + branch + plan/execute */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-t border-[var(--border)] bg-[var(--bg-secondary)] text-[10px] text-[var(--text-secondary)]">

        {/* Workspace picker */}
        <div className="relative">
          <button
            onClick={() => setWorkspaceOpen((o) => !o)}
            className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors max-w-[260px]"
          >
            <FolderOpen size={11} className="flex-shrink-0 text-amber-500" />
            <span className="truncate">{workspacePath ? truncate(workspacePath, 40) : 'Select workspace'}</span>
            <ChevronDown size={9} className="flex-shrink-0" />
          </button>

          {workspaceOpen && (
            <div className="absolute bottom-full left-0 mb-1 w-72 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden z-50">
              <button
                onClick={handlePickWorkspace}
                className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 text-[var(--text-primary)] border-b border-[var(--border)] transition-colors"
              >
                Browse…
              </button>
              {recentWorkspaces.length > 0 && (
                <>
                  <p className="px-3 py-1 text-[10px] text-[var(--text-secondary)]">Recent</p>
                  {recentWorkspaces.slice(0, 8).map((p) => (
                    <button
                      key={p}
                      onClick={() => handleSelectRecent(p)}
                      className={cn(
                        'w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 transition-colors truncate',
                        p === workspacePath ? 'text-amber-400' : 'text-[var(--text-secondary)]'
                      )}
                      title={p}
                    >
                      {p}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Git branch badge */}
        {gitBranch && (
          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[var(--border)] text-[var(--text-secondary)]">
            <GitBranch size={9} />
            {gitBranch}
          </span>
        )}

        <div className="flex-1" />

        {/* Plan / Execute dropdown */}
        <div className="relative">
          <button
            onClick={() => setAgentModeOpen((o) => !o)}
            className="flex items-center gap-1 px-2 py-0.5 rounded border border-[var(--border)] hover:border-amber-600/50 hover:text-[var(--text-primary)] transition-colors"
          >
            {agentMode === 'plan'
              ? <BookOpen size={10} className="text-amber-400" />
              : <Zap size={10} className="text-green-400" />}
            {agentMode === 'plan' ? 'Plan mode' : 'Execute'}
            <ChevronDown size={8} />
          </button>

          {agentModeOpen && (
            <div className="absolute bottom-full right-0 mb-1 w-44 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden z-50">
              <button
                onClick={() => { setAgentMode('plan'); setAgentModeOpen(false) }}
                className={cn(
                  'w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors flex items-center gap-2',
                  agentMode === 'plan' ? 'text-amber-400' : 'text-[var(--text-secondary)]'
                )}
              >
                <BookOpen size={11} />
                <div>
                  <p className="font-medium">Plan mode</p>
                  <p className="text-[10px] opacity-70">Discuss and plan only</p>
                </div>
              </button>
              <button
                onClick={() => { setAgentMode('execute'); setAgentModeOpen(false) }}
                className={cn(
                  'w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors flex items-center gap-2',
                  agentMode === 'execute' ? 'text-green-400' : 'text-[var(--text-secondary)]'
                )}
              >
                <Zap size={11} />
                <div>
                  <p className="font-medium">Execute</p>
                  <p className="text-[10px] opacity-70">Run tools and make changes</p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click-outside overlay for dropdowns */}
      {(workspaceOpen || agentModeOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setWorkspaceOpen(false); setAgentModeOpen(false) }}
        />
      )}
    </div>
  )
}
