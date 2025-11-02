# Test Checklist

Use this checklist to verify all fixes are working correctly.

## Pre-Test Setup

- [ ] All packages built successfully
  ```bash
  pnpm -w build
  ```

- [ ] Environment variables set
  ```bash
  export LEGILIMENS_DEBUG=true
  export LEGILIMENS_AI_CLI_TOOL=claude
  ```

- [ ] Claude CLI available (if using external CLI)
  ```bash
  which claude  # Should show path
  ```

## Test Case: Joomla CMS

### Stage 1: Detection ✓
- [ ] Run CLI: `pnpm --filter @legilimens/cli start`
- [ ] Enter: `Joomla CMS`
- [ ] Verify debug output shows:
  - `[pipeline] Discovering repository for: "Joomla CMS"`
  - `[pipeline] Tavily found X results`
  - Detection result: `joomla/joomla-cms` (AI-assisted)

**Expected**: ✅ Natural language → normalized identifier

### Stage 2: Fetch ✓
- [ ] Verify debug output shows:
  - `Using fetchDocumentationWithSource with sourceType=github`
  - Fetch attempt with normalized identifier `joomla/joomla-cms`
  - Success via ref.tools or Firecrawl

**Expected**: ✅ No "Unknown dependency type" error

### Stage 3: JSON Parsing ✓
- [ ] Verify output does NOT contain:
  - `llm_load_tensors:`
  - `ggml_backend_cuda_`
  - Other llama.cpp logs

- [ ] Verify debug output shows (if using local LLM):
  - `[localLlm] Successfully extracted, parsed, and validated JSON against schema`

**Expected**: ✅ Clean JSON parsing without logs

### Stage 4: Schema Validation ✓
- [ ] Verify debug output shows:
  - Local LLM: `Schema validation failed` OR validation success
  - External CLI: `[gateway] External CLI response validated with schema`

**Expected**: ✅ Schema validation enforced

### Stage 5: Output ✓
- [ ] Verify final output shows:
  - Source detected: `github, Type: [type] (AI-assisted)`
  - Documentation fetched from `[source]` in `XXXms`
  - AI generation succeeded with `[tool]`
  - Gateway doc: `[path]/framework_joomla_cms.md`
  - Static backup: `[path]/static-backup/framework_joomla_cms.md`

**Expected**: ✅ Successful generation

## Additional Test Cases

### Test Case 2: AG-UI
- [ ] Enter: `AG-UI`
- [ ] Verify detection normalizes to valid identifier
- [ ] Verify fetch succeeds
- [ ] Verify generation succeeds

### Test Case 3: React (canonical)
- [ ] Enter: `react`
- [ ] Verify detection identifies as NPM
- [ ] Verify fetch succeeds via Context7 or ref.tools
- [ ] Verify generation succeeds

### Test Case 4: vercel/ai (GitHub)
- [ ] Enter: `vercel/ai`
- [ ] Verify detection identifies as GitHub
- [ ] Verify fetch succeeds via ref.tools → Firecrawl
- [ ] Verify generation succeeds

## Troubleshooting

### If Stage 1 Fails (Detection)
- [ ] Check Tavily API key: `echo $TAVILY_API_KEY`
- [ ] Verify Tavily is enabled in runtime config
- [ ] Check network connectivity

### If Stage 2 Fails (Fetch)
- [ ] Verify compiled code is latest: `ls -lh packages/cli/dist/bin/legilimens.js`
- [ ] Check file size is ~2.5K
- [ ] Rebuild if needed: `pnpm -w build`
- [ ] Check API keys for fetchers (Firecrawl, Context7, RefTools)

### If Stage 3 Fails (JSON Parsing)
- [ ] Verify `LLAMA_LOG_LEVEL` is set in spawn: `grep -A 5 "LLAMA_LOG_LEVEL" packages/core/dist/ai/localLlmRunner.js`
- [ ] Try external CLI: `export LEGILIMENS_AI_CLI_TOOL=claude`
- [ ] Check Claude CLI works: `claude --version`

### If Stage 4 Fails (Schema Validation)
- [ ] Verify schema is exported: `grep "aiGeneratedContentSchema" packages/core/dist/ai/schemas.js`
- [ ] Check validation is called in gateway: `grep -A 5 "validateWithSchema" packages/core/dist/gateway.js`
- [ ] Review debug output for validation errors

### If Stage 5 Fails (Output)
- [ ] Check previous stages all passed
- [ ] Review full debug output for errors
- [ ] Check disk space for writing files
- [ ] Verify target directory permissions

## Success Criteria

All stages must pass for the fix to be considered successful:
- ✅ Stage 1: Detection normalizes natural language
- ✅ Stage 2: Fetch uses normalized identifier
- ✅ Stage 3: JSON parsing is clean
- ✅ Stage 4: Schema validation enforced
- ✅ Stage 5: Output generated successfully

## Quick Commands

### Run automated test
```bash
./test-joomla.sh
```

### Manual test with full debug
```bash
export LEGILIMENS_DEBUG=true
export LEGILIMENS_AI_CLI_TOOL=claude
export LLAMA_LOG_LEVEL=40
export LLAMA_LOG_COLORS=0
pnpm --filter @legilimens/cli start
```

### Rebuild everything
```bash
pnpm -w build
```

### Verify build
```bash
ls -lh packages/cli/dist/bin/legilimens.js packages/core/dist/gateway.js
```

### Check type safety
```bash
pnpm typecheck
```

## Report Template

If issues persist, provide this information:

**Environment:**
- Node version: `node --version`
- pnpm version: `pnpm --version`
- OS: 

**Build Status:**
- Core build output:
- CLI build output:
- Type check output:

**Test Input:**
- Dependency: 

**Stage Results:**
- [ ] Stage 1: Detection
- [ ] Stage 2: Fetch  
- [ ] Stage 3: JSON Parsing
- [ ] Stage 4: Schema Validation
- [ ] Stage 5: Output

**Debug Output:**
```
[Paste relevant debug output here]
```

**Error Messages:**
```
[Paste any error messages here]
```
