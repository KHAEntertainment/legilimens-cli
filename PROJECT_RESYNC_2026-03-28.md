# Project Resync - 2026-03-28

> **Status Update (2026-03-28)**: Several items flagged in this resync are now resolved.
> See the updates at the end of this document.

## Executive Summary

This pass was treated as a validation pass over a prior sync artifact rather than a first-time discovery. The repo contains an existing migration summary and commit messages referencing `KHA-*` tasks, but live core-memory Linear searches did not return an active `legilimens-cli` project or matching issues, so this report refreshes the backlog in migration-ready form instead of assuming active sync state. The codebase is healthier than the prior migration summary suggests: source confirmation, batch TUI flow, non-interactive batch mode, API key masking, and dual local-LLM support are now implemented. The biggest remaining gaps are documentation drift, welcome-screen/model-selection UX, and the still-disruptive mid-flow minimal-mode prompt.

## Mode Used

Validation pass with migrate-ready output.

- Prior sync evidence found: `docs/archive/LINEAR_MIGRATION_SUMMARY_2026-03-28.md`, commit messages referencing `KHA-124` through `KHA-127`, memory context describing a prior migration.
- Live Linear evidence found: none via core-memory `linear_search_issues` for `legilimens-cli`, `doc-gateway-cli`, or related issue keys.
- Interpretation: agents may be working from the migration document rather than a live Linear project/backlog.

## Discovery Notes

### Git State

- Branch: `dmr-refactor` tracking `origin/dmr-refactor`
- Remote: `https://github.com/KHAEntertainment/legilimens-cli.git`
- Untracked files present:
  - `docs/screenshots/01-main-menu.txt`
  - `docs/screenshots/02-batch-prompt.txt`
  - `docs/screenshots/03-batch-classified.txt`
  - `docs/screenshots/03-batch-preview.txt`

### Stack and Structure

- Runtime: Node.js 20 LTS
- Language: TypeScript 5.x, ESM
- Workspace: pnpm monorepo
- Packages:
  - `@legilimens/core`
  - `@legilimens/cli`
  - `@legilimens/harness-service`
- Test surfaces:
  - `tests/integration/parity.spec.ts`
  - `tests/integration/smoke.cli.spec.ts`

### Agent Files Reviewed

- `CLAUDE.md`
- `AGENTS.md`
- `openspec/AGENTS.md`

## Gap Analysis

### Status Matrix

| Area | Status | Evidence |
|------|--------|----------|
| Shared monorepo structure (`core`, `cli`, `harness-service`) | Complete | Workspace manifests and package layout are consistent |
| CLI and harness parity suite | Complete | `tests/integration/parity.spec.ts` exists and exercises both surfaces |
| Source confirmation / override before fetch | Complete | `packages/cli/src/flows/clackGenerationFlow.ts` includes confirmation and override loop |
| Interactive batch TUI flow | Complete | `packages/cli/src/flows/clackBatchGenerationFlow.ts` implements interactive batch processing |
| Non-interactive batch mode | Complete | `runNonInteractiveBatch()` exists and `clackApp.ts` routes via env vars |
| API key masking in setup wizard | Complete | `maskApiKey()` is used in `packages/cli/src/wizard/clackWizard.ts` |
| Dual local-LLM support (`llama.cpp` + DMR) | Complete | `isLocalLlmEnabled()` and `runLocalJson()` support both modes |
| Welcome/provider status dashboard | Planned | No dashboard implementation found in startup flow |
| Multi-model selection UX | Planned | No real model registry or selection UX found beyond backend config |
| Mid-flow minimal-mode prompt cleanup | In Progress | Prompt still appears in generation and batch flows unless already forced |
| “Gateway” terminology cleanup | Planned | Core paths, prompts, and generated output still use “gateway” heavily |
| Current agent instructions accuracy | Complete after this pass | `CLAUDE.md` and `AGENTS.md` updated |
| README / setup guide accuracy | Drift | README and `docs/guides/WORKING_CLI_SETUP.md` still describe older snapshot states and priorities |
| Prior Linear migration summary accuracy | Drift | Existing summary marks several now-complete items as backlog work |

### Complete

- Source confirmation and override are implemented.
- Batch generation exists in both interactive and non-interactive forms.
- API keys are masked in the wizard.
- Native `llama.cpp` and DMR paths both exist in current code.
- Parity and smoke test scaffolding are in place.

### In Progress

- Minimal mode still asks for confirmation in-flow when not preselected via flag or env var.

### Planned

- Welcome-screen/provider dashboard
- Multi-model selection UX
- Broad terminology cleanup away from “gateway”

### Drift

- `README.md` still frames older milestones and setup states as current truth.
- `docs/guides/WORKING_CLI_SETUP.md` is a historical snapshot tied to older commits and now-misleading “fully functional” language.
- `docs/archive/LINEAR_MIGRATION_SUMMARY_2026-03-28.md` lists several items that have since landed in code.

### Broken

- No core runtime blocker was found during this pass.
- The closest process-level blocker is tracking drift: Linear references exist in docs/history, but no live project/backlog could be confirmed through core-memory search.

## Agent Instruction Changes Made

- Rewrote `CLAUDE.md` into a tighter, code-accurate primary entry point.
- Repositioned `AGENTS.md` as a technical companion instead of a duplicated second primary.
- Removed stale assumptions that `llama.cpp` support, source confirmation, batch TUI flow, and API key masking were still missing.
- Added an explicit note that document-based `KHA-*` references should not be treated as proof of active Linear state.
- Preserved the OpenSpec managed block and the core-memory Linear access pattern.

## LINEAR MIGRATION SUMMARY

### Project Name
Legilimens CLI

### Project Description
Monorepo CLI and harness for generating lightweight dependency documentation from detected repos, package docs, and web sources, with shared core logic and a Clack-based terminal UX.

### Status Classification
[x] Active — currently in development
[ ] Reviving — stale but bringing back
[ ] Archive — moving to NAS

### GitHub Remote
https://github.com/KHAEntertainment/legilimens-cli.git

### Current Priority
P1

### Recommended Labels
typescript, monorepo, cli, documentation, ux, ai-tooling

### Issues to Create (Backlog)

**Clean Up Minimal-Mode UX**
- Type: Feature
- Priority: High
- Description: The CLI still asks users mid-flow whether to enable minimal mode in both single and batch generation flows. That interaction interrupts the flow and appears to be leftover UX debt from earlier planning.
- Acceptance Criteria: Minimal mode is chosen upfront by flag/config or removed from the middle of generation flows.
- Estimated Effort: S

**Add Welcome Screen Provider Status Panel**
- Type: Feature
- Priority: Medium
- Description: The startup menu does not yet expose at-a-glance health for local LLM, Tavily, Firecrawl, Context7, and RefTools. A lightweight status panel would make the tool more self-diagnosing.
- Acceptance Criteria: Startup screen shows current provider/config status before the user enters generation flows.
- Estimated Effort: M

**Add Multi-Model Selection UX**
- Type: Feature
- Priority: Medium
- Description: The project supports multiple local-LLM modes but does not offer a clear model-selection experience. Setup still feels backend-centric rather than model-centric.
- Acceptance Criteria: Users can choose among supported local model options during setup/configuration with clear persisted settings.
- Estimated Effort: M

**Refresh Stale Project Documentation**
- Type: Chore
- Priority: High
- Description: `README.md`, `docs/guides/WORKING_CLI_SETUP.md`, and the existing migration summary no longer match current code reality. This creates confusion for both humans and agents.
- Acceptance Criteria: Primary project docs reflect current implemented features, remaining gaps, and current branch/repo reality.
- Estimated Effort: S

**Reconcile Linear Tracking With Repo Reality**
- Type: Spike
- Priority: High
- Description: The repo contains a migration summary and commit references to `KHA-*` tasks, but live core-memory Linear searches do not show an active project/backlog for this repo. The tracking source of truth needs to be re-established.
- Acceptance Criteria: Either an active Linear project/backlog is verified and linked, or a fresh project/backlog is created from the refreshed migration summary.
- Estimated Effort: S

**Expand Tests Around Current CLI UX**
- Type: Feature
- Priority: Medium
- Description: Current tests cover parity and a smoke path, but recent UX features such as source confirmation and batch flow behavior are still underrepresented in automated coverage.
- Acceptance Criteria: Tests cover source confirmation flow behavior and batch-mode expectations at an appropriate integration/unit level.
- Estimated Effort: M

**Rename “Gateway” Terminology Across the Product**
- Type: Chore
- Priority: Low
- Description: The product still uses “gateway” pervasively in commands, paths, prompts, and generated outputs. If the naming direction has changed, this needs a coordinated cleanup.
- Acceptance Criteria: Product-facing terminology is made consistent across code, docs, and outputs.
- Estimated Effort: L

### Milestones / Cycles Suggested

- Milestone 1: Tracking and documentation reset
  - Reconcile Linear tracking with repo reality
  - Refresh stale project documentation
- Milestone 2: UX polish
  - Clean up minimal-mode UX
  - Add welcome screen provider status panel
  - Add multi-model selection UX
- Milestone 3: Confidence and naming
  - Expand tests around current CLI UX
  - Rename “gateway” terminology across the product

### Blockers

- No live Linear project/backlog could be confirmed through core-memory search.
- Historical docs overstate some old gaps and understate what has already landed.

### Notes for Handoff

- Use the current codebase, not the existing migration summary, as the source of truth for status.
- Treat `KHA-*` references in commit messages and docs as historical hints until live Linear confirms them.
- The repo is active and structurally healthy; the biggest need is coordination cleanup, not a code rescue.

## Recommended Next Session Starting Point

Start by deciding whether to restore a real Linear project/backlog for Legilimens or to keep tracking work from repo docs alone. Once tracking is settled, update `README.md` and `docs/guides/WORKING_CLI_SETUP.md` so they stop advertising now-completed work as open backlog, then tackle the minimal-mode UX cleanup as the next focused product task.

---

## Post-Resync Resolutions (2026-03-28)

Items from the status matrix above that have since been resolved:

| Item | Was | Now | Linear Issue |
|------|-----|-----|-------------|
| Mid-flow minimal-mode prompt | In Progress | **Complete** | KHA-139 |
| README / setup guide accuracy | Drift | **Updated** | KHA-142 |
| Prior Linear migration summary | Drift | **Archived with header** | KHA-142 |
| Linear tracking | No live project | **Active Linear project** | KHA-139–142 |

### Linear Project Verified

A live Linear project ("Legilimens CLI") now exists with active issues KHA-124 through KHA-144. The migration summary and resync doc should be treated as historical preparation artifacts, not the tracking source of truth.

### Remaining Open Items

- Welcome/provider status dashboard (KHA-128)
- Multi-model selection UX (KHA-129)
- Stale branch cleanup (KHA-130)
- Expand tests around CLI UX (KHA-144)