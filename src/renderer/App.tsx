import React, { useEffect } from 'react'
import { MainLayout } from './components/layout/MainLayout'
import { useSettingsStore } from './store/settings'
import { useConversationsStore } from './store/conversations'
import { useTheme } from './hooks/useTheme'

export default function App() {
  const loadSettings = useSettingsStore((s) => s.load)
  const loadConversations = useConversationsStore((s) => s.load)

  // Apply theme class to <html>
  useTheme()

  // Load persisted data on startup
  useEffect(() => {
    loadSettings()
    loadConversations()
  }, [loadSettings, loadConversations])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        useConversationsStore.getState().create()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return <MainLayout />
}
