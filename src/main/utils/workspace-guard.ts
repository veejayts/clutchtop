import { resolve, sep } from 'path'

export function assertWithinWorkspace(filePath: string, workspaceRoot: string): string {
  const absWorkspace = resolve(workspaceRoot)
  const absFile = resolve(workspaceRoot, filePath)

  if (!absFile.startsWith(absWorkspace + sep) && absFile !== absWorkspace) {
    throw new Error(`Path escape attempt blocked: "${filePath}" is outside workspace "${workspaceRoot}"`)
  }
  return absFile
}
