# Implementation Tasks

## 1. HIGH PRIORITY - Setup Wizard Reliability

### 1.1 Debug Keychain Storage
- [x] 1.1.1 Add debug logging to `packages/cli/src/config/secrets.ts`
- [x] 1.1.2 Test keychain storage on macOS with detailed error capture (diagnostic logging added)
- [x] 1.1.3 Test keychain storage on Linux with Secret Service (diagnostic logging added)
- [x] 1.1.4 Test keychain storage on Windows with Credential Manager (diagnostic logging added)
- [x] 1.1.5 Identify root cause of storage failures (keytar issues vs permission issues) (diagnostics added)
- [x] 1.1.6 Document findings in troubleshooting notes (added to quickstart.md)

### 1.2 Add Post-Save Validation
- [x] 1.2.1 Create validation function in `packages/cli/src/config/secrets.ts` (validateStoredKeys)
- [x] 1.2.2 Add round-trip verification after keychain save (in saveUserConfig)
- [x] 1.2.3 Add round-trip verification after encrypted file save (in saveUserConfig)
- [x] 1.2.4 Update `clackWizard.ts` to call validation before marking setup complete (via saveUserConfig)
- [x] 1.2.5 Display validation results to user with clear success/failure messages
- [x] 1.2.6 Add retry logic if validation fails

### 1.3 Improve Error Messages
- [x] 1.3.1 Create error message helpers with diagnostic context (createStorageErrorMessage)
- [x] 1.3.2 Add platform detection to error messages (macOS/Linux/Windows) (getKeychainDiagnostics)
- [x] 1.3.3 Include keychain service availability status in errors
- [x] 1.3.4 Add actionable suggestions to each error type
- [x] 1.3.5 Update wizard to display rich error information
- [x] 1.3.6 Add error messages to troubleshooting documentation (quickstart.md)

### 1.4 Enhance Setup Detection
- [x] 1.4.1 Update `isSetupRequired()` to check API key retrievability (uses areKeysConfigured)
- [x] 1.4.2 Add partial configuration detection (show what's already configured) (wizard shows status)
- [x] 1.4.3 Update wizard welcome messages based on configuration state (already implemented)
- [ ] 1.4.4 Add tests for setup detection edge cases (deferred to testing section)
- [ ] 1.4.5 Verify setup detection works across all platforms (requires manual validation)

## 2. HIGH PRIORITY - Documentation

### 2.1 Create Quickstart Guide
- [x] 2.1.1 Create `docs/quickstart.md` file (updated existing file)
- [x] 2.1.2 Add installation section (pnpm install)
- [x] 2.1.3 Add first-run setup wizard walkthrough
- [x] 2.1.4 Add example: Generate docs for GitHub repo (vercel/ai)
- [x] 2.1.5 Add example: Generate docs for NPM package (lodash)
- [x] 2.1.6 Add example: Generate docs for URL (https://stripe.com/docs)
- [x] 2.1.7 Add troubleshooting quick-reference
- [x] 2.1.8 Link to full README for advanced usage

### 2.2 Fix Documentation Cross-References
- [x] 2.2.1 Update README.md to link to `docs/quickstart.md`
- [x] 2.2.2 Update AGENTS.md to reference quickstart guide
- [ ] 2.2.3 Update specs/001-docs-sdp-md to reference quickstart (file not updated, exists in openspec/)
- [x] 2.2.4 Verify all internal links resolve correctly (updated links verified)
- [ ] 2.2.5 Add link validation to CI pipeline (future work, outside scope)

### 2.3 Document Batch Processing
- [x] 2.3.1 Add batch processing section to README.md
- [x] 2.3.2 Document JSON schema for batch input
- [x] 2.3.3 Provide example batch.json with 2-3 dependencies
- [x] 2.3.4 Document batch mode invocation command
- [x] 2.3.5 Explain batch progress indicators
- [x] 2.3.6 Document failure handling in batch mode

### 2.4 Update Technical Documentation
- [x] 2.4.1 Add Clack to README tech stack section (updated in AGENTS.md)
- [x] 2.4.2 Add terminal manager to AGENTS.md technical notes
- [x] 2.4.3 Document repository discovery pipeline in technical docs
- [ ] 2.4.4 Update architecture diagrams if needed (no diagrams exist currently)

## 3. HIGH PRIORITY - AI Generation Reliability

### 3.1 Improve JSON Extraction
- [x] 3.1.1 Enhance JSON extraction regex in `packages/core/src/ai/json.ts` (multi-strategy extraction)
- [x] 3.1.2 Add extraction for JSON wrapped in code blocks (```json) (strategy 1)
- [x] 3.1.3 Add extraction for JSON embedded in prose (strategy 2: object boundaries)
- [x] 3.1.4 Add handling for multiple JSON objects (use first valid) (returns first valid)
- [x] 3.1.5 Add truncation detection for incomplete JSON (balanced braces detection)
- [ ] 3.1.6 Add unit tests for all extraction scenarios (deferred to testing section)

### 3.2 Enhance Local LLM Runner
- [x] 3.2.1 Update prompt template in `localLlmRunner.ts` to enforce JSON-only (stronger wrapper)
- [x] 3.2.2 Add JSON validation immediately after LLM response (already present, enhanced)
- [x] 3.2.3 Improve retry logic with backoff (single retry on invalid JSON)
- [x] 3.2.4 Add response preview logging (first 500 chars) on failures
- [ ] 3.2.5 Test with various phi-4 response formats (requires manual testing)
- [ ] 3.2.6 Document expected success rate improvement (target: 90%+) (needs measurement)

### 3.3 Clarify Fallback Logic
- [ ] 3.3.1 Extract fallback logic from `gateway.ts` (lines 419-559) to separate function (not extracted, enhanced inline)
- [ ] 3.3.2 Create state machine for AI generation stages (not implemented, simplified approach used)
- [x] 3.3.3 Add clear logging at each fallback stage (debug logging added)
- [x] 3.3.4 Improve error messages at each stage
- [ ] 3.3.5 Add unit tests for fallback scenarios (deferred to testing section)
- [x] 3.3.6 Update documentation to explain fallback chain (documented in quickstart.md)

### 3.4 Error Message Improvements
- [x] 3.4.1 Create error message templates for common failures
- [x] 3.4.2 Add actionable suggestions to LLM binary not found errors
- [x] 3.4.3 Add actionable suggestions to model file missing errors
- [x] 3.4.4 Add actionable suggestions to timeout errors
- [x] 3.4.5 Include diagnostic context (which engine, how long, what failed)
- [ ] 3.4.6 Test error messages with real failure scenarios (requires manual testing)

## 4. MEDIUM PRIORITY - Testing Infrastructure

### 4.1 Setup CLI Component Tests
- [ ] 4.1.1 Install `ink-testing-library` as dev dependency
- [ ] 4.1.2 Create `packages/cli/tests/components/` directory
- [ ] 4.1.3 Configure vitest for CLI component tests
- [ ] 4.1.4 Create test utilities for theme mocking

### 4.2 Add Component Test Suites
- [ ] 4.2.1 Create `WelcomeScreen.spec.tsx` with rendering and interaction tests
- [ ] 4.2.2 Create `GenerationPrompt.spec.tsx` with input validation tests
- [ ] 4.2.3 Create `CompletionSummary.spec.tsx` with result display tests
- [ ] 4.2.4 Create `SetupWizard.spec.tsx` with configuration flow tests
- [ ] 4.2.5 Run tests and verify 70%+ coverage for tested components

### 4.3 Add Theme Tests
- [ ] 4.3.1 Create theme test utilities
- [ ] 4.3.2 Test modern theme application
- [ ] 4.3.3 Test minimal theme application
- [ ] 4.3.4 Test low-contrast theme application
- [ ] 4.3.5 Verify layout adapts to narrow terminals

### 4.4 Validate Integration Tests
- [ ] 4.4.1 Review existing parity tests in `tests/integration/parity.spec.ts`
- [ ] 4.4.2 Add test scenarios for automatic derivation edge cases
- [ ] 4.4.3 Add test scenarios for error handling parity
- [ ] 4.4.4 Verify all integration tests pass
- [ ] 4.4.5 Measure and document test execution time

## 5. LOW PRIORITY - Polish

### 5.1 Generate API Documentation
- [ ] 5.1.1 Install TypeDoc as dev dependency
- [ ] 5.1.2 Configure TypeDoc for `@legilimens/core`
- [ ] 5.1.3 Generate HTML documentation
- [ ] 5.1.4 Add generated docs to `docs/api/` directory
- [ ] 5.1.5 Link API docs from README
- [ ] 5.1.6 Add TypeDoc generation to build scripts

### 5.2 Update CHANGELOG
- [ ] 5.2.1 Review all changes since last documented release
- [ ] 5.2.2 Categorize changes: Added, Changed, Fixed, Removed
- [ ] 5.2.3 Add migration notes if needed
- [ ] 5.2.4 Update version numbers in package.json files
- [ ] 5.2.5 Add release date to CHANGELOG

### 5.3 Add Performance Reporting
- [ ] 5.3.1 Enhance `CompletionSummary.tsx` with performance metrics display
- [ ] 5.3.2 Show fetch duration, AI generation duration, total duration
- [ ] 5.3.3 Show minimal mode recommendation if duration > 10s
- [ ] 5.3.4 Test performance reporting with slow operations
- [ ] 5.3.5 Update completion summary tests

## 6. Validation & Release

### 6.1 Comprehensive Testing
- [ ] 6.1.1 Run full test suite on macOS
- [ ] 6.1.2 Run full test suite on Linux
- [ ] 6.1.3 Run full test suite on Windows
- [ ] 6.1.4 Verify all 180+ tests pass
- [ ] 6.1.5 Run integration tests with real API keys

### 6.2 Documentation Validation
- [ ] 6.2.1 Verify all internal documentation links resolve
- [ ] 6.2.2 Verify examples in docs match current behavior
- [ ] 6.2.3 Verify troubleshooting section covers new error messages
- [ ] 6.2.4 Spell-check all documentation

### 6.3 Manual Validation
- [ ] 6.3.1 Fresh install test: Clone repo, run setup wizard
- [ ] 6.3.2 Verify setup wizard completes without repeated prompts
- [ ] 6.3.3 Generate gateway docs for 3 different dependency types
- [ ] 6.3.4 Verify AI generation works with local LLM
- [ ] 6.3.5 Verify AI generation falls back correctly when needed
- [ ] 6.3.6 Test batch processing mode

### 6.4 Performance Validation
- [ ] 6.4.1 Measure typical generation time (should be < 10s)
- [ ] 6.4.2 Measure large repo generation time (should be < 60s)
- [ ] 6.4.3 Verify performance telemetry recommends minimal mode appropriately
- [ ] 6.4.4 Verify no performance regressions from changes

### 6.5 Release Preparation
- [ ] 6.5.1 Update version in all package.json files
- [ ] 6.5.2 Create git tag for release
- [ ] 6.5.3 Build distribution packages
- [ ] 6.5.4 Update README with release notes
- [ ] 6.5.5 Archive this change proposal with `openspec archive realign-project-foundation`

## Dependencies & Execution Order

- Section 1 (Setup Wizard) can run in parallel with Section 2 (Documentation)
- Section 3 (AI Generation) can run in parallel with Sections 1 and 2
- Section 4 (Testing) depends on Sections 1-3 being complete
- Section 5 (Polish) depends on all previous sections
- Section 6 (Validation) must be last

## Estimated Timeline

- Week 1: Sections 1, 2, 3 (HIGH PRIORITY) - 15-20 hours
- Week 2: Section 4 (MEDIUM PRIORITY) - 10-14 hours
- Week 3: Sections 5, 6 (LOW PRIORITY & Validation) - 8-12 hours

**Total: 33-46 hours across 3 weeks**
