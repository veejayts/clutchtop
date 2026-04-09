import { ipcMain } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import { spawn } from 'child_process'

function runGitCommand(args: string[], workspaceRoot: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('git', args, {
      cwd: workspaceRoot,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data: Buffer) => {
      stdout += data.toString()
    })

    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Git command failed with code ${code}`))
      } else {
        resolve(stdout)
      }
    })

    child.on('error', reject)
  })
}

export function registerGitHandlers(): void {
  // Get git status
  ipcMain.handle('git:status', async (_event, workspacePath: string) => {
    const gitPath = join(workspacePath, '.git')
    if (!existsSync(gitPath)) {
      return { isGit: false, status: '', branch: null }
    }

    try {
      const status = await runGitCommand(['status', '--porcelain'], workspacePath)
      const branch = await runGitCommand(['branch', '--show-current'], workspacePath)
      return { isGit: true, status: status.trim(), branch: branch.trim() }
    } catch {
      return { isGit: false, status: '', branch: null }
    }
  })

  // Get git diff (staged + unstaged)
  ipcMain.handle('git:diff', async (_event, workspacePath: string) => {
    const gitPath = join(workspacePath, '.git')
    if (!existsSync(gitPath)) {
      throw new Error('Not a git repository')
    }

    try {
      // Get diff of staged changes
      const stagedDiff = await runGitCommand(['diff', '--cached'], workspacePath).catch(() => '')
      // Get diff of unstaged changes
      const unstagedDiff = await runGitCommand(['diff'], workspacePath).catch(() => '')
      // Get status for new/modified/deleted files
      const status = await runGitCommand(['status', '--porcelain'], workspacePath)
      
      return {
        staged: stagedDiff,
        unstaged: unstagedDiff,
        status: status.trim()
      }
    } catch (err) {
      throw err
    }
  })

  // Get a summary of changes (for commit message generation)
  ipcMain.handle('git:changes-summary', async (_event, workspacePath: string) => {
    const gitPath = join(workspacePath, '.git')
    if (!existsSync(gitPath)) {
      throw new Error('Not a git repository')
    }

    try {
      // Get status
      const status = await runGitCommand(['status', '--porcelain'], workspacePath)
      
      if (!status.trim()) {
        return { hasChanges: false, summary: '' }
      }

      // Parse status
      const lines = status.trim().split('\n')
      const files = {
        added: [] as string[],
        modified: [] as string[],
        deleted: [] as string[],
        renamed: [] as string[]
      }

      for (const line of lines) {
        if (line.length < 3) continue
        const statusCode = line.substring(0, 2)
        const file = line.substring(3).trim()

        if (statusCode.includes('A') || statusCode === '??') files.added.push(file)
        else if (statusCode.includes('M')) files.modified.push(file)
        else if (statusCode.includes('D')) files.deleted.push(file)
        else if (statusCode.includes('R')) files.renamed.push(file)
      }

      // Get a concise diff summary (just the stats)
      const diffStat = await runGitCommand(['diff', '--stat', 'HEAD'], workspacePath).catch(() => '')

      // Get actual diff content (limited to first 5000 chars to avoid token limits)
      let diffContent = ''
      try {
        // First add all files, then get diff
        await runGitCommand(['add', '-N', '.'], workspacePath) // Add new files content without staging
        diffContent = await runGitCommand(['diff', '--no-color'], workspacePath)
        if (diffContent.length > 5000) {
          diffContent = diffContent.substring(0, 5000) + '\n... (diff truncated)'
        }
      } catch {
        // Ignore diff errors
      }

      return {
        hasChanges: true,
        files,
        diffStat: diffStat.trim(),
        diffContent
      }
    } catch (err) {
      throw err
    }
  })
}