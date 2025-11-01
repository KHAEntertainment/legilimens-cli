# Fix Summary: Retrieval and Processing Errors

This document summarizes all fixes implemented to resolve the retrieval and processing errors identified by Traycer.

## Issues Identified

### 1. Stale CLI Code
**Problem**: CLI was running from compiled `dist/bin/legilimens.js` instead of updated source code. Tavily-normalized identifiers weren't reaching fetchers.

**Evidence**: Detection found `joomla/joomla-cms` (AI-assisted), but fetcher error showed "Unknown dependency type for identifier: Joomla CMS".

**Fix**: Rebuilt both `@legilimens/core` and `@legilimens/cli` packages to compile latest changes.

### 2. Local LLM JSON Parsing Issues
**Problem**: Llama logs polluted stdout, preventing JSON detection. No schema validation for AI outputs.

**Fix**: 
- Suppressed llama logs by setting `LLAMA_LOG_LEVEL=40` and `LLAMA_LOG_COLORS=0` in spawn environment
- Added `aiGeneratedContentSchema` to `packages/core/src/ai/schemas.ts` with strict validation
- Updated both local and external CLI paths to use Zod schema validation end-to-end

### 3. External CLI Tool Configuration
**Problem**: Codex CLI had flag mismatches causing failures.

**Fix**: Can now set preferred tool via `LEGILIMENS_AI_CLI_TOOL=claude` environment variable.

## Changes Made

### File: `packages/core/src/ai/schemas.ts`
**Added**:
```typescript
export const aiGeneratedContentSchema = z.object({
  shortDescription: z.string().min(10),
  features: z.array(z.string()).min(3).max(10)
});
```

### File: `packages/core/src/ai/localLlmRunner.ts`
**Changed**: Both spawn calls now include:
```typescript
env: {
  ...process.env,
  LLAMA_LOG_LEVEL: '40',  // Suppress llama logs
  LLAMA_LOG_COLORS: '0'   // Disable color output
}
```

### File: `packages/core/src/gateway.ts`
**Changed**:
1. Local LLM now uses schema validation:
   ```typescript
   const localResult = await runLocalJson<AiGeneratedContent>({ 
     prompt, 
     schema: aiGeneratedContentSchema 
   });
   ```

2. External CLI now validates with schema and falls back immediately on failure:
   ```typescript
   const jsonText = extractFirstJson(aiResult.content);
   const parsed = jsonText ? safeParseJson(jsonText) : null;
   if (parsed) {
     const validation = validateWithSchema(aiGeneratedContentSchema, parsed);
     if (validation.success) {
       // Use validated data
     } else {
       // Fall back immediately
     }
   }
   ```

### File: `packages/core/src/fetchers/orchestrator.ts`
**Unchanged** - Already has the fixes from previous implementation:
- `fetchDocumentationWithSource()` function accepts precomputed sourceType
- `normalizeIdentifierForUrl()` helper normalizes GitHub/NPM identifiers
- Improved error messages guide users to canonical formats

### File: `packages/cli/src/flows/clackGenerationFlow.ts`
**Unchanged** - Already propagates detection results:
- Extracts `repositoryUrl` from detection
- Passes `sourceType`, `normalizedIdentifier`, and `repositoryUrl` through context

## Testing

### Test Script
Created `test-joomla.sh` to verify the fixes:
```bash
./test-joomla.sh
```

This script:
1. Enables debug mode (`LEGILIMENS_DEBUG=true`)
2. Suppresses llama logs
3. Sets preferred AI CLI tool to claude
4. Runs the CLI with guidance to test "Joomla CMS" input

### Expected Results
When testing with "Joomla CMS" input:
- ✅ Detection finds `joomla/joomla-cms` (AI-assisted)
- ✅ Fetch uses normalized identifier `joomla/joomla-cms`
- ✅ Success via ref.tools → Firecrawl for GitHub
- ✅ No "Unknown dependency type" errors
- ✅ Gateway doc generated successfully

### Manual Testing
For manual testing:

```bash
# Set environment variables
export LEGILIMENS_DEBUG=true
export LLAMA_LOG_LEVEL=40
export LLAMA_LOG_COLORS=0
export LEGILIMENS_AI_CLI_TOOL=claude

# Run CLI
pnpm --filter @legilimens/cli start
```

Then enter "Joomla CMS" at the prompt.

## Environment Variables

### New/Updated Variables
- `LLAMA_LOG_LEVEL=40` - Suppress llama.cpp logging (set by code, can be overridden)
- `LLAMA_LOG_COLORS=0` - Disable llama.cpp color output (set by code, can be overridden)
- `LEGILIMENS_AI_CLI_TOOL=claude` - Prefer claude CLI tool over auto-detect

### Existing Variables (Still Supported)
- `LEGILIMENS_DEBUG=true` - Enable debug logging
- `LEGILIMENS_FETCH_TIMEOUT_MS=90000` - Fetch timeout in milliseconds
- `LEGILIMENS_FETCH_RETRIES=3` - Maximum fetch retry attempts
- `TAVILY_API_KEY` - Tavily API key for web search
- `FIRECRAWL_API_KEY` - Firecrawl API key for web scraping
- `CONTEXT7_API_KEY` - Context7 API key for NPM docs
- `REFTOOLS_API_KEY` - RefTools API key for GitHub/NPM docs

## Build Status

All packages compiled successfully:
```bash
✓ packages/core build completed
✓ packages/cli build completed
✓ All TypeScript type checks passed
```

## Next Steps

1. **Test the fixes**: Run `./test-joomla.sh` or use manual testing steps above
2. **Verify Tavily detection**: Check debug output shows normalized identifier
3. **Verify fetch success**: Check debug output shows successful fetch
4. **Verify JSON parsing**: Check no llama logs in output, clean JSON parsing

## Known Limitations

1. **User config modification**: Cannot programmatically update `~/.legilimens/config.json` to set `aiCliTool: "claude"`. Users should either:
   - Set `export LEGILIMENS_AI_CLI_TOOL=claude` in their shell
   - Manually edit `~/.legilimens/config.json` to change `"aiCliTool": "auto-detect"` to `"aiCliTool": "claude"`

2. **External CLI tool availability**: Claude CLI must be installed and available in PATH. Check with `which claude`.

## Troubleshooting

### If "Unknown dependency type" error persists:
1. Verify packages are rebuilt: `pnpm -w build`
2. Check debug output shows normalized identifier is being used
3. Verify `detection.normalizedIdentifier` is passed to gateway context

### If JSON parsing fails:
1. Check `LLAMA_LOG_LEVEL` and `LLAMA_LOG_COLORS` are set
2. Verify schema validation is enabled (check debug output)
3. Try external CLI tool instead (set `LEGILIMENS_AI_CLI_TOOL=claude`)

### If fetch fails:
1. Verify API keys are configured: `TAVILY_API_KEY`, `FIRECRAWL_API_KEY`
2. Check network connectivity
3. Increase timeout: `export LEGILIMENS_FETCH_TIMEOUT_MS=120000`
4. Increase retries: `export LEGILIMENS_FETCH_RETRIES=5`

## References

- Previous fixes: Comment 1-10 implementations (sourceType propagation, error messages, etc.)
- Traycer analysis: Identified stale code and JSON parsing issues
- Test case: "Joomla CMS" → `joomla/joomla-cms` → successful fetch
