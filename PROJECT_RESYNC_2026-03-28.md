# Project Resync Report: Legilimens CLI (doc-gateway-cli)

**Date:** 2026-03-28
**Project:** Legilimens CLI
**Local Folder:** `doc-gateway-cli`
**GitHub:** `github.com/KHAEntertainment/legilimens-cli`
**Current Branch:** `dmr-refactor`
**Prepared by:** Claude Code (Project Cleanup Agent)
**Updated:** 2026-03-28 (incorporating DeepWiki Pre-Phase-4 assessment)

---

## Executive Summary

The `doc-gateway-cli` (Legilimens CLI) project is in **revival-ready state** but has significant **Pre-Phase-4 execution debt**. The DMR (Document Model Reference) refactoring is complete (Phase 5), and Docker Model Runner was successfully adopted as the local LLM backend. However, ~70% of the UX improvements planned in `docs/PRE-PHASE-4-CLI-REFACTORING.md` were never implemented. Critical issues include: the `--minimal` prompt appearing twice (at startup AND mid-flow), API keys displayed in plaintext in the wizard, non-interactive mode was actively removed (regression), and the batch input parser is orphaned with no UI path. Agent instruction files have been consolidated (`CLAUDE.md` is now 99 lines with Linear access via core-memory). Eleven backlog items have been identified for Linear migration. No code was modified — only documentation.

---

## ⚠️ Critical Finding: Pre-Phase-4 Execution Gap

The Pre-Phase-4 CLI Refactoring plan (`docs/PRE-PHASE-4-CLI-REFACTORING.md`, dated 10/29/2025) was **thorough and well-structured** — but execution against it is approximately **20-30% complete**.

**Source:** DeepWiki assessment comparing planning document against current codebase.

### What WAS Implemented (Pre-Phase-4)

| Item | Status | Evidence |
|------|--------|----------|
| `--minimal`/`--low-contrast` CLI flags | ✅ Done | `packages/cli/src/config/env.ts` |
| Docker Model Runner (DMR) | ✅ Done | `packages/cli/src/utils/dmrInstaller.ts` — **replaced** llama.cpp (user prefers llama.cpp) |
| Duplicate install guardrails | ✅ Done | `detectExistingInstallation()` |
| Static backup / LLM context separation | ✅ Done | `documentRouter.ts` 3-tier routing |
| Progress spinners | ✅ Done | `@clack/prompts` spinner in `clackGenerationFlow.ts` |
| GraphRAG planning docs | ✅ Done | `docs/PHASE-3-GRAPHRAG-INTEGRATION-PLAN.md` |

### What Was NOT Implemented (Pre-Phase-4)

| Item | Priority | Location |
|------|----------|----------|
| **llama.cpp as local LLM option** | **CRITICAL** | ⚠️ User preference: llama.cpp over DMR. Removed, not disabled. `isLocalLlmEnabled()` only checks DMR. |
| **Mid-flow `--minimal` prompt removal** | **CRITICAL** | `clackGenerationFlow.ts:108-117` — asks twice |
| **API key obfuscation** | **CRITICAL** | `clackWizard.ts:133-145` — plaintext display |
| **`--debug` flag** | High | `debugLogger.ts:12` — ENV-only |
| **Non-interactive mode** | High | **REGRESSED** — `nonInteractive.ts` deleted |
| **Batch TUI integration** | High | `batchInputParser.ts` orphaned |
| Pre-retrieval source correction | Medium | Not implemented |
| Status dashboard on welcome | Medium | Not implemented |
| Multi-model selection | Medium | Hardcoded to Granite 4 Micro |
| "Gateway" terminology removal | Low | Still throughout codebase |

---

## Gap Analysis Status Matrix

| Feature | Status | Evidence |
|---------|--------|----------|
| **DMR Refactoring** | ✅ Complete (Phase 5) | Commit `aaac278`: "complete Phase 5 DMR refactor for setup wizard" |
| **Context7-based Detection** | ✅ Enabled | Commit `9d81155`: "remove NPM pattern matching to enable Context7-based detection" |
| **Graceful LLM Fallback** | ✅ Implemented | Commit `ee38cb8`: "enhance DMR configuration with customizable settings and graceful LLM fallback" |
| **Tavily-first Discovery Pipeline** | ✅ Working | `packages/core/src/ai/webSearch.ts` exists |
| **Docker Model Runner** | ✅ Working | `packages/cli/src/utils/dmrInstaller.ts` with `ai/granite-4.0-micro:latest` (but llama.cpp was removed) |
| **llama.cpp Support** | ❌ Removed | `llamaInstaller.ts` exists but not wired up. User prefers llama.cpp over DMR. |
| **System Keychain Credential Storage** | ✅ Implemented | `packages/cli/src/config/secrets.ts` with three-tier fallback |
| **Full-screen TUI (Ink/Clack)** | ✅ Working | `packages/cli/src/clackApp.ts` implements alternate screen buffer |
| **Parity Tests** | ✅ Green | `tests/integration/parity.spec.ts` present and passing |
| **Monorepo Structure** | ✅ Maintained | `packages/core`, `packages/cli`, `packages/harness-service` |
| **Pre-Phase-4 UX improvements** | ⚠️ ~70% incomplete | See critical finding above |

### Git Branch State

| Branch | Status | Action Needed |
|--------|--------|---------------|
| `dmr-refactor` | **Active** | Keep — current development branch |
| `main` | **Clean** | Keep — stable branch |
| `001-docs-sdp-md` | **Stale** | Delete |
| `cli-workflow-enhancement` | **Stale** | Delete |
| `refactor/llama-tavily-clack` | **Stale** | Delete |
| `origin/claude/investigate-ref-usage-*` | **Stale remote** | Delete |

---

## Changes Made to Agent Instructions

### CLAUDE.md — Complete Rewrite
- **Before:** ~245 lines with duplicate content, missing Linear access standard
- **After:** 99 lines with:
  - Project overview and tech stack
  - Project structure (packages/, tests/, docs/)
  - Development commands
  - Current status (DMR refactoring active)
  - Known issues
  - **Linear access via core-memory** (new agent standard with session-start pattern)
  - Landing the Plane (session completion workflow)
  - Quick links to full documentation

### AGENTS.md — Updated
- **Before:** ~320 lines with content overlapping CLAUDE.md
- **After:** Comprehensive technical reference (~200 lines) with:
  - Required tooling
  - Governance and non-negotiables
  - Testing expectations
  - Technical notes (Discovery Pipeline, Terminal Manager, Credential Storage, CLI Configuration, DMR System)
  - Troubleshooting reference
  - Duplicate "Quick Start" content removed (now in CLAUDE.md)

### Files Not Changed
- `openspec/AGENTS.md` — OpenSpec workflow instructions, fine as-is
- `.resources/CLAUDE.md` — Read-only reference directory instructions, fine as-is
- `.resources/AGENTS.md` — Read-only reference directory instructions, fine as-is

---

## Linear Migration Summary

*(Full summary saved to `LINEAR_MIGRATION_SUMMARY_2026-03-28.md`)*

### Issues Identified for Backlog

| # | Title | Type | Priority | Effort |
|---|-------|------|----------|--------|
| 1 | Complete Pre-Phase-4 UX Gaps (CRITICAL) | Feature | High | M |
| 2 | Restore Batch TUI Integration | Feature | High | M |
| 3 | Pre-Retrieval Source Correction | Feature | Medium | S |
| 4 | Welcome Screen Status Dashboard | Feature | Medium | M |
| 5 | Multi-Model Selection | Feature | Medium | L |
| 6 | Stale Branch Cleanup | Chore | Medium | XS |
| 7 | CLAUDE.md Rewrite | Chore | High | S (DONE) |
| 8 | GitHub Remote Verification | Chore | Medium | XS (DONE) |
| 9 | GraphRAG Phase 3 Integration Spike | Spike | Low | L |
| 10 | Parity Test Coverage Expansion | Feature | Medium | M |
| 11 | "Gateway" Terminology Removal | Chore | Low | XL |

### Suggested Linear Sprint Structure

- **Sprint 1:** UX Critical Fixes (Issues #1, #2, #3, #7 DONE, #8 DONE)
- **Sprint 2:** Dashboard & Model Selection (Issues #4, #5, #6)
- **Sprint 3:** Testing & Future (Issues #9, #10, #11)

---

## Recommended Next Session Starting Point

### Immediate Next Steps

1. **Verify Linear access** — Use core-memory to search for existing legilimens issues and confirm account access:
   ```
   execute_integration_action(accountId: "0b4764e3-a793-4537-89b7-b26eff7b7675", action: "linear_search_issues", params: {query: "legilimens", first: 20})
   ```

2. **Create Linear issues** — Use the updated `LINEAR_MIGRATION_SUMMARY_2026-03-28.md` to populate the backlog (now has 11 issues including Pre-Phase-4 UX gaps)

3. **Delete stale branches** (after Linear issues created):
   ```bash
   git branch -d 001-docs-sdp-md cli-workflow-enhancement refactor/llama-tavily-clack
   git push origin --delete claude/investigate-ref-usage-011CUsZqGQAHYfzM78gbgAUB
   ```

4. **Priority UX fixes to tackle first:**
   - Remove mid-flow `--minimal` prompt from `clackGenerationFlow.ts:108-117`
   - Add API key masking to `clackWizard.ts:133-145`
   - Restore non-interactive mode (was deleted — see `clackApp.ts:46-56` TTY check)

### Context for Next Session

- **Pre-Phase-4 plan** at `docs/PRE-PHASE-4-CLI-REFACTORING.md` — comprehensive but ~70% unimplemented
- **Constitution** governs template/quality: `.specify/memory/constitution.md`
- **DMR system** documented in commits and `docs/guides/DMR_MIGRATION_GUIDE.md`
- **GraphRAG Phase 3** reference at `.resources/graphrag-system/` (read-only)
- **CLAUDE.md** is now the quick entry point (~100 lines)
- **AGENTS.md** contains comprehensive technical reference

### Session Start Pattern (For Next Agent)

```bash
# 1. Search memory for prior context
memory_search("legilimens")

# 2. Check Linear backlog via core-memory
execute_integration_action(accountId: "0b4764e3-a793-4537-89b7-b26eff7b7675", action: "linear_search_issues", params: {query: "legilimens", first: 20})

# 3. Read CLAUDE.md for immediate working context
# 4. Check .agent/ folder for any local session notes
```

---

## Verification Checklist

- [x] All agent instruction files reviewed
- [x] CLAUDE.md rewritten (99 lines, under 120 target)
- [x] AGENTS.md updated (duplicate content removed)
- [x] Gap analysis complete (all documented features verified)
- [x] Pre-Phase-4 execution gap identified via DeepWiki assessment
- [x] Git state documented (stale branches identified)
- [x] LINEAR_MIGRATION_SUMMARY_2026-03-28.md created and updated with UX issues
- [x] PROJECT_RESYNC_2026-03-28.md created and updated
- [x] No code modified/deleted — documentation changes only
- [x] Git status clean (only `.gitattributes` untracked, intentional)

---

## Appendix: Git State Summary

```
Current branch: dmr-refactor
Last commit: 7e81d6b chore: add .beads/ to .gitignore
Remote: https://github.com/KHAEntertainment/legilimens-cli.git
Tracking: origin/dmr-refactor (up to date)

Branches to delete:
- 001-docs-sdp-md (local)
- cli-workflow-enhancement (local)
- refactor/llama-tavily-clack (local)
- origin/claude/investigate-ref-usage-011CUsZqGQAHYfzM78gbgAUB (remote)
```

---

*Report generated by Claude Code Project Cleanup Agent — legilimens-cli resync — 2026-03-28*
*Updated with DeepWiki Pre-Phase-4 assessment findings*
