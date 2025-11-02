# .resources/ - Monorepo Reference Directory

## ⚠️ IMPORTANT: REFERENCE ONLY - DO NOT MODIFY

This directory contains **symlinked reference projects** for the Legilimens CLI monorepo structure. These are **read-only references** to external repositories maintained separately.

### Purpose

The `.resources/` directory provides access to related projects and systems that Legilimens integrates with, allowing:
- **Cross-referencing** documentation and specifications
- **Planning coordination** across multiple systems
- **Architecture alignment** with integrated components
- **Shared context** for AI assistants and developers

### Directory Structure

```
.resources/
├── README.md          # This file
├── CLAUDE.md          # Instructions for Claude Code
├── AGENTS.md          # Instructions for AI coding agents
└── graphrag-system/   # Symlink to graphrag-with-sqlite_vec repository
```

---

## graphrag-system/ (Symlink)

**Target:** `../../../graphrag-with-sqlite_vec`
**Type:** Symlink (not tracked in git)
**Status:** Reference-only, active development in source repo

### What It Is

The GraphRAG system is a TypeScript implementation combining knowledge graphs with dynamic hybrid search. It will be integrated into Legilimens as `@legilimens/graphrag` package during Phase 3.

### Key Documentation

**In graphrag-system (via symlink):**
- `CONSTITUTION.md` - Canonical model specifications and architectural invariants
- `CLAUDE.md` - Project overview and development guidelines
- `docs/planning/RESOURCE-GUARD-SYSTEM.md` - Resource management (Phase 4)
- `docs/planning/DMR-INTEGRATION-PLAN.md` - Docker Model Runner integration
- `docs/SQLITE-VEC-STATUS-CURRENT.md` - Current implementation status

**In Legilimens:**
- `docs/PHASE-3-GRAPHRAG-INTEGRATION-PLAN.md` - Integration roadmap (10 weeks)

---

## Usage Rules

### ✅ DO:
- **Read** documentation from symlinked projects
- **Reference** specifications and architecture decisions
- **Cross-check** integration plans and dependencies
- **Learn** from existing implementations
- **Cite** source files in comments (e.g., "See .resources/graphrag-system/CONSTITUTION.md")

### ❌ DO NOT:
- **Modify** any files in `.resources/` or symlinked directories
- **Create** new files in symlinked projects
- **Commit** changes to symlinked repositories from here
- **Run** build commands or tests from symlinked directories
- **Install** dependencies in symlinked projects

### 🔧 Active Development

**For GraphRAG development:**
```bash
# Work in the source repository
cd "/Users/bbrenner/Documents/Scripting Projects/graphrag-with-sqlite_vec"

# NOT from the symlink
# cd .resources/graphrag-system  # ❌ Wrong
```

**For Legilimens + GraphRAG integration:**
```bash
# Work in the Legilimens repository
cd "/Users/bbrenner/Documents/Scripting Projects/doc-gateway-cli"

# Reference GraphRAG via symlink for planning/docs
cat .resources/graphrag-system/CONSTITUTION.md  # ✅ Read-only OK
```

---

## Git Behavior

### Ignored by Git

The `.resources/` directory is **gitignored** (see `../.gitignore`):
```gitignore
# Monorepo resources (symlinked reference projects)
.resources/
```

This means:
- Symlinks are **NOT tracked** in version control
- Each developer sets up their own symlinks locally
- No accidental commits to external repositories
- Clean separation of concerns

### Setup Instructions

**For new developers:**
```bash
# 1. Clone both repositories (if not already cloned)
git clone <legilimens-repo> doc-gateway-cli
git clone <graphrag-repo> graphrag-with-sqlite_vec

# 2. Create symlink (from legilimens root)
cd doc-gateway-cli
mkdir -p .resources
ln -s "../../graphrag-with-sqlite_vec" ".resources/graphrag-system"

# 3. Verify symlink works
ls -la .resources/graphrag-system/  # Should show graphrag files
cat .resources/graphrag-system/CONSTITUTION.md  # Should display content
```

---

## Monorepo Philosophy

### Why Symlinks Instead of Submodules?

**Advantages:**
- ✅ **Independent git history** - Each repo maintains separate history
- ✅ **Flexible development** - Work in either repo without submodule complexity
- ✅ **No nested commits** - No accidentally committing in wrong repo
- ✅ **Simple setup** - Single `ln -s` command vs. submodule init/update
- ✅ **Local customization** - Developers can point to different branches/forks
- ✅ **No git overhead** - Symlinks ignored, no submodule state tracking

**Tradeoffs:**
- ⚠️ **Manual setup** - Each developer creates symlinks locally
- ⚠️ **Version ambiguity** - No enforced version locking (rely on documentation)
- ⚠️ **Broken links** - Symlink breaks if source repo moved (easy to fix)

### Integration Strategy

**Phase 3 Plan:**
During GraphRAG integration (Q1 2026), the symlinked `graphrag-system` will be:
1. **Copied** into `packages/graphrag/` (pnpm workspace package)
2. **Adapted** with Legilimens-specific integrations
3. **Maintained separately** in source repo for standalone use

The symlink remains for:
- **Planning reference** during integration
- **Architecture synchronization** across projects
- **Post-integration updates** to GraphRAG core

---

## Troubleshooting

### Symlink Broken

**Symptom:** `ls: .resources/graphrag-system: No such file or directory`

**Fix:**
```bash
# Remove broken symlink
rm .resources/graphrag-system

# Recreate with correct path
ln -s "../../graphrag-with-sqlite_vec" ".resources/graphrag-system"

# Or absolute path
ln -s "/Users/bbrenner/Documents/Scripting Projects/graphrag-with-sqlite_vec" \
      ".resources/graphrag-system"
```

### Permission Denied

**Symptom:** `Permission denied` when reading files

**Fix:**
```bash
# Check source repo permissions
ls -la "../../../graphrag-with-sqlite_vec"

# Verify symlink target is correct
readlink .resources/graphrag-system
```

### Git Tracking Symlink

**Symptom:** Git shows `.resources/` in `git status`

**Fix:**
```bash
# Verify .gitignore includes .resources/
grep -n "\.resources" .gitignore

# If missing, add it
echo -e "\n# Monorepo resources (symlinked reference projects)\n.resources/" >> .gitignore

# Force remove from tracking if already added
git rm --cached -r .resources/
```

---

## Future Additions

As Legilimens grows, additional symlinks may be added:

```
.resources/
├── graphrag-system/       # Current
├── doc-gateway-api/       # Future: API documentation server
├── legilimens-plugins/    # Future: Plugin ecosystem
└── shared-llm-runtime/    # Future: Shared LLM management layer
```

Each addition will follow the same principles:
- **Reference only** - No active development
- **Symlinked** - Not tracked in git
- **Documented** - Purpose and usage rules clear
- **Coordinated** - Integration plans documented

---

**Last Updated:** November 2, 2025
**Maintainer:** Legilimens CLI Team
**Related Docs:**
- `../docs/PHASE-3-GRAPHRAG-INTEGRATION-PLAN.md` - Integration roadmap
- `.resources/graphrag-system/CONSTITUTION.md` - GraphRAG specifications
