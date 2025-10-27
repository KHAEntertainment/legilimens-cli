# Legilimens CLI

Legilimens is a modern agentic CLI that automates gateway documentation generation while
keeping DeepWiki front-and-center for active coding workflows. The tool runs as a polished
Ink experience, ships as a TypeScript workspace, and reuses a shared core module so future
web adapters can share the same brain.

## Why It Exists
- Preserve context windows by generating lightweight gateway docs that point back to DeepWiki.
- Run consistent template-driven outputs across CLI and service harness surfaces.
- Offer a welcoming launch flow with ASCII branding that gracefully falls back to minimal mode.
- Keep operational guardrails visible: typical runs aim for ≤10s, hard stop at 60s.

## Architecture Highlights
- **Workspace**: pnpm-managed TypeScript monorepo targeting Node.js 20 LTS.
- **Cross-Platform**: Fully compatible with macOS, Linux, Windows, and WSL using cross-platform Node.js APIs.
- **Packages**:
  - `@legilimens/core` – reusable gateway generation engine + local LLM orchestration + Tavily search + parity helpers.
  - `@legilimens/cli` – Clack-powered modern TUI with wizard-driven config + interactive flows.
  - `@legilimens/harness-service` – Fastify HTTP harness that mirrors CLI responses.
- **AI Integration**: Local llama.cpp (phi-4 GGUF) + Tavily web search for natural language resolution; Firecrawl/Context7/Ref as REST tools.
- **Secure Storage**: API keys stored in system keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service) with encrypted file fallback.
- **Telemetry**: Shared performance tracker enforces guardrails and recommends minimal mode when runs stretch.
- **Doctrine**: DeepWiki remains the canonical knowledge surface; static backups support planning; MCP guidance stays template-driven.

## ✅ Current Status

**CLI Foundation: FULLY FUNCTIONAL** as of commit `99932db`

- ✅ Setup wizard works correctly (no forced re-runs)
- ✅ AI provider detection working (Local LLM + Tavily)
- ✅ Configuration persistence across sessions
- ✅ Binary and model detection robust
- ✅ Environment loading from secure storage

See [WORKING_CLI_SETUP.md](WORKING_CLI_SETUP.md) for detailed configuration and test results.

## Quickstart

For a complete walkthrough, see [docs/quickstart.md](docs/quickstart.md).

```bash
pnpm install
pnpm --filter @legilimens/cli start         # Interactive Clack-based CLI
pnpm --filter @legilimens/harness-service dev  # HTTP harness for parity checks
pnpm typecheck && pnpm lint                 # Validate TypeScript + linting
pnpm test:integration                       # Ensure CLI and harness stay in sync
```

## Terminal Experience

Legilimens uses a full-screen TUI (Text User Interface) similar to vim, less, or claude-code:
- **Clears the screen** on startup for a clean workspace
- **Preserves terminal history** using alternate screen buffer
- **Restores previous terminal state** when you exit
- **Graceful cleanup** on errors or interrupts (Ctrl+C)
- **Requires interactive terminal (TTY)** - won't work when output is piped or in CI/CD

To disable this behavior (useful for debugging or scripting):
```bash
export LEGILIMENS_DISABLE_TUI=true
legilimens
```

**Note**: The CLI requires a real terminal (TTY) to run the interactive menu. If you see "TTY initialization failed", make sure you're running directly in your terminal, not through a pipe or non-interactive environment.

### First Run: Automatic Setup

On first run, Legilimens automatically:
1. Detects existing llama.cpp installations (if any)
2. Downloads llama.cpp binary for your platform (if needed)
3. Downloads phi-4 GGUF model (~8.5GB, Q4 quantized) (if needed)
4. Installs everything to `~/.legilimens/` (if not using existing)

**No manual installation required.**

### Setup Wizard

The intelligent setup wizard:
- **Detects existing configuration**: Shows what's already configured and only prompts for missing items
- **Reuses existing installations**: Automatically finds llama.cpp installations in common locations
- **Pre-fills API keys**: Shows stored keys and lets you keep or update them
- **Smart validation**: Only requires Tavily key; other API keys are optional

To skip the wizard entirely, set `LEGILIMENS_SKIP_SETUP=true` and provide required environment variables.

#### Get Tavily API Key (Required)
Sign up at [tavily.com](https://tavily.com) and get your API key (free tier available). This enables web search for natural language dependency resolution.

#### Run Setup Wizard
```bash
pnpm --filter @legilimens/cli start
# Or force re-setup: pnpm --filter @legilimens/cli start --setup
```

The wizard will:
1. Auto-install llama.cpp + phi-4 model to `~/.legilimens/` (first run only)
2. Prompt for Tavily API key (required)
3. Optionally collect Firecrawl, Context7, RefTools API keys
4. Save configuration to `~/.legilimens/config.json`
5. Store API keys securely in system keychain

**Platform Support**: Automatic downloads for macOS (ARM64/x64), Linux (x64), Windows (x64). Model reference: [QuantFactory/phi-4-GGUF](https://huggingface.co/QuantFactory/phi-4-GGUF)

### Optional: Manual Configuration (Dev Mode)
For development, you can use environment variables (though the wizard is recommended):
```bash
LEGILIMENS_LOCAL_LLM_ENABLED=true
LEGILIMENS_LOCAL_LLM_BIN=/usr/local/bin/main
LEGILIMENS_LOCAL_LLM_MODEL=~/models/phi-4-q4.gguf
TAVILY_ENABLED=true
TAVILY_API_KEY=tvly-...
FIRECRAWL_API_KEY=fc-...  # optional
CONTEXT7_API_KEY=...      # optional
REFTOOLS_API_KEY=...      # optional
```

### Reusing Existing llama.cpp Installation

If you already have llama.cpp installed, Legilimens will detect it automatically in these locations:
- `/usr/local/bin/llama-cli` or `/usr/local/bin/main` (Homebrew on macOS/Linux)
- `/opt/homebrew/bin/llama-cli` or `/opt/homebrew/bin/main` (Homebrew on Apple Silicon)
- `~/llama.cpp/main` or `~/llama.cpp/build/bin/main` (Manual builds)
- `C:\Program Files\llama.cpp\main.exe` (Windows)

You can also point to a specific installation:

```bash
export LEGILIMENS_LOCAL_LLM_BIN=/path/to/your/llama-cpp/main
export LEGILIMENS_LOCAL_LLM_MODEL=/path/to/your/phi-4.gguf
export LEGILIMENS_LOCAL_LLM_ENABLED=true
```

The wizard will detect these paths and skip downloading.

### Configuration Storage

- **API Keys**: Stored securely in system keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service) or encrypted file (`~/.legilimens/secrets.json`) as fallback
- **Settings**: Stored in `~/.legilimens/config.json`
- **Smart Updates**: The wizard remembers previous configuration and only prompts for missing items

To manually edit configuration:
```bash
# Edit config file
nano ~/.legilimens/config.json

# View stored keys (if using file storage)
cat ~/.legilimens/secrets.json  # Note: Keys are in plaintext if keychain unavailable
```

## Platform Support

Legilimens CLI is fully cross-platform compatible:

- **macOS**: Native support with Keychain Access integration
- **Linux**: Full support with Secret Service integration (GNOME Keyring/KDE Wallet)
- **Windows**: Native support with Credential Manager integration
- **WSL**: Full Linux compatibility within Windows Subsystem for Linux

### Requirements
- Node.js 20 LTS or newer
- No platform-specific dependencies or native compilation required
- Cross-platform terminal support (ANSI colors with graceful fallback)

### Credential Storage
API keys are stored securely using the platform's native credential store:
- **macOS**: Keychain Access (`legilimens-cli` service)
- **Windows**: Credential Manager (`legilimens-cli` service)
- **Linux**: Secret Service (`legilimens-cli` service)
- **Fallback**: Encrypted local file (`~/.legilimens/secrets.json`) with restrictive permissions

## Troubleshooting

### Wizard Issues
- **Wizard keeps asking for API keys**: This happens when keytar is not installed or keys aren't properly stored. Check if keytar is installed: `pnpm list keytar`. If missing, run `pnpm install` in the repo.
- **Wizard re-downloads llama.cpp**: Set `LEGILIMENS_LOCAL_LLM_BIN` and `LEGILIMENS_LOCAL_LLM_MODEL` environment variables to point to your existing installation.
- **Skip setup entirely**: Set `LEGILIMENS_SKIP_SETUP=true` and provide all required environment variables.

### Runtime Issues
- **AI generation fails with "I am sorry" error**: External CLI tools handled the request and returned prose. Re-run the setup wizard (`pnpm --filter @legilimens/cli start --setup`) so the local LLM becomes the primary engine, then verify `LEGILIMENS_LOCAL_LLM_ENABLED=true` and related environment variables.
- **Local LLM not found**: The llama.cpp binary or GGUF model path is missing. Check `~/.legilimens/config.json` and ensure `LEGILIMENS_LOCAL_LLM_BIN` and `LEGILIMENS_LOCAL_LLM_MODEL` reference valid files on disk.
- **Template not found**: The CLI was launched outside the workspace root. Start the generator from the `doc-gateway-cli/` directory or pass an absolute path to `docs/templates/legilimens-template.md`.
- **Tavily search fails**: The Tavily API key is invalid or absent. Re-run the setup wizard and confirm `TAVILY_API_KEY` is exported in the current shell session.

### Environment Variables Reference

All supported environment variables for bypassing or configuring the wizard:

| Variable | Description | Required |
|----------|-------------|----------|
| `LEGILIMENS_SKIP_SETUP` | Skip setup wizard entirely (`true`/`false`) | No |
| `LEGILIMENS_LOCAL_LLM_ENABLED` | Enable local LLM (`true`/`false`) | No |
| `LEGILIMENS_LOCAL_LLM_BIN` | Path to llama.cpp binary | When LLM enabled |
| `LEGILIMENS_LOCAL_LLM_MODEL` | Path to phi-4 GGUF model | When LLM enabled |
| `TAVILY_API_KEY` | Tavily API key for web search | Yes |
| `FIRECRAWL_API_KEY` | Firecrawl API key (optional) | No |
| `CONTEXT7_API_KEY` | Context7 API key (optional) | No |
| `REFTOOLS_API_KEY` | RefTools API key (optional) | No |
| `LEGILIMENS_DEBUG` | Enable debug logging (`true`/`false`) | No |
| `LEGILIMENS_DISABLE_TUI` | Disable full-screen TUI mode (`true`/`false`) | No |

## Batch Processing

Process multiple dependencies at once using a JSON file:

```bash
pnpm --filter @legilimens/cli start --batch ./batch.json
```

### Batch JSON Schema

```json
{
  "dependencies": [
    { "input": "vercel/ai" },
    { "input": "lodash" },
    { "input": "https://stripe.com/docs" }
  ]
}
```

### Batch Processing Behavior

- **Progress indicators**: Shows current item and overall progress
- **Failure handling**: Failed items are logged and reported at the end
- **Parallel execution**: Items processed sequentially with shared progress bar
- **Output format**: Same gateway docs as interactive mode

### Example Batch File

```json
{
  "dependencies": [
    { "input": "vercel/ai", "description": "GitHub repo" },
    { "input": "lodash", "description": "NPM package" },
    { "input": "https://stripe.com/docs", "description": "URL docs" },
    { "input": "refine-dev/refine", "description": "Framework" }
  ]
}
```

**Note**: The `description` field is optional and for documentation only.

## MCP Tool Guidance

The system automatically determines the appropriate MCP tool based on dependency type:
- **GitHub repositories**: DeepWiki URLs are automatically derived (e.g., `vercel/ai` → `https://deepwiki.com/vercel/ai`)
- **NPM packages**: Context7 is used for package documentation
- **URLs**: Firecrawl is used for web-based documentation
- **Unknown sources**: Static backup serves as primary reference

Users only need to provide the dependency identifier (e.g., 'vercel/ai', 'lodash', 'https://stripe.com/docs') and the system automatically determines the appropriate MCP tool and reference URL. The constitution at `.specify/memory/constitution.md` governs template fidelity and terminology.

## Reference Docs
- `docs/sdp.md` – Product narrative, technical stack, and governance context.
- `AGENTS.md` – Operational handbook for agents collaborating on Legilimens.

