# Quick Test Guide

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

## Verify the Fixes

All fixes have been implemented and compiled. Here's how to test them:

### Option 1: Automated Test Script

```bash
./test-joomla.sh
```

This will run the CLI with all the correct environment variables set for testing.

### Option 2: Manual Test

```bash
# Set environment variables
export LEGILIMENS_DEBUG=true
export LLAMA_LOG_LEVEL=40
export LLAMA_LOG_COLORS=0
export LEGILIMENS_AI_CLI_TOOL=claude

# Run the CLI
pnpm --filter @legilimens/cli start
```

**At the prompt**, enter: `Joomla CMS`

### What to Look For in Debug Output

#### ✅ Successful Detection
```
[pipeline] Discovering repository for: "Joomla CMS"
[pipeline] Tavily found X results
[pipeline] High-confidence GitHub result found
```

Should show normalized identifier: `joomla/joomla-cms`

#### ✅ Successful Fetch
```
[gateway] Using fetchDocumentationWithSource with sourceType=github
```

Should show fetch succeeded via ref.tools or Firecrawl, **NOT** "Unknown dependency type" error.

#### ✅ Clean JSON Parsing (Local LLM)
Output should **NOT** contain llama.cpp logs like:
```
llm_load_tensors: ...
ggml_backend_cuda_...
```

If using local LLM, you should see:
```
[localLlm] Successfully extracted, parsed, and validated JSON against schema
```

#### ✅ Schema Validation (External CLI)
If using external CLI (claude), you should see:
```
[gateway] External CLI response validated with schema
```

### Expected Final Result

```
✔ Source detected: github, Type: other (AI-assisted)
✔ Documentation fetched from [source] in XXXms
✔ AI generation succeeded with [tool]
✔ Gateway doc: frameworks/framework_joomla_cms.md
✔ Static backup: frameworks/static-backup/framework_joomla_cms.md
```

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

### Build Issues
If you see old behavior, rebuild:
```bash
pnpm --filter @legilimens/core build && pnpm --filter @legilimens/cli build
```

### Detection Issues
If detection fails to normalize:
```bash
# Check Tavily API key is set
echo $TAVILY_API_KEY

# If empty, load from config
source packages/cli/src/config/env.ts  # or set manually
```

### Fetch Issues
If fetch shows "Unknown dependency type":
1. Verify compiled code includes latest changes: `ls -lh packages/cli/dist/bin/legilimens.js`
2. Check file size is ~2.5K (should be recent)
3. Rebuild if needed: `pnpm -w build`

### JSON Parsing Issues
If seeing llama logs or JSON errors:
1. Verify environment variables are set: `echo $LLAMA_LOG_LEVEL`
2. Check spawn includes env override in compiled code
3. Use external CLI as fallback: `export LEGILIMENS_AI_CLI_TOOL=claude`

If issues persist, use the report template from `docs/.archive/TEST-CHECKLIST.md`.

## Build Status

Current build artifacts:
- ✅ `packages/cli/dist/bin/legilimens.js` (2.5K) - Latest compiled CLI
- ✅ `packages/core/dist/gateway.js` (31K) - Latest compiled gateway with all fixes
- ✅ All TypeScript type checks passed

## Environment Variables Reference

### Debug & Logging
- `LEGILIMENS_DEBUG=true` - Enable detailed debug output
- `LLAMA_LOG_LEVEL=40` - Suppress llama.cpp logs (auto-set in code)
- `LLAMA_LOG_COLORS=0` - Disable llama.cpp colors (auto-set in code)

### AI Configuration
- `LEGILIMENS_AI_CLI_TOOL=claude` - Prefer claude CLI tool
- `TAVILY_API_KEY=tvly-...` - Tavily API key for web search

### Fetch Configuration
- `LEGILIMENS_FETCH_TIMEOUT_MS=90000` - Fetch timeout (default: 60000)
- `LEGILIMENS_FETCH_RETRIES=3` - Max retries (default: 2)

### API Keys
- `FIRECRAWL_API_KEY` - Firecrawl for web scraping
- `CONTEXT7_API_KEY` - Context7 for NPM docs
- `REFTOOLS_API_KEY` - RefTools for GitHub/NPM docs

## Next Steps

1. **Run the test**: Use automated script or manual steps above
2. **Verify each stage**: Check debug output matches expected results
3. **Test other inputs**: Try "AG-UI", "React", "vercel/ai", etc.
4. **Report issues**: If any stage fails, check troubleshooting section

## Success Criteria

All of the following should work:
- ✅ Natural language input ("Joomla CMS") → normalized (`joomla/joomla-cms`)
- ✅ Fetch uses normalized identifier, not original input
- ✅ No "Unknown dependency type" errors
- ✅ Clean JSON output without llama logs
- ✅ Schema validation catches invalid responses
- ✅ Gateway doc generated successfully
