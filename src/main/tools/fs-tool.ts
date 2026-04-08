import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'fs'
import { join, relative } from 'path'
import { assertWithinWorkspace } from '../utils/workspace-guard'

export interface FsInput {
  path: string
  content?: string
  recursive?: boolean
}

export function readFile(input: FsInput, workspaceRoot: string): string {
  const absPath = assertWithinWorkspace(input.path, workspaceRoot)
  return readFileSync(absPath, 'utf-8')
}

export function writeFile(input: FsInput, workspaceRoot: string): string {
  const absPath = assertWithinWorkspace(input.path, workspaceRoot)
  // Ensure parent directory exists
  const dir = absPath.substring(0, absPath.lastIndexOf('/') !== -1 ? absPath.lastIndexOf('/') : absPath.lastIndexOf('\\'))
  if (dir) mkdirSync(dir, { recursive: true })
  writeFileSync(absPath, input.content ?? '', 'utf-8')
  return `Written ${input.path}`
}

export function listDir(input: FsInput, workspaceRoot: string): string {
  const absPath = assertWithinWorkspace(input.path, workspaceRoot)
  const entries = readdirSync(absPath)
  const lines = entries.map((name) => {
    const full = join(absPath, name)
    const stat = statSync(full)
    const rel = relative(workspaceRoot, full)
    return stat.isDirectory() ? `${rel}/` : rel
  })
  return lines.join('\n')
}
