# Remove Legacy Ink-based TUI

## Why

The Legilimens CLI currently contains two complete UI implementations:

1. **Clack-based TUI** (active) - Modern, AI-powered with automatic dependency type detection via `detectSourceTypeWithAI()`
2. **Ink-based TUI** (orphaned) - Old implementation with manual type selection prompts

The Ink-based components (`app.tsx`, 12+ component files in `components/`) are no longer imported or used anywhere in the codebase. The entry point (`bin/legilimens.ts`) explicitly calls `runClackApp()`, not the old Ink-based `App` component.

This orphaned code creates confusion about which workflow is active. Recent user feedback highlighted this issue - the documentation (`docs/Legilimens CLI - How It Works.md`) describes the AI-powered Clack workflow, but the presence of manual selection components in the codebase suggested both approaches might be active. This violates the project's principle of clarity and creates unnecessary maintenance burden.

## What Changes

### Code Cleanup
- **Remove** 15+ orphaned Ink-based TUI components from `packages/cli/src/`
- **Remove** orphaned flow files that were only used by Ink TUI
- **Verify** no imports or dependencies remain
- **Update** package.json to remove unused Ink dependencies (if safe)

### Files to Remove

**Main App:**
1. `packages/cli/src/app.tsx` - Old Ink-based main app (~400 lines)

**Components (all in `packages/cli/src/components/`):**
2. `GenerationFlow.tsx` - Old generation orchestrator
3. `GenerationPrompt.tsx` - Manual type selection UI (the source of confusion)
4. `WelcomeScreen.tsx` - Old welcome screen
5. `SetupWizard.tsx` - Old setup wizard (replaced by `clackWizard.ts`)
6. `ProgressTimeline.tsx` - Old progress UI
7. `BatchProgressView.tsx` - Old batch UI
8. `CompletionSummary.tsx` - Old completion display
9. `LiveStatus.tsx` - Old status component
10. `LiveLog.tsx` - Old log component
11. `PreflightWarnings.tsx` - Old warnings
12. `ProgressBar.tsx` - Old progress bar

**Flow Files (if orphaned):**
13. `packages/cli/src/flows/batchGeneration.ts` - Only if not imported by Clack
14. `packages/cli/src/flows/runGeneration.ts` - Only if not imported by Clack
15. `packages/cli/src/flows/nonInteractive.ts` - Only if not imported by Clack

**Utility Files:**
16. Any `ProgressUtils.ts` or similar utilities only used by removed components

### Files to Keep (Active Clack-based System)
- ✅ `packages/cli/bin/legilimens.ts` - Entry point
- ✅ `packages/cli/src/clackApp.ts` - Clack-based main app
- ✅ `packages/cli/src/flows/clackGenerationFlow.ts` - AI-powered generation
- ✅ `packages/cli/src/wizard/clackWizard.ts` - Clack-based setup wizard
- ✅ `packages/cli/src/config/` - All config modules
- ✅ `packages/cli/src/utils/` - All utilities
- ✅ `packages/cli/src/assets/` - All assets

### Dependencies to Review
- Check if `ink`, `ink-select-input`, `ink-text-input`, `ink-spinner` can be removed from `package.json`
- Keep only what's needed by remaining code (check for any Clack components that might still use Ink)

## Impact

### Affected Specs
Since no specs exist yet, this change will not modify any specs. However, when specs are created in the future, they should document only the Clack-based architecture.

### Affected Code
- **Remove**: `packages/cli/src/app.tsx` and 14+ component/flow files (~2000 lines)
- **Keep unchanged**: All Clack-based files (`clackApp.ts`, `clackWizard.ts`, `clackGenerationFlow.ts`)
- **Update**: `packages/cli/package.json` dependencies (remove unused Ink packages if safe)

### Breaking Changes
**NONE** - These files are not imported or used anywhere. The CLI behavior is identical before and after this change.

### Migration Required
**NONE** - No user-facing changes, purely internal cleanup. Users will not notice any difference.

## Dependencies

### Internal
- Must verify no hidden imports exist before deletion (comprehensive grep search)
- Should run full test suite to ensure no runtime dependencies
- Must verify Clack components don't use any Ink imports

### External
- None - this is purely code cleanup

## Risks

### Low Risk
- **Accidental deletion of needed code**: Comprehensive grep verification + full test suite will catch this
- **Mitigation**: Thorough verification phase, run all tests before/after

### Very Low Risk
- **Breaking someone's local development**: Unlikely since files aren't used
- **Mitigation**: Clear communication in commit message and CHANGELOG

### Minimal Risk
- **Future need for archived code**: Can always recover from git history
- **Mitigation**: Git history serves as permanent archive

## Success Criteria

### Measurable Outcomes
1. ✅ Zero imports of removed files remain in codebase (verified by grep)
2. ✅ All 180+ existing tests pass
3. ✅ TypeScript compilation succeeds without errors
4. ✅ CLI starts and runs without errors (`pnpm --filter @legilimens/cli start`)
5. ✅ ~2000+ lines of code removed from project
6. ✅ Codebase file count reduced by 15+ files

### User Validation
- CLI behavior unchanged - users see no difference in functionality
- AI-powered dependency type detection still works
- Setup wizard still works
- Generation flow still works
- Codebase is clearer for future development
- No confusion about which UI implementation is active

## Timeline Estimate

**Total: 1-2 hours**

- **30 minutes**: Verification phase (grep searches, import analysis)
- **30 minutes**: Deletion phase (remove files, update dependencies)
- **30 minutes**: Validation phase (tests, typecheck, runtime verification)
- **30 minutes**: Documentation phase (CHANGELOG, final checks)

## Open Questions

1. **Should we archive or delete?** 
   - Archive: Move to `packages/cli/src/_archived/legacy-ink-tui/`
   - Delete: Remove entirely (can recover from git history)
   - **Decision**: Delete - git history is sufficient archive, no need for extra directory

2. **Can we remove Ink dependencies?**
   - Need to verify if anything else uses `ink`, `ink-select-input`, `ink-text-input`, `ink-spinner`
   - **Action**: Check all imports before removing from package.json
   - **Conservative approach**: Keep dependencies if there's any doubt

3. **Are flow files (batchGeneration.ts, runGeneration.ts) orphaned?**
   - Need to verify if Clack components import these
   - **Action**: Comprehensive grep before deletion
   - **Conservative approach**: Only delete if 100% certain they're orphaned
