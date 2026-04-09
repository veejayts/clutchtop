import { registerDbHandlers } from './db'
import { registerSettingsHandlers } from './settings'
import { registerToolHandlers } from './tools'
import { registerGitHandlers } from './git'

export function registerIpcHandlers(): void {
  registerDbHandlers()
  registerSettingsHandlers()
  registerToolHandlers()
  registerGitHandlers()
}