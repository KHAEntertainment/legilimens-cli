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

# Legilimens CLI - Agent Instructions

## Project Overview

Legilimens is a pnpm monorepo for generating lightweight dependency documentation from detected repositories, package docs, and web sources. The repo contains a shared core engine, a Clack-based terminal UI, and a Fastify harness that should stay behaviorally aligned with the CLI.

Current work is happening on `dmr-refactor`, but the codebase now supports both Docker Model Runner and native `llama.cpp` paths. Treat current source code and tests as truth when older docs disagree.

## Tech Stack

- Runtime: Node.js 20 LTS, TypeScript 5.x, ESM
- Monorepo: pnpm workspaces
- CLI UX: `@clack/prompts`, `chalk`, `commander`, `figlet`, `gradient-string`, `ora`
- Core: Tavily, axios, zod
- Harness: Fastify

## Project Structure

```text
packages/
  core/              shared detection, fetch, generation, parity helpers
  cli/               interactive CLI, setup wizard, batch flows, config/secrets
  harness-service/   Fastify parity surface
tests/integration/   parity + smoke coverage
docs/                generated docs, guides, templates, screenshots
openspec/            change proposal workflow
.resources/          read-only GraphRAG reference for Phase 3 planning
```

## Development Commands

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

## Current Status

- Working now: source confirmation/override flow, interactive batch generation, non-interactive batch mode, masked API key prompts, dual local-LLM config support, parity harness.
- Still worth attention: duplicated mid-flow minimal-mode prompt, stale documentation snapshots, welcome-screen status/dashboard ideas, multi-model UX, terminology cleanup.
- Git note: this repo may already have been synced to Linear in a prior session, but agents should verify live state through core-memory each time because memory and search results can drift.

## Architecture Notes

- Shared behavior belongs in `@legilimens/core`; CLI and harness should stay aligned through parity tests.
- Local LLM support has two modes:
  - DMR: `modelName` + `apiEndpoint`
  - `llama.cpp`: `binaryPath` + `modelPath`
- Batch mode lives in `packages/cli/src/flows/clackBatchGenerationFlow.ts`; non-interactive execution is triggered by `LEGILIMENS_NON_INTERACTIVE=true` with `LEGILIMENS_BATCH_INPUT`.
- `.resources/graphrag-system/` is read-only reference material only. Never modify or run build/test commands inside `.resources/`.

## Known Issues / Tech Debt

- Several docs still describe older milestones as incomplete even when the code has caught up.
- `README.md`, `docs/guides/WORKING_CLI_SETUP.md`, and older migration notes should be treated as historical unless recently updated.
- The term "gateway" is still deeply embedded across the codebase and generated outputs.

## Agent Guidelines

- Prefer direct code inspection over historical planning docs when they conflict.
- Do not use Linear CLI or native Linear MCP directly for this repo.
- Keep doc/config changes surgical; avoid refactoring unrelated code while doing cleanup work.
- If TUI flows change, verify with `agent-tui`.

## Context & Project Management Access

All Linear interaction goes through core-memory MCP via `execute_integration_action`.

```text
memory_search("legilimens-cli")
execute_integration_action(
  accountId: "0b4764e3-a793-4537-89b7-b26eff7b7675",
  action: "linear_search_issues",
  params: { query: "legilimens-cli", first: 20 }
)
```

Useful actions:
- `linear_search_issues`
- `linear_create_issue`
- `linear_update_issue`
- `linear_list_projects`
- `linear_list_cycles`

Linear accountId: `0b4764e3-a793-4537-89b7-b26eff7b7675`

## Landing the Plane

At session end:
1. File follow-up issues for real gaps.
2. Run quality gates if code changed.
3. Update issue status.
4. Push authorized implementation work to remote.
5. Leave a clean handoff with any remaining risks or drift.
