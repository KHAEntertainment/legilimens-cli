# CLAUDE.md - Instructions for Claude Code in .resources/

## ⚠️ CRITICAL: READ-ONLY REFERENCE DIRECTORY

This is the `.resources/` directory containing **symlinked reference projects**. You are working in the **Legilimens CLI** repository, and this directory provides read-only access to related systems.

---

## Primary Working Directory

**Your main workspace is:**
```
/Users/bbrenner/Documents/Scripting Projects/doc-gateway-cli/
```

**This file is located at:**
```
/Users/bbrenner/Documents/Scripting Projects/doc-gateway-cli/.resources/CLAUDE.md
```

---

## Absolute Rules for .resources/

### ❌ DO NOT:

1. **Modify any files** in `.resources/` or its subdirectories
2. **Create new files** in symlinked projects
3. **Run git commands** from within symlinked directories
4. **Execute build/test commands** in symlinked projects
5. **Install dependencies** in symlinked projects
6. **Make any changes** that would affect symlinked repositories

### ✅ DO:

1. **Read** documentation and source code
2. **Reference** specifications and architecture decisions
3. **Cross-check** integration plans
4. **Learn** from implementation patterns
5. **Cite** source files in your responses (with full path)

---

## Purpose of .resources/

This directory provides **context and reference** for:
- **Cross-project coordination** - Understand how systems integrate
- **Architecture alignment** - Ensure compatible designs
- **Planning reference** - Review roadmaps and specifications
- **Documentation access** - Read canonical sources of truth

---

## graphrag-system/ Symlink

### What It Points To

```bash
.resources/graphrag-system/ → /Users/bbrenner/Documents/Scripting Projects/graphrag-with-sqlite_vec
```

### Key Reference Documents

**IMPORTANT:** Always use full paths when referencing:

```
.resources/graphrag-system/CONSTITUTION.md
.resources/graphrag-system/CLAUDE.md
.resources/graphrag-system/docs/planning/RESOURCE-GUARD-SYSTEM.md
.resources/graphrag-system/docs/planning/DMR-INTEGRATION-PLAN.md
.resources/graphrag-system/docs/SQLITE-VEC-STATUS-CURRENT.md
```

### When to Reference

**Read GraphRAG documentation when:**
- Planning Phase 3 integration work
- Understanding model specifications (Triplex, Granite, etc.)
- Reviewing Resource Guard System architecture
- Checking hybrid search implementation details
- Verifying DMR provider requirements

**Example:**
```
User: "How does GraphRAG handle embeddings?"

Claude: "According to .resources/graphrag-system/CONSTITUTION.md, GraphRAG uses
IBM Granite Embedding (125M parameters, 768 dimensions) with a dual embedding
strategy:
- Entity embeddings: 'name :: kind :: hints' format
- Edge embeddings: 'S <predicate> O :: context' format

See .resources/graphrag-system/CONSTITUTION.md lines 93-119 for full specification."
```

---

## If User Asks You to Modify .resources/

### Correct Response Pattern

If a user asks you to edit files in `.resources/`:

```
User: "Update .resources/graphrag-system/CONSTITUTION.md to add X"

Claude: "I cannot modify files in .resources/ because it's a read-only reference
directory pointing to a separate repository. The file you want to update is located at:

  /Users/bbrenner/Documents/Scripting Projects/graphrag-with-sqlite_vec/CONSTITUTION.md

To make changes to GraphRAG:
1. Switch to the graphrag-with-sqlite_vec repository
2. Make changes in that repository
3. Changes will automatically be visible in .resources/graphrag-system/ (symlink)

Would you like me to help you make changes in the source repository instead?"
```

---

## Integration Work

### Phase 3: GraphRAG Integration

**Active Work Location:**
```
doc-gateway-cli/packages/graphrag/  # Future workspace package (Phase 3b)
```

**Reference Material:**
```
.resources/graphrag-system/         # Read-only reference
docs/PHASE-3-GRAPHRAG-INTEGRATION-PLAN.md  # Integration roadmap
```

### Workflow Pattern

**Planning:**
1. Read `.resources/graphrag-system/CONSTITUTION.md` for model specs
2. Review `.resources/graphrag-system/docs/planning/` for architecture
3. Reference Legilimens `docs/PHASE-3-GRAPHRAG-INTEGRATION-PLAN.md` for integration plan

**Implementation (Phase 3):**
1. Create `packages/graphrag/` in Legilimens
2. Port/adapt code from reference (don't modify source)
3. Add Legilimens-specific integrations
4. Test within Legilimens workspace

**Post-Integration:**
1. Keep symlink for architecture sync
2. Apply updates to `packages/graphrag/` in Legilimens
3. Contribute improvements back to source repo (if needed)

---

## Error Prevention

### If You Accidentally Modify .resources/

**Symptom:** You used Edit, Write, or other modification tools on `.resources/` files

**Immediate Action:**
1. **STOP** - Do not commit
2. **INFORM USER** - Explain the mistake
3. **UNDO** - Git checkout or manual revert
4. **RE-READ** - Review this file to prevent recurrence

**Example Response:**
```
"I apologize - I mistakenly attempted to modify .resources/graphrag-system/CLAUDE.md,
which is a read-only reference. I've reverted that change. For modifications to GraphRAG,
we should work in the source repository at:

  /Users/bbrenner/Documents/Scripting Projects/graphrag-with-sqlite_vec/

Shall I help you make changes there instead?"
```

---

## Verification Before Actions

### Mental Checklist (Before Any Modification)

Before using Write, Edit, or other file-modifying tools, ask yourself:

1. **Is this path under `.resources/`?**
   - YES → **STOP** - Read-only, reference user to source repo
   - NO → Proceed

2. **Does this path start with `.resources/graphrag-system/`?**
   - YES → **STOP** - This is symlinked, redirect to actual repo
   - NO → Proceed

3. **Am I being asked to modify a symlinked file?**
   - YES → **STOP** - Explain symlink structure, offer alternative
   - NO → Proceed

---

## Summary for Quick Reference

| Action | .resources/ | doc-gateway-cli/ |
|--------|-------------|------------------|
| Read files | ✅ Yes | ✅ Yes |
| Write/Edit files | ❌ NO | ✅ Yes |
| Run git commands | ❌ NO | ✅ Yes |
| Build/Test | ❌ NO | ✅ Yes |
| Reference in responses | ✅ Yes | ✅ Yes |

**Golden Rule:** `.resources/` is like a library - you can read books, but you can't write in them.

---

**Last Updated:** November 2, 2025
**Purpose:** Protect symlinked repositories from accidental modifications
**Related:** See `.resources/README.md` for complete usage guide
