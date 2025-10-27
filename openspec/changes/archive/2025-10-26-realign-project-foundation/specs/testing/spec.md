## ADDED Requirements

### Requirement: CLI Component Unit Tests
The CLI package SHALL include unit tests for critical Ink components using ink-testing-library, achieving 70%+ coverage for user-facing components.

#### Scenario: WelcomeScreen component tests
- **GIVEN** WelcomeScreen component exists
- **WHEN** test suite executes
- **THEN** tests verify ASCII banner rendering
- **AND** tests verify navigation options display (Continue, Skip, Quit)
- **AND** tests verify keyboard interaction handling
- **AND** tests verify minimal mode fallback rendering

#### Scenario: GenerationPrompt component tests
- **GIVEN** GenerationPrompt component handles user input
- **WHEN** test suite executes
- **THEN** tests verify dependency identifier prompt renders
- **AND** tests verify dependency type selection renders
- **AND** tests verify input validation (empty string rejection)
- **AND** tests verify form submission behavior

#### Scenario: CompletionSummary component tests
- **GIVEN** CompletionSummary displays generation results
- **WHEN** test suite executes
- **THEN** tests verify success summary rendering
- **AND** tests verify artifact paths display
- **AND** tests verify performance metrics display
- **AND** tests verify next action options (Again, Quit)

#### Scenario: SetupWizard component tests
- **GIVEN** SetupWizard handles configuration
- **WHEN** test suite executes
- **THEN** tests verify API key prompts render
- **AND** tests verify optional vs required field handling
- **AND** tests verify setup completion confirmation
- **AND** tests verify skip functionality

### Requirement: Theme Switching Tests
The CLI SHALL validate that theme profiles (modern, minimal, low-contrast) apply correctly to components.

#### Scenario: Modern theme application
- **GIVEN** modern theme is active
- **WHEN** components render
- **THEN** ASCII art is enabled
- **AND** gradients are applied
- **AND** color palette uses vivid Legilimens branding
- **AND** max content width is 80 columns

#### Scenario: Minimal theme application
- **GIVEN** minimal theme is active
- **WHEN** components render
- **THEN** ASCII art is disabled
- **AND** plain text header is shown instead
- **AND** color usage is reduced
- **AND** layout remains clear and functional

#### Scenario: Low-contrast theme application
- **GIVEN** low-contrast theme is active
- **WHEN** components render
- **THEN** color palette uses muted tones
- **AND** text remains legible
- **AND** layout adapts to narrow terminals (80 columns)

### Requirement: Integration Test Coverage
The test suite SHALL include integration tests validating CLI and harness service parity.

#### Scenario: Parity test execution
- **GIVEN** integration test suite runs
- **WHEN** parity tests execute
- **THEN** tests create temporary workspace
- **AND** tests run same scenario through CLI core module and harness service
- **AND** tests normalize outputs for comparison
- **AND** tests verify outputs match exactly
- **AND** tests clean up temporary files

#### Scenario: Automatic derivation parity
- **GIVEN** dependency requires automatic MCP tool derivation
- **WHEN** parity test runs without explicit deepWikiRepository
- **THEN** CLI core derives DeepWiki URL for GitHub repos
- **AND** harness service derives same URL
- **AND** both set correct MCP guidance flags
- **AND** normalized outputs match

### Requirement: Test Infrastructure
The testing setup SHALL support efficient test execution and debugging.

#### Scenario: Test execution speed
- **GIVEN** test suite contains 200+ tests
- **WHEN** developer runs full test suite
- **THEN** all tests complete in under 15 seconds
- **AND** unit tests run in parallel
- **AND** integration tests run sequentially

#### Scenario: Test isolation
- **GIVEN** tests modify file system or environment
- **WHEN** test executes
- **THEN** test creates temporary directory for operations
- **AND** test restores environment variables after completion
- **AND** test cleans up all created files
- **AND** test failures do not affect subsequent tests

#### Scenario: Debug mode support
- **GIVEN** developer needs to debug failing test
- **WHEN** test runs with --debug flag
- **THEN** test outputs verbose logging
- **AND** test preserves temporary files for inspection
- **AND** test displays exact assertion failures with context
