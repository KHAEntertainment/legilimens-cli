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
  - `@legilimens/core` – reusable gateway generation engine + parity helpers + AI CLI orchestration.
  - `@legilimens/cli` – Ink-powered UX wrapper with interactive + minimal flows.
  - `@legilimens/harness-service` – Fastify HTTP harness that mirrors CLI responses.
- **AI Integration**: CLI tool detection → orchestration → generation flow with fallback chains.
- **Secure Storage**: API keys stored in system keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service) with encrypted file fallback.
- **Telemetry**: Shared performance tracker enforces guardrails and recommends minimal mode when runs stretch.
- **Doctrine**: DeepWiki remains the canonical knowledge surface; static backups support planning; MCP guidance stays template-driven.

## Quickstart
```bash
pnpm install
pnpm --filter @legilimens/cli start         # Interactive walkthrough
pnpm --filter @legilimens/harness-service dev  # HTTP harness for parity checks
pnpm typecheck && pnpm lint                 # Validate TypeScript + linting
pnpm test:integration                       # Ensure CLI and harness stay in sync
```

### Optional: AI CLI Tool Setup
Legilimens can harness installed AI CLI tools for dynamic content generation. Supported tools:
- **gemini**: `npm install -g @google/generative-ai-cli`
- **codex**: Install via [OpenAI CLI](https://platform.openai.com/docs/cli)
- **claude**: Install via [Claude Code](https://docs.anthropic.com/en/docs/claude-code)
- **qwen**: Install via [Qwen CLI](https://github.com/QwenLM/Qwen)

On first run, the CLI will guide you through a setup wizard to configure API keys and AI tool preferences. Configuration is saved to `~/.legilimens/config.json` (cross-platform home directory detection).

Alternatively, configure your preferred tool in `.env`:
```bash
LEGILIMENS_AI_CLI_TOOL=gemini
LEGILIMENS_AI_CLI_TIMEOUT_MS=120000
LEGILIMENS_AI_GENERATION_ENABLED=true

# Optional: Use a custom path if tool is not on PATH
LEGILIMENS_AI_CLI_COMMAND_OVERRIDE=/custom/path/to/gemini
```

**Command Override Behavior**: If `LEGILIMENS_AI_CLI_COMMAND_OVERRIDE` is set along with `LEGILIMENS_AI_CLI_TOOL`, the preferred tool will be attempted using the custom path even if it's not detected on your system PATH. This allows using non-standard installation locations.

**CLI Adapter Strategy**: Each supported CLI tool uses a multi-strategy approach for maximum compatibility:
1. **File-arg strategy** (default): Passes prompt via temp file (e.g., `gemini -p /tmp/file.txt`)
2. **Stdin strategy** (fallback): Passes prompt via stdin (e.g., `gemini -p -`)

If the first strategy fails with an "unknown option" or "invalid flag" error, the adapter automatically retries with the next strategy. This ensures compatibility across different CLI versions without manual configuration.

**Default Commands by Tool**:
- **gemini**: `gemini -p <file>` or `gemini -p -`
- **codex**: `codex api responses.create -m gpt-4o-mini -i <input>` (Responses API, recommended) or `codex -p <file>` (legacy Completions API)
- **claude**: `claude -p <prompt>` or `claude --print <prompt>` (headless mode)
- **qwen**: `qwen -p <file>` or `qwen -p -`

These defaults can be overridden programmatically via the `argOverrides` configuration option if needed for specific use cases.

**Note**: API keys must be configured per each tool's documentation (not managed by Legilimens). If no AI tool is available, the system falls back gracefully to static content generation.

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