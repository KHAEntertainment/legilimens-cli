# Detection Pipeline Testing & Validation Guide

## Overview

This document provides comprehensive testing and validation procedures for the detection pipeline refactor (Phases 1-8). The refactor transformed the system from regex-based pattern matching to an intelligent, multi-layered approach.

### What Changed

**Old Architecture (Pre-Refactor):**
- Regex patterns for NPM packages (caused false positives like "strappi" → NPM)
- Natural language heuristic blocked AI for lowercase inputs
- No Context7 search integration
- Tavily called for everything (slow, redundant)
- No user validation for ambiguous results

**New Architecture (Post-Refactor):**
- Pattern detection only for GitHub/URL (high confidence)
- Context7 search for NPM packages (fast, typo-tolerant)
- User selection for ambiguous Context7 results
- Tavily fallback for GitHub/official docs (Context7 excluded)
- Manual URL fallback as final safety net
- Comprehensive debug logging throughout

### Eight Phases Implemented

1. **Phase 1**: NPM pattern removal from `sourceDetector.ts`
2. **Phase 2**: `looksNaturalLanguage` heuristic removal
3. **Phase 3**: Manual URL fallback implementation
4. **Phase 4**: Context7 search API integration
5. **Phase 5**: Context7-first detection pipeline
6. **Phase 6**: User selection for multiple Context7 results
7. **Phase 7**: Tavily query optimization (Context7 excluded)
8. **Phase 8**: Comprehensive debug logging

### Purpose

This document validates that all eight phases work correctly end-to-end through systematic testing of five critical scenarios covering typo correction, natural language detection, pattern matching, and user interaction flows.

---

## Prerequisites

Before running tests, ensure the following requirements are met:

### 1. Enable Debug Mode

```bash
export LEGILIMENS_DEBUG=true
```

Debug mode enables comprehensive logging throughout the detection pipeline, showing exactly which detection paths are taken and why.

### 2. Verify API Keys

Ensure the following API keys are configured:

- **Context7**: `CONTEXT7_API_KEY` (required for NPM package search)
- **Tavily**: `TAVILY_API_KEY` (required for GitHub/official docs search)
- **Firecrawl**: `FIRECRAWL_API_KEY` (required for URL content fetching)

Check configuration:

```bash
# Via environment variables
echo $CONTEXT7_API_KEY
echo $TAVILY_API_KEY
echo $FIRECRAWL_API_KEY

# Or via setup wizard
pnpm --filter @legilimens/cli start
# Select "Configure API Keys" from wizard
```

### 3. Verify Docker Model Runner (Optional)

If using local LLM for AI generation:

```bash
docker ps | grep model-runner
# Should show running container
```

If not running:

```bash
# Start Docker Model Runner
docker run -d -p 8000:8000 --name model-runner \
  ghcr.io/docker/model-runner:latest
```

### 4. Clean Configuration (Recommended)

For clean testing, consider resetting configuration:

```bash
# Backup existing config
cp ~/.legilimens/config.json ~/.legilimens/config.json.backup

# Remove config to trigger fresh setup
rm ~/.legilimens/config.json

# Re-run setup wizard
pnpm --filter @legilimens/cli start
```

### 5. Build the CLI

```bash
# Production build
pnpm build

# Or use dev mode for testing
pnpm --filter @legilimens/cli dev
```

---

## Test Scenario 1: Typo Correction via Context7

**Purpose**: Validate that Context7 corrects typos in package names and auto-selects high-confidence matches.

### Input

```
strappi
```

*(lowercase typo for "strapi")*

### Expected Behavior

1. Pattern detection returns `unknown` (no NPM patterns anymore)
2. Context7 search called with query "strappi"
3. Context7 returns single result: `{name: "strapi", score: 0.85-0.95}`
4. Auto-select because score > 0.8
5. Return `{sourceType: 'npm', normalizedIdentifier: 'strapi', confidence: 'high', aiAssisted: false}`
6. Tavily NOT called (Context7 succeeded)
7. Generation proceeds with "strapi" package

### Expected Debug Logs

```
[detector] Starting detection for "strappi"
[detector] Pattern detection result: unknown (low)
[detector] Context7 API key: configured
[detector] Attempting Context7 search for "strappi"
[detector] Calling Context7 search API
[context7] Search started: query="strappi", attempt=1
[context7] Search completed: 1 results for "strappi" in 245ms
[context7] Top matches: strapi (0.85)
[detector] Context7 search: success
[detector] Context7 search completed: 1 results
[detector] Top 3 matches: strapi (0.85)
[detector] Context7 high-confidence match: strapi (score: 0.85)
[detector] Returning immediately, skipping Tavily
[detector] Routing: auto-select
```

### Actual Results

**Test Execution:**
- [ ] Test executed: Yes/No
- [ ] Context7 called: Yes/No
- [ ] Typo corrected: Yes/No (strappi → strapi)
- [ ] Tavily skipped: Yes/No
- [ ] Source type: ________________
- [ ] Normalized identifier: ________________
- [ ] Confidence: ________________
- [ ] AI assisted: ________________
- [ ] Duration: ________________

**Debug Log Verification:**
- [ ] Pattern detection logged: Yes/No
- [ ] Context7 search logged: Yes/No
- [ ] Auto-select routing logged: Yes/No
- [ ] Tavily skip logged: Yes/No

**Issues Encountered:**

```
(Describe any problems, unexpected behaviors, or deviations from expected results)
```

---

## Test Scenario 2: Natural Language via Tavily

**Purpose**: Validate that natural language queries fall back to Tavily when Context7 has no results.

### Input

```
OpenAI Codex
```

*(natural language with capitals and space)*

### Expected Behavior

1. Pattern detection returns `unknown` (not a GitHub identifier or URL)
2. Context7 search called with query "OpenAI Codex"
3. Context7 returns no results (not an NPM package)
4. Fall back to Tavily pipeline
5. Tavily searches GitHub and official docs (Context7 excluded)
6. Tavily finds GitHub repository: `github.com/openai/codex`
7. Return `{sourceType: 'github', normalizedIdentifier: 'openai/codex', confidence: 'high', aiAssisted: true}`
8. Generation proceeds with GitHub source

### Expected Debug Logs

```
[detector] Starting detection for "OpenAI Codex"
[detector] Pattern detection result: unknown (low)
[detector] Context7 API key: configured
[detector] Attempting Context7 search for "OpenAI Codex"
[detector] Calling Context7 search API
[context7] Search started: query="OpenAI Codex", attempt=1
[context7] Search completed: 0 results for "OpenAI Codex" in 312ms
[detector] Context7 search: success
[detector] Context7 search completed: 0 results
[detector] Context7 found no results, falling back to Tavily
[detector] Calling Tavily pipeline (Context7 search completed with no actionable results)
[pipeline] Discovering repository for: "OpenAI Codex"
[webSearch] Tavily query: "Find the official GitHub repository or documentation website for OpenAI Codex..."
[webSearch] Search options: maxResults=10, excludeDomains=["context7.com","context7.ai"]
[webSearch] Tavily response received: 5 results
[webSearch] Classification: 3 GitHub, 2 official, 0 other
[webSearch] Source recommendation: github (high)
[pipeline] Tavily found 5 results
[pipeline] Using Tavily's high-confidence recommendation: github
[pipeline] Extracting GitHub identifier from URL: https://github.com/openai/codex
[pipeline] Extracted GitHub identifier: openai/codex
```

### Actual Results

**Test Execution:**
- [ ] Test executed: Yes/No
- [ ] Context7 called: Yes/No
- [ ] Context7 results count: ________________
- [ ] Tavily called: Yes/No
- [ ] Source type: ________________
- [ ] GitHub identifier extracted: ________________
- [ ] Confidence: ________________
- [ ] AI assisted: ________________
- [ ] Duration: ________________

**Debug Log Verification:**
- [ ] Context7 no results logged: Yes/No
- [ ] Tavily fallback logged: Yes/No
- [ ] Context7 exclusion in Tavily query: Yes/No
- [ ] GitHub extraction logged: Yes/No

**Issues Encountered:**

```
(Describe any problems, unexpected behaviors, or deviations from expected results)
```

---

## Test Scenario 3: GitHub Identifier Pattern Match

**Purpose**: Validate that canonical GitHub identifiers are detected instantly without API calls.

### Input

```
vercel/ai
```

*(canonical GitHub identifier)*

### Expected Behavior

1. Pattern detection returns `{sourceType: 'github', normalizedIdentifier: 'vercel/ai', confidence: 'high'}`
2. High-confidence match → return immediately
3. Context7 NOT called (pattern match succeeded)
4. Tavily NOT called (pattern match succeeded)
5. Return `{sourceType: 'github', normalizedIdentifier: 'vercel/ai', confidence: 'high', aiAssisted: false}`
6. Generation proceeds with GitHub source

### Expected Debug Logs

```
[detector] Starting detection for "vercel/ai"
[detector] Pattern detection result: github (high)
[detector] High-confidence github match, skipping AI pipeline
```

### Actual Results

**Test Execution:**
- [ ] Test executed: Yes/No
- [ ] Pattern match succeeded: Yes/No
- [ ] Context7 skipped: Yes/No
- [ ] Tavily skipped: Yes/No
- [ ] Source type: ________________
- [ ] Normalized identifier: ________________
- [ ] Confidence: ________________
- [ ] AI assisted: ________________
- [ ] Duration: ________________ (should be <100ms - fast path)

**Debug Log Verification:**
- [ ] Pattern detection logged: Yes/No
- [ ] AI pipeline skip logged: Yes/No
- [ ] No Context7 logs present: Yes/No
- [ ] No Tavily logs present: Yes/No

**Issues Encountered:**

```
(Describe any problems, unexpected behaviors, or deviations from expected results)
```

---

## Test Scenario 4: URL Pattern Match

**Purpose**: Validate that direct URLs are detected instantly without API calls.

### Input

```
https://docs.example.com
```

*(direct URL)*

### Expected Behavior

1. Pattern detection returns `{sourceType: 'url', normalizedIdentifier: 'https://docs.example.com', confidence: 'high'}`
2. High-confidence match → return immediately
3. Context7 NOT called (pattern match succeeded)
4. Tavily NOT called (pattern match succeeded)
5. Return `{sourceType: 'url', normalizedIdentifier: 'https://docs.example.com', confidence: 'high', aiAssisted: false}`
6. Generation proceeds with URL source (Firecrawl)

### Expected Debug Logs

```
[detector] Starting detection for "https://docs.example.com"
[detector] Pattern detection result: url (high)
[detector] High-confidence url match, skipping AI pipeline
```

### Actual Results

**Test Execution:**
- [ ] Test executed: Yes/No
- [ ] Pattern match succeeded: Yes/No
- [ ] Context7 skipped: Yes/No
- [ ] Tavily skipped: Yes/No
- [ ] Source type: ________________
- [ ] Normalized identifier: ________________
- [ ] Confidence: ________________
- [ ] AI assisted: ________________
- [ ] Duration: ________________ (should be <100ms - fast path)

**Debug Log Verification:**
- [ ] Pattern detection logged: Yes/No
- [ ] AI pipeline skip logged: Yes/No
- [ ] No Context7 logs present: Yes/No
- [ ] No Tavily logs present: Yes/No

**Issues Encountered:**

```
(Describe any problems, unexpected behaviors, or deviations from expected results)
```

---

## Test Scenario 5A: Ambiguous Input with User Selection

**Purpose**: Validate that multiple Context7 results trigger user selection and re-detection works correctly.

### Input

```
react
```

*(could match multiple packages)*

### Expected Behavior

1. Pattern detection returns `unknown` (NPM patterns removed)
2. Context7 search called with query "react"
3. Context7 returns multiple results: `[{name: "react", score: 0.95}, {name: "react-dom", score: 0.87}, {name: "react-router", score: 0.82}]`
4. Return `{sourceType: 'unknown', confidence: 'low', context7Results: [...]}`
5. UI shows selection prompt with 3 packages + "None of these"
6. User selects "react"
7. Re-detection runs with "react"
8. Context7 returns single result: `{name: "react", score: 0.95}`
9. Auto-select and return `{sourceType: 'npm', normalizedIdentifier: 'react', confidence: 'high'}`
10. Generation proceeds with "react" package

### Expected Debug Logs

```
[detector] Starting detection for "react"
[detector] Pattern detection result: unknown (low)
[detector] Context7 API key: configured
[detector] Attempting Context7 search for "react"
[context7] Search started: query="react", attempt=1
[context7] Search completed: 3 results for "react" in 278ms
[context7] Top matches: react (0.95), react-dom (0.87), react-router (0.82)
[detector] Context7 search: success
[detector] Context7 search completed: 3 results
[detector] Top 3 matches: react (0.95), react-dom (0.87), react-router (0.82)
[detector] Multiple matches require user selection (Phase 6)
[detector] Routing: user-selection (enableSelection option set to true)
[GenerationFlow] Multiple Context7 results found (count: 3)
[GenerationFlow] Showing package selection prompt
[GenerationFlow] User selection: react
[GenerationFlow] Re-running detection with selected package
[detector] Starting detection for "react"
[detector] Context7 search completed: 1 results
[detector] Context7 high-confidence match: react (score: 0.95)
[detector] Routing: auto-select
```

### Actual Results

**Test Execution:**
- [ ] Test executed: Yes/No
- [ ] Context7 returned multiple results: Yes/No (count: ___)
- [ ] Selection prompt shown: Yes/No
- [ ] All packages displayed correctly: Yes/No
- [ ] "None of these" option shown: Yes/No
- [ ] User selection worked: Yes/No
- [ ] Re-detection succeeded: Yes/No
- [ ] Final source type: ________________
- [ ] Final normalized identifier: ________________
- [ ] Duration: ________________

**Debug Log Verification:**
- [ ] Multiple results logged: Yes/No
- [ ] User selection routing logged: Yes/No
- [ ] Selection prompt logged: Yes/No
- [ ] Re-detection logged: Yes/No
- [ ] Auto-select after re-detection: Yes/No

**Issues Encountered:**

```
(Describe any problems, unexpected behaviors, or deviations from expected results)
```

---

## Test Scenario 5B: User Selects "None of these"

**Purpose**: Validate that declining Context7 suggestions triggers Tavily fallback without manual URL prompt.

### Input

```
react
```

*(same as 5A)*

### Expected Behavior

1. Context7 returns multiple results (same as 5A)
2. Selection prompt shown
3. User selects "None of these - search with Tavily instead"
4. `userDeclinedContext7` flag set to `true`
5. Re-detection runs with `enableSelection: false` to force Tavily path
6. Tavily searches for "react" on GitHub and official docs
7. Tavily finds official React documentation or GitHub repo
8. Return with Tavily's recommendation
9. Manual URL prompt is **skipped** (user already declined suggestions)
10. Generation proceeds with Tavily's result

### Expected Debug Logs

```
[detector] Starting detection for "react"
[detector] Context7 search completed: 3 results
[detector] Top 3 matches: react (0.95), react-dom (0.87), react-router (0.82)
[detector] Multiple matches require user selection (Phase 6)
[detector] Routing: user-selection
[GenerationFlow] Multiple Context7 results found (count: 3)
[GenerationFlow] Showing package selection prompt
[GenerationFlow] User selection: null
[GenerationFlow] User declined Context7 suggestions, triggering Tavily fallback
[GenerationFlow] Calling detectSourceTypeWithAI with selection disabled
[detector] Calling Tavily pipeline
[pipeline] Discovering repository for: "react"
[webSearch] Tavily query: "Find the official GitHub repository or documentation website for react..."
[webSearch] Search options: maxResults=10, excludeDomains=["context7.com","context7.ai"]
[webSearch] Tavily response received: 8 results
[pipeline] Tavily found 8 results
[pipeline] Using Tavily's high-confidence recommendation: github
```

### Actual Results

**Test Execution:**
- [ ] Test executed: Yes/No
- [ ] "None of these" option shown: Yes/No
- [ ] User declined logged: Yes/No
- [ ] Tavily fallback triggered: Yes/No
- [ ] Manual URL prompt skipped: Yes/No
- [ ] Final source type: ________________
- [ ] Final normalized identifier: ________________
- [ ] Duration: ________________

**Debug Log Verification:**
- [ ] User decline logged: Yes/No
- [ ] Tavily fallback logged: Yes/No
- [ ] Selection disabled in re-detection: Yes/No
- [ ] Manual URL prompt not shown: Yes/No

**Issues Encountered:**

```
(Describe any problems, unexpected behaviors, or deviations from expected results)
```

---

## Debug Log Analysis Guide

This section provides a reference guide for interpreting debug logs during testing.

### Log Prefix Meanings

- `[detector]`: Source detection logic in `packages/core/src/detection/sourceDetector.ts`
- `[pipeline]`: Repository discovery pipeline in `packages/core/src/ai/repositoryDiscoveryPipeline.ts`
- `[webSearch]`: Tavily search in `packages/core/src/ai/webSearch.ts`
- `[context7]`: Context7 API calls in `packages/core/src/fetchers/context7.ts`
- `[GenerationFlow]`: CLI flow orchestration in `packages/cli/src/flows/clackGenerationFlow.ts`

### Key Log Patterns

#### Pattern Match Fast Path

```
[detector] Pattern detection result: github (high)
[detector] High-confidence github match, skipping AI pipeline
```

**Interpretation**: GitHub or URL pattern matched, AI pipeline skipped for performance. Expected for inputs like `vercel/ai` or `https://docs.example.com`.

#### Context7 Auto-Select Path

```
[detector] Context7 search completed: 1 results
[detector] Context7 high-confidence match: strapi (score: 0.85)
[detector] Routing: auto-select
```

**Interpretation**: Context7 found single high-score result, Tavily skipped. Expected for typo corrections like `strappi → strapi`.

#### Context7 User Selection Path

```
[detector] Context7 found 3 results
[detector] Top 3 matches: react (0.95), react-dom (0.87), react-router (0.82)
[detector] Routing: user-selection
[GenerationFlow] Showing package selection prompt
```

**Interpretation**: Multiple Context7 results, user must choose. Expected for popular packages with many variants.

#### Tavily Fallback Path

```
[detector] Context7 found no results, falling back to Tavily
[detector] Calling Tavily pipeline (Context7 search completed with no actionable results)
[pipeline] Discovering repository for: "OpenAI Codex"
[webSearch] Tavily query: "Find the official GitHub repository or documentation website for OpenAI Codex..."
```

**Interpretation**: Context7 had no matches, Tavily searching GitHub/official docs. Expected for non-NPM packages and natural language queries.

#### Manual URL Fallback Path

```
[detector] Calling Tavily pipeline
[pipeline] Tavily found 0 results
[GenerationFlow] Could not auto-detect source
[GenerationFlow] Showing manual URL prompt
[GenerationFlow] User provided manual URL: https://example.com/docs
```

**Interpretation**: All automated detection failed, user providing URL manually. Expected for unknown/obscure packages.

---

## Troubleshooting

This section provides solutions for common issues encountered during testing.

### Issue: Context7 search not being called

**Symptom**: Debug logs show `[detector] Context7 API key: missing`

**Solution**: 
1. Set `CONTEXT7_API_KEY` in environment or run setup wizard
2. Verify key is valid (not expired or revoked)

**Verification**:
```bash
echo $CONTEXT7_API_KEY
# Should output your API key

# Or check via wizard
pnpm --filter @legilimens/cli start
# Select "Configure API Keys" → "Context7 API Key"
```

---

### Issue: Selection prompt not showing for multiple results

**Symptom**: Multiple Context7 results but no selection prompt appears

**Root Cause**: `enableSelection: true` not passed to `detectSourceTypeWithAI()` in `clackGenerationFlow.ts:97`

**Solution**: 
1. Verify `enableSelection: true` is set in the detection call
2. Check that `context7Results` array is populated
3. Ensure `alreadySelectedFromContext7` flag is not preventing re-prompt

**Verification**:
```
[detector] Routing: user-selection (enableSelection option set to true)
[GenerationFlow] Showing package selection prompt
```

---

### Issue: Tavily being called for NPM packages

**Symptom**: Debug logs show Tavily query for packages like "react" or "express"

**Root Cause**: Context7 search is not returning results (API key issue, network problem, or rate limiting)

**Solution**:
1. Verify Context7 API key is configured
2. Check network connectivity to Context7 API
3. Review Context7 API quota/rate limits
4. Check for Context7 error messages in logs

**Verification**:
```
[detector] Context7 search: success
[detector] Context7 search completed: X results
```

If you see `[detector] Context7 search: error` or `Context7 API key: missing`, the issue is with Context7 configuration.

---

### Issue: Pattern match not working for GitHub identifiers

**Symptom**: `vercel/ai` triggers Context7/Tavily instead of pattern match

**Root Cause**: Input format is not exactly `owner/repo` (extra slashes, spaces, or special characters)

**Solution**:
1. Verify input format is exactly `owner/repo` (no `https://`, no trailing `/`)
2. Check for whitespace or special characters
3. Review pattern detection regex in `sourceDetector.ts`

**Verification**:
```
[detector] Pattern detection result: github (high)
[detector] High-confidence github match, skipping AI pipeline
```

**Valid formats**:
- ✅ `vercel/ai`
- ✅ `facebook/react`
- ❌ `https://github.com/vercel/ai` (URL pattern, not GitHub identifier)
- ❌ `vercel/ai/` (trailing slash)
- ❌ `vercel / ai` (spaces)

---

### Issue: Manual URL prompt showing when it shouldn't

**Symptom**: Manual URL prompt appears even after successful detection

**Root Cause**: `detection.sourceType` is `unknown` or `userDeclinedContext7` flag is not being set correctly

**Solution**:
1. Check if detection actually returned `unknown`
2. Verify `userDeclinedContext7` flag is set when user selects "None of these"
3. Check spinner stop message for "Source detected: unknown"

**Verification**:
```
[GenerationFlow] Source detected: npm (confidence: high)
# Manual URL prompt should NOT appear

[GenerationFlow] Source detected: unknown (confidence: low)
# Manual URL prompt SHOULD appear (unless user declined Context7)
```

---

### Issue: Infinite loop in selection prompt

**Symptom**: Selection prompt shows repeatedly for the same package

**Root Cause**: `alreadySelectedFromContext7` flag is not being set correctly (line 116 in `clackGenerationFlow.ts`)

**Solution**:
1. Verify flag is set after first selection
2. Check that re-detection uses the selected package name
3. Ensure guard condition prevents re-showing prompt

**Verification**:
```
[GenerationFlow] User selection: react
[GenerationFlow] Re-running detection with selected package
[detector] Starting detection for "react"
[detector] Context7 high-confidence match: react (score: 0.95)
[detector] Routing: auto-select
# Prompt should NOT appear again
```

---

## Performance Benchmarks

This section documents expected timing for each detection path.

### Fast Path (Pattern Match)

**GitHub Identifier** (`vercel/ai`):
- **Expected**: <100ms
- **No API calls**: Pure regex matching
- **Log signature**: `High-confidence github match, skipping AI pipeline`

**URL** (`https://docs.example.com`):
- **Expected**: <100ms
- **No API calls**: Pure regex matching
- **Log signature**: `High-confidence url match, skipping AI pipeline`

---

### Context7 Auto-Select Path

**Single High-Score Result** (`strappi → strapi`):
- **Expected**: 200-500ms
- **Includes**: Context7 API call + response parsing
- **Tavily skipped**: Saves 2-5 seconds
- **Log signature**: `Context7 high-confidence match: strapi (score: 0.85)`

---

### Context7 User Selection Path

**Multiple Results** (`react`):
- **Expected**: 200-500ms + user interaction time
- **Includes**: Context7 API call + selection prompt + re-detection
- **Total**: ~1-3 seconds (depending on user response time)
- **Log signature**: `Routing: user-selection`

---

### Tavily Fallback Path

**Context7 No Results** (`OpenAI Codex`):
- **Expected**: 2-5 seconds
- **Includes**: Context7 attempt + Tavily search + LLM interpretation (if needed)
- **Slower**: But handles edge cases like GitHub repos and official docs
- **Log signature**: `Context7 found no results, falling back to Tavily`

---

### Manual URL Fallback Path

**All Detection Failed** (`unknown-package-xyz`):
- **Expected**: 5-10 seconds + user interaction time
- **Includes**: Context7 + Tavily + manual URL prompt + re-detection
- **Slowest**: But ensures user can always proceed
- **Log signature**: `Could not auto-detect source`

---

## Validation Checklist

This section provides a comprehensive checklist for marking the refactor complete.

### Phase 1: NPM Pattern Removal

- [ ] NPM patterns removed from `sourceDetector.ts` (packages/core/src/detection/sourceDetector.ts)
- [ ] "react" returns `unknown` (not `npm`)
- [ ] "@types/node" returns `unknown` (not `npm`)
- [ ] "express" returns `unknown` (not `npm`)
- [ ] GitHub patterns still work: "vercel/ai" → `github`
- [ ] URL patterns still work: "https://..." → `url`

**Verification Test**:
```bash
# Input: react
# Expected: [detector] Pattern detection result: unknown (low)
```

---

### Phase 2: Natural Language Check Removal

- [ ] `looksNaturalLanguage` check removed from `sourceDetector.ts`
- [ ] Lowercase inputs call AI: "strappi" → Context7/Tavily
- [ ] Capitalized inputs call AI: "OpenAI Codex" → Context7/Tavily
- [ ] Mixed case inputs call AI: "CoPilotKit" → Context7/Tavily
- [ ] High-confidence matches skip AI: "vercel/ai" → immediate return
- [ ] High-confidence matches skip AI: "https://..." → immediate return

**Verification Test**:
```bash
# Input: strappi (lowercase)
# Expected: [detector] Attempting Context7 search for "strappi"

# Input: OpenAI Codex (capitalized)
# Expected: [detector] Attempting Context7 search for "OpenAI Codex"
```

---

### Phase 3: Manual URL Fallback

- [ ] Manual URL prompt shows when detection returns `unknown`
- [ ] Validation requires `://` or `github.com/` in user input
- [ ] Re-detection runs with user-provided URL
- [ ] User cancellation exits gracefully (no crash)
- [ ] Manual URL prompt **skipped** when user declined Context7

**Verification Test**:
```bash
# Input: unknown-package-xyz
# Expected: Manual URL prompt appears after Context7 + Tavily fail

# Input: react → select "None of these"
# Expected: Tavily fallback triggered, manual URL prompt skipped
```

---

### Phase 4: Context7 Search API

- [ ] `searchContext7()` function implemented in `context7.ts` (packages/core/src/fetchers/context7.ts)
- [ ] API key validation works (early guard prevents calls without key)
- [ ] Retry logic with exponential backoff (3 attempts: 0ms, 1000ms, 2000ms)
- [ ] Rate limiting handled (429 status returns empty results, not error)
- [ ] Empty results return `{success: true, results: []}` (not error)
- [ ] Network errors handled gracefully (fallback to Tavily)

**Verification Test**:
```bash
# Temporarily remove Context7 API key
unset CONTEXT7_API_KEY

# Input: strappi
# Expected: [detector] Context7 API key: missing
# Expected: [detector] Calling Tavily pipeline
```

---

### Phase 5: Context7 Integration

- [ ] Context7 search called **before** Tavily in detection flow
- [ ] Single high-score result (>0.8) returns immediately (Tavily skipped)
- [ ] Multiple results stored in `context7Results` field
- [ ] No results fall back to Tavily (not error)
- [ ] Context7 errors fall back to Tavily gracefully (not crash)

**Verification Test**:
```bash
# Input: strappi
# Expected: [detector] Context7 high-confidence match: strapi (score: 0.85)
# Expected: [detector] Returning immediately, skipping Tavily

# Input: OpenAI Codex
# Expected: [detector] Context7 found no results, falling back to Tavily
```

---

### Phase 6: User Selection

- [ ] Selection prompt shows for multiple Context7 results
- [ ] Each option displays name, score, and URL
- [ ] "None of these - search with Tavily instead" option shown
- [ ] User selection triggers re-detection with selected package
- [ ] Infinite loop prevented by `alreadySelectedFromContext7` guard flag
- [ ] User cancellation (Ctrl+C) exits gracefully

**Verification Test**:
```bash
# Input: react (if multiple results)
# Expected: Selection prompt with 3 packages + "None of these"
# Expected: After selection, re-detection runs
# Expected: No infinite loop (prompt appears only once)
```

---

### Phase 7: Tavily Query Optimization

- [ ] Tavily query excludes Context7 references in prompt
- [ ] Query focuses on GitHub and official docs
- [ ] Domain exclusion: `excludeDomains: ['context7.com', 'context7.ai']`
- [ ] Tavily results don't include Context7 URLs in response

**Verification Test**:
```bash
# Input: OpenAI Codex
# Expected: [webSearch] Search options: maxResults=10, excludeDomains=["context7.com","context7.ai"]
# Expected: [webSearch] Tavily response received: X results
# Verify: No context7.com URLs in Tavily results
```

---

### Phase 8: Debug Logging

- [ ] All logs use correct prefixes: `[detector]`, `[pipeline]`, `[webSearch]`, `[context7]`, `[GenerationFlow]`
- [ ] Pattern detection decisions logged
- [ ] Context7 search flow logged (query, results, routing)
- [ ] Tavily search flow logged (query, response, classification)
- [ ] LLM interpretation logged (prompt, response, validation) if used
- [ ] All routing decisions logged (auto-select, user-selection, Tavily fallback)
- [ ] Logs only appear when `LEGILIMENS_DEBUG=true` (silent in production)

**Verification Test**:
```bash
# Without debug mode
unset LEGILIMENS_DEBUG
# Input: strappi
# Expected: No debug logs in console

# With debug mode
export LEGILIMENS_DEBUG=true
# Input: strappi
# Expected: All [detector] and [context7] logs visible
```

---

## Integration Testing

This section provides guidance for end-to-end testing of the complete generation flow.

### Test 1: Complete Flow with Context7 Success

**Objective**: Verify typo correction and full document generation with Context7 auto-select.

**Steps**:
1. Run: `pnpm --filter @legilimens/cli start`
2. Input: "strappi" (typo for "strapi")
3. Verify: Context7 corrects to "strapi"
4. Verify: Generation completes successfully
5. Verify: Gateway doc created at `docs/frameworks/framework_strapi.md` (or appropriate category)
6. Verify: Static backup created at `docs/frameworks/static-backup/framework_strapi.md`

**Expected Outcome**:
- ✅ Detection: `{sourceType: 'npm', normalizedIdentifier: 'strapi'}`
- ✅ Duration: <500ms for detection
- ✅ Document created with correct template structure
- ✅ Static backup exists

---

### Test 2: Complete Flow with Tavily Fallback

**Objective**: Verify natural language detection and GitHub repository documentation.

**Steps**:
1. Run: `pnpm --filter @legilimens/cli start`
2. Input: "OpenAI Codex"
3. Verify: Context7 returns no results
4. Verify: Tavily finds GitHub repository
5. Verify: Generation completes successfully
6. Verify: Gateway doc created for GitHub source
7. Verify: Static backup created

**Expected Outcome**:
- ✅ Detection: `{sourceType: 'github', normalizedIdentifier: 'openai/codex'}`
- ✅ Duration: 2-5 seconds for detection
- ✅ Document created with GitHub metadata
- ✅ Static backup exists

---

### Test 3: Complete Flow with User Selection

**Objective**: Verify user selection workflow for ambiguous inputs.

**Steps**:
1. Run: `pnpm --filter @legilimens/cli start`
2. Input: "react" (if Context7 returns multiple results)
3. Verify: Selection prompt shows with multiple packages
4. Select: "react" from the list
5. Verify: Re-detection succeeds
6. Verify: Generation completes successfully
7. Verify: Gateway doc created for "react" package
8. Verify: Static backup created

**Expected Outcome**:
- ✅ Detection: Multiple results → user selection → `{sourceType: 'npm', normalizedIdentifier: 'react'}`
- ✅ Duration: <1 second for detection + user interaction time
- ✅ Document created with correct package
- ✅ Static backup exists

---

### Test 4: Complete Flow with Manual URL

**Objective**: Verify manual URL fallback when all automated detection fails.

**Steps**:
1. Run: `pnpm --filter @legilimens/cli start`
2. Input: "unknown-package-xyz-12345"
3. Verify: Context7 returns no results
4. Verify: Tavily returns no results
5. Verify: Manual URL prompt appears
6. Enter: "https://example.com/docs"
7. Verify: Re-detection succeeds with URL
8. Verify: Generation completes successfully
9. Verify: Gateway doc created for URL source
10. Verify: Static backup created

**Expected Outcome**:
- ✅ Detection: `{sourceType: 'url', normalizedIdentifier: 'https://example.com/docs'}`
- ✅ Duration: 5-10 seconds for detection + user interaction time
- ✅ Document created with Firecrawl content
- ✅ Static backup exists

---

### Test 5: Fast Path Performance

**Objective**: Verify pattern matching performance and GitHub documentation.

**Steps**:
1. Run: `pnpm --filter @legilimens/cli start`
2. Input: "vercel/ai"
3. Verify: Pattern match (no API calls)
4. Verify: Detection completes in <100ms
5. Verify: Generation completes successfully
6. Verify: Gateway doc created for GitHub repository
7. Verify: Static backup created

**Expected Outcome**:
- ✅ Detection: `{sourceType: 'github', normalizedIdentifier: 'vercel/ai'}`
- ✅ Duration: <100ms for detection (fast path)
- ✅ Document created immediately
- ✅ Static backup exists

---

## Regression Testing

This section verifies that existing functionality was not broken by the refactor.

### Regression Test 1: GitHub URLs

**Objective**: Verify GitHub URLs are still extracted correctly.

**Input**: `https://github.com/vercel/ai`

**Expected**:
- Pattern match extracts `vercel/ai`
- Source type: `github`
- Generation succeeds
- Same behavior as before refactor

**Actual**:
- [ ] Test passed: Yes/No
- [ ] Issues: ________________

---

### Regression Test 2: Scoped Packages

**Objective**: Verify scoped NPM packages are detected via Context7.

**Input**: `@types/node`

**Expected**:
- Returns `unknown` from pattern detection
- Triggers Context7/Tavily search
- Correct package found and documented

**Actual**:
- [ ] Test passed: Yes/No
- [ ] Detection path: ________________
- [ ] Issues: ________________

---

### Regression Test 3: Direct URLs

**Objective**: Verify direct documentation URLs still work.

**Input**: `https://docs.strapi.io`

**Expected**:
- Pattern match detects URL
- Firecrawl fetches content
- Same behavior as before refactor

**Actual**:
- [ ] Test passed: Yes/No
- [ ] Issues: ________________

---

### Regression Test 4: AI Generation

**Objective**: Verify local LLM and AI content generation still work.

**Steps**:
1. Verify Docker Model Runner is running
2. Complete a full generation flow
3. Check that AI content is generated
4. Verify AI metadata is populated correctly

**Expected**:
- Local LLM (DMR) generates AI content successfully
- Fallback to external CLI tools if DMR fails
- AI metadata fields populated: `AI Generated On`, `AI Model Used`

**Actual**:
- [ ] Test passed: Yes/No
- [ ] AI generation worked: Yes/No
- [ ] AI metadata populated: Yes/No
- [ ] Issues: ________________

---

### Regression Test 5: Template Validation

**Objective**: Verify template validation still enforces structure.

**Steps**:
1. Complete a generation flow
2. Open generated gateway doc
3. Verify all required sections present
4. Verify static backup matches main doc
5. Verify template structure follows `docs/templates/legilimens-template.md`

**Expected**:
- Template validation works
- Gateway docs follow template structure
- Static backups created correctly
- All required frontmatter present

**Actual**:
- [ ] Test passed: Yes/No
- [ ] Template structure correct: Yes/No
- [ ] Static backup created: Yes/No
- [ ] Issues: ________________

---

## Known Issues and Limitations

This section documents known issues and limitations discovered during testing.

### Limitation 1: Context7 Coverage

**Description**: Context7 may not have all NPM packages indexed, especially newly published or niche packages.

**Impact**: Some valid NPM packages may fall back to Tavily (slower) or require manual URL input.

**Workaround**: Fallback to Tavily handles this gracefully. No action needed from user.

**Status**: Expected behavior, not a bug.

---

### Limitation 2: Typo Correction Threshold

**Description**: Context7 score threshold is 0.8 for auto-select. Typos with scores 0.7-0.8 may trigger user selection instead of auto-correction.

**Impact**: Some obvious typos may require user confirmation instead of auto-correcting.

**Rationale**: Better to ask for confirmation than auto-select the wrong package (false positive prevention).

**Status**: Intentional design decision.

---

### Limitation 3: Multiple Results for Popular Packages

**Description**: Popular packages like "react", "vue", "angular" may have many related packages (react-dom, react-router, etc.).

**Impact**: User selection required to disambiguate, adding ~2-5 seconds to flow.

**Workaround**: Context7 returns top 3 matches sorted by relevance score. User can also select "None of these" to trigger Tavily fallback.

**Status**: Expected behavior, not a bug.

---

### Limitation 4: Tavily Rate Limiting

**Description**: Tavily API has rate limits that vary by subscription plan.

**Impact**: During high-volume testing, retry logic may cause delays (exponential backoff: 1s, 2s, 4s).

**Workaround**: 
- Use Context7 auto-select path when possible (faster, doesn't count toward Tavily quota)
- Upgrade Tavily plan if rate limits are consistently hit
- Add delays between test runs during validation

**Status**: External API limitation.

---

### Limitation 5: DMR Cold Start

**Description**: First Docker Model Runner request after container restart takes 10-15 seconds. Subsequent requests take 2-5 seconds.

**Impact**: First generation in a session may be slower than expected.

**Workaround**: 
- Keep DMR container running during development
- Cold start is one-time cost per session
- Subsequent generations use warm cache

**Status**: Docker Model Runner behavior, not a Legilimens bug.

---

## Sign-Off

This section provides a final checklist for marking the refactor complete and approved.

### All Test Scenarios Passed

- [ ] **Scenario 1**: Typo correction (strappi → strapi)
- [ ] **Scenario 2**: Natural language (OpenAI Codex → GitHub)
- [ ] **Scenario 3**: GitHub identifier (vercel/ai → pattern match)
- [ ] **Scenario 4**: URL (https://... → pattern match)
- [ ] **Scenario 5A**: Ambiguous input (react → user selection)
- [ ] **Scenario 5B**: User declines (None of these → Tavily)

---

### All Phases Validated

- [ ] **Phase 1**: NPM pattern removal
- [ ] **Phase 2**: Natural language check removal
- [ ] **Phase 3**: Manual URL fallback
- [ ] **Phase 4**: Context7 search API
- [ ] **Phase 5**: Context7 integration
- [ ] **Phase 6**: User selection
- [ ] **Phase 7**: Tavily optimization
- [ ] **Phase 8**: Debug logging

---

### No Regressions

- [ ] GitHub URLs still work
- [ ] Scoped packages still work
- [ ] Direct URLs still work
- [ ] AI generation still works
- [ ] Template validation still works

---

### Performance Acceptable

- [ ] Pattern match: <100ms
- [ ] Context7 auto-select: <500ms
- [ ] Tavily fallback: <5 seconds
- [ ] Manual URL: <10 seconds (including user interaction)

---

### Documentation Complete

- [ ] All test scenarios documented with actual results
- [ ] All issues encountered documented with resolutions
- [ ] Performance benchmarks recorded
- [ ] Sign-off checklist completed

---

### Approved By

**Engineer**: _______________ **Date**: ___________

**Tech Lead**: _______________ **Date**: ___________

---

## Next Steps

This section provides guidance for post-validation activities.

### Immediate Next Steps

1. **Update CHANGELOG.md** with detection pipeline refactor details (Phases 1-8)
2. **Update README.md** with new detection flow documentation and Context7 API key requirement
3. **Update docs/quickstart.md** with Context7 setup instructions
4. **Create migration guide** for existing users (if needed - API key requirement)
5. **Tag release** with version bump (breaking change = major version)

---

### Future Enhancements

1. **Add caching for Context7 search results**: Reduce API calls for repeated queries (TTL: 1 hour)
2. **Add fuzzy matching for typo correction**: Beyond Context7's built-in matching (Levenshtein distance)
3. **Add support for other package registries**: PyPI, RubyGems, Maven, NuGet, etc.
4. **Add telemetry to track detection paths**: Understand which paths are most common (opt-in analytics)
5. **Add A/B testing framework**: Test detection algorithm improvements in production

---

### Monitoring and Observability

1. **Track Context7 success rate**: How often it finds packages (target: >80%)
2. **Track Tavily fallback rate**: How often Context7 fails (target: <20%)
3. **Track manual URL fallback rate**: How often all automation fails (target: <5%)
4. **Track user selection patterns**: Which packages are ambiguous (inform future improvements)
5. **Track performance metrics**: Detection duration by path (ensure targets met)

---

## Appendix: Debug Log Examples

This section provides complete debug log examples for each scenario to help engineers understand expected output.

### Example 1: Typo Correction (strappi → strapi)

```
[detector] Starting detection for "strappi"
[detector] Pattern detection result: unknown (low)
[detector] Context7 API key: configured
[detector] Attempting Context7 search for "strappi"
[detector] Calling Context7 search API
[context7] Search started: query="strappi", attempt=1
[context7] Search completed: 1 results for "strappi" in 245ms
[context7] Top matches: strapi (0.85)
[detector] Context7 search: success
[detector] Context7 search completed: 1 results
[detector] Top 3 matches: strapi (0.85)
[detector] Context7 high-confidence match: strapi (score: 0.85)
[detector] Returning immediately, skipping Tavily
[detector] Routing: auto-select
```

---

### Example 2: Natural Language (OpenAI Codex → GitHub)

```
[detector] Starting detection for "OpenAI Codex"
[detector] Pattern detection result: unknown (low)
[detector] Context7 API key: configured
[detector] Attempting Context7 search for "OpenAI Codex"
[detector] Calling Context7 search API
[context7] Search started: query="OpenAI Codex", attempt=1
[context7] Search completed: 0 results for "OpenAI Codex" in 312ms
[detector] Context7 search: success
[detector] Context7 search completed: 0 results
[detector] Context7 found no results, falling back to Tavily
[detector] Calling Tavily pipeline (Context7 search completed with no actionable results)
[pipeline] Discovering repository for: "OpenAI Codex"
[webSearch] Tavily query: "Find the official GitHub repository or documentation website for OpenAI Codex. Focus on GitHub repos and official docs. Exclude Context7 references."
[webSearch] Search options: maxResults=10, excludeDomains=["context7.com","context7.ai"]
[webSearch] Tavily response received: 5 results
[webSearch] Classification: 3 GitHub, 2 official, 0 other
[webSearch] Source recommendation: github (high)
[pipeline] Tavily found 5 results
[pipeline] Using Tavily's high-confidence recommendation: github
[pipeline] Extracting GitHub identifier from URL: https://github.com/openai/codex
[pipeline] Extracted GitHub identifier: openai/codex
```

---

### Example 3: Pattern Match (vercel/ai → GitHub)

```
[detector] Starting detection for "vercel/ai"
[detector] Pattern detection result: github (high)
[detector] High-confidence github match, skipping AI pipeline
```

---

### Example 4: User Selection (react → multiple results)

```
[detector] Starting detection for "react"
[detector] Pattern detection result: unknown (low)
[detector] Context7 API key: configured
[detector] Attempting Context7 search for "react"
[detector] Calling Context7 search API
[context7] Search started: query="react", attempt=1
[context7] Search completed: 3 results for "react" in 278ms
[context7] Top matches: react (0.95), react-dom (0.87), react-router (0.82)
[detector] Context7 search: success
[detector] Context7 search completed: 3 results
[detector] Top 3 matches: react (0.95), react-dom (0.87), react-router (0.82)
[detector] Multiple matches require user selection (Phase 6)
[detector] Routing: user-selection (enableSelection option set to true)
[GenerationFlow] Multiple Context7 results found (count: 3)
[GenerationFlow] Showing package selection prompt
[GenerationFlow] User selection: react
[GenerationFlow] Re-running detection with selected package
[detector] Starting detection for "react"
[detector] Context7 API key: configured
[detector] Attempting Context7 search for "react"
[detector] Calling Context7 search API
[context7] Search started: query="react", attempt=1
[context7] Search completed: 1 results for "react" in 198ms
[context7] Top matches: react (0.95)
[detector] Context7 search: success
[detector] Context7 search completed: 1 results
[detector] Context7 high-confidence match: react (score: 0.95)
[detector] Routing: auto-select
```

---

### Example 5: User Declines Context7 (react → Tavily fallback)

```
[detector] Starting detection for "react"
[detector] Pattern detection result: unknown (low)
[detector] Context7 search completed: 3 results
[detector] Top 3 matches: react (0.95), react-dom (0.87), react-router (0.82)
[detector] Multiple matches require user selection (Phase 6)
[detector] Routing: user-selection
[GenerationFlow] Multiple Context7 results found (count: 3)
[GenerationFlow] Showing package selection prompt
[GenerationFlow] User selection: null
[GenerationFlow] User declined Context7 suggestions, triggering Tavily fallback
[GenerationFlow] Calling detectSourceTypeWithAI with selection disabled
[detector] Starting detection for "react"
[detector] Calling Tavily pipeline
[pipeline] Discovering repository for: "react"
[webSearch] Tavily query: "Find the official GitHub repository or documentation website for react..."
[webSearch] Search options: maxResults=10, excludeDomains=["context7.com","context7.ai"]
[webSearch] Tavily response received: 8 results
[webSearch] Classification: 5 GitHub, 3 official, 0 other
[webSearch] Source recommendation: github (high)
[pipeline] Tavily found 8 results
[pipeline] Using Tavily's high-confidence recommendation: github
[pipeline] Extracting GitHub identifier from URL: https://github.com/facebook/react
[pipeline] Extracted GitHub identifier: facebook/react
```

---

## Document Maintenance

**This document should be updated with actual test results as engineers validate each scenario. The "Actual Results" sections are templates for recording findings.**

**Last Updated**: ___________
**Updated By**: ___________
**Refactor Version**: Phases 1-8 Complete
**Document Version**: 1.0

---

**References:**
- `packages/core/src/detection/sourceDetector.ts` - Pattern detection and Context7 integration
- `packages/cli/src/flows/clackGenerationFlow.ts` - User selection and flow orchestration (lines 110-197, 232-281)
- `packages/core/src/ai/repositoryDiscoveryPipeline.ts` - Tavily fallback pipeline
- `packages/core/src/ai/webSearch.ts` - Tavily search with Context7 exclusion
- `packages/core/src/fetchers/context7.ts` - Context7 search API implementation
