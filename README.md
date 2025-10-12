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

## Quickstart
```bash
pnpm install
pnpm --filter @legilimens/cli start         # Interactive Clack-based CLI
pnpm --filter @legilimens/harness-service dev  # HTTP harness for parity checks
pnpm typecheck && pnpm lint                 # Validate TypeScript + linting
pnpm test:integration                       # Ensure CLI and harness stay in sync
```

### First Run: Automatic Setup

On first run, Legilimens automatically:
1. Downloads llama.cpp binary for your platform
2. Downloads phi-4 GGUF model (~8.5GB, Q4 quantized)
3. Installs everything to `~/.legilimens/`

**No manual installation required.**

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
- `specs/001-docs-sdp-md/` – Active specification, plan, tasks, and research history.
- `.specify/memory/constitution.md` – Governing principles, version history, and amendment log.


Recommended Testing Order
pnpm typecheck
pnpm lint
pnpm test
pnpm test:integration
cl --help
pnpm start:cli --setup



The setup wizard UI/Experiecne seems like it got toned/down and simplified to bare minimum compared to the actual CLI.

API Key Configuration Pane: Needs clearer instructions. Put the "use tab/shift...." above the 

Where are these keys being stored? I hope we're using Keytar to store them securely in the systems secrets store. 

The final step of the CLI seems to be mocked and incomplete....


'''
[✓] Collecting session input — Interactive prompts 
captured successfully.
[!] Validating template location — Template 
validation failed: Template path
"/Users/bbrenner/Documents/Scripting
Projects/doc-gateway-cli/packages/cli/docs/template
s/legilimens-template.md" is not readable: ENOENT:
no such file or directory, access
'/Users/bbrenner/Documents/Scripting
Projects/doc-gateway-cli/packages/cli/docs/template
s/legilimens-template.md'
[!] Generating gateway documentation — Template 
validation failed: Template path
"/Users/bbrenner/Documents/Scripting
Projects/doc-gateway-cli/packages/cli/docs/template
s/legilimens-template.md" is not readable: ENOENT:
no such file or directory, access
'/Users/bbrenner/Documents/Scripting
Projects/doc-gateway-cli/packages/cli/docs/template
s/legilimens-template.md'
[!] Summarizing results — Generation halted before 
completion; see error details.


Generation summary

Core generation is not yet implemented. The shared 
module stub returned:

Template validation failed: Template path 
"/Users/bbrenner/Documents/Scripting 
Projects/doc-gateway-cli/packages/cli/docs/template
s/legilimens-template.md" is not readable: ENOENT: 
no such file or directory, access 
'/Users/bbrenner/Documents/Scripting 
Projects/doc-gateway-cli/packages/cli/docs/template
s/legilimens-template.md'

Use this as a planning preview. Once the shared 
module is complete, rerun to produce real
artifacts.
'''

At the end, the CLI shouldn't auto terminate, it should ask the user if they want to start over (process another entry) or quit but that's less important than actually delivering the output that the previous step skips entirely.