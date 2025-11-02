# AGENTS.md - Instructions for AI Coding Agents in .resources/

## ⚠️ CRITICAL: READ-ONLY REFERENCE DIRECTORY

**Location:** `/Users/bbrenner/Documents/Scripting Projects/doc-gateway-cli/.resources/`

This directory contains **symlinked reference projects** for the Legilimens CLI monorepo. All content here is **READ-ONLY**. Do not modify any files in this directory or its subdirectories.

---

## Primary Rules

### Absolute Restrictions

**YOU MUST NOT:**
- ❌ Modify any files in `.resources/` or symlinked directories
- ❌ Create new files in symlinked projects
- ❌ Execute git commands from within `.resources/`
- ❌ Run build, test, or installation commands in symlinked projects
- ❌ Make any changes that would affect the symlinked repositories

**YOU MAY:**
- ✅ Read files for reference
- ✅ Analyze code structure
- ✅ Extract specifications and requirements
- ✅ Reference documentation in your responses
- ✅ Suggest changes for implementation in the main repository

---

## Your Working Directory

**Active Development:**
```
/Users/bbrenner/Documents/Scripting Projects/doc-gateway-cli/
```

**Reference Only:**
```
/Users/bbrenner/Documents/Scripting Projects/doc-gateway-cli/.resources/
```

**Symlink Target (DO NOT MODIFY):**
```
.resources/graphrag-system/ → /Users/bbrenner/Documents/Scripting Projects/graphrag-with-sqlite_vec
```

---

## Purpose of .resources/

### graphrag-system/ Symlink

Points to the GraphRAG-with-SQLite-Vec repository, which will be integrated into Legilimens as `@legilimens/graphrag` package during Phase 3 (Q1 2026).

**Key Reference Documents:**
- `CONSTITUTION.md` - Model specifications, architectural invariants
- `CLAUDE.md` - Project overview, development guidelines
- `docs/planning/RESOURCE-GUARD-SYSTEM.md` - Resource management (Phase 4)
- `docs/planning/DMR-INTEGRATION-PLAN.md` - Docker Model Runner integration
- `docs/SQLITE-VEC-STATUS-CURRENT.md` - Implementation status

**Use Cases:**
1. **Planning Integration** - Understand GraphRAG architecture before Phase 3 work
2. **Specification Reference** - Check model specs (Triplex, Granite, StructLM)
3. **Architecture Alignment** - Ensure compatible designs with GraphRAG core
4. **Documentation Sync** - Keep integration plans up-to-date with source

---

## Workflow Guidelines

### Reading from .resources/

**Correct Usage:**
```python
# Read for reference
with open('.resources/graphrag-system/CONSTITUTION.md') as f:
    model_specs = f.read()

# Analyze structure
import os
files = os.listdir('.resources/graphrag-system/src/lib/')

# Extract information
# Use data to inform work in doc-gateway-cli/, not in .resources/
```

**Incorrect Usage:**
```python
# ❌ WRONG - Modifying symlinked file
with open('.resources/graphrag-system/CONSTITUTION.md', 'w') as f:
    f.write("Updated specs")

# ❌ WRONG - Running commands in symlinked directory
os.chdir('.resources/graphrag-system/')
os.system('npm install')

# ❌ WRONG - Git operations in symlink
os.system('cd .resources/graphrag-system && git commit -m "Update"')
```

### Integration Development (Phase 3)

**When copying code from reference:**

1. **Read** from `.resources/graphrag-system/src/`
2. **Adapt** for Legilimens in `packages/graphrag/src/`
3. **Test** in Legilimens workspace
4. **Never modify** the source in `.resources/`

**Example:**
```typescript
// ✅ CORRECT: Read reference, implement in Legilimens
// File: packages/graphrag/src/lib/repository-indexer.ts

/**
 * Repository indexer for Legilimens GraphRAG integration
 *
 * Adapted from .resources/graphrag-system/src/lib/repository-indexer.ts
 * with Legilimens-specific modifications
 */
export class RepositoryIndexer {
  // Implementation here (in packages/graphrag/)
}

// ❌ WRONG: Modifying the reference
// File: .resources/graphrag-system/src/lib/repository-indexer.ts
// (Should never edit this file)
```

---

## Error Handling

### If You Accidentally Modify .resources/

**Detection:**
- Git status shows changes in `.resources/`
- User reports unexpected changes in graphrag-with-sqlite_vec repo
- Build errors from symlinked directory

**Response:**
1. **Stop immediately** - Do not proceed with the task
2. **Inform user** - Explain what happened and why it's wrong
3. **Revert changes** - Use git checkout or manual revert
4. **Propose alternative** - Suggest correct approach in main repo

**Example Response:**
```
I apologize - I attempted to modify .resources/graphrag-system/CONSTITUTION.md,
which is a read-only reference symlink. This would have affected the standalone
GraphRAG repository.

I've reverted the change. For modifications to GraphRAG specifications, we should
either:
1. Work in the source repository at /Users/bbrenner/Documents/Scripting Projects/graphrag-with-sqlite_vec
2. Document Legilimens-specific adaptations in packages/graphrag/ (Phase 3)

Which approach would you like me to take?
```

---

## Verification Checklist

### Before Any File Operation

Ask yourself these questions:

1. **Is the file path under `.resources/`?**
   - YES → Read-only, no modifications
   - NO → Check if it's in main repo

2. **Am I about to modify a symlinked file?**
   - YES → STOP, redirect to proper location
   - NO → Proceed with caution

3. **Is this a git operation in `.resources/`?**
   - YES → STOP, work in main repo or source repo
   - NO → Proceed

4. **Is this a build/test command in symlinked directory?**
   - YES → STOP, run in main repo
   - NO → Proceed

### Before Suggesting Changes

When user asks for changes to GraphRAG:

1. **Identify location** - Is this in `.resources/` or `packages/graphrag/`?
2. **Check phase** - Are we in Phase 3 (integration) or pre-Phase 3 (planning)?
3. **Determine action:**
   - Pre-Phase 3 → Suggest changes to source repo (outside `.resources/`)
   - Phase 3 → Make changes in `packages/graphrag/` (not `.resources/`)

---

## Integration Phases and .resources/

### Pre-Phase 3 (Now - Q1 2026)

**Status:** Planning and preparation
**.resources/ role:** Reference for integration planning
**Your role:**
- Read GraphRAG documentation
- Review architecture and specifications
- Suggest integration strategies
- **Do NOT modify** anything in `.resources/`

### Phase 3 (Q1 2026)

**Status:** Active GraphRAG integration
**Active work:** `packages/graphrag/` in Legilimens
**Your role:**
- Copy/adapt code from `.resources/graphrag-system/` to `packages/graphrag/`
- Add Legilimens-specific integration code
- **Still do NOT modify** `.resources/`

### Post-Phase 3

**Status:** GraphRAG integrated into Legilimens
**Active work:** `packages/graphrag/` in Legilimens
**Your role:**
- Continue working in `packages/graphrag/`
- Use `.resources/graphrag-system/` for architecture sync
- **Never modify** `.resources/`

---

## Quick Reference Table

| Action | .resources/ | doc-gateway-cli/ | graphrag-with-sqlite_vec/ |
|--------|-------------|------------------|---------------------------|
| **Read files** | ✅ Yes | ✅ Yes | ✅ Yes (if in that repo) |
| **Modify files** | ❌ NO | ✅ Yes | ✅ Yes (if in that repo) |
| **Git operations** | ❌ NO | ✅ Yes | ✅ Yes (if in that repo) |
| **Build/Test** | ❌ NO | ✅ Yes | ✅ Yes (if in that repo) |
| **NPM install** | ❌ NO | ✅ Yes | ✅ Yes (if in that repo) |

---

## Summary

**Golden Rule:** Treat `.resources/` like a read-only mounted filesystem. You can browse it, but you can't write to it.

**If in doubt:** Ask the user whether you should:
1. Make changes in the main Legilimens repository
2. Suggest changes for the source repository (graphrag-with-sqlite_vec)
3. Wait until Phase 3 to implement in `packages/graphrag/`

**Never assume** you can modify `.resources/` - it's always wrong.

---

**Last Updated:** November 2, 2025
**Target Audience:** Cursor, Aider, Codex, and other AI coding agents
**Related:** See `.resources/README.md` and `.resources/CLAUDE.md` for complete usage guide
