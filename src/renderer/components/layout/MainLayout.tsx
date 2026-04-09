import React from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { ChatPane } from '../chat/ChatPane'
import { CodePane } from '../code/CodePane'
import { useWorkspaceStore } from '../../store/workspace'
import { useConversationsStore } from '../../store/conversations'
import { MessageSquare, Terminal, Zap } from 'lucide-react'

class ContentErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div className="h-full flex items-center justify-center flex-col gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
            <Terminal size={20} className="text-red-400" />
          </div>
          <p className="text-sm text-[var(--text-secondary)]">Something went wrong loading this conversation.</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium rounded-lg transition-all duration-200"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export function MainLayout() {
  const mode = useWorkspaceStore((s) => s.mode)
  const { activeId, conversations } = useConversationsStore()

  const activeConv = conversations.find((c) => c.id === activeId)
  const visibleId = (activeConv?.mode === mode || (mode === 'agent' && activeConv?.mode === 'code')) ? activeId : null

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden rounded-2xl">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 rounded-l-2xl overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-hidden">
          <ContentErrorBoundary key={visibleId ?? 'empty'}>
            {visibleId ? (
              mode === 'agent' ? (
                <CodePane key={visibleId} conversationId={visibleId} />
              ) : (
                <ChatPane key={visibleId} conversationId={visibleId} />
              )
            ) : (
              <EmptyState />
            )}
          </ContentErrorBoundary>
        </main>
      </div>
    </div>
  )
}

function EmptyState() {
  const { create } = useConversationsStore()
  const { mode } = useWorkspaceStore()

  return (
    <div className="h-full flex flex-col items-center justify-center gap-5 bg-[var(--bg-primary)]">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center shadow-sm">
        <Zap size={24} className="text-amber-500" fill="currentColor" />
      </div>
      <div className="text-center space-y-1.5">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {mode === 'agent' ? 'Start a new agent session' : 'Start a new conversation'}
        </p>
        <p className="text-xs text-[var(--text-secondary)]">
          {mode === 'agent' 
            ? 'Run AI agents on your codebase' 
            : 'Chat with your AI assistant'}
        </p>
      </div>
      <button
        onClick={() => create({ mode })}
        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
      >
        {mode === 'agent' ? <Terminal size={15} /> : <MessageSquare size={15} />}
        New {mode === 'agent' ? 'session' : 'chat'}
      </button>
      <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
        <kbd className="px-1.5 py-0.5 bg-[var(--bg-secondary)] rounded border border-[var(--border)] text-[10px]">⌘</kbd>
        <kbd className="px-1.5 py-0.5 bg-[var(--bg-secondary)] rounded border border-[var(--border)] text-[10px]">N</kbd>
        <span>to create one quickly</span>
      </p>
    </div>
  )
}
