import { spawn } from 'child_process'

export interface ShellInput {
  command: string
  timeout?: number
}

export function runCommand(
  input: ShellInput,
  workspaceRoot: string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = input.timeout ?? 30000
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
