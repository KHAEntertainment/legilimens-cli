# ref.tools MCP Integration Plan

**Status:** Built but NOT integrated
**Created:** 2025-11-07
**Location:** `packages/core/src/fetchers/refToolsMcp.ts`

## Executive Summary

The current `refTools.ts` implementation uses a **fictional REST API** that doesn't exist. ref.tools only provides MCP (Model Context Protocol) server access. A proper MCP-based implementation has been built at `refToolsMcp.ts` but is not yet integrated into the codebase.

## Problem Statement

### Current Implementation (Broken)
**File:** `packages/core/src/fetchers/refTools.ts`

```typescript
const REF_TOOLS_BASE_URL = 'https://api.ref.tools/v1';
await axios.get(`${REF_TOOLS_BASE_URL}/docs/${identifier}`)
```

**Issues:**
- ❌ Endpoint `/v1/docs/{identifier}` doesn't exist in ref.tools API
- ❌ Will return 404 or similar errors
- ❌ No actual documentation fetching occurs

### Solution (Built, Not Integrated)
**File:** `packages/core/src/fetchers/refToolsMcp.ts`

```typescript
// Uses real MCP protocol via @modelcontextprotocol/sdk
const client = await initializeMcpClient(apiKey);
const result = await client.callTool({
  name: 'ref_search_documentation',
  arguments: { query: identifier }
});
```

**Benefits:**
- ✅ Uses actual ref.tools MCP API
- ✅ Calls real `ref_search_documentation` tool
- ✅ Follows existing fetcher patterns
- ✅ Includes retry logic and error handling
- ✅ Singleton client for connection reuse

---

## Integration Roadmap

### Phase 1: Prerequisites

**Dependencies to Install:**
```bash
pnpm add @modelcontextprotocol/sdk
```

**Verify package.json update:**
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.10.1"
  }
}
```

### Phase 2: Integration Points

#### 2.1 Update Orchestrator

**File:** `packages/core/src/fetchers/orchestrator.ts`

**Current imports (Line 6):**
```typescript
import { fetchFromRefTools } from './refTools.js';
```

**Replace with:**
```typescript
import { fetchFromRefToolsMcp } from './refToolsMcp.js';
```

**Current calls (Lines 77, 163):**
```typescript
const refToolsResult = await fetchFromRefTools(normalizedId, refToolsConfig);
```

**Replace with:**
```typescript
const refToolsResult = await fetchFromRefToolsMcp(normalizedId, refToolsConfig);
```

**Search pattern to find all occurrences:**
```bash
grep -rn "fetchFromRefTools" packages/core/src/
```

#### 2.2 Update Exports

**File:** `packages/core/src/index.ts`

Check if `fetchFromRefTools` is exported. If so:

**Find:**
```typescript
export { fetchFromRefTools } from './fetchers/refTools.js';
```

**Replace with:**
```typescript
export { fetchFromRefToolsMcp } from './fetchers/refToolsMcp.js';
```

Or add alias for backward compatibility:
```typescript
export { fetchFromRefToolsMcp, fetchFromRefToolsMcp as fetchFromRefTools } from './fetchers/refToolsMcp.js';
```

#### 2.3 Add Cleanup Hook (Optional but Recommended)

The MCP client maintains a persistent connection. Add cleanup when app exits.

**File:** `packages/cli/src/index.ts` (or main CLI entry point)

```typescript
import { closeRefToolsMcpClient } from '@legilimens/core';

// Add process cleanup handlers
process.on('SIGINT', async () => {
  await closeRefToolsMcpClient();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeRefToolsMcpClient();
  process.exit(0);
});
```

### Phase 3: Update Tests

#### 3.1 Update Unit Tests

**File:** `packages/core/tests/fetchers/refTools.spec.ts`

**Option A: Update existing tests**
- Change imports to use `fetchFromRefToolsMcp`
- Mock `@modelcontextprotocol/sdk` instead of `axios`
- Update test expectations for MCP response format

**Option B: Create new test file**
- Create `refToolsMcp.spec.ts` alongside existing tests
- Keep old tests for reference
- Delete `refTools.spec.ts` after migration complete

**Example mock structure:**
```typescript
import { vi } from 'vitest';

// Mock MCP SDK
vi.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
  Client: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    callTool: vi.fn().mockResolvedValue({
      content: [{ type: 'text', text: '# Documentation' }]
    }),
    close: vi.fn().mockResolvedValue(undefined)
  }))
}));
```

#### 3.2 Update Integration Tests

**File:** `packages/core/tests/fetchers/orchestrator.spec.ts`

Update mocks to expect `refToolsMcp` module instead of `refTools`:

```typescript
vi.mock('../../src/fetchers/refToolsMcp.js', () => ({
  fetchFromRefToolsMcp: vi.fn()
}));
```

#### 3.3 Parity Tests

**File:** `tests/integration/parity.spec.ts`

These should pass automatically if orchestrator is updated correctly, since they test the public API. Run to verify:

```bash
pnpm test:integration
```

### Phase 4: Environment Configuration

No changes needed - already configured via `REFTOOLS_API_KEY`.

**Verify in:**
- `.env.example` - ✅ Already has `REFTOOLS_API_KEY=`
- `packages/core/src/config/runtimeConfig.ts` - ✅ Already reads `ENV_REFTOOLS_API_KEY`
- `packages/cli/src/config/env.ts` - ✅ Should already load from env/config

### Phase 5: Migration Checklist

Before integration, complete your current refactor, then:

- [ ] Install `@modelcontextprotocol/sdk`
- [ ] Update `orchestrator.ts` imports (2 locations)
- [ ] Update `orchestrator.ts` function calls (2 locations)
- [ ] Update `index.ts` exports if needed
- [ ] Add cleanup handlers to CLI entry point
- [ ] Create/update unit tests for MCP fetcher
- [ ] Update orchestrator test mocks
- [ ] Run all tests: `pnpm test`
- [ ] Run parity tests: `pnpm test:integration`
- [ ] Test manually with real ref.tools API key
- [ ] Verify performance (MCP adds ~50-100ms connection overhead on first call)
- [ ] Monitor logs for MCP connection errors
- [ ] Delete old `refTools.ts` after successful migration
- [ ] Delete old `refTools.spec.ts` after test migration

---

## Testing Strategy

### Manual Testing

**Test with real API key:**
```bash
# Set API key in environment
export REFTOOLS_API_KEY="your-key-here"

# Run CLI
pnpm --filter @legilimens/cli start

# Try GitHub repo
# Input: vercel/ai
# Expected: Should fetch via ref.tools MCP

# Try NPM package (fallback to Context7 first)
# Input: react
# Expected: Context7 primary, ref.tools as documented fallback if applicable
```

**Verify in logs:**
```
✓ Fetched documentation from ref.tools (MCP)
  Duration: 450ms
  Attempts: 1
```

### Unit Test Coverage

**Test cases to cover:**
- ✅ Successful fetch on first attempt
- ✅ Retry logic on timeout
- ✅ Retry logic on rate limit (429)
- ✅ Connection error handling
- ✅ API key validation (early return)
- ✅ MCP response parsing (content array)
- ✅ Empty response handling
- ✅ Client singleton reuse (same API key)
- ✅ Client recreation (different API key)
- ✅ Cleanup function (`closeRefToolsMcpClient`)

### Performance Testing

**Expected metrics:**
- First call: ~200-500ms (includes MCP connection setup)
- Subsequent calls: ~150-300ms (reuses connection)
- Timeout: Respects `config.timeoutMs` (default 60s)
- Retries: Exponential backoff (100ms, 200ms, 400ms)

---

## Rollback Strategy

If MCP integration causes issues:

### Quick Rollback (Temporary Fix)
Revert orchestrator imports back to old implementation:
```typescript
import { fetchFromRefTools } from './refTools.js';
```

**Note:** This returns to broken state but won't crash the app (just fails gracefully).

### Proper Rollback (If MCP Doesn't Work)

**Option 1: Wait for REST API**
Keep MCP implementation, add check for REST API availability:
```typescript
export async function fetchFromRefTools(identifier: string, config: FetcherConfig) {
  // Try REST API first (if/when it exists)
  try {
    const restResult = await fetchViaRestApi(identifier, config);
    if (restResult.success) return restResult;
  } catch {
    // Fall through to MCP
  }

  // Fallback to MCP
  return fetchFromRefToolsMcp(identifier, config);
}
```

**Option 2: Disable ref.tools**
Comment out ref.tools in fallback chain (GitHub will use Firecrawl directly):
```typescript
// GitHub fallback chain: Firecrawl only (skip ref.tools until fixed)
if (dependencyType === 'github') {
  // const refToolsResult = await fetchFromRefToolsMcp(...);
  // if (refToolsResult.success) return refToolsResult;

  if (runtimeConfig.apiKeys.firecrawl) {
    return await fetchFromFirecrawl(githubUrl, firecrawlConfig);
  }
}
```

---

## File Reference

### New Files
- ✅ `packages/core/src/fetchers/refToolsMcp.ts` - MCP implementation (built)
- 📄 `docs/integration/REF_TOOLS_MCP_INTEGRATION.md` - This document

### Files to Modify (When Ready)
- 📝 `packages/core/src/fetchers/orchestrator.ts` - Update imports and calls
- 📝 `packages/core/src/index.ts` - Update exports (if needed)
- 📝 `packages/cli/src/index.ts` - Add cleanup handlers (optional)
- 📝 `packages/core/tests/fetchers/refTools.spec.ts` - Update or replace
- 📝 `packages/core/tests/fetchers/orchestrator.spec.ts` - Update mocks
- 📝 `package.json` - Add `@modelcontextprotocol/sdk` dependency

### Files to Delete (After Migration)
- ❌ `packages/core/src/fetchers/refTools.ts` - Old broken implementation
- ❌ `packages/core/tests/fetchers/refTools.spec.ts` - Old tests (if replaced)

---

## FAQ

### Why not use MCPorter?

MCPorter is overkill for our needs. It's designed for:
- CLI generation
- Interactive shells
- Multi-server discovery
- Config file management

We only need:
- One simple MCP call to `ref_search_documentation`
- Programmatic integration within existing Node.js fetcher
- Consistency with other fetchers (Context7, Firecrawl)

Using `@modelcontextprotocol/sdk` directly is:
- Lighter weight (~100KB vs full MCPorter toolchain)
- More maintainable (official SDK)
- Better integrated with existing patterns

### What if ref.tools adds a REST API later?

The MCP implementation can stay as primary. Add REST as fallback:
```typescript
// Try REST first (faster)
const restResult = await tryRestApi();
if (restResult.success) return restResult;

// Fallback to MCP (more reliable)
return await fetchFromRefToolsMcp();
```

### Does this affect other fetchers?

No. Context7, Firecrawl, and orchestrator continue working as-is. Only ref.tools integration changes.

### Performance impact?

**Minimal:**
- First call: +50-100ms for MCP connection
- Subsequent calls: ~same speed (connection reused)
- Overall: Negligible in 10-60s total generation time

### What about API rate limits?

MCP implementation includes:
- Retry logic on 429 errors
- Exponential backoff (1s, 2s, 4s)
- Respects Retry-After headers (if MCP server provides them)

---

## Next Steps

1. **Complete your current refactor** (as mentioned)
2. **Review this integration plan** - adjust if needed for your refactor
3. **Install dependency** when ready: `pnpm add @modelcontextprotocol/sdk`
4. **Follow Phase 2 migration steps** in this document
5. **Test thoroughly** using manual and automated tests
6. **Monitor performance** in first few production uses
7. **Delete old implementation** after 1-2 weeks of stable operation

---

## Support & References

- **MCP SDK Docs:** https://github.com/modelcontextprotocol/typescript-sdk
- **ref.tools MCP Server:** https://github.com/ref-tools/ref-tools-mcp
- **ref.tools API:** https://api.ref.tools/mcp
- **Implementation File:** `/packages/core/src/fetchers/refToolsMcp.ts`

## Questions?

If integration issues arise:
1. Check MCP SDK is installed: `pnpm list @modelcontextprotocol/sdk`
2. Verify API key is set: `echo $REFTOOLS_API_KEY`
3. Test MCP connection manually with inspector: `npx @modelcontextprotocol/inspector`
4. Check logs for connection errors
5. Use rollback strategy if needed (see above)
