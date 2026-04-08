import { registerDbHandlers } from './db'
import { registerSettingsHandlers } from './settings'
import { registerToolHandlers } from './tools'

export function registerIpcHandlers(): void {
  registerDbHandlers()
  registerSettingsHandlers()
  registerToolHandlers()
}
