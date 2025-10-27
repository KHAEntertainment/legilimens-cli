# Re-align Project Foundation

## Why

Following a comprehensive project audit, several gaps were identified between documented capabilities and actual implementation. While the core architecture is solid (180 passing tests, clean TypeScript workspace), critical user-facing features have reliability issues that impact the onboarding experience. The setup wizard repeatedly prompts for API keys due to keychain storage failures, local LLM JSON extraction has edge cases causing fallback failures, and missing quickstart documentation breaks navigation references across the project.

These issues violate the constitution's operational guardrails requiring "graceful error handling" and "actionable feedback" while degrading the modern agentic CLI user experience documented in specs/001-docs-sdp-md.

## What Changes

### HIGH PRIORITY (User-Blocking Issues)
- **Fix setup wizard API key persistence** - Keychain storage/retrieval failing, causing repeated prompts
- **Create missing quickstart documentation** - Referenced in 5+ files but doesn't exist
- **Improve local LLM JSON extraction** - phi-4 sometimes returns prose instead of JSON

### MEDIUM PRIORITY (UX Improvements)
- Add CLI component unit tests using ink-testing-library
- Document batch processing JSON format
- Refactor AI fallback logic for clarity

### LOW PRIORITY (Polish)
- Generate TypeDoc API reference for @legilimens/core
- Update CHANGELOG with recent work
- Add performance reporting to completion summary

### Documentation Drift Corrections
- Update README to mention Clack integration
- Add terminal manager to AGENTS.md technical notes
- Document repository discovery pipeline feature

## Impact

### Affected Specs
- **setup-wizard** (NEW) - Currently no spec, needs creation with ADDED requirements
- **documentation** (NEW) - Currently no spec, needs creation for quickstart docs
- **ai-generation** (MODIFY) - Improve JSON extraction and fallback reliability
- **testing** (NEW) - Add CLI component test requirements

### Affected Code
- **HIGH PRIORITY**:
  - `packages/cli/src/config/secrets.ts` - Keychain integration debug
  - `packages/cli/src/wizard/clackWizard.ts` - Post-save validation
  - `docs/quickstart.md` - CREATE new file
  - `packages/core/src/ai/localLlmRunner.ts` - JSON extraction improvement
  - `packages/core/src/ai/json.ts` - Robust fallback parsing
  
- **MEDIUM PRIORITY**:
  - `packages/cli/tests/` - CREATE directory with ink-testing-library tests
  - `README.md` - Document batch JSON schema
  - `packages/core/src/gateway.ts` - Extract fallback logic (lines 419-559)
  
- **LOW PRIORITY**:
  - `package.json` - Add TypeDoc dependency
  - `CHANGELOG.md` - Document all changes
  - `packages/cli/src/components/CompletionSummary.tsx` - Performance report

### Breaking Changes
**NONE** - All changes are additive fixes or documentation improvements.

### Migration Required
**NONE** - Existing configurations remain compatible.

## Dependencies

### Internal
- Setup wizard fix must complete before next release
- Quickstart docs should be created before other documentation updates
- AI generation improvements can proceed in parallel with wizard fixes

### External
- No new external dependencies required
- Existing keychain libraries (keytar) may need upgrade/replacement if issues persist

## Risks

### High Risk
- **Keychain integration may need replacement** - If debugging reveals fundamental keytar issues, may need to migrate to alternative library
- **Mitigation**: Encrypted file fallback already exists, can make it primary path

### Medium Risk  
- **Local LLM JSON extraction may require prompt template changes** - Could affect all LLM integrations
- **Mitigation**: Extensive testing with phi-4 model, fallback to external CLI tools already exists

### Low Risk
- **Documentation updates may reveal more gaps** - Cascading documentation work
- **Mitigation**: Limit scope to documented issues, defer others to future proposals

## Success Criteria

### Measurable Outcomes
1. Setup wizard successfully stores API keys on first attempt (95%+ success rate)
2. Local LLM JSON extraction success rate improves from ~60% to 90%+
3. All documentation references resolve without 404s
4. Zero test failures after all changes applied
5. CLI component test coverage reaches 70%+ for core components

### User Validation
- First-time user can complete setup without repeated prompts
- Developers can navigate all documentation links successfully
- AI generation produces valid output without manual intervention 95%+ of the time

## Timeline Estimate

### Week 1: Critical Fixes (HIGH PRIORITY)
- Days 1-2: Fix setup wizard API key persistence (6-8 hours)
- Day 3: Create quickstart documentation (1-2 hours)
- Days 4-5: Improve local LLM JSON extraction (4-6 hours)

### Week 2: UX Improvements (MEDIUM PRIORITY)  
- Days 1-2: Add CLI component unit tests (6-8 hours)
- Day 3: Document batch processing (2-3 hours)
- Days 4-5: Refactor AI fallback logic (4-6 hours)

### Week 3: Polish (LOW PRIORITY)
- Day 1: Update CHANGELOG (1-2 hours)
- Day 2: Generate API documentation (2-3 hours)
- Days 3-5: Final testing and validation (6-8 hours)

**Total Estimated Effort**: 32-46 hours across 3 weeks

## Open Questions

1. **Keychain library replacement**: Should we migrate from keytar to a more actively maintained library (e.g., keychain, keyv) or make encrypted file storage the primary method?
   
2. **JSON extraction strategy**: Should we enforce stricter JSON-only mode in phi-4 prompts or add more lenient parsing that extracts JSON from mixed content?

3. **Test coverage target**: Is 70% CLI component coverage sufficient, or should we aim for 90%+ given the critical nature of setup wizard?

4. **Documentation consolidation**: Should we consolidate docs/ and openspec/ documentation or keep them separate for different audiences?

5. **Release timing**: Should all HIGH PRIORITY fixes be completed before next release, or can quickstart docs be deferred to a patch release?
