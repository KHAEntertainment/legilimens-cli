# Legilimens Constitution
## Core Principles & Immutable Rules

### 🎯 Mission
Create lightweight gateway documentation that preserves context windows while providing quick reference to external dependencies.

### 📜 The Sacred Template Format
**This template structure is IMMUTABLE and validated through extensive use.**

Every gateway doc MUST follow this exact structure:
1. **Title** with dependency name
2. **Overview** sentence with one-line description
3. **Short Description** (2-3 sentences)
4. **Key Features** (exactly 5 items)
5. **MCP Tool Guidance** section (MUST include source-appropriate MCP tool guidance (DeepWiki for GitHub, Context7 for NPM, Firecrawl for URLs, static backup for unknown))
6. **Static Backup Reference** link
7. **Official Source** link

### 🔧 The MCP Tool Guidance Doctrine
**Different sources require different MCP tools for optimal context preservation.**

#### Quick Reference (During Active Development)
- **GitHub**: `DeepWiki ask_question()` for immediate answers
- **NPM**: `Context7 MCP` for cached package documentation
- **URLs**: `Firecrawl MCP` for live documentation scraping
- **Unknown**: Static-backup files as primary reference

#### Deep Research (Planning Phase)
- **USE**: Static-backup markdown files for all source types
- **WHEN**: Dedicated research/planning sessions
- **WHERE**: `./static-backup/[dependency].md`

#### MCP Tool Selection by Source Type

**GitHub Repositories**: Use DeepWiki MCP with `ask_question()` function for direct repository access
**NPM Packages**: Use Context7 MCP for cached package documentation and API references
**Documentation URLs**: Use Firecrawl MCP or web-based tools for live documentation scraping
**Unknown Sources**: Rely on static backup files as primary reference

#### Example MCP Guidance Templates

**Example 1 - GitHub Source**:
```
## USE DEEPWIKI MCP TO ACCESS DEPENDENCY KNOWLEDGE!
Primary repository: https://github.com/user/repo
Example: ask_question("What is the quickest way to integrate this dependency?")

For planning sessions, review the static backup: ./static-backup/framework_name.md

DeepWiki for coding. Static files for planning.
```

**Example 2 - NPM Package**:
```
## USE CONTEXT7 MCP TO ACCESS PACKAGE DOCUMENTATION!
Context7 provides cached NPM package documentation optimized for quick queries.
Use Context7 MCP to query package APIs, usage patterns, and examples.

For deep research, review the static backup: ./static-backup/library_name.md

Context7 for package docs. Static files for deep research.
```

**Example 3 - Documentation URL**:
```
## USE FIRECRAWL OR WEB-BASED TOOLS TO ACCESS DOCUMENTATION!
Documentation available at: https://docs.example.com
Use Firecrawl MCP or browser-based access for specific sections.

For offline reference, review the static backup: ./static-backup/api_name.md

Web tools for live docs. Static files for offline reference.
```

#### The Golden Rules
> "Right tool for the right source. Static files for planning."
> "DeepWiki for GitHub repos. Context7 for NPM packages. Firecrawl for URLs."

Every gateway doc MUST include source-appropriate MCP tool instructions based on the detected dependency source type.

### 🏗️ File Structure Rules

#### Naming Convention (STRICT)
- **Format**: `{type}_{name}_{descriptor}.md`
- **Examples**:
  - `framework_vercel_ai_sdk.md`
  - `api_stripe.md`
  - `library_lodash.md`
  - `tool_eslint.md`

#### Directory Structure (IMMUTABLE)
```
docs/
├── frameworks/
│   ├── framework_*.md           # Gateway docs (point to DeepWiki)
│   └── static-backup/           # Full documentation (for planning)
├── apis/
│   ├── api_*.md
│   └── static-backup/
├── libraries/
│   ├── library_*.md
│   └── static-backup/
└── tools/
    ├── tool_*.md
    └── static-backup/
```

### 🔄 API Priority Rules

#### Source Detection Order
1. **GitHub pattern** → ref.tools first
2. **NPM package** → Context7 first
3. **URL** → Firecrawl only

#### Fallback Chain (MANDATORY)
- **GitHub**: ref.tools → Firecrawl
- **NPM**: Context7 → ref.tools → Firecrawl
- **URL**: Firecrawl (no fallback)

### ⚡ Performance Standards
- **Max execution**: 10 seconds typical
- **Large repo timeout**: 60 seconds
- **User feedback**: Always show progress indicators

### 🚫 Forbidden Actions
- **NEVER** modify template structure
- **NEVER** change folder names from `static-backup`
- **NEVER** skip fallback chain
- **NEVER** mix naming conventions
- **NEVER** inline large docs in gateway files
- **NEVER** overwrite without confirmation
- **NEVER** omit source-appropriate MCP tool instructions from gateway docs
- **NEVER** use generic "web-fetch" instructions instead of specific MCP tool guidance
- **NEVER** recommend DeepWiki for non-GitHub sources
- **NEVER** omit source-specific MCP tool instructions

### ✅ Quality Gates
All outputs MUST:
1. Match template compliance exactly
2. Include source-appropriate MCP tool instructions (DeepWiki for GitHub, Context7 for NPM, etc.)
3. Create correct file structure
4. Follow naming convention strictly
5. Handle errors gracefully
6. Generate both gateway and static files

### 🎭 Philosophy
> "Context windows are precious real estate. Every token counts."

Gateway docs are **navigation aids**, not encyclopedias. They:
- Point to the right MCP tool for the right source type
- Reference static-backup for deep planning sessions
- Preserve context by keeping docs external
- Enable fast, targeted information retrieval
- Different sources require different access patterns
- MCP tools are optimized for specific source types

### 🏛️ Governance
This constitution can only be modified when:
1. Template format proves insufficient (3+ real failures)
2. New dependency type emerges (beyond current four)
3. Structure change saves >20% context
4. DeepWiki MCP is replaced by superior tool

---

**Remember**: 
- DeepWiki = Quick answers during coding
- Static-backup = Deep research during planning
- The template and structure are battle-tested. Honor them.

*Constitution Version: 1.2.0*
*Established: 2024*
*Updated: Enhanced to multi-tool MCP guidance doctrine*
