# Integration Documentation

This directory contains integration guides for pending and future feature implementations.

## Active Integrations

### ref.tools MCP Migration

**Status:** 🟡 Built but NOT integrated (awaiting refactor completion)

**What was built:**
- MCP-based fetcher using official `@modelcontextprotocol/sdk`
- Proper implementation of ref.tools protocol (replaces fictional REST API)
- Connection pooling via singleton client pattern
- Full retry/timeout/error handling matching existing fetchers

**Files created:**
1. **`/packages/core/src/fetchers/refToolsMcp.ts`**
   - Production-ready MCP implementation
   - Drop-in replacement for `refTools.ts`
   - ~200 lines with full error handling

2. **`REF_TOOLS_MCP_INTEGRATION.md`**
   - Comprehensive integration guide
   - Problem statement and solution details
   - 5-phase migration roadmap
   - Testing strategy and rollback plan
   - FAQ and troubleshooting

3. **`REF_TOOLS_MIGRATION_CHECKLIST.md`**
   - Quick step-by-step migration guide
   - Copy-paste code snippets
   - Command reference
   - Verification checklist

**When to integrate:**
After completing your current refactor, follow the checklist in `REF_TOOLS_MIGRATION_CHECKLIST.md`.

**Key changes needed:**
- Install: `pnpm add @modelcontextprotocol/sdk`
- Update 3 lines in `orchestrator.ts` (import + 2 function calls)
- Update tests to mock MCP SDK instead of axios
- Optional: Add cleanup handler to CLI entry point

**Why it exists:**
Current `refTools.ts` uses a fictional REST API (`/v1/docs/{id}`) that doesn't exist. ref.tools only provides MCP server access. This was discovered during investigation and fixed proactively.

**Integration time estimate:** ~30 minutes once refactor is complete

---

## Future Integrations

(Add future integration plans here)

---

## Documentation Standards

Each integration should include:
- ✅ Status badge (🟢 Active | 🟡 Pending | 🔴 Blocked)
- ✅ Comprehensive integration guide
- ✅ Quick migration checklist
- ✅ Rollback strategy
- ✅ Testing approach
- ✅ Success metrics

---

## Questions?

For ref.tools MCP integration questions, see:
- **Quick Start:** `REF_TOOLS_MIGRATION_CHECKLIST.md`
- **Full Details:** `REF_TOOLS_MCP_INTEGRATION.md`
- **Implementation:** `/packages/core/src/fetchers/refToolsMcp.ts`
