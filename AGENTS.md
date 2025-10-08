# Legilimens Agent Handbook

Central reference for any AI agent working on the Legilimens CLI workspace.

## Canonical Stack
- Node.js 20 LTS (enforced by constitution)
- TypeScript 5.x (ESM, pnpm workspaces)
- UI Runtime: `ink`, `commander`, `chalk`, `gradient-string`, `ora`, `figlet`, `ink-select-input`, `ink-text-input`
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

## Manual Notes
<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
