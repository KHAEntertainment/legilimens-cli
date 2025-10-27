# Implementation Tasks

## 1. Verification Phase

### 1.1 Verify Orphaned Status - Main App
- [ ] 1.1.1 Run `rg "from.*['\"].*app" packages/cli/src --type ts` to find imports of app.tsx
- [ ] 1.1.2 Run `rg "import.*App.*from" packages/cli/src --type ts` to find App component imports
- [ ] 1.1.3 Verify `bin/legilimens.ts` only calls `runClackApp()`, not the old `App`
- [ ] 1.1.4 Document findings - should be zero imports

### 1.2 Verify Orphaned Status - Components
- [ ] 1.2.1 Run `rg "GenerationFlow" packages/cli/src --type ts -l` - should only show the file itself
- [ ] 1.2.2 Run `rg "GenerationPrompt" packages/cli/src --type ts -l` - should only show the file itself
- [ ] 1.2.3 Run `rg "WelcomeScreen" packages/cli/src --type ts -l` - should only show the file itself and app.tsx
- [ ] 1.2.4 Run `rg "SetupWizard" packages/cli/src --type ts -l` - should only show the file itself and app.tsx
- [ ] 1.2.5 Run `rg "ProgressTimeline" packages/cli/src --type ts -l` - should only show related component files
- [ ] 1.2.6 Run `rg "BatchProgressView" packages/cli/src --type ts -l` - should only show related component files
- [ ] 1.2.7 Run `rg "CompletionSummary" packages/cli/src --type ts -l` - should only show related component files
- [ ] 1.2.8 Document any unexpected imports found

### 1.3 Verify Orphaned Status - Flow Files
- [ ] 1.3.1 Run `rg "batchGeneration" packages/cli/src --type ts -l` to check imports
- [ ] 1.3.2 Run `rg "runGeneration" packages/cli/src --type ts -l` to check imports
- [ ] 1.3.3 Run `rg "nonInteractive" packages/cli/src --type ts -l` to check imports
- [ ] 1.3.4 Determine which flow files are safe to remove (only if no imports from Clack code)

### 1.4 Identify Ink Dependencies
- [ ] 1.4.1 Check `packages/cli/package.json` for `ink` dependencies
- [ ] 1.4.2 Run `rg "from 'ink'" packages/cli/src --type ts` to find remaining Ink imports
- [ ] 1.4.3 Run `rg "from 'ink-" packages/cli/src --type ts` to find Ink plugin imports
- [ ] 1.4.4 Determine if Ink packages can be safely removed from package.json

### 1.5 Baseline Testing
- [ ] 1.5.1 Run `pnpm test` and record current test count and results (should be 180+ passing)
- [ ] 1.5.2 Run `pnpm typecheck` to ensure clean TypeScript compilation
- [ ] 1.5.3 Run `pnpm --filter @legilimens/cli start -- --help` to verify CLI works

## 2. Removal Phase

### 2.1 Remove Main App File
- [ ] 2.1.1 Delete `packages/cli/src/app.tsx`
- [ ] 2.1.2 Verify deletion with `ls packages/cli/src/app.tsx` (should fail)

### 2.2 Remove Component Files
- [ ] 2.2.1 Delete `packages/cli/src/components/GenerationFlow.tsx`
- [ ] 2.2.2 Delete `packages/cli/src/components/GenerationPrompt.tsx`
- [ ] 2.2.3 Delete `packages/cli/src/components/WelcomeScreen.tsx`
- [ ] 2.2.4 Delete `packages/cli/src/components/SetupWizard.tsx`
- [ ] 2.2.5 Delete `packages/cli/src/components/ProgressTimeline.tsx`
- [ ] 2.2.6 Delete `packages/cli/src/components/BatchProgressView.tsx`
- [ ] 2.2.7 Delete `packages/cli/src/components/CompletionSummary.tsx`
- [ ] 2.2.8 Delete `packages/cli/src/components/LiveStatus.tsx`
- [ ] 2.2.9 Delete `packages/cli/src/components/LiveLog.tsx`
- [ ] 2.2.10 Delete `packages/cli/src/components/PreflightWarnings.tsx`
- [ ] 2.2.11 Delete `packages/cli/src/components/ProgressBar.tsx`
- [ ] 2.2.12 Check for `packages/cli/src/components/ProgressUtils.ts` and delete if exists

### 2.3 Remove Orphaned Flow Files (Conditional)
- [ ] 2.3.1 If `batchGeneration.ts` is orphaned (verified in 1.3.1), delete it
- [ ] 2.3.2 If `runGeneration.ts` is orphaned (verified in 1.3.2), delete it
- [ ] 2.3.3 If `nonInteractive.ts` is orphaned (verified in 1.3.3), delete it
- [ ] 2.3.4 Document which flow files were kept (if any) and why

### 2.4 Update Dependencies (Conditional)
- [ ] 2.4.1 Review Ink-related packages in `packages/cli/package.json`
- [ ] 2.4.2 If no imports found in 1.4.2-1.4.3, remove `ink` from dependencies
- [ ] 2.4.3 If no imports found, remove `ink-select-input` from dependencies
- [ ] 2.4.4 If no imports found, remove `ink-text-input` from dependencies
- [ ] 2.4.5 If no imports found, remove `ink-spinner` from dependencies
- [ ] 2.4.6 If any Ink packages removed, run `pnpm install` to update lockfile
- [ ] 2.4.7 If keeping Ink packages, document why (e.g., "Still used by X component")

## 3. Validation Phase

### 3.1 Build Verification
- [ ] 3.1.1 Run `pnpm --filter @legilimens/cli typecheck` - Should pass with no errors
- [ ] 3.1.2 Run `pnpm --filter @legilimens/core typecheck` - Should pass with no errors
- [ ] 3.1.3 Run `pnpm --filter @legilimens/cli build` - Should succeed
- [ ] 3.1.4 Check for any "Cannot find module" errors - should be none

### 3.2 Test Verification
- [ ] 3.2.1 Run `pnpm test` - Should pass all 180+ tests (same count as baseline)
- [ ] 3.2.2 Verify no new test failures introduced
- [ ] 3.2.3 Check for import errors or missing module errors in test output
- [ ] 3.2.4 If any tests fail, investigate and fix before proceeding

### 3.3 Runtime Verification
- [ ] 3.3.1 Run `pnpm --filter @legilimens/cli start -- --help` - Should display help
- [ ] 3.3.2 Run `pnpm --filter @legilimens/cli start -- --version` - Should display version
- [ ] 3.3.3 Run interactive mode: `pnpm --filter @legilimens/cli start` - Should show Clack menu
- [ ] 3.3.4 Test setup wizard flow - Should work normally
- [ ] 3.3.5 Test generation flow with a simple dependency (e.g., "lodash") - Should complete
- [ ] 3.3.6 Verify AI detection shows: "Detecting dependency source and type with AI"
- [ ] 3.3.7 Verify NO manual type selection prompt appears
- [ ] 3.3.8 Verify generation completes with either success or graceful fallback

### 3.4 Import Verification (Post-Deletion)
- [ ] 3.4.1 Run `rg "from.*app\.tsx" packages/cli --type ts` - Should be empty
- [ ] 3.4.2 Run `rg "GenerationFlow|GenerationPrompt|WelcomeScreen" packages/cli --type ts` - Should be empty
- [ ] 3.4.3 Run `rg "from 'ink'" packages/cli/src --type ts` - Should be empty (if Ink removed)
- [ ] 3.4.4 Verify no broken imports exist

## 4. Documentation Phase

### 4.1 Update CHANGELOG
- [ ] 4.1.1 Add entry under "Internal" or "Removed" section
- [ ] 4.1.2 Entry text: "Removed legacy Ink-based TUI components (internal cleanup, no user impact)"
- [ ] 4.1.3 Note: "~2000 lines of unused code removed; Clack-based TUI is sole implementation"
- [ ] 4.1.4 Include list of removed files for transparency

### 4.2 Verify Documentation Accuracy
- [ ] 4.2.1 Re-read `docs/Legilimens CLI - How It Works.md`
- [ ] 4.2.2 Verify it accurately describes current Clack workflow (should already be correct)
- [ ] 4.2.3 Verify AGENTS.md reflects current architecture (single TUI implementation)
- [ ] 4.2.4 Update any references to "dual UI" or "alternative implementations" (if found)

### 4.3 Update README (if needed)
- [ ] 4.3.1 Check if README mentions Ink components
- [ ] 4.3.2 Remove any outdated technical stack references to unused Ink components
- [ ] 4.3.3 Ensure README reflects current Clack-based architecture

## 5. Final Checks

### 5.1 Git Review
- [ ] 5.1.1 Run `git status` to see all changes
- [ ] 5.1.2 Review git diff to ensure only intended files removed/modified
- [ ] 5.1.3 Verify no accidental deletions of active code
- [ ] 5.1.4 Check that `clackApp.ts`, `clackWizard.ts`, `clackGenerationFlow.ts` are NOT in deleted files
- [ ] 5.1.5 Verify `package.json` changes are intentional (if any)

### 5.2 Commit Changes
- [ ] 5.2.1 Stage all changes: `git add -A`
- [ ] 5.2.2 Commit with clear message: "Remove legacy Ink-based TUI components

- Removes orphaned app.tsx and 12+ component files
- Removes unused Ink dependencies from package.json
- No user-facing changes; Clack TUI remains sole implementation
- Reduces codebase by ~2000 lines"

### 5.3 Archive Proposal
- [ ] 5.3.1 Run `openspec archive remove-legacy-ink-tui --yes`
- [ ] 5.3.2 Verify proposal moved to `openspec/changes/archive/`
- [ ] 5.3.3 Run `openspec validate --strict` to confirm archive succeeded

## Dependencies & Execution Order

### Sequential Dependencies
- **Phase 1 must complete before Phase 2** - Cannot delete until verification confirms safety
- **Phase 2 must complete before Phase 3** - Cannot validate what hasn't been removed
- **Phase 3 must pass before Phase 4** - Don't document broken changes
- **Phase 4 must complete before Phase 5** - Final checks include documentation review

### Parallelizable Work
- Tasks within Phase 1 can run in any order
- Tasks within Phase 2 can run in any order (but do 2.1 first for safety)
- Tasks within Phase 3 should run sequentially (build → test → runtime)
- Tasks within Phase 4 can run in any order

### Critical Path
1. Verification (1.1-1.4) → 2. Deletion (2.1-2.4) → 3. Validation (3.1-3.3) → 4. Documentation → 5. Commit

## Estimated Timeline

- **Phase 1 (Verification)**: 30 minutes
  - Comprehensive grep searches: 15 min
  - Baseline testing: 15 min
- **Phase 2 (Removal)**: 30 minutes
  - File deletion: 10 min
  - Dependency updates: 10 min
  - Re-install: 10 min
- **Phase 3 (Validation)**: 30 minutes
  - Build/typecheck: 5 min
  - Test suite: 10 min
  - Runtime verification: 15 min
- **Phase 4 (Documentation)**: 20 minutes
  - CHANGELOG update: 10 min
  - Documentation review: 10 min
- **Phase 5 (Final Checks)**: 10 minutes
  - Git review: 5 min
  - Commit: 5 min

**Total: 2 hours**

## Rollback Plan

If any validation fails:
1. **Don't commit** - Keep changes local
2. **Investigate** - Determine what broke and why
3. **Decide**: 
   - Fix the issue and continue
   - Or `git checkout -- .` to rollback completely
4. **Re-verify** - Full validation must pass before committing

## Success Indicators

✅ All verification steps pass (no unexpected imports found)
✅ All files successfully deleted
✅ TypeScript compiles without errors
✅ All 180+ tests pass
✅ CLI runs successfully in interactive mode
✅ AI-powered generation flow works
✅ No manual type selection prompts appear
✅ Git diff shows only intended changes
✅ CHANGELOG updated
✅ Proposal successfully archived
