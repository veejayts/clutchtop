import { useCallback } from 'react'
import { nanoid } from 'nanoid'
import { useMessagesStore } from '../store/messages'
import { useConversationsStore } from '../store/conversations'
import { useSettingsStore } from '../store/settings'
import { useWorkspaceStore } from '../store/workspace'
import { useProvider } from './useProvider'
import { CODE_TOOLS } from '../tools/definitions'
import { executeToolCalls } from '../tools/executor'
import type { Message, ContentPart, ToolUsePart, ToolResultPart } from '../providers/types'
import type { ToolCall } from '../tools/types'

const MAX_ITERATIONS = 20

export function useCodeAgent(conversationId: string) {
  const messagesStore = useMessagesStore()
  const convsStore = useConversationsStore()
  const settings = useSettingsStore()
  const conversation = convsStore.conversations.find((c) => c.id === conversationId)
  const providerId = (conversation?.providerId ?? settings.defaultProvider) as Parameters<typeof useProvider>[0]
  const provider = useProvider(providerId)
  const agentMode = useWorkspaceStore((s) => s.agentMode)

  const run = useCallback(async (userText: string) => {
    const streamingState = messagesStore.getStreamingState(conversationId)
    if (!userText.trim() || streamingState.isStreaming) return

    const workspacePath = conversation?.workspacePath ?? ''
    const model = conversation?.model ?? settings.providers[providerId]?.defaultModel ?? settings.defaultModel

    // Append user message
    const userMsg: Message = {
      id: nanoid(),
      role: 'user',
      content: [{ type: 'text', text: userText }],
      createdAt: new Date().toISOString()
    }
    await messagesStore.appendMessage(conversationId, userMsg)

    // Auto-title
    const msgs = messagesStore.getMessages(conversationId)
    if (msgs.length === 1) {
      await convsStore.update(conversationId, { title: userText.slice(0, 60) })
    }

    const ac = new AbortController()
    messagesStore.setAbortController(conversationId, ac)

    // In plan mode, don't provide tools so the model responds with text only
    const tools = agentMode === 'execute' ? CODE_TOOLS : undefined

    let iterations = 0

    while (iterations < MAX_ITERATIONS) {
      iterations++
      const currentMessages = messagesStore.getMessages(conversationId)

      // Streaming accumulation state
      let textAccum = ''
      const toolUseMap: Record<string, { name: string; inputAccum: string }> = {}
      const toolUseOrder: string[] = []

      messagesStore.setStreamingText(conversationId, '')

      try {
        for await (const chunk of provider.stream({
          model,
          messages: currentMessages,
          systemPrompt: conversation?.systemPrompt ?? undefined,
          tools,
          signal: ac.signal
        })) {
          if (chunk.type === 'text_delta' && chunk.textDelta) {
            textAccum += chunk.textDelta
            messagesStore.appendStreamingText(conversationId, chunk.textDelta)
          } else if (chunk.type === 'tool_use_start' && chunk.toolUseId) {
            toolUseMap[chunk.toolUseId] = { name: chunk.toolName ?? '', inputAccum: '' }
            toolUseOrder.push(chunk.toolUseId)
          } else if (chunk.type === 'tool_use_delta' && chunk.toolInputDelta) {
            const current = toolUseOrder[toolUseOrder.length - 1]
            if (current && toolUseMap[current]) {
              toolUseMap[current].inputAccum += chunk.toolInputDelta
            }
          } else if (chunk.type === 'tool_use_end' && chunk.toolInputFull) {
            const id = chunk.toolUseId ?? toolUseOrder[toolUseOrder.length - 1]
            if (id && toolUseMap[id]) {
              toolUseMap[id].inputAccum = JSON.stringify(chunk.toolInputFull)
            }
          } else if (chunk.type === 'message_stop') {
            break
          } else if (chunk.type === 'error') {
            textAccum += `\n[Error: ${chunk.error}]`
            messagesStore.appendStreamingText(conversationId, `\n[Error: ${chunk.error}]`)
            break
          }
        }
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') {
          messagesStore.setAbortController(conversationId, null)
          return
        }
        textAccum += `\n[Error: ${(err as Error).message}]`
      }

      // Build assistant message content
      const assistantContent: ContentPart[] = []
      if (textAccum) {
        assistantContent.push({ type: 'text', text: textAccum })
      }

      const toolCalls: ToolCall[] = []
      for (const id of toolUseOrder) {
        const tu = toolUseMap[id]
        let input: Record<string, unknown> = {}
        try { input = JSON.parse(tu.inputAccum) } catch { /* keep empty */ }
        const toolUsePart: ToolUsePart = {
          type: 'tool_use',
          toolUseId: id,
          toolName: tu.name,
          toolInput: input
        }
        assistantContent.push(toolUsePart)
        toolCalls.push({ toolUseId: id, toolName: tu.name, toolInput: input })
      }

      // Finalize assistant message
      await messagesStore.finalizeStream(conversationId, assistantContent)

      // No tool calls → done
      if (toolCalls.length === 0) break

      // Execute tool calls (sandboxed to workspacePath)
      const results = await executeToolCalls(toolCalls, workspacePath)

      // Build tool_result message
      const toolResultContent: ToolResultPart[] = results.map((r) => ({
        type: 'tool_result',
        toolUseId: r.toolUseId,
        content: r.content,
        isError: r.isError
      }))

      const toolResultMsg: Message = {
        id: nanoid(),
        role: 'tool_result',
        content: toolResultContent,
        createdAt: new Date().toISOString()
      }
      await messagesStore.appendMessage(conversationId, toolResultMsg)
    }
  }, [conversationId, messagesStore, convsStore, settings, provider, conversation, providerId, agentMode])

  const streamingState = messagesStore.getStreamingState(conversationId)
  return {
    run,
    isStreaming: streamingState.isStreaming,
    cancel: () => messagesStore.cancelStream(conversationId)
  }
}
