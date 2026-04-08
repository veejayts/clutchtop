import { readdirSync, readFileSync, statSync } from 'fs'
import { join, relative } from 'path'
import { assertWithinWorkspace } from '../utils/workspace-guard'

export interface GrepInput {
  pattern: string
  path?: string
  fileGlob?: string
  maxResults?: number
}

export interface GlobInput {
  pattern: string
  path?: string
}

export function grepSearch(input: GrepInput, workspaceRoot: string): string {
  const searchRoot = input.path
    ? assertWithinWorkspace(input.path, workspaceRoot)
    : workspaceRoot

  const maxResults = input.maxResults ?? 50
  const results: string[] = []
  let regex: RegExp

  try {
    regex = new RegExp(input.pattern, 'g')
  } catch {
    return `Invalid regex: ${input.pattern}`
  }

  function walkDir(dir: string): void {
    if (results.length >= maxResults) return
    let entries: string[]
    try { entries = readdirSync(dir) } catch { return }

    for (const entry of entries) {
      if (results.length >= maxResults) return
      const full = join(dir, entry)
      let stat
      try { stat = statSync(full) } catch { continue }

      if (stat.isDirectory()) {
        if (!entry.startsWith('.') && entry !== 'node_modules' && entry !== 'dist') {
          walkDir(full)
        }
      } else if (stat.isFile()) {
        // Skip binary-ish files
        if (/\.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|bin|exe|dll)$/i.test(entry)) continue
        try {
          const content = readFileSync(full, 'utf-8')
          const lines = content.split('\n')
          lines.forEach((line, idx) => {
            if (results.length >= maxResults) return
            regex.lastIndex = 0
            if (regex.test(line)) {
              const rel = relative(workspaceRoot, full)
              results.push(`${rel}:${idx + 1}: ${line.trim()}`)
            }
          })
        } catch {
          // skip unreadable files
        }
      }
    }
  }

  walkDir(searchRoot)
  if (results.length === 0) return 'No matches found.'
  return results.join('\n')
}

export function globSearch(input: GlobInput, workspaceRoot: string): string {
  const searchRoot = input.path
    ? assertWithinWorkspace(input.path, workspaceRoot)
    : workspaceRoot

  const pattern = input.pattern
  const results: string[] = []

  // Convert glob pattern to regex
  const regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '<<<DOUBLESTAR>>>')
    .replace(/\*/g, '[^/\\\\]*')
    .replace(/<<<DOUBLESTAR>>>/g, '.*')
    .replace(/\?/g, '[^/\\\\]')

  let regex: RegExp
  try {
    regex = new RegExp(regexStr + '$', 'i')
  } catch {
    return `Invalid glob pattern: ${pattern}`
  }

  function walkDir(dir: string): void {
    if (results.length >= 200) return
    let entries: string[]
    try { entries = readdirSync(dir) } catch { return }

    for (const entry of entries) {
      const full = join(dir, entry)
      let stat
      try { stat = statSync(full) } catch { continue }

      const rel = relative(workspaceRoot, full)
      if (stat.isDirectory()) {
        if (!entry.startsWith('.') && entry !== 'node_modules' && entry !== 'dist') {
          walkDir(full)
        }
      } else if (regex.test(rel)) {
        results.push(rel)
      }
    }
  }

  walkDir(searchRoot)
  if (results.length === 0) return 'No matching files found.'
  return results.join('\n')
}
