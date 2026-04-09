import React, { useEffect, useRef, useState, useCallback } from 'react'
import { FolderOpen, GitBranch, ChevronDown, Zap, BookOpen, GitCommitHorizontal, Loader2, Check, X } from 'lucide-react'
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
  const streamingState = useMessagesStore((s) => s.streamingStates[conversationId])
  const isStreaming = streamingState?.isStreaming ?? false
  const { run, cancel } = useCodeAgent(conversationId)
  const loadMessages = useMessagesStore((s) => s.loadMessages)
  const { conversations, update } = useConversationsStore()
  const conv = conversations.find((c) => c.id === conversationId)
  const { agentMode, setAgentMode, selectWorkspace } = useWorkspaceStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  const [gitBranch, setGitBranch] = useState<string | null>(null)
  const [isGitRepo, setIsGitRepo] = useState(false)
  const [agentModeOpen, setAgentModeOpen] = useState(false)
  const [recentWorkspaces, setRecentWorkspaces] = useState<string[]>([])
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [isCommitting, setIsCommitting] = useState(false)
  const [commitResult, setCommitResult] = useState<{ success: boolean; message: string } | null>(null)

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

  // Detect git status whenever workspace changes
  useEffect(() => {
    if (!workspacePath) {
      setGitBranch(null)
      setIsGitRepo(false)
      return
    }
    window.api.workspace.gitBranch(workspacePath).then(setGitBranch).catch(() => setGitBranch(null))
    window.api.git.status(workspacePath).then((status) => {
      setIsGitRepo(status.isGit)
    }).catch(() => setIsGitRepo(false))
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

  const handleCommitAndPush = useCallback(async () => {
    if (!workspacePath || isCommitting) return

    setIsCommitting(true)
    setCommitResult(null)

    try {
      const result = await window.api.tools.execute('gitCommitAndPush', {}, workspacePath)
      const isError = result.isError
      setCommitResult({
        success: !isError,
        message: result.content
      })

      // Refresh git branch after push (in case it changed)
      window.api.workspace.gitBranch(workspacePath).then(setGitBranch).catch(() => {})
      window.api.git.status(workspacePath).then((status) => {
        setIsGitRepo(status.isGit)
      }).catch(() => {})
    } catch (err) {
      setCommitResult({
        success: false,
        message: err instanceof Error ? err.message : String(err)
      })
    } finally {
      setIsCommitting(false)

      // Clear result after 8 seconds
      setTimeout(() => setCommitResult(null), 8000)
    }
  }, [workspacePath, isCommitting])

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)]">
      {/* Message area */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Subtle pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle, var(--text-secondary) 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        ></div>

        <div className="relative flex flex-col">
          {messages.length === 0 && !isStreaming && (
            <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] text-sm gap-3 px-6">
              {!hasWorkspace ? (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center mb-2 shadow-sm">
                    <FolderOpen size={28} className="text-amber-500/80" />
                  </div>
                  <p className="text-center font-medium text-[var(--text-secondary)]">Select a workspace folder</p>
                  <p className="text-xs text-[var(--text-muted)]">The agent will work with your codebase</p>
                  <button
                    onClick={handlePickWorkspace}
                    className="mt-2 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-medium rounded-xl shadow-md transition-all duration-200 active:scale-98"
                  >
                    <FolderOpen size={14} />
                    Select workspace
                  </button>
                  {recentWorkspaces.length > 0 && (
                    <div className="w-full max-w-sm mt-4">
                      <p className="text-[10px] text-[var(--text-muted)] mb-2 text-center font-medium">Recent workspaces</p>
                      <div className="space-y-1">
                        {recentWorkspaces.slice(0, 3).map((p) => (
                          <button
                            key={p}
                            onClick={() => handleSelectRecent(p)}
                            className="w-full text-left text-xs px-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-200 truncate border border-[var(--border)] hover:shadow-sm"
                            title={p}
                          >
                            <span className="text-amber-500/80">📁</span> {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
                    <Zap size={20} className="text-amber-500" />
                  </div>
                  <p className="font-medium text-[var(--text-secondary)]">Ask the agent to help with your code</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Describe what you want to build or fix</p>
                </div>
              )}
            </div>
          )}

          {messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} />
          ))}

          <StreamingIndicator conversationId={conversationId} />
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Commit result toast */}
      {commitResult && (
        <div className={cn(
          "mx-4 mb-2 px-4 py-3 rounded-xl text-sm border shadow-lg transition-all duration-300",
          commitResult.success
            ? "bg-green-500/10 border-green-500/30 text-green-400"
            : "bg-red-500/10 border-red-500/30 text-red-400"
        )}>
          <div className="flex items-start gap-2">
            <div className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
              commitResult.success ? "bg-green-500/20" : "bg-red-500/20"
            )}>
              {commitResult.success
                ? <Check size={12} className="text-green-400" />
                : <X size={12} className="text-red-400" />
              }
            </div>
            <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed overflow-auto max-h-32 flex-1">
              {commitResult.message}
            </pre>
          </div>
        </div>
      )}

      {/* Input */}
      <MessageInput
        onSend={run}
        isStreaming={isStreaming}
        onCancel={cancel}
        placeholder={hasWorkspace ? 'Ask the agent…' : 'Select a workspace first…'}
      />

      {/* Bottom status bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-t border-[var(--border)] bg-[var(--bg-secondary)] text-xs">
        {/* Workspace picker */}
        <div className="relative">
          <button
            onClick={() => setWorkspaceOpen((o) => !o)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200',
              workspaceOpen ? 'bg-[var(--bg-hover)] shadow-sm' : 'hover:bg-[var(--bg-hover)]'
            )}
          >
            <div className={cn(
              'w-5 h-5 rounded-md flex items-center justify-center',
              hasWorkspace ? 'bg-amber-500/20 text-amber-500' : 'bg-[var(--border)] text-[var(--text-muted)]'
            )}>
              <FolderOpen size={12} />
            </div>
            <span className={cn('truncate max-w-[160px]', !workspacePath && 'text-[var(--text-muted)]')}>
              {workspacePath ? truncate(workspacePath, 24) : 'Select workspace'}
            </span>
            <ChevronDown size={11} className="flex-shrink-0" />
          </button>

          {workspaceOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-72 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden z-50">
              <button
                onClick={handlePickWorkspace}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border-b border-[var(--border)] transition-colors flex items-center gap-2"
              >
                <span className="text-amber-500">📁</span> Browse folders…
              </button>
              {recentWorkspaces.length > 0 && (
                <>
                  <p className="px-4 py-2 text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider">Recent</p>
                  {recentWorkspaces.slice(0, 8).map((p) => (
                    <button
                      key={p}
                      onClick={() => handleSelectRecent(p)}
                      className={cn(
                        'w-full text-left px-4 py-2 text-sm hover:bg-[var(--bg-hover)] transition-colors truncate',
                        p === workspacePath ? 'text-amber-400 font-medium' : 'text-[var(--text-secondary)]'
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
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)]">
            <GitBranch size={11} />
            <span className="text-xs">{gitBranch}</span>
          </span>
        )}

        {/* Commit and Push button - only shown when git repo is detected */}
        {isGitRepo && (
          <button
            onClick={handleCommitAndPush}
            disabled={isCommitting}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all duration-200",
              !isCommitting
                ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-sm hover:shadow-md active:scale-95"
                : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
            )}
            title="Stage all changes, generate a commit message, commit and push to remote"
          >
            {isCommitting ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                <span>Committing…</span>
              </>
            ) : (
              <>
                <GitCommitHorizontal size={12} />
                <span>Commit & Push</span>
              </>
            )}
          </button>
        )}

        <div className="flex-1" />

        {/* Agent mode selector */}
        <div className="relative">
          <button
            onClick={() => setAgentModeOpen((o) => !o)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200',
              agentModeOpen
                ? 'border-amber-500/50 bg-amber-500/10'
                : 'border-[var(--border)] hover:border-[var(--border-focus)]'
            )}
          >
            {agentMode === 'plan' ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-500 flex items-center justify-center">
                  <BookOpen size={12} />
                </div>
                <span>Plan</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-green-500/20 text-green-500 flex items-center justify-center">
                  <Zap size={12} />
                </div>
                <span>Execute</span>
              </div>
            )}
            <ChevronDown size={11} className="flex-shrink-0 opacity-70" />
          </button>

          {agentModeOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-56 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden z-50">
              <button
                onClick={() => { setAgentMode('plan'); setAgentModeOpen(false) }}
                className={cn(
                  'w-full text-left px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-3',
                  agentMode === 'plan' ? 'text-amber-400' : 'text-[var(--text-secondary)]'
                )}
              >
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={12} />
                </div>
                <div>
                  <p className="text-sm font-medium">Plan mode</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Discuss and plan only, no changes</p>
                </div>
              </button>
              <button
                onClick={() => { setAgentMode('execute'); setAgentModeOpen(false) }}
                className={cn(
                  'w-full text-left px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-3',
                  agentMode === 'execute' ? 'text-green-400' : 'text-[var(--text-secondary)]'
                )}
              >
                <div className="w-6 h-6 rounded-lg bg-green-500/20 text-green-500 flex items-center justify-center flex-shrink-0">
                  <Zap size={12} />
                </div>
                <div>
                  <p className="text-sm font-medium">Execute</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Run tools and make changes to files</p>
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