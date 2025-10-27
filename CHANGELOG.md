# Changelog

## 2025-10-26 - Remove Legacy Ink-based TUI

### Removed
- **Legacy Ink-based TUI components** - Removed 15 orphaned component files (~2000 lines)
  - `packages/cli/src/app.tsx` - Old Ink-based main app
  - `packages/cli/src/components/GenerationFlow.tsx` - Old generation orchestrator
  - `packages/cli/src/components/GenerationPrompt.tsx` - Manual type selection UI
  - `packages/cli/src/components/WelcomeScreen.tsx` - Old welcome screen
  - `packages/cli/src/components/SetupWizard.tsx` - Old setup wizard
  - `packages/cli/src/components/ProgressTimeline.tsx` - Old progress UI
  - `packages/cli/src/components/BatchProgressView.tsx` - Old batch UI
  - `packages/cli/src/components/CompletionSummary.tsx` - Old completion display
  - `packages/cli/src/components/LiveStatus.tsx` - Old status component
  - `packages/cli/src/components/LiveLog.tsx` - Old log component
  - `packages/cli/src/components/PreflightWarnings.tsx` - Old warnings
  - `packages/cli/src/components/ProgressBar.tsx` - Old progress bar
  - `packages/cli/src/components/ProgressUtils.ts` - Old progress utilities
- **Orphaned flow files** - Removed 3 flow files only used by Ink TUI
  - `packages/cli/src/flows/batchGeneration.ts`
  - `packages/cli/src/flows/runGeneration.ts`
  - `packages/cli/src/flows/nonInteractive.ts`
- **Unused dependencies** - Removed Ink and React packages (120 packages total)
  - `ink`, `ink-select-input`, `ink-text-input`, `ink-spinner`
  - `react`, `@types/react`, `@types/ink-spinner`

### Changed
- **CLI now uses Clack exclusively** - Single TUI implementation (AI-powered, no manual type selection)
- **Added @clack/prompts dependency** - Explicitly listed (was implicit before)

### Impact
- ✅ Zero user-facing changes - CLI behavior identical
- ✅ 180+ tests still passing
- ✅ TypeScript compilation clean
- ✅ Codebase reduced by ~2000 lines
- ✅ Dependencies reduced by 120 packages
- ✅ Eliminates confusion about which UI is active

## 2025-10-08 - Phase 7 polish

- `pnpm lint` PASS - typed lint passes with workspace tsconfig projects; tests directories intentionally ignored until dedicated configs land.
- `pnpm test` PASS - core gateway suite green; CLI and harness runners use `--passWithNoTests` pending future coverage.
- `pnpm typecheck` PASS - all packages compile cleanly with NodeNext resolution.
- `pnpm --filter @legilimens/cli build-assets` PASS - external banner from `docs/ascii-art.md` validated within 80 columns and minimal-mode fallback emitted.
- ANSI fallback verified via generated `packages/cli/dist/assets/banner-minimal.txt`; 80-column guardrail enforced during asset build.
- Full-access validation completed 2025-10-08.
