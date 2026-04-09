import { ipcMain, BrowserWindow } from 'electron'
import { readFile, writeFile, listDir } from '../tools/fs-tool'
import { runCommand, gitCommitAndPush } from '../tools/shell-tool'
import { webFetch } from '../tools/fetch-tool'
import { grepSearch, globSearch } from '../tools/search-tool'

export function registerToolHandlers(): void {
  ipcMain.handle('tool:execute', async (event, { name, input, workspacePath }) => {
    const sender = BrowserWindow.fromWebContents(event.sender)
    const toolUseId: string = input._toolUseId ?? 'unknown'

    const sendChunk = (chunk: string) => {
      if (sender && !sender.isDestroyed()) {
        event.sender.send('tool:stream-output', { toolUseId, chunk })
      }
    }

    try {
      let content: string

      switch (name) {
        case 'readFile':
          content = readFile(input as { path: string }, workspacePath)
          break
        case 'writeFile':
          content = writeFile(input as { path: string; content: string }, workspacePath)
          break
        case 'listDir':
          content = listDir(input as { path: string }, workspacePath)
          break
        case 'runCommand':
          content = await runCommand(input as { command: string; timeout?: number }, workspacePath, sendChunk)
          break
        case 'webFetch':
          content = await webFetch(input as { url: string; maxLength?: number })
          break
        case 'grepSearch':
          content = grepSearch(input as { pattern: string; path?: string }, workspacePath)
          break
        case 'globSearch':
          content = globSearch(input as { pattern: string; path?: string }, workspacePath)
          break
        case 'gitCommitAndPush':
          content = await gitCommitAndPush(input as { commitMessage?: string }, workspacePath, sendChunk)
          break
        default:
          return { content: `Unknown tool: ${name}`, isError: true }
      }

      return { content, isError: false }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      return { content: message, isError: true }
    }
  })
}