<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

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
└─ harness-service/   # Fastify parity harness (HTTP)
tests/integration/    # Cross-surface parity suite
docs/                 # Constitution, SDP, template assets
specs/001-docs-sdp-md # Active Speckit artefacts (spec/plan/tasks)
```

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
- Constitution lives at `.specify/memory/constitution.md`; DeepWiki doctrine and template rules are mandatory.
- Gateway docs must use `docs/templates/legilimens-template.md` and write to `docs/{type}/` with matching `static-backup/`.
- CLI & harness share the same core logic; feature work must flow through `@legilimens/core`.
- Performance guardrails: typical run ≤10s, absolute max 60s, with visible progress feedback; instrumentation lives in `packages/core/src/telemetry/performance.ts` and recommends minimal mode when runs stretch.
- Branding/UX must preserve modern agentic feel while offering minimal/low-contrast modes.

## Testing Expectations
- Parity test (`tests/integration/parity.spec.ts`) must stay green; expands when new scenarios added.
- CLI components should prefer `ink-testing-library` for future unit tests.
- Integration harness should use Fastify inject tests (no network binding in CI).

## Checklists & Automation
- Spec quality checklist at `specs/001-docs-sdp-md/checklists/requirements.md`.
- Tasks tracked in `specs/001-docs-sdp-md/tasks.md`; mark `[X]` as work completes.
- Implementation plans and research docs live alongside the spec for traceability.

## Technical Notes

### Repository Discovery Pipeline

The core module implements a multi-stage repository discovery pipeline for NPM packages:

1. **Direct GitHub Detection**: Checks if input is a GitHub repository pattern (org/repo)
2. **NPM Package Resolution**: For package names, uses Tavily web search to find official repository
3. **URL-Based Fallback**: For URLs, uses Firecrawl/Context7 to fetch and process documentation
4. **Static Backup**: Falls back to DeepWiki reference when all fetchers fail

Implementation: `packages/core/src/detection/detector.ts`

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

## Manual Notes
<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
