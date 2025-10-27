# Legilimens CLI

The `@legilimens/cli` package delivers a modern, agentic command-line experience for Legilimens.
It provides an interactive setup wizard and guided workflows for generating gateway documentation
with DeepWiki integration.

## Getting Started

### First Run Setup

On first run, Legilimens launches a setup wizard to configure API keys and AI CLI tools:

```bash
pnpm --filter @legilimens/cli start
```

On first run, Legilimens automatically:
1. **Downloads llama.cpp** binary for your platform (macOS, Linux, Windows)
2. **Downloads phi-4 GGUF model** (~8.5GB, Q4 quantized) from [QuantFactory/phi-4-GGUF](https://huggingface.co/QuantFactory/phi-4-GGUF)
3. **Installs to ~/.legilimens/** (bin/ and models/)
4. **Collects Tavily API key** (required for web search and natural language dependency resolution)
5. **Optionally collects** Firecrawl, Context7, RefTools API keys

Configuration is saved to `~/.legilimens/config.json` for future runs. API keys are stored securely in your system keychain.

### Subsequent Runs

After setup, the CLI skips directly to the welcome screen:

```bash
pnpm --filter @legilimens/cli start
```

### Re-running Setup

To reconfigure your settings, delete the config file and restart:

```bash
rm ~/.legilimens/config.json
pnpm --filter @legilimens/cli start
```

Or run with the `--setup` flag (coming soon).

## AI CLI Tools

Legilimens can use installed AI CLI tools for dynamic content generation.

### Supported Tools

| Tool | Command | Installation | Command Syntax |
|------|---------|-------------|----------------|
| **gemini** | `gemini` | `npm install -g @google/generative-ai-cli` | `gemini -p "prompt"` |
| **codex** | `codex` | [OpenAI CLI](https://platform.codex.com/docs/cli) | `codex api responses.create -m gpt-4o-mini -i "prompt"` (recommended)<br/>or `codex -p "prompt"` (legacy) |
| **claude** | `claude` | [Claude Code](https://docs.anthropic.com/en/docs/claude) | `claude -p "prompt"` |
| **qwen** | `qwen` | [Qwen CLI](https://github.com/QwenLM/Qwen) | `qwen -p "prompt"` |

### Auto-Detection and Fallback

The CLI automatically detects installed tools and falls back through available options if the preferred tool fails. Tools are tried in order:
1. Preferred tool (from config or environment variable)
2. Fallback tools in configured order
3. All remaining detected tools

## Configuration

Configuration is loaded from three sources (in priority order):

### 1. Environment Variables (Highest Priority)

```bash
# API Keys
FIRECRAWL_API_KEY=your-key
CONTEXT7_API_KEY=your-key
REFTOOLS_API_KEY=your-key

# AI CLI Tool Configuration
LEGILIMENS_AI_CLI_TOOL=gemini
LEGILIMENS_AI_CLI_TIMEOUT_MS=30000
LEGILIMENS_AI_GENERATION_ENABLED=true

# Custom tool path
LEGILIMENS_AI_CLI_COMMAND_OVERRIDE=/custom/path/to/gemini

# Optional: Project directories
LEGILIMENS_ROOT=/path/to/project
LEGILIMENS_DOCS_DIR=docs
LEGILIMENS_CONSTITUTION_DIR=.specify/memory
```

### 2. User Config File (`~/.legilimens/config.json`)

Automatically created by the setup wizard. Example:

```json
{
  "aiCliTool": "gemini",
  "aiCliCommandOverride": "/custom/path/to/gemini",
  "setupCompleted": true,
  "configVersion": "1.0.0",
  "apiKeysStoredInKeychain": true,
  "_warning": "API keys are stored securely in system keychain or encrypted file. Do not commit this file to version control."
}
```

**Note**: API keys are no longer stored in the config file. They are saved securely in your system keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service) or in an encrypted file at `~/.legilimens/secrets.json` with 0o600 permissions.

### 3. Defaults

- AI generation enabled
- 30-second timeout for AI CLI tools
- Auto-detect available tools
- 60-second timeout for fetchers
- Maximum 2 retry attempts

## Non-Interactive Mode

For batch processing or CI/CD pipelines, skip the wizard by setting environment variables:

```bash
# Set required environment variables
export LEGILIMENS_AI_CLI_TOOL=gemini
export FIRECRAWL_API_KEY=your-key

# Run in minimal mode
pnpm --filter @legilimens/cli start -- --minimal
```

The wizard is automatically skipped if any API keys or AI tool configuration is detected in environment variables.

## Display Modes

### Default Mode
- Full ASCII art banner
- Color gradients and syntax highlighting
- Interactive prompts with visual feedback

### Minimal Mode
```bash
pnpm --filter @legilimens/cli start -- --minimal
```
- Plain text output
- No ASCII art or gradients
- Optimized for CI/automation

### Low-Contrast Mode
```bash
pnpm --filter @legilimens/cli start -- --low-contrast
```
- Reduced color intensity
- Compact banner
- Accessibility-focused palette

## Interactive Controls

### Welcome Screen
- **Enter**: Start guided generation flow
- **S**: Skip welcome and jump to prompts
- **Q or Esc**: Exit at any time

### Generation Flow
- **Arrow Keys**: Navigate options
- **Enter**: Confirm selection
- **Q or Esc**: Cancel and return to welcome

## Command-Line Flags

```bash
legilimens [options]
```

| Flag | Description |
|------|-------------|
| `--minimal` | Force minimal mode (plain text, no ASCII) |
| `--low-contrast` | Use low-contrast palette |
| `--help`, `-h` | Show help information |
| `--version`, `-v` | Show version information |

## Troubleshooting

### AI Tool Not Detected

**Problem**: Setup wizard shows "No AI CLI tools detected"

**Solutions**:
1. Verify installation: `which gemini` (or `codex`, `claude`, `qwen`)
2. Check PATH: Ensure tool directory is in your PATH
3. Use custom path: Provide full path in setup wizard or via `LEGILIMENS_AI_CLI_COMMAND_OVERRIDE`

### API Key Errors

**Problem**: "Missing API key" errors during generation

**Solutions**:
1. Re-run setup: Delete `~/.legilimens/config.json` and restart
2. Set environment variables directly
3. Verify `.env` file in project root (copied from `.env.example`)
4. Check keychain access: Ensure system keychain is accessible
5. Verify secrets file: Check `~/.legilimens/secrets.json` permissions (should be 0o600)

### Permission Issues

**Problem**: Cannot write to config file

**Solutions**:
1. Check permissions: `ls -la ~/.legilimens/`
2. Recreate directory: `rm -rf ~/.legilimens && mkdir ~/.legilimens`
3. Run with appropriate user permissions

### Configuration Reset

To completely reset configuration:

```bash
rm -rf ~/.legilimens
rm .env
pnpm --filter @legilimens/cli start
```

### Credential Storage Details

**System Keychain Storage**:
- **macOS**: Keys stored in Keychain Access under "legilimens-cli"
- **Windows**: Keys stored in Credential Manager under "legilimens-cli"
- **Linux**: Keys stored in Secret Service (GNOME Keyring/KDE Wallet) under "legilimens-cli"

**File Fallback**:
- Used when keychain is unavailable or inaccessible
- Stored at `~/.legilimens/secrets.json` with 0o600 permissions
- JSON format: `{"firecrawl": "key", "context7": "key", "refTools": "key"}`

**Security Notes**:
- Keys are never stored in plaintext in the main config file
- Environment variables always take precedence over stored keys
- Keys can be rotated by updating them in the setup wizard
- Use `rm -rf ~/.legilimens` to completely remove all stored credentials

## ASCII Assets

By default the CLI renders a Standard figlet banner for "Legilimens." Custom ASCII art can be provided at `docs/ascii-art.md`. The loader verifies the asset is ASCII-safe and falls back gracefully when validation fails.

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm --filter @legilimens/cli dev

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Run tests
pnpm test
```

## See Also

- [Project README](../../README.md) - Complete project overview
- [Core Package](../core/README.md) - Gateway generation engine
- [Harness Service](../harness-service/README.md) - HTTP API wrapper
- `.env.example` - Environment variable reference
