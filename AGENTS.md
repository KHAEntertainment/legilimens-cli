# Legilimens Agent Handbook

Central reference for any AI agent working on the Legilimens CLI workspace.

## Canonical Stack
- Node.js 20 LTS (enforced by constitution)
- TypeScript 5.x (ESM, pnpm workspaces)
- UI Runtime: `ink`, `@clack/prompts`, `commander`, `chalk`, `gradient-string`, `ora`, `figlet`, `ink-select-input`, `ink-text-input`
  - **Clack**: Modern prompts library for setup wizard and interactive flows
  - **Ink**: React-based TUI components for progress indicators and completion summaries
  - **Terminal Manager**: Alternate screen buffer for full-screen TUI mode (can be disabled via `LEGILIMENS_DISABLE_TUI`)
- Shared Library: `@legilimens/core` (business logic, parity utilities)
- Service Harness: Fastify (`@legilimens/harness-service`)

## Workspace Layout
```
packages/
├─ core/              # Shared gateway engine + parity helpers
├─ cli/               # Ink-powered UX wrapper (bin/legilimens)
├─ harness-service/   # Fastify parity harness (HTTP)
├─ hive-docs/         # git submodule — wiki-style doc management (standalone repo)
├─ graphrag/          # git submodule — GraphRAG with SQLite-vec (standalone repo)
tests/integration/    # Cross-surface parity suite
docs/                 # Constitution, SDP, template assets
.resources/           # Monorepo references (symlinked, read-only)
```

## Git Submodules

`packages/hive-docs` and `packages/graphrag` are git submodules pointing to their
own remote repos. Each continues independent development in its original location.

| Action | Command |
|--------|---------|
| Check submodule status | `git submodule status` |
| Update to latest main | `git submodule update --remote packages/<name>` |
| Update all submodules | `git submodule update --remote` |
| Initialize after fresh clone | `git submodule update --init --recursive` |
| Freeze a submodule | Don't run `update --remote` — stays pinned at current commit |
| Commit submodule pin | After updating: `git add packages/<name> && git commit` |

**Important**: Edits to submodule code should happen in the original standalone repos,
not inside `packages/`. The submodule is a read reference for integration work.

## 📦 Monorepo Structure - IMPORTANT

**Reference Directory:** `.resources/`

This repository now contains a **read-only reference** to the GraphRAG-with-SQLite-Vec system for integration planning.

### .resources/graphrag-system/ (Symlink)

**Target:** `/Users/bbrenner/Documents/Scripting Projects/graphrag-with-sqlite_vec`
**Purpose:** Reference for Phase 3 GraphRAG integration planning (Q1 2026)
**Status:** **READ-ONLY** - DO NOT MODIFY

### Critical Rules for .resources/

**❌ DO NOT:**
- Modify any files in `.resources/` or symlinked directories
- Create new files in symlinked projects
- Run git commands from within `.resources/`
- Execute build/test/install commands in symlinked projects

**✅ DO:**
- Read documentation and source code for reference
- Cross-check integration plans with GraphRAG specifications
- Reference architecture decisions in your work
- Cite source files in comments (e.g., "See .resources/graphrag-system/CONSTITUTION.md")

**For detailed usage instructions:** See `.resources/AGENTS.md`

### Phase 3 Integration (Q1 2026)

GraphRAG will be integrated as `@legilimens/graphrag` workspace package:
- **Planning:** `docs/PHASE-3-GRAPHRAG-INTEGRATION-PLAN.md` (10-week roadmap)
- **Active work:** `packages/graphrag/` (future, Phase 3b)
- **Reference:** `.resources/graphrag-system/` (read-only, for planning)

**Integration approach:** Copy/adapt code from reference to `packages/graphrag/`, never modify `.resources/`

## Required Tooling
- `pnpm` (Corepack-managed, workspace root `pnpm-workspace.yaml`)
- `vitest` for unit/integration tests
- `eslint` + `typescript-eslint` (project references required)
- `tsx` dev runner for CLI/harness scripts

## Quick Start

For first-time users, see [docs/quickstart.md](docs/quickstart.md) for a complete walkthrough.

## Common Commands
```bash
pnpm install                            # Bootstrap workspace
pnpm --filter @legilimens/cli start     # Launch interactive CLI
pnpm --filter @legilimens/harness-service dev  # Run parity harness
pnpm typecheck                          # Repo-wide TS checks
pnpm test                               # All test suites (unit + integration)
pnpm test:integration                   # Vitest integration/parity suite
pnpm lint                               # ESLint (requires parserOptions.project)
```

## Governance & Non-Negotiables
- Gateway docs must use `docs/templates/legilimens-template.md` and write to `docs/{type}/` with matching `static-backup/`.
- CLI & harness share the same core logic; feature work must flow through `@legilimens/core`.
- Performance guardrails: typical run ≤10s, absolute max 60s, with visible progress feedback; instrumentation lives in `packages/core/src/telemetry/performance.ts` and recommends minimal mode when runs stretch.
- Branding/UX must preserve modern agentic feel while offering minimal/low-contrast modes.

## Testing Expectations
- Parity test (`tests/integration/parity.spec.ts`) must stay green; expands when new scenarios added.
- CLI components should prefer `ink-testing-library` for future unit tests.
- Integration harness should use Fastify inject tests (no network binding in CI).
- **TUI verification** must use `agent-tui` for visual confirmation of interactive flows (see below).

## TUI Testing with agent-tui

`agent-tui` (v1.0.1, installed at `/opt/homebrew/bin/agent-tui`) provides virtual PTY emulation for programmatic TUI testing — like Playwright for terminals. It captures screenshots, injects keyboard/text input, and supports wait conditions.

### When Required

- After modifying `clackWizard.ts`, `clackGenerationFlow.ts`, or `clackApp.ts`
- After any TUI layout, prompt, or banner changes
- When validating API key masking, minimal mode, or backend selection UI
- Regression checks after refactors that touch interactive flows

### Core Workflow

```bash
# 1. Start daemon (required once per session)
agent-tui daemon start

# 2. Run Legilimens in a virtual PTY
agent-tui run -- npx tsx packages/cli/bin/legilimens.ts

# 3. Capture screenshot (text or JSON)
agent-tui screenshot                # Human-readable text output
agent-tui screenshot --json         # JSON for assertions

# 4. Interact
agent-tui type "react"              # Type text
agent-tui press Enter               # Press keys
agent-tui press Down Enter          # Navigate menus
agent-tui wait "Configure"          # Wait for text to appear

# 5. Cleanup
agent-tui kill                      # Kill the running session
agent-tui daemon stop               # Stop daemon
```

### Test Patterns

**Setup wizard verification:**
```bash
agent-tui daemon start
agent-tui run -- npx tsx packages/cli/bin/legilimens.ts --setup
agent-tui screenshot  # Verify intro banner and status
agent-tui wait "Local LLM"
agent-tui screenshot  # Verify backend selection
agent-tui kill
agent-tui daemon stop
```

**Generation flow verification:**
```bash
agent-tui daemon start
agent-tui run -- npx tsx packages/cli/bin/legilimens.ts
agent-tui wait "What would you like to do?"
agent-tui press Down Enter  # Select "Generate"
agent-tui wait "dependency"
agent-tui type "react"
agent-tui press Enter
agent-tui screenshot  # Verify detection step
agent-tui kill
agent-tui daemon stop
```

**JSON output for assertions:**
```bash
agent-tui screenshot --json | jq '.screenshot'  # Extract screen text
```

### Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `AGENT_TUI_SOCKET` | IPC socket path | `~/.agent-tui/daemon.sock` |
| `AGENT_TUI_LOG` | Log file path | disabled |
| `AGENT_TUI_DETACH_KEYS` | Detach sequence | `Ctrl-P Ctrl-Q` |

### Reference

- Repository: https://github.com/pproenca/agent-tui
- Full CLI docs: `docs/cli/agent-tui.md` (in agent-tui repo)

## Checklists & Automation
- Implementation plans and research docs live alongside the spec for traceability.

## Technical Notes

### Repository Discovery Pipeline

The core module implements a **Tavily-first** discovery pipeline optimized for speed and reliability:

**Search Strategy** (`packages/core/src/ai/webSearch.ts`):
- **Domain Filtering**: Forces results from `github.com` and `context7.com` only
- **Developer-Focused Query**: `"${packageName} official GitHub repository and developer documentation"`
- **Tavily Answer Extraction**: Parses GitHub owner/repo from Tavily's LLM-generated answer
- **Result**: 100% relevant sources, 80% faster than generic search

**Discovery Flow** (`packages/core/src/ai/repositoryDiscoveryPipeline.ts`):
1. **Tavily Search**: Domain-filtered search with developer-focused query
2. **Direct Path** (80% of cases): High-confidence GitHub result (score > 0.75) → skip LLM, return immediately
3. **Suggested Identifier**: Use Tavily's extracted GitHub owner/repo → skip LLM
4. **LLM Interpretation**: Ambiguous results only → consult local LLM with schema validation
5. **Fallback Chain**: LLM fails → use Tavily's top result anyway
6. **Unknown**: No Tavily results → return unknown

**Schema Validation** (`packages/core/src/ai/schemas.ts`):
- Zod schemas for `DiscoveryResult` and `ToolCall` validation
- Optional schema parameter for LLM runner
- Schema hints embedded in prompts for better LLM guidance
- Type-safe validation with detailed error messages

**Performance Impact**:
- **Before**: All searches required LLM (5-10s), frequent "Invalid JSON" errors
- **After**: 80% skip LLM entirely (<2s), robust fallback prevents failures
- **Example**: "CoPilotKit" → GitHub repo #1 (0.7809 score) in 1.5s without LLM

### Terminal Manager

The CLI uses an alternate screen buffer for full-screen TUI mode:

- **Enabled by default**: Provides clean, immersive experience similar to vim/less
- **Preserves terminal history**: Your previous terminal content is restored on exit
- **Graceful cleanup**: Handles errors and Ctrl+C interrupts properly
- **Can be disabled**: Set `LEGILIMENS_DISABLE_TUI=true` for debugging or CI pipelines

Implementation: `packages/cli/src/clackApp.ts`

### Credential Storage Architecture

API keys are stored using a three-tier fallback system:

1. **System Keychain** (preferred): Platform-native credential storage
   - macOS: Keychain Access
   - Windows: Credential Manager
   - Linux: Secret Service (GNOME Keyring/KDE Wallet)
2. **Encrypted File** (automatic fallback): `~/.legilimens/secrets.json` with 0600 permissions
3. **Environment Variables** (highest precedence): Override stored credentials

Implementation: `packages/cli/src/config/secrets.ts`

### CLI Configuration System

The CLI uses a three-layer configuration architecture that combines persistent storage, secure credentials, and runtime environment variables:

**Configuration Flow:**
1. **Persistent Config** (`~/.legilimens/config.json`): Stores user preferences, setup state, and local LLM paths
2. **Secure Storage**: API keys stored in system keychain or encrypted file
3. **Environment Variables**: Runtime population from both sources via `loadCliEnvironment()`

**Setup Wizard Detection:**
The wizard runs when `isSetupRequired()` returns true, which checks:
- `setupCompleted` flag in config.json
- Presence of at least one AI provider (Local LLM or API keys)
- Valid local LLM installation (binary + model paths)

**Local LLM Integration:**
- Binary and model paths stored in `config.localLlm` section
- Recursive search for llama.cpp installation in `~/.legilimens/bin/`
- Automatic detection prevents duplicate downloads
- Timer initialization fixed to prevent crashes on first run

**Environment Loading Sequence:**
1. CLI startup calls `loadCliEnvironment()` before any flows
2. Loads Tavily/Firecrawl/Context7 keys from secure storage into `process.env`
3. Populates `LEGILIMENS_LOCAL_LLM_*` variables from config.json
4. Runtime config auto-enables providers when credentials exist

**Key Files:**
- `packages/cli/src/config/userConfig.ts` - Configuration persistence and loading
- `packages/cli/src/config/env.ts` - Environment variable population
- `packages/cli/src/utils/llamaInstaller.ts` - Local LLM detection and installation
- `packages/core/src/config/runtimeConfig.ts` - Provider auto-detection logic

**Troubleshooting Reference:**
See `WORKING_CLI_SETUP.md` for detailed configuration status, common issues, and resolution steps.

## Manual Notes
<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** (authorized implementation sessions only):
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches (if applicable)
6. **Verify** - All changes committed AND pushed (if authorized)
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**

**For authorized implementation sessions (with write permissions):**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

**For review-only and read-only sessions:**
- Remote write steps (git push) do NOT apply
- Focus on analysis, documentation, and creating issues for follow-up
- Commits may be made locally but are not required to be pushed