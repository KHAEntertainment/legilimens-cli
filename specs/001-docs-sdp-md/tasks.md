# Tasks: Modern Agentic CLI UX for Legilimens

**Input**: Design documents from `/specs/001-docs-sdp-md/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/legilimens.openapi.yaml

**Tests**: Only included where required to satisfy parity and success criteria.

**Organization**: Tasks are grouped by user story so each increment can be delivered and validated independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the TypeScript/Node.js workspace and baseline tooling.

- [X] T001 [Setup] Initialize pnpm workspace scaffolding (`package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.npmrc`) at repo root for Node.js 20 LTS.
- [X] T002 [Setup] Configure repository linting and formatting (create `eslint.config.js`, `.prettierrc`, and shared TypeScript paths in `tsconfig.base.json`).
- [X] T003 [Setup] Add root scripts in `package.json` (`build`, `typecheck`, `lint`, `test`, `start:cli`, `start:harness`) aligned with quickstart.md guidance.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core workspace structure required before any user story work.

- [X] T004 [Found] Scaffold `packages/core` module (`package.json`, `tsconfig.json`, `src/index.ts`, `src/types.ts`) exporting stubbed gateway interfaces.
- [X] T005 [Found] Scaffold `packages/cli` adapter (`package.json`, `tsconfig.json`, `src/app.tsx`, `bin/legilimens.ts`) with placeholder invocation of core stubs.
- [X] T006 [Found] Scaffold `packages/harness-service` (`package.json`, `tsconfig.json`, `src/server.ts`) with Fastify bootstrap that currently returns 501.
- [X] T007 [Found] Create shared configuration utilities (`packages/core/src/config/runtimeConfig.ts`, `packages/cli/src/config/env.ts`) handling Node.js 20 detection and constitutional directories.
- [X] T008 [Found] Establish integration testing harness (`vitest.config.ts`, `tests/integration/parity.spec.ts` placeholder, pnpm scripts) to compare CLI vs service outputs later.

**Checkpoint**: Foundation ready—user stories can begin.

---

## Phase 3: User Story 1 - Launch immersion (Priority: P1) 🎯 MVP

**Goal**: Deliver the modern welcome sequence with ASCII branding, skip control, and DeepWiki reminders.

**Independent Test**: Launch CLI via `pnpm --filter @legilimens/cli start` and verify branded welcome, DeepWiki messaging, and immediate skip handling.

- [X] T009 [US1] Implement ASCII banner loader with fallback detection in `packages/cli/src/assets/asciiBanner.ts` (figlet fonts + local validation).
- [X] T010 [P] [US1] Define brand theme tokens (gradients, color palette) in `packages/cli/src/theme/brandTheme.ts`.
- [X] T011 [US1] Build `WelcomeScreen` component in `packages/cli/src/components/WelcomeScreen.tsx` rendering ASCII art, mode hints, and DeepWiki doctrine.
- [X] T012 [US1] Wire CLI entrypoint (`packages/cli/src/app.tsx`, `packages/cli/bin/legilimens.ts`) to display welcome, support instant skip, and respect `--minimal`.
- [X] T013 [US1] Update launch documentation (`packages/cli/README.md`, `docs/quickstart.md` intro) to describe welcome sequence, ASCII assets, and skip flags.

**Checkpoint**: CLI launch feels modern and skippable while reinforcing DeepWiki guidance.

---

## Phase 4: User Story 2 - Guided generation flow (Priority: P1)

**Goal**: Provide structured prompts, progress indicators, and completion summaries that mirror leading agentic CLIs.

**Independent Test**: Run `pnpm --filter @legilimens/cli start` to execute a full generation; confirm prompts align with spec, progress updates render per step, and summary reiterates DeepWiki usage.

- [X] T014 [US2] Implement interactive input component (`packages/cli/src/components/GenerationPrompt.tsx`) using `ink-text-input` and `ink-select-input` with validation.
- [X] T015 [P] [US2] Build progress timeline component in `packages/cli/src/components/ProgressTimeline.tsx` supporting live milestone updates.
- [X] T016 [US2] Orchestrate generation flow (`packages/cli/src/flows/runGeneration.ts`) tying prompt responses to core `generateGatewayDoc` stub and emitting progress events.
- [X] T017 [US2] Create completion summary component (`packages/cli/src/components/CompletionSummary.tsx`) that surfaces outputs, next steps, and DeepWiki reminders.
- [X] T018 [P] [US2] Implement non-interactive fallback runner (`packages/cli/src/flows/nonInteractive.ts`) using `ora` spinners for scripted environments.

**Checkpoint**: Generation journey guides users end-to-end with modern feedback and DeepWiki emphasis.

---

## Phase 5: User Story 3 - Accessible configuration (Priority: P2)

**Goal**: Enable minimal and low-contrast modes that preserve clarity across terminals and CI.

**Independent Test**: Launch CLI with `--minimal` and `--low-contrast`; confirm ASCII art suppression, color adjustments, and layout resilience at 80 columns.

- [X] T019 [US3] Define theme profiles (`packages/cli/src/theme/profiles.ts`) for `modern`, `minimal`, and `low-contrast` modes.
- [X] T020 [US3] Implement user preference loader (`packages/cli/src/config/preferences.ts`) merging flags, env vars, and defaults into theme selection while detecting ANSI support to trigger plain-text fallbacks automatically.
- [X] T021 [US3] Apply theme profiles across components (update `packages/cli/src/app.tsx`, `packages/cli/src/components/*`) to toggle ASCII, gradients, and layout widths, including clamps that keep layouts legible at 80-column terminals.
- [X] T022 [US3] Update CLI help output and docs (`packages/cli/src/commands/help.ts`, `docs/quickstart.md` configuration section) to describe configuration switches and environment overrides.

**Checkpoint**: Accessibility modes deliver polished minimal outputs without breaking flow.

---

## Phase 6: User Story 4 - Service reuse foundation (Priority: P2)

**Goal**: Expose Legilimens capabilities through a reusable TypeScript core consumed by both CLI and service harness.

**Independent Test**: Import the core module from a script and via harness POST `/legilimens/generate`; confirm outputs match CLI results when normalized.

- [X] T023 [US4] Move generation logic into `packages/core/src/gateway.ts`, exposing `generateGatewayDoc`, `validateTemplate`, and `formatProgress`.
- [X] T024 [US4] Add parity utilities in `packages/core/src/parity/normalizeOutput.ts` to normalize artifacts for CLI vs service comparison.
- [X] T025 [US4] Wire CLI to consume `packages/core` via workspace dependency (update `packages/cli/package.json`, rework imports in `packages/cli/src/app.tsx`).
- [X] T026 [US4] Implement Fastify harness routes (`packages/harness-service/src/server.ts`) conforming to `contracts/legilimens.openapi.yaml`.
- [X] T027 [US4] Write integration parity test in `tests/integration/parity.spec.ts` confirming CLI and harness outputs stay aligned across three scenarios.

**Checkpoint**: Shared TypeScript module powers both CLI and service harness with verified parity.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Finalize documentation, performance guardrails, and release readiness.

- [X] T028 [Polish] Refresh top-level documentation (`README.md`, `docs/sdp.md`, `AGENTS.md`) to summarize modern CLI UX, TypeScript workspace, and DeepWiki doctrine.
- [X] T029 [Polish] Add performance telemetry hooks (`packages/core/src/telemetry/performance.ts`) enforcing 10s/60s guardrails and minimal-mode checks.
- [X] T030 [Polish] Execute release checklist (`pnpm lint`, `pnpm test`, `pnpm typecheck`, `pnpm --filter @legilimens/cli build-assets`) and capture results in CHANGELOG, explicitly logging ANSI fallback and 80-column validation runs.

---

## Dependencies & Execution Order

| Phase | Depends On | Notes |
|-------|------------|-------|
| Setup | — | Required before any other work |
| Foundational | Setup | Establishes workspace scaffolding and testing harness |
| US1 (P1) | Foundational | Needs CLI skeleton and config utilities |
| US2 (P1) | US1 | Reuses welcome flow and CLI entry scaffolding |
| US3 (P2) | US2 | Extends CLI components with theme logic |
| US4 (P2) | Foundational, US2 | Requires core scaffolding and CLI flow before reuse |
| Polish | All stories | Final cleanup after features land |

User stories remain independently testable once their prerequisites complete; US3/US4 can begin after US2 if team capacity allows, but deployment order should respect priority (P1 before P2).

---

## Parallel Execution Examples

### User Story 1
- Run T009 (ASCII loader) and T010 (brand theme tokens) in parallel—they touch separate files.

### User Story 2
- Develop T015 (progress timeline) alongside T018 (non-interactive runner) while T014/T016 focus on orchestration.

### User Story 3
- Execute T019 (theme profiles) and T020 (preference loader) concurrently before integrating in T021.

### User Story 4
- Build T024 (parity utilities) while another contributor handles T026 (Fastify routes); both depend on T023 but not on each other.

---

## Implementation Strategy

### MVP First (Deliver US1)
1. Complete Setup and Foundational phases.
2. Implement all US1 tasks and validate welcome sequence.
3. Demo CLI launch experience before proceeding.

### Incremental Delivery
1. Finish US1 to establish new UX baseline.
2. Layer US2 guided flow to deliver core value.
3. Add US3 accessibility improvements.
4. Finish with US4 module reuse and parity validation.

### Parallel Team Strategy
1. Team collaborates on Setup + Foundational.
2. Split US1/US2 across two contributors while a third prepares US3 theme work once base components exist.
3. After US2 stabilizes, dedicate effort to US4 refactor and parity testing in parallel with Polish tasks.
