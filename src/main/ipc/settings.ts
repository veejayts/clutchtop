import { ipcMain, app, dialog } from 'electron'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const DEFAULT_SETTINGS = {
  theme: 'dark',
  defaultProvider: 'anthropic',
  defaultModel: 'claude-3-5-sonnet-20241022',
  providers: {
    anthropic:   { apiKey: '', defaultModel: 'claude-3-5-sonnet-20241022' },
    openai:      { apiKey: '', defaultModel: 'gpt-4o' },
    gemini:      { apiKey: '', defaultModel: 'gemini-1.5-pro' },
    ollama:      { baseUrl: 'http://localhost:11434', defaultModel: 'llama3.2' },
    openrouter:  { apiKey: '', baseUrl: 'https://openrouter.ai/api/v1', defaultModel: 'anthropic/claude-3.5-sonnet' }
  }
}

function getSettingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

function readSettings(): Record<string, unknown> {
  const path = getSettingsPath()
  if (!existsSync(path)) return { ...DEFAULT_SETTINGS }
  try {
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

function writeSettings(data: Record<string, unknown>): void {
  writeFileSync(getSettingsPath(), JSON.stringify(data, null, 2), 'utf-8')
}

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', () => {
    return readSettings()
  })

  ipcMain.handle('settings:set', (_e, data) => {
    const current = readSettings()
    const merged = deepMerge(current, data)
    writeSettings(merged)
  })

  ipcMain.handle('workspace:select', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select Workspace Folder'
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('workspace:git-branch', (_e, workspacePath: string) => {
    try {
      const headPath = join(workspacePath, '.git', 'HEAD')
      if (!existsSync(headPath)) return null
      const content = readFileSync(headPath, 'utf-8').trim()
      if (content.startsWith('ref: refs/heads/')) {
        return content.replace('ref: refs/heads/', '')
      }
      return null // detached HEAD — don't show anything
    } catch {
      return null
    }
  })
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...target }
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      typeof target[key] === 'object' &&
      target[key] !== null
    ) {
      out[key] = deepMerge(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>)
    } else {
      out[key] = source[key]
    }
  }
  return out
}
