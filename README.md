# Legilimens CLI

Legilimens generates lightweight dependency documentation from detected repositories,
package registries, and web sources. It runs as a polished Clack-based TUI, ships as
a TypeScript monorepo, and keeps DeepWiki as the canonical knowledge surface.

## Why It Exists
- Preserve context windows by generating gateway docs that point back to DeepWiki.
- Run consistent template-driven outputs across CLI and service harness surfaces.
- Offer a welcoming launch flow with ASCII branding that gracefully falls back to minimal mode.
- Keep operational guardrails visible: typical runs aim for ≤10s, hard stop at 60s.

## Architecture
- **Workspace**: pnpm-managed TypeScript monorepo targeting Node.js 20 LTS.
- **Cross-Platform**: macOS, Linux, Windows, WSL via cross-platform Node.js APIs.
- **Packages**:
  - `@legilimens/core` – reusable gateway generation engine + local LLM orchestration + Tavily search + parity helpers.
  - `@legilimens/cli` – Clack-powered TUI with wizard-driven config + interactive flows.
  - `@legilimens/harness-service` – Fastify HTTP harness that mirrors CLI responses.
- **AI Integration**: Local llama.cpp (preferred) or Docker Model Runner + Tavily web search; Firecrawl/Context7/RefTools as REST tools.
- **Secure Storage**: API keys in system keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service) with encrypted file fallback.

## Quickstart

```bash
pnpm install
pnpm --filter @legilimens/cli start         # Interactive Clack-based CLI
pnpm --filter @legilimens/harness-service dev  # HTTP harness for parity checks
pnpm typecheck && pnpm lint                 # Validate TypeScript + linting
pnpm test:integration                       # CLI ↔ harness parity tests
```

## Terminal Experience

Legilimens uses a full-screen TUI with alternate screen buffer:
- Clears screen on startup, restores terminal state on exit
- Graceful cleanup on errors or interrupts (Ctrl+C)
- Requires interactive terminal (TTY)

To disable full-screen mode:
```bash
export LEGILIMENS_DISABLE_TUI=true
```

### First Run: Automatic Setup

On first run, Legilimens:
1. Detects existing llama.cpp installations
2. Downloads llama.cpp binary for your platform (if needed)
3. Downloads phi-4 GGUF model (~8.5GB, Q4 quantized) (if needed)
4. Installs to `~/.legilimens/`

### Setup Wizard

The wizard:
- Detects existing configuration and only prompts for missing items
- Reuses existing llama.cpp installations
- Pre-fills and masks API keys
- Requires Tavily key; other keys are optional

```bash
pnpm --filter @legilimens/cli start
# Force re-setup: pnpm --filter @legilimens/cli start --setup
```

### Minimal Mode

Minimal mode produces plain-text, ANSI-free output. Controlled at startup only
(no mid-flow prompt):

| Source | Example |
|--------|---------|
| `--minimal` flag | `legilimens --minimal` |
| `LEGILIMENS_MODE=minimal` | `export LEGILIMENS_MODE=minimal` |
| `LEGILIMENS_MINIMAL_MODE=true` | `export LEGILIMENS_MINIMAL_MODE=true` |

## Generation Flow

1. **Enter dependency identifier** — natural language, package name, GitHub `owner/repo`, or URL
2. **AI source detection** — resolves source type with Context7, Tavily, or manual fallback
3. **Source confirmation** — review detected source, override if incorrect
4. **Fetch & generate** — documentation fetched and gateway doc written to `docs/`

### Batch Mode

Process multiple dependencies interactively or non-interactively:

```bash
# Interactive batch (select "Generate from batch input" from menu)
pnpm --filter @legilimens/cli start

# Non-interactive batch
LEGILIMENS_NON_INTERACTIVE=true LEGILIMENS_BATCH_INPUT="react,express,next" legilimens
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TAVILY_API_KEY` | Tavily API key for web search | Yes |
| `LEGILIMENS_LOCAL_LLM_ENABLED` | Enable local LLM (`true`/`false`) | No |
| `LEGILIMENS_LOCAL_LLM_BIN` | Path to llama.cpp binary | When LLM enabled |
| `LEGILIMENS_LOCAL_LLM_MODEL` | Path to GGUF model | When LLM enabled |
| `LEGILIMENS_MODE` | `minimal` or `default` | No |
| `LEGILIMENS_MINIMAL_MODE` | Force minimal mode (`true`/`false`) | No |
| `LEGILIMENS_DISABLE_TUI` | Disable full-screen TUI (`true`/`false`) | No |
| `LEGILIMENS_DEBUG` | Enable debug logging (`true`/`false`) | No |
| `LEGILIMENS_NON_INTERACTIVE` | Non-interactive mode (`true`/`false`) | No |
| `LEGILIMENS_BATCH_INPUT` | Comma-separated deps or `@file.json` for batch | No |
| `FIRECRAWL_API_KEY` | Firecrawl API key (optional) | No |
| `CONTEXT7_API_KEY` | Context7 API key (optional) | No |
| `REFTOOLS_API_KEY` | RefTools API key (optional) | No |

## Configuration Storage

- **API Keys**: System keychain or encrypted file (`~/.legilimens/secrets.json`)
- **Settings**: `~/.legilimens/config.json`
- The wizard remembers previous configuration and only prompts for missing items

## MCP Tool Guidance

The system automatically routes dependencies to the right tool:
- **GitHub repos** → DeepWiki URLs (e.g., `vercel/ai` → `deepwiki.com/vercel/ai`)
- **NPM packages** → Context7
- **URLs** → Firecrawl
- **Unknown sources** → Static backup

## Contributing

See the [Maintenance Guide](docs/MAINTENANCE.md) for protected files and cleanup procedures.

## Reference Docs
- `docs/sdp.md` – Product narrative, technical stack, governance context
- `AGENTS.md` – Operational handbook for agents collaborating on Legilimens
- `docs/archive/` – Historical migration and resync snapshots