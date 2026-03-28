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

Legilimens is a CLI tool that generates lightweight gateway documentation for external dependencies (frameworks, APIs, libraries, tools) to preserve AI context windows. It detects package repositories, fetches docs via multiple sources (DeepWiki, Context7, Tavily, Firecrawl), and generates formatted markdown using local LLM or cloud AI.

## Tech Stack

- **Runtime**: Node.js 20 LTS, TypeScript 5.x, ESM modules
- **UI**: Ink + @clack/prompts (full-screen TUI), chalk, ora, figlet
- **Core**: @legilimens/core (gateway engine, detection, fetchers, AI pipeline)
- **Harness**: @legilimens/harness-service (Fastify HTTP for parity testing)
- **Package Manager**: pnpm workspaces

## Project Structure

```
packages/
├─ core/              # Gateway engine, detection, AI pipeline, fetchers
├─ cli/               # TUI application, wizard, config management
└─ harness-service/   # Fastify HTTP harness for parity tests
tests/integration/     # Vitest parity test suite
docs/                  # Gateway outputs + static-backup/
openspec/              # Change proposal workflow
.specify/memory/       # Constitution and templates
.resources/            # Read-only GraphRAG reference (symlink)
```

## Development Commands

```bash
pnpm install                           # Bootstrap workspace
pnpm --filter @legilimens/cli start    # Launch interactive CLI
pnpm --filter @legilimens/harness-service dev  # Run parity harness
pnpm test:integration                 # Run parity tests
pnpm typecheck                         # TypeScript check
pnpm lint                              # ESLint
```

## Current Status

**Active DMR (Document Model Reference) refactoring** on `dmr-refactor` branch. Key features working:
- Tavily-first discovery pipeline with Context7 fallback
- Local LLM support (llama.cpp with phi-4 GGUF)
- System keychain credential storage
- Full-screen TUI with alternate screen buffer

## Known Issues

- Setup wizard may loop if `~/.legilimens/config.json` missing `setupCompleted: true`
- Local LLM binary at nested path `~/.legilimens/bin/build/bin/llama-cli`
- Disable TUI with `LEGILIMENS_DISABLE_TUI=true` for debugging

## Linear Access (Agent Standard)

All Linear work goes through **core-memory MCP** via `execute_integration_action`.

**Session start pattern:**
1. `memory_search("legilimens")`
2. `execute_integration_action(accountId: "0b4764e3-a793-4537-89b7-b26eff7b7675", action: "linear_search_issues", params: {query: "legilimens", first: 20})`

**Available actions:** `linear_search_issues`, `linear_create_issue`, `linear_update_issue`, `linear_create_project`, `linear_list_cycles`

**Linear accountId:** `0b4764e3-a793-4537-89b7-b26eff7b7675`

## Landing the Plane (Session Completion)

Work is NOT complete until `git push` succeeds.

1. File issues for remaining work via core-memory
2. Run quality gates (tests, typecheck)
3. Update issue status
4. `git pull --rebase && git push` (MANDATORY)
5. Verify clean git status

## Quick Links

- Full technical docs: `AGENTS.md`
- Constitution: `.specify/memory/constitution.md`
- Quickstart: `docs/quickstart.md`
- Troubleshooting: `docs/guides/WORKING_CLI_SETUP.md`