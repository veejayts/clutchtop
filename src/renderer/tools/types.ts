export interface ToolCall {
  toolUseId: string
  toolName: string
  toolInput: Record<string, unknown>
}

export interface ToolResult {
  toolUseId: string
  toolName: string
  content: string
  isError: boolean
}
