## REMOVED Requirements

### Requirement: Legacy Ink-based TUI Components
The CLI SHALL NOT include the orphaned Ink-based TUI implementation. Only the Clack-based TUI implementation shall remain.

#### Scenario: Ink-based App Component Removed
- **GIVEN** the legacy Ink-based TUI code exists in `packages/cli/src/app.tsx`
- **WHEN** the removal is completed
- **THEN** `packages/cli/src/app.tsx` no longer exists
- **AND** no imports of the old App component remain in the codebase
- **AND** the CLI continues to function normally using Clack-based components

#### Scenario: Ink-based UI Components Removed
- **GIVEN** the legacy Ink components exist in `packages/cli/src/components/`
- **WHEN** the removal is completed
- **THEN** files like `GenerationFlow.tsx`, `GenerationPrompt.tsx`, `WelcomeScreen.tsx`, etc. no longer exist
- **AND** no imports of these components remain
- **AND** the Clack-based components continue to provide the same functionality

#### Scenario: Manual Type Selection Removed
- **GIVEN** the old `GenerationPrompt.tsx` provided manual dependency type selection
- **WHEN** the removal is completed
- **THEN** users can no longer see manual type selection prompts
- **AND** only AI-powered automatic type detection via `detectSourceTypeWithAI()` is available
- **AND** the CLI workflow matches the documented behavior in "How It Works.md"

#### Scenario: Orphaned Flow Files Removed
- **GIVEN** flow files like `batchGeneration.ts`, `runGeneration.ts`, `nonInteractive.ts` may be orphaned
- **WHEN** verification confirms they are only imported by removed Ink components
- **THEN** these orphaned flow files are removed
- **AND** if they are still used by Clack components, they remain in the codebase
- **AND** only truly orphaned files are deleted

#### Scenario: Unused Ink Dependencies Removed
- **GIVEN** the `packages/cli/package.json` may contain Ink-related dependencies
- **WHEN** verification confirms no remaining code imports from Ink packages
- **THEN** unused Ink dependencies are removed from `package.json`
- **AND** if any Clack components still use Ink, those dependencies remain
- **AND** `pnpm install` updates the lockfile accordingly

## MODIFIED Requirements

None - This change only removes code; it does not modify existing behavior.

## ADDED Requirements

None - This change only removes code; it does not add new behavior.
