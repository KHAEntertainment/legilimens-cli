# Linear Migration Summary

> **ARCHIVE NOTICE** — This document was a pre-migration backlog snapshot. All issues
> listed below have been migrated to the live Linear project "Legilimens CLI".
> Issues 0, 1, 3, 4 are now Done (KHA-124, 125, 126, 127). Issue 8 and 9 were completed
> during the original cleanup pass. Treat this file as historical reference only.

**Project:** Legilimens CLI (aka doc-gateway-cli)
**Generated:** 2026-03-28
**Updated:** 2026-03-28 (incorporating DeepWiki Pre-Phase-4 assessment)
**Prepared by:** Claude Code (Project Cleanup Agent)

---

## Project Overview

**Name:** Legilimens CLI
**Local Folder:** `doc-gateway-cli`
**GitHub:** `github.com/KHAEntertainment/legilimens-cli`

**Description:** CLI tool that generates lightweight gateway documentation for external dependencies (frameworks, APIs, libraries, tools) to preserve AI context windows. Detects package repositories, fetches docs via multiple sources (DeepWiki, Context7, Tavily, Firecrawl), and generates formatted markdown using local LLM or cloud AI.

**Current Status:** Active — DMR (Document Model Reference) refactoring in progress on `dmr-refactor` branch.

**GitHub Remote:** https://github.com/KHAEntertainment/legilimens-cli

---

## ⚠️ Critical Finding: Pre-Phase-4 Execution Gap

The Pre-Phase-4 CLI Refactoring plan (`docs/PRE-PHASE-4-CLI-REFACTORING.md`, dated 10/29/2025) was **thorough and well-structured** — but execution against it is approximately **20-30% complete**. The Docker Model Runner migration was completed (replacing llama.cpp), but almost none of the UX improvements from that plan have landed.

**Source:** DeepWiki assessment of codebase vs. planning document.

---

## Status Classification

- [x] **Active** — currently in development (dmr-refactor branch)

---

## Current Priority

**P1** (revival in progress)

---

## Recommended Labels

- `legilimens-cli`
- `monorepo`
- `typescript`
- `documentation`
- `ux-improvement`
- `pre-phase-4`

---

## Issues to Create (Backlog)

### Issue 0: Reintroduce llama.cpp as Preferred Local LLM Backend — CRITICAL ⚠️

- **Type:** Feature
- **Priority:** High
- **Description:** **User preference: llama.cpp over DMR.** The codebase currently ONLY supports Docker Model Runner (DMR). llama.cpp was **removed**, not just supplemented. The `isLocalLlmEnabled()` in `runtimeConfig.ts:234-249` explicitly checks for DMR mode only (`modelName + apiEndpoint`), with comment stating "Legacy mode (binaryPath + modelPath) is not supported until reintroduced in localLlmRunner." The `localLlmRunner.ts` only makes HTTP calls to DMR endpoints. User prefers llama.cpp and wants BOTH options available (llama.cpp native OR DMR via Docker).
- **Files to modify:**
  - `packages/core/src/config/runtimeConfig.ts` — Update `isLocalLlmEnabled()` to also check legacy `binaryPath + modelPath` mode
  - `packages/core/src/ai/localLlmRunner.ts` — Add llama.cpp native execution path (currently only DMR HTTP)
  - `packages/cli/src/utils/llamaInstaller.ts` — Exists and functional, needs to be wired back in
- **Acceptance Criteria:** User can choose between llama.cpp (native binary) and DMR (Docker) for local LLM. llama.cpp is the preferred/default option.
- **Estimated Effort:** M

---

### Issue 1: Complete Pre-Phase-4 UX Gaps — CRITICAL

- **Type:** Feature
- **Priority:** High
- **Description:** The Pre-Phase-4 CLI Refactoring plan (`docs/PRE-PHASE-4-CLI-REFACTORING.md`) has significant gaps. Critical UX issues:
  1. **Remove disruptive mid-flow `--minimal` prompt** — `--minimal` flag exists at startup but the confirmation prompt mid-flow (`"Enable minimal mode?"`) was NEVER removed from `clackGenerationFlow.ts` line 108-117
  2. **Add `--debug` flag** — Currently ENV-only (`LEGILIMENS_DEBUG`), needs CLI flag
  3. **API key obfuscation** — Wizard displays raw API keys in plaintext in terminal prompts (line 133-145 in `clackWizard.ts`)
  4. **Non-interactive mode REGRESSED** — Old `nonInteractive.ts` was deleted; CLI now actively blocks non-TTY with error
- **Acceptance Criteria:** All 4 UX blockers resolved, parity tests green
- **Estimated Effort:** M

---

### Issue 3: Restore Pre-Phase-4 Batch TUI Integration

- **Type:** Feature
- **Priority:** High
- **Description:** The `batchInputParser.ts` utility EXISTS but the batch flow UI was deleted in 10/26 cleanup. The parser is orphaned with no UI path to invoke it. Need to restore batch generation TUI flow.
- **Acceptance Criteria:** Batch input works through TUI: `legilimens generate @batch.txt` or interactive batch mode
- **Estimated Effort:** M

---

### Issue 4: Pre-Retrieval Source Correction Step

- **Type:** Feature
- **Priority:** Medium
- **Description:** After AI detection resolves a source, the flow proceeds immediately to generation. Add confirmation/override step so users can verify or correct the matched repository before retrieval begins.
- **Acceptance Criteria:** User sees detected source, can override before fetch begins
- **Estimated Effort:** S

---

### Issue 5: Welcome Screen Status Dashboard

- **Type:** Feature
- **Priority:** Medium
- **Description:** Welcome screen shows only ASCII banner and 3-option menu. Add status panel showing DMR, model, Tavily, Firecrawl, Context7, RefTools health on startup.
- **Acceptance Criteria:** Welcome screen shows provider status at a glance
- **Estimated Effort:** M

---

### Issue 6: Multi-Model Selection

- **Type:** Feature
- **Priority:** Medium
- **Description:** Setup wizard is hardcoded to `ai/granite-4.0-micro:latest` only. No model selection menu (Phi-4, Qwen, etc.). `MODEL_REGISTRY` from planning doc was never created.
- **Acceptance Criteria:** User can select from multiple local LLM options during setup
- **Estimated Effort:** L

---

### Issue 7: Stale Branch Cleanup

- **Type:** Chore
- **Priority:** Medium
- **Description:** Delete superseded branches:
  - `claude/investigate-ref-usage-011CUsZqGQAHYfzM78gbgAUB` (stale remote)
  - `001-docs-sdp-md` (old local)
  - `cli-workflow-enhancement` (superseded)
  - `refactor/llama-tavily-clack` (superseded by dmr-refactor)
- **Acceptance Criteria:** Only `main` and `dmr-refactor` branches remain
- **Estimated Effort:** XS

---

### Issue 8: CLAUDE.md Rewrite per Agent Standards

- **Type:** Chore
- **Priority:** High
- **Description:** Rewrite CLAUDE.md to ~100 lines with new Linear access standard via core-memory. **Already completed during this cleanup pass.**
- **Acceptance Criteria:** CLAUDE.md under 120 lines, includes session-start pattern
- **Estimated Effort:** S (COMPLETED)

---

### Issue 9: Verify GitHub Remote Tracking

- **Type:** Chore
- **Priority:** Medium
- **Description:** Confirm `dmr-refactor` properly tracks `origin/dmr-refactor`. Currently shows up-to-date.
- **Acceptance Criteria:** `git status` shows tracking is correct
- **Estimated Effort:** XS (VERIFIED)

---

### Issue 10: GraphRAG Phase 3 Integration Spike

- **Type:** Spike
- **Priority:** Low
- **Description:** Plan GraphRAG integration per `docs/PHASE-3-GRAPHRAG-INTEGRATION-PLAN.md`. Reference at `.resources/graphrag-system/` (read-only symlink to graphrag-with-sqlite_vec).
- **Acceptance Criteria:** Linear issue created with integration approach documented
- **Estimated Effort:** L

---

### Issue 11: Parity Test Coverage Expansion

- **Type:** Feature
- **Priority:** Medium
- **Description:** Expand parity tests for new DMR-based detection pipeline. Commit `9d81155` enabled Context7-based detection — ensure all scenarios covered.
- **Acceptance Criteria:** All new detection scenarios covered by `tests/integration/parity.spec.ts`
- **Estimated Effort:** M

---

### Issue 12: "Gateway" Terminology Removal

- **Type:** Chore
- **Priority:** Low
- **Description:** The term "gateway" appears throughout the codebase (`"Generate gateway documentation"`, `generateGatewayDoc`, etc.). Large refactor to rename to preferred terminology.
- **Acceptance Criteria:** "Gateway" terminology replaced throughout
- **Estimated Effort:** XL (large, cross-cutting)

---

## Suggested Milestones / Cycles

### Sprint 0: Local LLM Backend (CRITICAL)
- Issue #0: Reintroduce llama.cpp alongside DMR (user preference: llama.cpp > DMR)

### Sprint 1: UX Critical Fixes
- Issue #1: Complete Pre-Phase-4 UX Gaps (CRITICAL)
- Issue #2: Restore Batch TUI Integration
- Issue #3: Pre-Retrieval Source Correction
- Issue #8: CLAUDE.md Rewrite — ALREADY DONE
- Issue #9: GitHub Remote Verification — ALREADY VERIFIED

### Sprint 2: Dashboard & Model Selection
- Issue #4: Welcome Screen Status Dashboard
- Issue #5: Multi-Model Selection
- Issue #7: Stale Branch Cleanup

### Sprint 3: Testing & Future
- Issue #11: Parity Test Coverage Expansion
- Issue #10: GraphRAG Phase 3 Integration Spike
- Issue #12: "Gateway" Terminology Removal (stretch goal)

---

## What WAS Successfully Implemented (from Pre-Phase-4 plan)

| Item | Status |
|------|--------|
| `--minimal` and `--low-contrast` as CLI flags | ✅ Done |
| Docker Model Runner (DMR) as local LLM backend | ✅ Done |
| Duplicate install guardrails | ✅ Done |
| Static backup / LLM context separation | ✅ Done |
| Progress spinners | ✅ Done |
| GraphRAG planning docs | ✅ Done |

---

## What Was NOT Implemented (from Pre-Phase-4 plan)

| Item | Priority | Notes |
|------|----------|-------|
| **llama.cpp as local LLM option** | **CRITICAL** | ⚠️ **Removed**, not just disabled. User prefers llama.cpp over DMR. `isLocalLlmEnabled()` only checks DMR mode. |
| Mid-flow `--minimal` prompt removal | **CRITICAL** | Still in `clackGenerationFlow.ts:108-117` |
| API key obfuscation | **CRITICAL** | Still plaintext in wizard |
| `--debug` flag | High | ENV-only currently |
| Non-interactive mode | High | **Regressed** — was deleted |
| Batch TUI integration | High | Parser orphaned |
| Pre-retrieval source correction | Medium | Not done |
| Status dashboard on welcome | Medium | Not done |
| Multi-model selection | Medium | Hardcoded to Granite |
| `settings.json` | Low | Not done |
| OpenRouter/Vercel AI SDK | Low | Not done |
| `setup-agent` command | Low | Not done |
| "Gateway" terminology | Low | Still everywhere |

---

## Blockers

**None** — project is in good state for resumption, but significant UX debt from Pre-Phase-4 plan.

---

## Notes for Handoff

1. **Pre-Phase-4 plan execution gap is significant** — The planning doc was thorough but ~70% of planned UX improvements were never implemented

2. **Biggest wins that DID land:**
   - Docker Model Runner (DMR) as local LLM backend
   - Duplicate install guardrails
   - Static backup/LLM context separation via `documentRouter.ts`

3. **Most pressing UX issues:**
   - **llama.cpp was REMOVED (not disabled)** — User prefers llama.cpp over DMR. `llamaInstaller.ts` exists but is not wired up. `isLocalLlmEnabled()` only checks DMR mode. Issue #0 created for this.
   - Mid-flow `--minimal` prompt is disruptive (asked twice — at startup AND mid-flow)
   - API keys displayed in plaintext in wizard
   - Non-interactive mode was **actively removed** (regression)

4. **Orphaned utility:** `batchInputParser.ts` exists but has no UI path

5. **CLAUDE.md and AGENTS.md** updated per new agent standards (99 lines, Linear via core-memory)

---

## Verification Completed This Session

- [x] CLAUDE.md rewritten (99 lines)
- [x] AGENTS.md updated (duplicate content removed)
- [x] Git state documented (stale branches identified)
- [x] DeepWiki Pre-Phase-4 assessment incorporated
- [x] Linear Migration Summary updated with UX gap issues
- [x] No code modified/deleted — documentation changes only

---

*Generated by Claude Code Project Cleanup Agent — legilimens-cli resync — 2026-03-28*
*Updated with DeepWiki Pre-Phase-4 assessment findings*
