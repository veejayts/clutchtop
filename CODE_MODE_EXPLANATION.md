# Code Mode Explanation

## Overview

This is an Electron-based chat application that includes a special "Code Mode" - essentially an AI-powered coding assistant that can interact directly with your local workspace. It's similar to tools like GitHub Copilot, Cursor, or Claude's code assistant, but as a standalone desktop application.

## How Code Mode Works

### 1. **Workspace Selection**

When you enter Code mode, you first need to select a workspace folder:
- A workspace picker component appears at the top of the Code pane
- Click "Select workspace" to browse and choose a local folder
- The selected workspace becomes the root directory for all file operations
- This provides **sandboxing** - the AI can only access files within the chosen workspace

### 2. **The AI Agent Loop**

The core logic is in `useCodeAgent.ts`. Here's how it works:

**For each user message:**
1. **Append user message** to the conversation history
2. **Stream the AI response** from the configured provider (Anthropic, OpenAI, Gemini, etc.)
3. **Detect tool calls** - the AI can request to use tools during streaming
4. **Execute tool calls** - the app runs the requested tools in the workspace
5. **Return results** - tool results are appended back to the conversation
6. **Loop** - The AI can make additional tool calls up to 20 iterations max

**Key parameters:**
- `MAX_ITERATIONS = 20` - prevents infinite loops
- Tools are executed with `workspacePath` as the working directory for sandboxing

### 3. **Available Tools**

The Code mode has 7 built-in tools that the AI can use to interact with your workspace:

| Tool | Description |
|------|-------------|
| **readFile** | Read the contents of a file |
| **writeFile** | Write/update a file (creates if doesn't exist) |
| **listDir** | List files/directories in a directory |
| **runCommand** | Execute shell commands in the workspace |
| **webFetch** | Fetch content from URLs |
| **grepSearch** | Search for regex patterns across files |
| **globSearch** | Find files matching glob patterns |

**Example workflow:**
```
User: "Show me the structure of my src folder and read App.tsx"

1. AI calls: listDir("src") → sees folder structure
2. AI calls: readFile("src/renderer/App.tsx") → reads the file
3. AI responds with a summary of what it found
```

### 4. **Message Flow & Streaming**

The app handles streaming in real-time:

**Streaming states:**
- `streamingText` - accumulates text as it comes from the AI
- `isStreaming` - boolean flag for UI (shows "thinking" indicator)
- `abortController` - allows cancellation via Ctrl+C or Cancel button

**Message structure:**
Each message has a `role` and `content` array with parts:
- `text` - plain text content
- `tool_use` - AI requesting to use a tool
- `tool_result` - Output from a tool execution

### 5. **The Tool Execution Pipeline**

When the AI requests a tool call, here's the execution flow:

```
Provider streams chunks → 
  tool_use_start (tool name) →
  tool_use_delta (partial input) →
  tool_use_end (full input) →

executor.ts executes the tool →
  window.api.tools.execute() (Electron main process) →

Tool result returned →
  Added as tool_result message →
  Loop continues for next iteration
```

### 6. **Provider Integration**

The app supports multiple AI providers:
- **Anthropic** (Claude)
- **OpenAI** (GPT)
- **Gemini** (Google)
- **Ollama** (local models)
- **OpenRouter**

Each provider's SDK handles tool-calling differently, but the app normalizes the streaming output into a unified format.

## Code Mode vs Chat Mode

| Feature | Chat Mode | Code Mode |
|---------|-----------|-----------|
| **Workspace** | Not needed | Required |
| **Tools** | Web search only | Full file system + shell |
| **Use case** | General conversation | Code assistance, repo exploration |
| **Safety** | External only | Sandboxed to workspace |

## Example Usage

Here's how a typical Code mode conversation might go:

**User:** "Find all React components in my project"

**AI (internal thinking):**
1. Call `globSearch("**/*.tsx")` to find all TypeScript React files
2. Read a few key files to understand the structure
3. Provide summary of component locations

**User:** "Write a new component called Button.tsx"

**AI:**
1. Check if src/components exists with `listDir("src")`
2. Write the new file with `writeFile("src/components/Button.tsx", "...")`
3. Confirm the file was created

## Security Considerations

The workspace selection provides sandboxing - the AI can only access the chosen directory. However, `runCommand` can execute arbitrary shell commands, so users should be cautious when:
- Granting access to sensitive repositories
- Allowing the AI to run build/test commands
- Working with untrusted codebases

## Implementation Notes

- Uses **Zustand** for state management
- Uses **Electron** for desktop app + file system access
- Uses **SQLite** for message persistence
- Uses **Tailwind CSS** for styling
- Tool calls are executed in the **Electron main process** (not renderer)
- Messages are streamed chunk-by-chunk for real-time UI updates
