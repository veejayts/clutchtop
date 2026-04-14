import { spawn } from 'child_process'
import { existsSync, writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { randomBytes } from 'crypto'

export interface ShellInput {
  command: string
  timeout?: number
}

export interface GitCommitAndPushInput {
  commitMessage?: string
}

export function runCommand(
  input: ShellInput,
  workspaceRoot: string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = input.timeout ?? 120000
    const isWindows = process.platform === 'win32'
    const shell = isWindows ? 'cmd.exe' : '/bin/sh'
    const shellFlag = isWindows ? '/c' : '-c'

    const child = spawn(shell, [shellFlag, input.command], {
      cwd: workspaceRoot,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    let output = ''
    const timer = setTimeout(() => {
      child.kill()
      reject(new Error(`Command timed out after ${timeout}ms`))
    }, timeout)

    child.stdout.on('data', (data: Buffer) => {
      const chunk = data.toString()
      output += chunk
      onChunk?.(chunk)
    })

    child.stderr.on('data', (data: Buffer) => {
      const chunk = data.toString()
      output += chunk
      onChunk?.(chunk)
    })

    child.on('close', (code) => {
      clearTimeout(timer)
      resolve(output + (code !== 0 ? `\n[Exit code: ${code}]` : ''))
    })

    child.on('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })
  })
}

// Helper to run git commands directly without shell escaping issues
function runGitCommand(
  args: string[],
  workspaceRoot: string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = 30000

    const child = spawn('git', args, {
      cwd: workspaceRoot,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    let output = ''
    const timer = setTimeout(() => {
      child.kill()
      reject(new Error(`Git command timed out after ${timeout}ms`))
    }, timeout)

    child.stdout.on('data', (data: Buffer) => {
      const chunk = data.toString()
      output += chunk
      onChunk?.(chunk)
    })

    child.stderr.on('data', (data: Buffer) => {
      const chunk = data.toString()
      output += chunk
      onChunk?.(chunk)
    })

    child.on('close', (code) => {
      clearTimeout(timer)
      resolve(output + (code !== 0 ? `\n[Exit code: ${code}]` : ''))
    })

    child.on('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })
  })
}

export async function gitCommitAndPush(
  input: GitCommitAndPushInput,
  workspaceRoot: string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  // Check if .git directory exists
  const gitPath = join(workspaceRoot, '.git')
  if (!existsSync(gitPath)) {
    throw new Error('No git repository found in the workspace')
  }

  let output = ''

  // Get git status
  const statusResult = await runGitCommand(['status', '--porcelain'], workspaceRoot, onChunk)
  output += 'Git status:\n' + statusResult

  if (statusResult.trim() === '') {
    output += '\nNo changes to commit.'
    return output
  }

  // Get diff for analysis
  const diffResult = await runGitCommand(['diff', '--stat'], workspaceRoot, onChunk)
  output += '\nChanges summary:\n' + diffResult

  // Generate commit message if not provided
  let commitMessage = input.commitMessage
  if (!commitMessage) {
    // Parse the status output to understand changes
    const changes = statusResult.trim().split('\n')
    
    const added: string[] = []
    const modified: string[] = []
    const deleted: string[] = []
    const renamed: string[] = []

    for (const line of changes) {
      if (line.length < 3) continue
      
      // git status --porcelain format: XY filename
      const status = line.substring(0, 2)
      const file = line.substring(3).trim()

      if (status.includes('A') || status === '??') added.push(file)
      else if (status.includes('M')) modified.push(file)
      else if (status.includes('D')) deleted.push(file)
      else if (status.includes('R')) renamed.push(file)
    }

    // Build commit message
    const messageParts: string[] = []

    if (added.length > 0) {
      messageParts.push(`Add ${added.length} file${added.length > 1 ? 's' : ''}`)
    }

    if (modified.length > 0) {
      messageParts.push(`Update ${modified.length} file${modified.length > 1 ? 's' : ''}`)
    }

    if (deleted.length > 0) {
      messageParts.push(`Remove ${deleted.length} file${deleted.length > 1 ? 's' : ''}`)
    }

    if (renamed.length > 0) {
      messageParts.push(`Rename ${renamed.length} file${renamed.length > 1 ? 's' : ''}`)
    }

    // Use single line message to avoid shell escaping issues
    commitMessage = messageParts.join(', ') || 'Update files'
  }

  // Stage all changes
  const addResult = await runGitCommand(['add', '.'], workspaceRoot, onChunk)
  output += '\nStaging changes...\n' + addResult

  // Commit using a temp file to handle multiline messages safely
  const tempFile = join(workspaceRoot, `.git-commit-msg-${randomBytes(8).toString('hex')}.tmp`)
  
  try {
    // Write commit message to temp file
    writeFileSync(tempFile, commitMessage, 'utf-8')
    
    // Use git commit -F with the temp file
    const commitResult = await runGitCommand(['commit', '-F', tempFile], workspaceRoot, onChunk)
    output += '\nCommitting...\n' + commitResult

    // Clean up temp file
    try { unlinkSync(tempFile) } catch { /* ignore cleanup errors */ }

    // Check if commit succeeded before pushing
    if (commitResult.includes('[Exit code:') && !commitResult.includes('[Exit code: 0]')) {
      output += '\nCommit failed, skipping push.'
      return output
    }
  } catch (err) {
    // Clean up temp file on error
    try { unlinkSync(tempFile) } catch { /* ignore cleanup errors */ }
    throw err
  }

  // Push changes
  const pushResult = await runGitCommand(['push'], workspaceRoot, onChunk)
  output += '\nPushing...\n' + pushResult

  return output
}