import type { ToolCall, ToolResult } from './types'

export async function executeToolCall(
  call: ToolCall,
  workspacePath: string
): Promise<ToolResult> {
  const result = await window.api.tools.execute(call.toolName, call.toolInput, workspacePath)
  return {
    toolUseId: call.toolUseId,
    toolName: call.toolName,
    content: result.content,
    isError: result.isError
  }
}

export async function executeToolCalls(
  calls: ToolCall[],
  workspacePath: string
): Promise<ToolResult[]> {
  return Promise.all(calls.map((c) => executeToolCall(c, workspacePath)))
}
