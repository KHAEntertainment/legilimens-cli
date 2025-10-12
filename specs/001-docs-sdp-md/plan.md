# Implementation Plan: Modern Agentic CLI UX for Legilimens

**Branch**: `001-docs-sdp-md` | **Date**: 2025-10-07 | **Spec**: `/Users/bbrenner/Documents/Scripting Projects/legilimens-cli/specs/001-docs-sdp-md/spec.md`
**Input**: Feature specification from `/specs/001-docs-sdp-md/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Elevate the Legilimens CLI experience to match modern agentic tooling by introducing a polished launch sequence, guided documentation generation flow, and accessible presentation modes while grounding all functionality in a reusable TypeScript/Node core module that can power forthcoming web integrations.

- Modernize the interactive experience with `ink` components, ASCII branding, and progress feedback while honoring minimal/low-contrast fallbacks.
- Refactor CLI orchestration to consume a shared `packages/core` module, enabling parity with a thin `fastify` service harness.
- Document UI guidance in `docs/sdp.md`, codify testing via `vitest` + `ink-testing-library`, and maintain constitution compliance for DeepWiki-first messaging.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.x targeting Node.js 20 LTS  
**Primary Dependencies**: `commander`, `ink`, `chalk`, `gradient-string`, `figlet`, `ink-select-input`, `ink-text-input`, `ora`, shared `packages/core` module  
**Storage**: N/A  
**Testing**: `vitest`, `ink-testing-library`, `tsx` runner  
**Target Platform**: Cross-platform terminals on macOS, Linux, and Windows (Node.js runtime)  
**Project Type**: Monorepo with shared `packages/core` module plus CLI adapter  
**Performance Goals**: Typical runs ≤10s, extended runs ≤60s per constitution  
**Constraints**: Outputs must remain template-compliant, adapt to ANSI-less terminals, and operate offline with local assets  
**Scale/Scope**: Single CLI used by internal developers; future web service adapter consuming shared module

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Validate the plan against the active constitutional principles before proceeding:

- **Mission-Led Gateways**: Feature scope targets presentation polish and guidance without expanding content payloads; static-backup links and DeepWiki reminders remain central.
- **Immutable Template Format**: No template changes are proposed; UI adjustments affect runtime rendering only and will explicitly verify outputs against `docs/consitution-original.md`.
- **Naming & Directory Discipline**: No new gateway files are created; any scaffolding updates will respect existing `docs/` hierarchy should content generation be touched (not expected in this feature).
- **Source Priority Chain**: Fetch logic remains unchanged; plan will ensure any future refactors preserve the mandated order and fallbacks.
- **Operational Guardrails**: Performance ceilings and progress indicators remain requirements (FR-003, FR-006, FR-007); accessibility modes enhance clarity without violating guardrails.
- **DeepWiki-First Guidance**: Launch sequence and prompts will reiterate "DeepWiki for coding; static files for planning," ensuring canonical block remains intact.
- **Reusable Node.js Core**: Shared TypeScript module (FR-009) is the primary implementation work item; CLI will act as a thin adapter to uphold this principle.

Document any exceptions in "Complexity Tracking" and secure maintainer approval before advancing.

*Re-evaluation after Phase 1 design: data model, contracts, and quickstart reinforce the shared Node.js core strategy without introducing template changes—gate remains PASS.*

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```
packages/
├── core/                 # Shared TypeScript module housing gateway logic
│   ├── src/
│   ├── tests/
│   └── package.json
├── cli/                  # CLI adapter consuming packages/core
│   ├── src/
│   ├── bin/
│   ├── tests/
│   └── package.json
└── harness-service/      # Minimal Node harness for service parity validation
    ├── src/
    └── package.json

docs/
└── ...                   # Existing gateway outputs (unchanged by this feature)

scripts/
└── ...                   # Automation scripts (may add CLI UX utilities)

tests/
└── integration/          # Cross-package integration tests and golden fixtures
```

**Structure Decision**: Adopt a multi-package workspace where `packages/core` owns reusable gateway orchestration, `packages/cli` wraps it with UX enhancements, and `packages/harness-service` proves service reuse while integration tests live in top-level `tests/integration`.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| _None_ | — | — |
