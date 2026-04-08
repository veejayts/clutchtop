import type { ToolDefinition } from '../providers/types'

export const CODE_TOOLS: ToolDefinition[] = [
  {
    name: 'readFile',
    description: 'Read the contents of a file in the workspace.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative path to the file within the workspace.' }
      },
      required: ['path']
    }
  },
  {
    name: 'writeFile',
    description: 'Write content to a file in the workspace. Creates the file if it does not exist.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative path to the file within the workspace.' },
        content: { type: 'string', description: 'Content to write to the file.' }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'listDir',
    description: 'List files and directories in a directory within the workspace.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative path to the directory. Use "." for workspace root.' }
      },
      required: ['path']
    }
  },
  {
    name: 'runCommand',
    description: 'Run a shell command in the workspace root. Returns stdout and stderr.',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'The shell command to run.' },
        timeout: { type: 'number', description: 'Timeout in milliseconds (default: 30000).' }
      },
      required: ['command']
    }
  },
  {
    name: 'webFetch',
    description: 'Fetch the content of a URL and return it as text.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The URL to fetch.' },
        maxLength: { type: 'number', description: 'Max characters to return (default: 50000).' }
      },
      required: ['url']
    }
  },
  {
    name: 'grepSearch',
    description: 'Search for a regex pattern across files in the workspace.',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Regular expression pattern to search for.' },
        path: { type: 'string', description: 'Subdirectory to search in (optional).' },
        maxResults: { type: 'number', description: 'Max number of matches to return (default: 50).' }
      },
      required: ['pattern']
    }
  },
  {
    name: 'globSearch',
    description: 'Find files matching a glob pattern in the workspace.',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Glob pattern, e.g. "**/*.ts" or "src/**/*.tsx".' },
        path: { type: 'string', description: 'Subdirectory to search in (optional).' }
      },
      required: ['pattern']
    }
  }
]
