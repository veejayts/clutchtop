# Clutchtop

![Clutchtop](resources/icon.png)

**AI Desktop Assistant with Chat and Code Modes** - A powerful Electron-based AI assistant that combines conversational chat capabilities with code-aware workspace interaction.

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-33.0.0-blue.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)

## Features

### 🗨️ Chat Mode
- **Multi-provider support** - Connect with OpenAI, Anthropic (Claude), Google Gemini, Ollama, and OpenRouter
- **Web search capabilities** - Fetch information from the web when needed
- **Conversation history** - Persistent chat sessions stored locally
- **Theme support** - Dark/Light mode with system preference detection

### 💻 Code Mode
- **Workspace sandboxing** - Select a local folder for secure AI interaction
- **File system tools** - Read, write, list, search, and modify files
- **Command execution** - Run shell commands within the workspace
- **Code analysis** - Understand and interact with your codebase
- **AI-powered assistance** - Similar to GitHub Copilot, Cursor, or Claude Code

## Tech Stack

- **Electron** - Desktop application framework
- **React 18** - UI components
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Zustand** - State management
- **SQLite** - Local data persistence
- **Shiki** - Syntax highlighting
- **React Markdown** - Markdown rendering

## Supported AI Providers

| Provider | Models | API Key Required |
|----------|--------|------------------|
| **Anthropic** | Claude 3.5 Sonnet, Claude 3 Opus, etc. | ✅ |
| **OpenAI** | GPT-4, GPT-4 Turbo, GPT-3.5 | ✅ |
| **Google Gemini** | Gemini 1.5 Pro, Gemini 1.0 Pro | ✅ |
| **Ollama** | Local models (Llama 3.2, etc.) | ❌ (local) |
| **OpenRouter** | Various model aggregators | ✅ |

## Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- For local models: Ollama running on `http://localhost:11434`

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/veejayts/clutchtop.git
   cd clutchtop
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Development mode:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   npm run dist
   ```

## Usage

### Setup

1. **First launch** - The app will start in Chat mode
2. **Configure providers** - Go to Settings and add API keys for your preferred providers
3. **Switch to Code mode** - Click the "Code" tab in the sidebar

### Chat Mode

1. Select your preferred AI provider from the dropdown
2. Choose a model
3. Start chatting!

### Code Mode

1. **Select workspace** - Click "Select workspace" to choose a local folder
2. **Describe what you want** - The AI can:
   - Analyze your codebase structure
   - Read and understand files
   - Write new code or modify existing files
   - Search for patterns across your project
   - Run commands (build, test, etc.)

#### Example Code Mode Conversations

**Analyzing a codebase:**
> "Show me the structure of my src folder and explain what each file does"

**Writing new code:**
> "Create a new React component called Button.tsx with variants for primary, secondary, and danger styles"

**Code refactoring:**
> "Find all places where we're using fetch and replace them with axios"

**Debugging:**
> "Why is this component not rendering? Here's the code..."

## Configuration

### Provider Settings

API keys and configuration are stored locally. To configure:

1. Open Settings (gear icon)
2. Select a provider
3. Enter your API key
4. Optionally set a custom base URL or default model

### Theme Settings

- **Dark** - Dark theme (default)
- **Light** - Light theme
- **System** - Follows system preference

## Architecture

```
clutchtop/
├── src/
│   ├── main/           # Electron main process
│   │   ├── db/         # SQLite database
│   │   ├── ipc/        # IPC handlers
│   │   └── tools/      # Code mode tools
│   ├── preload/        # Preload scripts
│   └── renderer/       # React UI
│       ├── components/ # UI components
│       ├── hooks/      # Custom hooks
│       ├── lib/        # Utilities
│       ├── providers/  # AI provider integrations
│       ├── store/      # Zustand state stores
│       └── tools/      # Code mode tool definitions
├── resources/          # App icons and assets
├── dist/               # Build output
└── out/                # Electron output
```

## Code Mode Tools

The Code mode provides 7 built-in tools for workspace interaction:

| Tool | Description | Example |
|------|-------------|---------|
| `readFile` | Read file contents | `readFile("src/App.tsx")` |
| `writeFile` | Create/update files | `writeFile("README.md", "content")` |
| `listDir` | List directory contents | `listDir("src/components")` |
| `runCommand` | Execute shell commands | `runCommand("npm test")` |
| `webFetch` | Fetch web content | `webFetch("https://api.example.com")` |
| `grepSearch` | Search files by regex | `grepSearch("TODO", "src/")` |
| `globSearch` | Find files by pattern | `globSearch("**/*.tsx")` |

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build the app |
| `npm run dist` | Build and package for distribution |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |

### Project Structure

- **State Management**: Zustand stores in `src/renderer/store/`
- **AI Providers**: Modular provider system in `src/renderer/providers/`
- **Tool Execution**: Tools run in Electron main process via IPC
- **UI Components**: Reusable components in `src/renderer/components/`

## Security

### Workspace Sandboxing

Code mode only accesses files within the selected workspace folder, providing isolation from your entire file system.

### Command Execution

The `runCommand` tool can execute arbitrary shell commands. Use with caution:
- Only grant workspace access to trusted repositories
- Review commands before execution
- Be careful with build/test commands that may have side effects

### API Keys

- API keys are stored locally using Electron's safe storage
- Consider using environment variables or secure key management for production

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- UI components powered by [React](https://reactjs.org/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)
- State management by [Zustand](https://github.com/pmndrs/zustand)
- Syntax highlighting by [Shiki](https://shiki.matsu.io/)

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/veejayts/clutchtop/issues) on GitHub.