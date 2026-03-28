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

`CLAUDE.md` is the primary entry point. This file is the longer technical companion for repo-specific rules, testing expectations, and architecture notes that are easy to forget during implementation.

## Canonical Stack

- Node.js 20 LTS
- TypeScript 5.x, ESM, pnpm workspaces
- CLI UX: `@clack/prompts`, `chalk`, `commander`, `figlet`, `gradient-string`, `ora`
- Shared logic: `@legilimens/core`
- Harness: Fastify in `@legilimens/harness-service`

## Workspace Layout

```text
packages/
  core/              shared gateway engine, detection, fetchers, AI helpers
  cli/               Clack-based UX, setup wizard, batch flows, config + secrets
  harness-service/   HTTP parity surface
tests/integration/   parity and smoke coverage
docs/                templates, guides, generated outputs, screenshots
openspec/            change proposal workflow
specs/               legacy Speckit artifacts kept for traceability
.resources/          read-only GraphRAG reference material
```

## Source of Truth Rules

- Prefer current code and tests over historical planning docs when they disagree.
- `CLAUDE.md` should stay concise and current; `AGENTS.md` can hold the deeper operational notes.
- Existing docs like `docs/archive/LINEAR_MIGRATION_SUMMARY_2026-03-28.md` and `docs/guides/WORKING_CLI_SETUP.md` may describe a moment-in-time state, not the latest reality.
- `.resources/` is reference-only. Never edit files there or run build/test/install commands inside referenced projects.

## Local LLM Architecture

The repo currently supports two local LLM modes:

- DMR mode: `modelName` + `apiEndpoint`
- Native `llama.cpp` mode: `binaryPath` + `modelPath`

Key files:

- `packages/core/src/config/runtimeConfig.ts`
- `packages/core/src/ai/localLlmRunner.ts`
- `packages/cli/src/wizard/clackWizard.ts`
- `packages/cli/src/utils/llamaInstaller.ts`
- `packages/cli/src/utils/dmrInstaller.ts`

When checking local-LLM behavior, verify both config detection and the runtime execution path.

## TUI and Batch Flows

Relevant files:

- `packages/cli/src/clackApp.ts`
- `packages/cli/src/flows/clackGenerationFlow.ts`
- `packages/cli/src/flows/clackBatchGenerationFlow.ts`
- `packages/cli/src/wizard/clackWizard.ts`

Current code already includes:

- Source confirmation and override before fetch
- Interactive batch generation
- Non-interactive batch execution via environment variables
- API key masking in setup prompts

Known UX debt still visible in code:

- The minimal-mode confirmation still appears mid-flow unless the flag/env is already set
- Welcome screen status/dashboard work is still largely a design idea
- "Gateway" terminology is still widespread

## Required Tooling

- `pnpm`
- `vitest`
- `eslint`
- `tsx`
- `agent-tui` for TUI verification when interactive flows change

## Common Commands

```bash
pnpm install
pnpm --filter @legilimens/cli start
pnpm --filter @legilimens/cli start -- --help
pnpm --filter @legilimens/harness-service dev
pnpm typecheck
pnpm lint
pnpm test
pnpm test:integration
```

## Testing Expectations

- `tests/integration/parity.spec.ts` must remain green for core/harness parity.
- `tests/integration/smoke.cli.spec.ts` covers basic CLI startup/help behavior.
- Use Fastify inject tests for harness work rather than binding a network port.
- If you change wizard/generation/batch TUI behavior, verify with `agent-tui`.

Example `agent-tui` workflow:

```bash
agent-tui daemon start
agent-tui run -- npx tsx packages/cli/bin/legilimens.ts
agent-tui wait "What would you like to do?"
agent-tui screenshot
agent-tui kill
agent-tui daemon stop
```

## Governance and Guardrails

- Shared behavior should flow through `@legilimens/core`, not diverge between CLI and harness.
- Generated docs should continue using `docs/templates/legilimens-template.md`.
- Performance target remains "fast enough for interactive use" with visible feedback if runs take time.
- Avoid treating archived docs as implementation requirements without re-validating them in code.

## Context and Project Management Access

Do not use the Linear CLI or a native Linear MCP directly for this repo.

Use core-memory as the Linear interface:

```text
memory_search("legilimens-cli")
execute_integration_action(
  accountId: "0b4764e3-a793-4537-89b7-b26eff7b7675",
  action: "linear_search_issues",
  params: { query: "legilimens-cli", first: 20 }
)
```

Useful Linear actions:

- `linear_search_issues`
- `linear_create_issue`
- `linear_update_issue`
- `linear_list_projects`
- `linear_list_cycles`

Linear accountId: `0b4764e3-a793-4537-89b7-b26eff7b7675`

Important current caveat:

- This repo contains a prior migration summary and commit messages referencing `KHA-*` issues.
- The old migration summary has been archived under `docs/archive/` and should be treated as historical context only.
- Live Linear lookups may still return no matching issues for `legilimens-cli`.
- Treat document-based task references as historical hints until a live Linear search confirms active backlog state.

## Landing the Plane

When ending a session:

1. Capture any real remaining work as follow-up issues or explicit handoff notes.
2. Run quality gates if code changed.
3. Update issue status if the work is tracked live.
4. Push authorized implementation work before declaring completion.
5. Leave the repo in a resumable state with drift or blockers called out clearly.
