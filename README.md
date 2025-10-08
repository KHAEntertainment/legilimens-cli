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
- **Packages**:
  - `@legilimens/core` – reusable gateway generation engine + parity helpers.
  - `@legilimens/cli` – Ink-powered UX wrapper with interactive + minimal flows.
  - `@legilimens/harness-service` – Fastify HTTP harness that mirrors CLI responses.
- **Telemetry**: Shared performance tracker enforces guardrails and recommends minimal mode when runs stretch.
- **Doctrine**: DeepWiki remains the canonical knowledge surface; static backups support planning.

## Quickstart
```bash
pnpm install
pnpm --filter @legilimens/cli start         # Interactive walkthrough
pnpm --filter @legilimens/harness-service dev  # HTTP harness for parity checks
pnpm typecheck && pnpm lint                 # Validate TypeScript + linting
pnpm test:integration                       # Ensure CLI and harness stay in sync
```

## DeepWiki Guidance
Every generated gateway reiterates the standing rule: *use DeepWiki for coding, consult static
backups for planning*. The CLI surfaces DeepWiki prompts inline, while the constitution at
`.specify/memory/constitution.md` governs template fidelity and terminology.

## Reference Docs
- `docs/sdp.md` – Product narrative, technical stack, and governance context.
- `AGENTS.md` – Operational handbook for agents collaborating on Legilimens.
- `specs/001-docs-sdp-md/` – Active specification, plan, tasks, and research history.
- `.specify/memory/constitution.md` – Governing principles, version history, and amendment log.
