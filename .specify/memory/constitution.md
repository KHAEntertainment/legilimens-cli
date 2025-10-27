<!--
Sync Impact Report
Version: 1.4.1 -> 2.0.0
Modified Principles:
- Mission-Led Gateways (brand rename from doc-gateway to Legilimens reflected throughout)
- Reusable Node.js Core (scope + naming aligned with Legilimens Node.js module requirement)
Added Sections:
- (none)
Removed Sections:
- (none)
Templates requiring updates:
- ✅ .specify/templates/plan-template.md (pass-through — no wording changes required)
- ✅ .specify/templates/spec-template.md (pass-through — no wording changes required)
- ✅ .specify/templates/tasks-template.md (pass-through — no wording changes required)
Follow-up TODOs:
- TODO(RATIFICATION_DATE): Original adoption date not recorded beyond year 2025.
-->

# Legilimens CLI Constitution

## Core Principles

### Mission-Led Gateways
- Gateway documentation MUST remain lightweight quick-reference surfaces that preserve limited AI and IDE context windows.
- Every deliverable MUST articulate the dependency's purpose, pivotal capabilities, and navigation cues while deferring deep content to external sources.
- Automation MUST provide static-backup links for deep dives and explicit DeepWiki usage guidance so developers know where to retrieve live knowledge.

Rationale: Keeping outputs concise sustains developer focus and leaves headroom for active implementation context.

### Immutable Template Format
- Each gateway doc MUST implement the canonical sequence: Title, Overview sentence, Short Description (2-3 sentences), Key Features (exactly 5 items), MCP Tool Guidance (with DeepWiki instructions), Static Backup Reference link, Official Source link.
- Headings, counts, and label casing are immutable across frameworks, APIs, libraries, tools, and other dependencies.
- The canonical formatting is defined in `docs/consitution-original.md`; generated outputs MUST match it exactly, including the DeepWiki guidance block.
- Any proposed template adjustment MUST complete the governance amendment process before being adopted in automation.

Rationale: A single, validated structure prevents drift and keeps downstream consumers reliable.

### Naming & Directory Discipline
- File names MUST observe the `{type}_{name}_{descriptor}.md` pattern (e.g., `framework_vercel_ai_sdk.md`, `api_stripe.md`, `library_lodash.md`, `tool_eslint.md`).
- Gateway and static-backup artifacts MUST live in the canonical directory tree under `docs/` with type-specific folders and `static-backup/` subdirectories.
- Tooling MUST halt or fail fast when paths deviate from the mandated structure to avoid silent entropy.

Rationale: Deterministic naming and layout unlock automation, batching, and instant discoverability.

### Source Priority Chain
- Source detection MUST resolve in priority order: GitHub-style identifiers -> ref.tools first, NPM packages -> Context7 first, raw URLs -> Firecrawl only.
- Each source type MUST attempt its mandated fallback chain (GitHub: ref.tools then Firecrawl; NPM: Context7 -> ref.tools -> Firecrawl; URL: Firecrawl without fallback) before reporting failure.
- Skipping or reordering source attempts without governance approval constitutes a violation.

Rationale: The proven acquisition sequence minimizes latency while safeguarding coverage when primary sources fail.

### Operational Guardrails
- Typical executions MUST complete within 10 seconds; large repositories may extend to a 60-second ceiling without user intervention.
- The CLI MUST surface progress indicators during long-running operations so users can track status.
- Outputs MUST pass all six quality gates: template compliance, explicit DeepWiki instructions, correct directory hierarchy, strict naming convention, graceful error handling, and dual gateway plus static-backup generation.
- The following actions are prohibited: modifying the canonical template structure, renaming `static-backup` directories, skipping the fallback chain, mixing naming conventions, inlining large documentation inside gateway files, omitting DeepWiki instructions, or overwriting existing docs without explicit confirmation.

Rationale: Consistent guardrails keep the workflow predictable, safe, and production-ready.

### DeepWiki-First Guidance
- Every gateway doc MUST instruct developers to use DeepWiki MCP for in-context answers and to rely on static-backup files for deep planning sessions.
- Launch and help flows MUST reinforce "DeepWiki for coding; static files for planning" so the team consistently preserves context windows.
- Tooling MUST validate that generated docs include the canonical DeepWiki guidance block with up-to-date repository references.

Rationale: DeepWiki is the sanctioned path for live documentation retrieval, ensuring the workflow balances agility and depth.

### Reusable Node.js Core
- All Legilimens business logic MUST live in a reusable TypeScript module targeting the Node.js runtime so the CLI and any other surfaces consume the same capabilities.
- The CLI MUST remain a thin wrapper over the shared module, avoiding duplicated logic or divergent code paths.
- New surfaces (e.g., web services) MUST integrate by importing the shared module, ensuring behavior parity and single-source governance.
- The shared module and consuming adapters MUST standardize on Node.js 20 LTS; adopting alternative runtimes (such as Bun or Deno) requires a successful governance amendment before exploration.

Rationale: A common Node.js core keeps feature work reusable, reduces drift between interfaces, and accelerates future platform integrations.

## Operational Standards

Legilimens CLI runs MUST follow the execution cadence below to maintain reliability and context efficiency:

1. Validate user input, detect dependency type, and confirm that naming and directory targets exist or can be created safely.
2. Acquire source material using the mandated priority and fallback chain, logging each attempt for traceability.
3. Generate the gateway doc via Gemini using the immutable template, produce the paired static-backup, and verify both artifacts for compliance—including DeepWiki guidance text.
4. Persist files to the canonical structure, emitting confirmations or actionable errors instead of silent failures.
5. Provide real-time feedback and timing transparency so operators can intervene before hitting performance ceilings.
6. Expose all new capabilities through the shared TypeScript/Node module first, then consume them from the CLI or other adapters to maintain a single source of truth.

## Canonical Template Specification

The shorthand gateway template MUST match the exact formatting reproduced below. This content mirrors `docs/consitution-original.md` and MUST stay synchronized.

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
5. **MCP Tool Guidance** section (MUST reference DeepWiki)
6. **Static Backup Reference** link
7. **Official Source** link

### 🔧 The DeepWiki Doctrine
**DeepWiki MCP is the PRIMARY tool for preserving context windows.**

#### Quick Reference (During Active Development)
- **USE**: `DeepWiki ask_question()` for immediate answers
- **EXAMPLE**: `ask_question("How do I implement streaming with Vercel AI SDK?")`
- **BENEFIT**: Get precise answers without loading entire docs

#### Deep Research (Planning Phase)
- **USE**: Static-backup markdown files
- **WHEN**: Dedicated research/planning sessions
- **WHERE**: `./static-backup/[dependency].md`

#### The Golden Rule
> "DeepWiki for coding. Static files for planning."

Every gateway doc MUST include explicit DeepWiki instructions:
```
## USE DEEPWIKI MCP TO ACCESS DEPENDENCY KNOWLEDGE!
To access the most up-to-date documentation for this framework, use the DeepWiki MCP to retrieve information directly from the source repository. Access the repository at https://github.com/[user/repo] and use the `ask_question` function with specific queries like "how can I [specific task]" to get targeted guidance.

For broader context during planning, the full static docs are available at: 
[./static-backup/[filename].md](./static-backup/[filename].md)
```

### 🏗️ File Structure Rules

#### Naming Convention (STRICT)
- **Format**: `{type}_{name}_{descriptor}.md`
- **Examples**:
  - `framework_vercel_ai_sdk.md`
  - `api_stripe.md`
  - `library_lodash.md`
  - `tool_eslint.md`
  - `other_custom_dependency.md`

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
├── tools/
│   ├── tool_*.md
│   └── static-backup/
└── other/
    ├── other_*.md
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
- **NEVER** omit DeepWiki instructions from gateway docs

### ✅ Quality Gates
All outputs MUST:
1. Match template compliance exactly
2. Include explicit DeepWiki MCP instructions
3. Create correct file structure
4. Follow naming convention strictly
5. Handle errors gracefully
6. Generate both gateway and static files

### 🎭 Philosophy
> "Context windows are precious real estate. Every token counts."

Gateway docs are **navigation aids**, not encyclopedias. They:
- Point to DeepWiki for quick answers during coding
- Reference static-backup for deep planning sessions
- Preserve context by keeping docs external
- Enable fast, targeted information retrieval

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

*Constitution Version: 1.1.0*
*Established: 2024*
*Updated: Added DeepWiki Doctrine*

## Philosophy & Developer Guidance

> "Context windows are precious real estate. Every token counts."

Gateway docs are navigation aids, not encyclopedias. Treat them as launchpads that help developers: understand what a dependency does, know its key capabilities, access full documentation when needed, and preserve context for active development. When expanding the toolchain, prioritize features that keep outputs concise, actionable, and immediately trustworthy.

## Governance

- **Authority**: This constitution supersedes all other workflow notes; conflicting instructions must be reconciled before release.
- **Amendment Criteria**: Changes are justified only when the template format fails in three or more real cases, a new dependency type emerges beyond frameworks/APIs/libraries/tools/other, a structure change demonstrably saves more than 20% context, or DeepWiki MCP is replaced by a superior tool.
- **Amendment Procedure**: Document rationale, collect reproduction evidence, update automation, and secure maintainer approval before shipping; no interim shortcuts are permitted.
- **Versioning Policy**: Apply semantic versioning - MAJOR for breaking rule changes or removals, MINOR for new principles or materially expanded guidance, PATCH for clarifications that do not alter obligations.
- **Compliance Review**: Every plan (`/speckit.plan`) must document a Constitution Check covering all six principles; releases may proceed only after confirming runtime guardrails, directory audits, and DeepWiki instruction enforcement remain intact.

**Version**: 2.1.0 | **Ratified**: 2025-10-08 | **Last Amended**: 2025-10-08
