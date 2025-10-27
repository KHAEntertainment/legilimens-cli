# Design Document: Project Foundation Re-alignment

## Context

The Legilimens CLI project audit revealed a solid core architecture (180 passing tests, clean TypeScript workspace) but identified several user-facing reliability issues that degrade the modern agentic CLI experience. The primary issues stem from:

1. **Keychain integration failures**: The keytar library may have platform-specific issues causing setup wizard to repeatedly prompt for API keys
2. **Local LLM JSON extraction brittleness**: phi-4 model sometimes returns prose instead of JSON, causing cascading fallback failures
3. **Documentation gaps**: Missing quickstart.md breaks navigation references across 5+ documentation files

These issues violate constitutional principles requiring "graceful error handling" and "actionable feedback."

### Constraints
- Must maintain backward compatibility (no breaking changes)
- Must work across macOS, Windows, Linux
- Must preserve existing encrypted file fallback for keychain
- Must not introduce new external dependencies for HIGH PRIORITY fixes
- Must complete HIGH PRIORITY fixes before next release

### Stakeholders
- **End Users**: Need reliable setup wizard, want fast onboarding
- **Developers**: Need working documentation links, want clear error messages
- **AI Agents**: Rely on accurate documentation for context
- **Maintainers**: Need test coverage, clear diagnostic logs

## Goals / Non-Goals

### Goals
1. **Reliability**: Setup wizard stores API keys successfully 95%+ of the time
2. **Transparency**: All errors include diagnostic context and actionable suggestions
3. **Completeness**: All documentation references resolve without 404s
4. **Robustness**: AI generation handles edge cases (JSON extraction, fallbacks) gracefully
5. **Testability**: Critical components have unit tests to prevent regressions

### Non-Goals
- **Replacing keychain library**: Will debug and fix keytar issues first; only replace if unfixable
- **Rewriting AI generation**: Will improve error handling and parsing; not redesigning architecture
- **100% test coverage**: Targeting 70%+ for CLI components is sufficient
- **New features**: This is purely a re-alignment effort, no new capabilities
- **Performance optimization**: Performance is already within guardrails (10s/60s)

## Decisions

### Decision 1: Post-Save Validation Pattern

**Choice**: Add round-trip validation immediately after saving API keys to keychain/file.

**Rationale**:
- Catches storage failures before marking setup complete
- Provides immediate feedback to user
- Enables retry without data loss
- Low-cost addition (< 50ms overhead)

**Alternatives Considered**:
1. ❌ **Lazy validation on next launch**: Delays error discovery, poor UX
2. ❌ **Periodic validation background job**: Overly complex for the problem
3. ✅ **Immediate post-save validation**: Simple, effective, immediate feedback

**Implementation**:
```typescript
// In secrets.ts
async function validateStoredKeys(keys: string[]): Promise<boolean> {
  for (const key of keys) {
    const retrieved = await getSecret(key);
    if (!retrieved || retrieved.length === 0) {
      return false;
    }
  }
  return true;
}

// In clackWizard.ts
const saved = await saveConfig(config);
if (!saved || !await validateStoredKeys(Object.keys(config.apiKeys))) {
  console.error("Configuration saved but could not be verified. Please restart wizard.");
  return { success: false };
}
```

### Decision 2: JSON Extraction Strategy

**Choice**: Multi-strategy extraction with fallback parsing.

**Rationale**:
- Different LLMs format JSON differently (code blocks, prose, pure JSON)
- Single regex pattern is too brittle
- Fallback chain maximizes success rate
- Low-cost operation (< 10ms)

**Alternatives Considered**:
1. ❌ **Enforce stricter prompts**: Can't guarantee LLM compliance
2. ❌ **Parse prose for structured data**: Too complex, unreliable
3. ✅ **Multi-strategy extraction**: Handles real-world variance

**Implementation**:
```typescript
// In json.ts
export function extractFirstJson(response: string): string | null {
  // Strategy 1: Look for code block
  const codeBlock = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlock) {
    const parsed = safeParseJson(codeBlock[1]);
    if (parsed) return codeBlock[1];
  }
  
  // Strategy 2: Look for object boundaries
  const objectMatch = response.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    const parsed = safeParseJson(objectMatch[0]);
    if (parsed) return objectMatch[0];
  }
  
  // Strategy 3: Try entire response
  const parsed = safeParseJson(response);
  if (parsed) return response.trim();
  
  return null;
}
```

### Decision 3: Fallback Logic State Machine

**Choice**: Extract fallback logic into separate function with explicit state tracking.

**Rationale**:
- Current implementation is inline in gateway.ts (140+ lines)
- Hard to understand flow and debug failures
- State machine makes stages explicit
- Easier to test and maintain

**Alternatives Considered**:
1. ❌ **Leave inline**: Hard to maintain, test, debug
2. ❌ **Separate module**: Over-engineering for single use case
3. ✅ **Separate function with state machine**: Clean, testable, maintainable

**Implementation**:
```typescript
type AiGenerationStage = 
  | { stage: 'local-llm'; attempt: number }
  | { stage: 'external-cli'; tool: string; attempt: number }
  | { stage: 'fallback-content' };

async function runAiGeneration(
  prompt: string, 
  runtimeConfig: RuntimeConfig
): Promise<{ stage: AiGenerationStage; content: AiGeneratedContent }> {
  // Try local LLM first
  if (isLocalLlmEnabled(runtimeConfig)) {
    const result = await tryLocalLlm(prompt);
    if (result.success) {
      return { stage: { stage: 'local-llm', attempt: result.attempts }, content: result.content };
    }
  }
  
  // Try external CLI tools
  const cliResult = await tryExternalCli(prompt, runtimeConfig);
  if (cliResult.success) {
    return { 
      stage: { stage: 'external-cli', tool: cliResult.tool, attempt: cliResult.attempts },
      content: cliResult.content 
    };
  }
  
  // Fallback content
  const fallback = generateFallbackContent(...);
  return { stage: { stage: 'fallback-content' }, content: fallback };
}
```

### Decision 4: Test Coverage Target

**Choice**: 70% coverage for CLI components, maintain 90%+ for core module.

**Rationale**:
- Core module (business logic) needs higher coverage
- CLI components are thin wrappers, less critical
- Focus on critical paths (setup wizard, error states)
- Diminishing returns above 70% for UI components

**Alternatives Considered**:
1. ❌ **50% coverage**: Too low, critical bugs slip through
2. ❌ **90% coverage**: Overkill for UI components
3. ✅ **70% coverage**: Balances risk and effort

**Focus Areas**:
- ✅ Setup wizard (critical path)
- ✅ Error message rendering
- ✅ Theme switching
- ⚠️ Decorative elements (skip)
- ⚠️ Progress animations (skip)

### Decision 5: Keychain Library Strategy

**Choice**: Debug keytar first, prepare migration plan as backup.

**Rationale**:
- Keytar is widely used, likely configuration issue
- Encrypted file fallback already exists
- Migration is expensive (4-6 hours)
- Debug effort is low (1-2 hours)

**Alternatives Considered**:
1. ❌ **Replace immediately**: Premature, may not be necessary
2. ❌ **Ignore keychain, use file only**: Defeats purpose of secure storage
3. ✅ **Debug first, prepare migration**: Low-risk, efficient

**Migration Candidates** (if needed):
- `keychain` npm package (maintained, simpler API)
- `keyv` with file backend (simpler, more reliable)
- Native Node.js credential storage (future, requires Node 22+)

## Risks / Trade-offs

### Risk 1: Keychain Issues May Be Unfixable

**Description**: Keytar library may have fundamental platform issues we can't resolve.

**Probability**: Medium (30%)

**Impact**: High (blocks setup wizard)

**Mitigation**:
- Encrypted file fallback already exists
- Can make file storage primary with manual keychain opt-in
- Migration plan prepared (see Decision 5)

**Fallback**:
```typescript
// Make file storage primary
const STORAGE_PREFERENCE = process.env.LEGILIMENS_STORAGE || 'file';
if (STORAGE_PREFERENCE === 'file' || !isKeychainAvailable()) {
  return saveToEncryptedFile(secrets);
}
```

### Risk 2: JSON Extraction May Not Reach 90% Success Rate

**Description**: phi-4 model variability may exceed what extraction improvements can handle.

**Probability**: Low (20%)

**Impact**: Medium (users see fallback content more often)

**Mitigation**:
- External CLI tool fallback already exists
- Fallback content is acceptable quality
- Can add prompt engineering improvements iteratively

**Acceptance Criteria**: 
- If local LLM success rate stays below 70%, recommend external CLI tools as primary
- Update documentation to set expectations

### Risk 3: Test Infrastructure Setup May Be Complex

**Description**: ink-testing-library may have compatibility issues with current setup.

**Probability**: Low (15%)

**Impact**: Low (delays test coverage, doesn't block features)

**Mitigation**:
- Well-documented library with active community
- Can skip CLI component tests for initial release if needed
- Core module tests already provide good coverage

### Risk 4: Documentation Updates May Reveal More Gaps

**Description**: Fixing quickstart.md may expose other outdated documentation.

**Probability**: High (60%)

**Impact**: Low (more work, but doesn't block features)

**Mitigation**:
- Limit scope to documented gaps in this proposal
- Log additional gaps for future proposals
- Set up documentation link validation in CI (future)

## Migration Plan

### Phase 1: Setup & Validation (Week 1)

**Day 1-2**: Setup Wizard Fixes
1. Add debug logging to secrets.ts
2. Test keychain on all platforms
3. Implement post-save validation
4. Update wizard to use validation
5. Test end-to-end on macOS/Linux/Windows

**Day 3**: Documentation
1. Create docs/quickstart.md
2. Update cross-references in README, AGENTS.md
3. Validate all links resolve

**Day 4-5**: AI Generation
1. Enhance JSON extraction in json.ts
2. Update localLlmRunner.ts prompt
3. Test with various phi-4 outputs
4. Extract fallback logic to separate function
5. Add comprehensive error messages

**Validation**: 
- Setup wizard works on all platforms without repeated prompts
- All documentation links resolve
- Local LLM success rate measured (baseline vs improved)

### Phase 2: Testing & Polish (Week 2-3)

**Week 2**: Testing Infrastructure
1. Install ink-testing-library
2. Create component test suites
3. Achieve 70%+ coverage for critical components
4. Validate integration tests still pass

**Week 3**: Polish & Release
1. Generate TypeDoc API documentation
2. Update CHANGELOG
3. Final validation on all platforms
4. Release preparation

**Rollback Plan**:
- Each change is independent and can be reverted individually
- Git branches for each major change
- Keep encrypted file fallback as safety net
- Can skip testing/polish sections without breaking features

### Migration for Users

**No user action required** - all changes are backward compatible:
- Existing encrypted file secrets.json still works
- Existing configurations auto-upgraded
- No API changes
- No configuration changes

## Open Questions

### Question 1: Keychain Library Replacement?

**Context**: If keytar debugging reveals unfixable issues.

**Options**:
1. Migrate to `keychain` npm package
2. Migrate to `keyv` with file backend
3. Make encrypted file storage primary

**Decision Criteria**:
- If keytar works on 2/3 platforms → keep with platform-specific fallback
- If keytar fails on all platforms → migrate to `keychain`
- If migration time > 8 hours → make file storage primary

**Timeline**: Decide after platform testing (Day 2)

### Question 2: JSON Extraction Success Rate Target?

**Context**: 90% may be aspirational depending on phi-4 variance.

**Options**:
1. Keep 90% target, invest in prompt engineering
2. Lower to 75% target, accept more fallbacks
3. Recommend external CLI tools as primary

**Decision Criteria**:
- Measure baseline after current improvements
- If baseline > 85% → keep 90% target
- If baseline 70-85% → lower to 75%
- If baseline < 70% → recommend external CLI primary

**Timeline**: Decide after JSON extraction improvements (Day 5)

### Question 3: Test Coverage Enforcement?

**Context**: Should we add coverage gates to CI?

**Options**:
1. Add coverage threshold to vitest config
2. Add coverage reporting only (no enforcement)
3. Skip coverage tooling for now

**Decision Criteria**:
- If tests are stable and useful → add threshold
- If tests are flaky → reporting only
- If tests are too slow → skip for now

**Timeline**: Decide after test infrastructure complete (Week 2)

### Question 4: Documentation Consolidation?

**Context**: We have docs/, openspec/specs/, specs/001-docs-sdp-md/.

**Options**:
1. Consolidate all in docs/
2. Keep separation (specs for governance, docs for users)
3. Add navigation guide explaining structure

**Decision Criteria**:
- Different audiences need different docs
- Specs are governance/planning, docs are usage
- Navigation guide is sufficient

**Timeline**: Add navigation guide in quickstart.md

### Question 5: Release Timing?

**Context**: When should HIGH PRIORITY fixes ship?

**Options**:
1. Ship immediately after Week 1
2. Wait for all testing (Week 2)
3. Wait for full polish (Week 3)

**Decision Criteria**:
- If setup wizard fix is critical → ship Week 1
- If testing reveals regressions → wait Week 2
- If no urgency → wait Week 3 for complete release

**Timeline**: Decide after HIGH PRIORITY validation (Week 1 end)

## Implementation Notes

### Testing Strategy

**Unit Tests**:
- Core module: Target 90%+ coverage (already achieved)
- CLI components: Target 70%+ for critical paths
- Focus on error cases and edge conditions

**Integration Tests**:
- Parity tests: CLI module vs harness service
- End-to-end tests: Setup wizard → generation → completion
- Platform tests: macOS, Linux, Windows

**Manual Tests**:
- Fresh install on clean machine
- Setup wizard flow with various configurations
- Generation with all dependency types
- Error scenarios (missing keys, failed AI, etc.)

### Performance Considerations

**No performance degradation expected**:
- Post-save validation: < 50ms overhead
- JSON extraction: < 10ms overhead
- Separated fallback logic: No runtime impact
- Test infrastructure: Dev-time only

**Performance improvements**:
- Better error messages reduce user time debugging
- Reliable setup reduces repeated wizard launches
- Improved JSON extraction reduces fallback attempts

### Security Considerations

**No new security risks**:
- Keychain validation uses read-only operations
- Encrypted file permissions already restrictive (0600)
- No new credential storage mechanisms
- No new network requests

**Security improvements**:
- Post-save validation catches storage failures early
- Better diagnostic logging helps identify permission issues
- Clear error messages prevent users from exposing credentials in bug reports

### Maintenance Considerations

**Reduced maintenance burden**:
- Better error messages reduce support requests
- Test coverage prevents regressions
- Separated fallback logic easier to modify
- Documentation completeness reduces confusion

**Ongoing maintenance**:
- Keep quickstart.md in sync with CLI changes
- Monitor keychain library for updates
- Track local LLM success rates in telemetry
- Update tests when components change

## Success Metrics

### Immediate (Week 1)
- [ ] Setup wizard success rate > 95% across all platforms
- [ ] Zero 404s in documentation cross-references
- [ ] Local LLM JSON extraction baseline measured

### Short-term (Week 2-3)
- [ ] Local LLM success rate > 85% (target 90%)
- [ ] CLI component test coverage > 70%
- [ ] All integration tests pass
- [ ] Zero test failures on macOS/Linux/Windows

### Long-term (Post-release)
- [ ] Setup wizard support requests reduced by 50%+
- [ ] AI generation failures reduced by 30%+
- [ ] Documentation-related issues reduced by 80%+
- [ ] First-time user success rate > 95%

## Appendix

### Related Documents
- Constitution: `.specify/memory/constitution.md`
- SDP: `docs/sdp.md`
- Tasks Spec: `specs/001-docs-sdp-md/tasks.md`
- Agent Handbook: `AGENTS.md`

### Code References
- Setup wizard: `packages/cli/src/wizard/clackWizard.ts`
- Secrets storage: `packages/cli/src/config/secrets.ts`
- JSON extraction: `packages/core/src/ai/json.ts`
- Local LLM: `packages/core/src/ai/localLlmRunner.ts`
- Gateway fallback: `packages/core/src/gateway.ts:419-559`

### External Resources
- keytar documentation: https://github.com/atom/node-keytar
- ink-testing-library: https://github.com/vadimdemedes/ink-testing-library
- TypeDoc: https://typedoc.org/
