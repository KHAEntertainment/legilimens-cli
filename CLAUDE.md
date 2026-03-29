# AI Assistant Quick Start

Welcome! This is a lightweight entry point for AI assistants working on the Legilimens CLI project.

## Primary Reference

**👉 Read `AGENTS.md` first** - it's the comprehensive technical handbook covering:
- Complete stack and workspace layout
- Common commands and workflows
- Testing expectations and governance rules
- Detailed technical notes on all major subsystems

## Quick Context

**Legilimens** is a CLI tool that generates documentation for dependencies by:
1. Detecting package repositories (GitHub, NPM, URLs)
2. Fetching docs via multiple sources (DeepWiki, Context7, Tavily, Firecrawl)
3. Generating formatted markdown using local LLM or cloud AI
4. Following strict template and quality standards

**Architecture:**
- `@legilimens/core` - Business logic (gateway, detection, fetchers)
- `@legilimens/cli` - Interactive Clack/Ink-based UX
- `@legilimens/harness-service` - Fastify HTTP service for parity testing
- `packages/hive-docs` - git submodule — wiki-style doc management (standalone repo)
- `packages/graphrag` - git submodule — GraphRAG with SQLite-vec (standalone repo)

### Git Submodules

`packages/hive-docs` and `packages/graphrag` are git submodules. See **AGENTS.md** for
full submodule commands. Key points:

- Edits happen in the standalone repos, not inside `packages/`
- `git submodule status` to check current pins
- `git submodule update --remote` to pull latest from upstream

## 📦 Monorepo Structure

**IMPORTANT:** This repository contains reference to the GraphRAG system for integration planning.

**Reference Directory:** `.resources/`
- **`.resources/graphrag-system/`** - Symlinked reference to GraphRAG-with-SQLite-Vec repository
- **Read-only** - For planning and reference purposes only
- **Do NOT modify** files in `.resources/` or symlinked directories
- See `.resources/CLAUDE.md` for detailed usage instructions

**Phase 3 Integration (Q1 2026):**
- GraphRAG will be integrated as `@legilimens/graphrag` workspace package
- See `docs/PHASE-3-GRAPHRAG-INTEGRATION-PLAN.md` for complete roadmap

## Common Pitfalls

### Configuration & Setup
- **Setup Wizard Loop**: If wizard keeps running, check `~/.legilimens/config.json` for `setupCompleted: true` and valid `localLlm` paths
- **"No AI provider configured"**: Ensure `loadCliEnvironment()` is called before flows run; check API keys in secure storage
- **Local LLM not found**: Binary lives in nested path `~/.legilimens/bin/build/bin/llama-cli`; recursive search required
- **Environment Variables**: Don't manually set `TAVILY_API_KEY` etc. - they're loaded from secure storage automatically

### Code Standards
- **TypeScript Strict Mode**: All packages use strict type checking with ESM modules
- **pnpm Workspaces**: Always use `--filter` for package-specific commands
- **Import Paths**: Use `@legilimens/core` imports, not relative paths across packages
- **Template Compliance**: Documentation output MUST follow `docs/templates/legilimens-template.md` format

### Testing
- **Parity Tests**: Changes to `@legilimens/core` require green `tests/integration/parity.spec.ts`
- **Unit Tests**: Prefer `vitest` with `ink-testing-library` for CLI components
- **No Network in CI**: Harness tests use Fastify inject, not real HTTP

## Governance

- **Template Enforcement**: Generated docs must match official template structure
- **Static Backups**: All generated files need `static-backup/` copies

## Troubleshooting

If you encounter configuration or setup issues, check:
1. **`WORKING_CLI_SETUP.md`** - Detailed status snapshot and common fixes
2. **`AGENTS.md` Technical Notes** - Architecture-specific guidance
3. **`docs/quickstart.md`** - First-time setup walkthrough

## Ready to Start

1. Read `AGENTS.md` for comprehensive context
2. Check `docs/guides/WORKING_CLI_SETUP.md` if debugging CLI issues
3. Run `pnpm install` and launch with `pnpm --filter @legilimens/cli start`

Happy coding! 🚀