import React from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { ChatPane } from '../chat/ChatPane'
import { CodePane } from '../code/CodePane'
import { useWorkspaceStore } from '../../store/workspace'
import { useConversationsStore } from '../../store/conversations'

class ContentErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div className="h-full flex items-center justify-center text-[var(--text-secondary)] text-sm flex-col gap-2">
          <p>Something went wrong loading this conversation.</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="text-xs underline"
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
  const { activeId } = useConversationsStore()

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-hidden">
          <ContentErrorBoundary key={activeId ?? 'empty'}>
            {activeId ? (
              mode === 'code' ? (
                <CodePane key={activeId} conversationId={activeId} />
              ) : (
                <ChatPane key={activeId} conversationId={activeId} />
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
    <div className="h-full flex flex-col items-center justify-center gap-4 text-[var(--text-secondary)]">
      <div className="text-4xl">⚡</div>
      <div className="text-center">
        <p className="text-base font-medium text-[var(--text-primary)]">Welcome to Clutchtop</p>
        <p className="text-sm mt-1">Start a conversation or open a project</p>
      </div>
      <button
        onClick={() => create({ mode })}
        className="mt-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors"
      >
        New conversation
      </button>
    </div>
  )
}
