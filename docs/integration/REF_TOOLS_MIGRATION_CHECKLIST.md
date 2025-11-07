# ref.tools MCP Migration - Quick Checklist

**Execute AFTER completing your current refactor**

## Prerequisites ✅

```bash
# 1. Install MCP SDK
pnpm add @modelcontextprotocol/sdk

# 2. Verify installation
pnpm list @modelcontextprotocol/sdk
```

## Code Changes 📝

### Step 1: Update Orchestrator Imports

**File:** `packages/core/src/fetchers/orchestrator.ts`

**Line 6 - Change:**
```diff
- import { fetchFromRefTools } from './refTools.js';
+ import { fetchFromRefToolsMcp } from './refToolsMcp.js';
```

### Step 2: Update Orchestrator Function Calls

**Same file, 2 locations:**

**Line 77 (GitHub fallback chain) - Change:**
```diff
- const refToolsResult = await fetchFromRefTools(normalizedId, refToolsConfig);
+ const refToolsResult = await fetchFromRefToolsMcp(normalizedId, refToolsConfig);
```

**Line 163 (fetchDocumentationWithSource) - Change:**
```diff
- const refToolsResult = await fetchFromRefTools(normalizedId, refToolsConfig);
+ const refToolsResult = await fetchFromRefToolsMcp(normalizedId, refToolsConfig);
```

### Step 3: Update Package Exports (If Needed)

**File:** `packages/core/src/index.ts`

**Check if refTools is exported:**
```bash
grep "fetchFromRefTools" packages/core/src/index.ts
```

**If found, update:**
```diff
- export { fetchFromRefTools } from './fetchers/refTools.js';
+ export { fetchFromRefToolsMcp as fetchFromRefTools } from './fetchers/refToolsMcp.js';
```

### Step 4: Add Cleanup Handler (Optional)

**File:** `packages/cli/src/index.ts` (or main entry point)

**Add near top:**
```typescript
import { closeRefToolsMcpClient } from '@legilimens/core';

// Cleanup MCP connection on exit
process.on('SIGINT', async () => {
  await closeRefToolsMcpClient();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeRefToolsMcpClient();
  process.exit(0);
});
```

## Test Updates 🧪

### Step 5: Update Test Mocks

**File:** `packages/core/tests/fetchers/orchestrator.spec.ts`

**Find:**
```typescript
vi.mock('../../src/fetchers/refTools.js'
```

**Replace with:**
```typescript
vi.mock('../../src/fetchers/refToolsMcp.js', () => ({
  fetchFromRefToolsMcp: vi.fn()
}));
```

**And update test expectations:**
```diff
- import { fetchFromRefTools } from '../../src/fetchers/refTools.js';
+ import { fetchFromRefToolsMcp } from '../../src/fetchers/refToolsMcp.js';
```

### Step 6: Create/Update Unit Tests

**Create:** `packages/core/tests/fetchers/refToolsMcp.spec.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchFromRefToolsMcp } from '../../src/fetchers/refToolsMcp.js';

// Mock MCP SDK
vi.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
  Client: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    callTool: vi.fn().mockResolvedValue({
      content: [{ type: 'text', text: '# Test Documentation' }]
    }),
    close: vi.fn().mockResolvedValue(undefined)
  }))
}));

vi.mock('@modelcontextprotocol/sdk/client/sse.js', () => ({
  SSEClientTransport: vi.fn()
}));

describe('refToolsMcp fetcher', () => {
  it('fetches documentation successfully', async () => {
    const result = await fetchFromRefToolsMcp('test-package', {
      timeoutMs: 60000,
      maxRetries: 2,
      apiKey: 'test-key'
    });

    expect(result.success).toBe(true);
    expect(result.content).toBe('# Test Documentation');
    expect(result.metadata?.source).toBe('ref.tools (MCP)');
  });
});
```

## Testing Phase 🔬

### Step 7: Run All Tests

```bash
# Unit tests
pnpm test

# Integration tests
pnpm test:integration

# If tests fail, check:
# - MCP SDK mocks are correct
# - Import paths updated everywhere
# - No references to old fetchFromRefTools remain
```

### Step 8: Manual Testing

```bash
# Set API key
export REFTOOLS_API_KEY="your-actual-key"

# Run CLI
pnpm --filter @legilimens/cli start

# Test with GitHub repo
# Input: vercel/ai
# Expected: "✓ Fetched from ref.tools (MCP)"

# Check logs for:
# - "ref.tools (MCP)" in source
# - No axios errors
# - Reasonable duration (<1s for cached, <5s for first call)
```

## Cleanup 🧹

### Step 9: Delete Old Files (After Successful Testing)

```bash
# After 1-2 days of stable operation:
git rm packages/core/src/fetchers/refTools.ts
git rm packages/core/tests/fetchers/refTools.spec.ts

# Commit
git add .
git commit -m "feat: migrate ref.tools to MCP protocol

- Replace fictional REST API with real MCP implementation
- Use @modelcontextprotocol/sdk for protocol communication
- Add connection pooling via singleton client
- Update tests to mock MCP SDK instead of axios"
```

## Verification Checklist ✓

- [ ] `@modelcontextprotocol/sdk` installed
- [ ] `orchestrator.ts` imports updated (1 location)
- [ ] `orchestrator.ts` calls updated (2 locations)
- [ ] `index.ts` exports updated (if applicable)
- [ ] Cleanup handlers added to CLI entry
- [ ] Test mocks updated
- [ ] New unit tests created
- [ ] All tests passing (`pnpm test`)
- [ ] Integration tests passing (`pnpm test:integration`)
- [ ] Manual testing successful
- [ ] No console errors with real API key
- [ ] Old files deleted (after stable operation)

## Rollback (If Needed) 🔙

If something breaks:

```bash
# Quick revert of orchestrator.ts
git checkout HEAD -- packages/core/src/fetchers/orchestrator.ts

# Uninstall MCP SDK
pnpm remove @modelcontextprotocol/sdk

# Note: This returns to broken state but won't crash
# Consider disabling ref.tools in fallback chain instead:
# Comment out lines 76-78 and 162-164 in orchestrator.ts
```

## Post-Migration Monitoring 📊

Watch for:
- ✅ Duration metrics (~200-500ms first call, ~150-300ms subsequent)
- ✅ Error rates (should be same or lower than before)
- ✅ MCP connection stability (check logs for reconnection events)
- ✅ Memory usage (singleton should prevent leak)

## Success Metrics 🎯

**Migration successful when:**
1. All tests green
2. Manual testing works with real API key
3. No increase in error rates
4. Performance within expected ranges
5. 1 week of stable production use

---

**Full Documentation:** See `REF_TOOLS_MCP_INTEGRATION.md` for detailed explanation
**Implementation:** `packages/core/src/fetchers/refToolsMcp.ts`
