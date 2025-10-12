# Legilimens CLI – Phase 2 Summary

## Source Notes

- Captured from `docs/Notes regarding CLI implementation.md` (batch of usability issues).
- Supplemented by hands-on CLI run-throughs on 2025-10-08 and the follow-up discussion about automation gaps.

## Current Pain Points

- Missing "other" category: CLI can't classify documentation that is not a framework, API, library, or tool.
- No batch ingestion: users must enter dependencies one at a time; there is no file import, multi-line, or comma-separated mode.
- Manual DeepWiki URLs: GitHub sources do not auto-convert to the expected `https://deepwiki.com/{org}/{repo}` path.
- Non-GitHub sources unsupported: CLI does not recommend Context7 (or another method) when repositories are private or hosted elsewhere.
- Output guidance weak: Generated instructions do not force the use of DeepWiki/Context7 MCP tools, leaving agents to rely on generic fetchers.
- Output directory friction: CLI asks users for a destination path and suggests `docs/static-backup/...` instead of deriving `docs/{type}/{slug}.md` automatically.
- Template stub still active: generation fails because `docs/templates/legilimens-template.md` is missing.
- ~~No AI automation: CLI only produces prompts; it does not drive any API calls or agent tooling despite the original project goal.~~ **[IN PROGRESS]** AI CLI tool orchestration now implemented
- ~~Agent detection absent: CLI cannot discover installed agentic CLIs (Claude Code, Copilot CLI, etc.) or orchestrate them on the user's behalf.~~ **[IN PROGRESS]** CLI tool detection and orchestration system implemented
- ~~Credential handling unclear: tooling never records Context7 / Firecrawl / Ref keys, so the CLI cannot invoke those services directly.~~ **[RESOLVED]** CLI tools manage their own credentials; Legilimens orchestrates installed tools

## Phase 2 Goals (High Level)

- Reinstate the automation promise: CLI should invoke a detected agent CLI (or other configured automation) to classify dependencies, fetch knowledge, and generate markdown—without manual copy/paste.
- Expand classification: include an “other” bucket and smarter type inference, especially when batch processing.
- Provide batch workflows: accept lists from files or multi-entry prompts, auto-sort by type, and process sequentially.
- Improve knowledge sourcing: auto-derive DeepWiki URLs for GitHub repos; route non-GitHub resources through Context7 (or configurable fallbacks).
- Strengthen output: ensure guidance explicitly directs agents to DeepWiki/Context7 MCP tools, and generate output directories automatically.
- Ship real templates: add the missing `legilimens-template.md` asset and validate it during generation.
- Keep credentials user-owned: document that the CLI relies on existing agent configurations (no internal key storage yet); flag future work for direct API support.

## Spec & Constitution Drift Summary

- **DeepWiki wording changed** (`docs/consitution-original.md:35`): generated docs use altered language instead of the mandated instruction block.
- **Naming convention unenforced** (`docs/consitution-original.md:47`): files omit the required descriptor segment (only `{type}_{slug}.md` today).
- **Static backups are placeholders** (`docs/consitution-original.md:98-104`): no automated fetch; CLI writes a stub file.
- **API fallback chain missing** (`docs/consitution-original.md:71-81`): spec requires ref.tools → Context7 → Firecrawl; implementation lacks any fetchers.
- **Auto-detection skipped** (`docs/sdp.md:632`): user must choose type manually; no GitHub/NPM/URL inference.
- ~~**AI generation absent** (`docs/sdp.md:17-63`, `632-637`): Gemini integration never implemented; core just performs string substitution.~~ **[RESOLVED]** AI CLI tool orchestration implemented using installed CLI tools instead of direct SDK integration
- **Batch mode unrealized** (`docs/Notes regarding CLI implementation.md:2`): CLI handles single input only.
- **Non-interactive flow still a stub** (`packages/cli/src/flows/nonInteractive.ts:92-118`): ends with "Shared module stub prevented full generation."
- ~~**Agent orchestration lacking**: CLI neither detects nor drives existing agent CLIs/MCP tooling.~~ **[RESOLVED]** CLI tool detection and orchestration system implemented with fallback chains
- ~~**Credential workflow undefined**: Spec expected Context7/Firecrawl/Ref usage; current CLI never requests or stores keys.~~ **[RESOLVED]** CLI tools manage their own credentials; Legilimens preserves user control over API keys
- **Template asset missing**: `legilimens-template.md` referenced but not present, causing runtime errors.

## Phase 2 Implementation - AI CLI Tool Orchestration

**Approach Taken**: Instead of direct Gemini SDK integration as originally planned, the system now harnesses pre-existing CLI tools installed on the end user's machine (gemini-cli, openai, claude-code, qwen-code) via headless command-line invocation.

**Key Benefits**:
- **User Control**: API keys and credentials remain user-owned; tools manage their own configuration
- **Flexibility**: Supports multiple AI providers through a unified orchestration layer
- **Graceful Fallback**: Falls back to static content generation when no tools are available
- **Constitution Compliance**: Template structure and MCP guidance remain template-driven, not AI-generated

**Implementation Architecture**:
1. **Detection Layer** (`cliDetector.ts`): Detects installed AI CLI tools using `which` command or path resolution
2. **Orchestration Layer** (`cliOrchestrator.ts`): Executes selected CLI tool in headless mode with fallback logic
3. **Integration Layer** (`gateway.ts`): Replaces static string substitution with AI generation
4. **Configuration Layer** (`runtimeConfig.ts`): Environment variables for preferred tool and settings

**Content Generation Strategy**:
- AI generates **content only** (short description and features)
- Template structure and MCP guidance remain **locally controlled** for constitution compliance
- Hybrid approach balances automation with governance requirements

## Phase 2 Implementation - Batch Processing Mode

**Approach Taken**: Comprehensive batch processing system allowing users to process multiple dependencies in a single CLI session with intelligent auto-classification and dual-level progress tracking.

**Key Features**:
- **Multi-Format Input**: Supports inline comma-separated lists, .txt files (one per line), and .json files (structured dependency data)
- **Auto-Classification**: Automatically detects dependency types (GitHub, NPM, URL, unknown) with confidence-based heuristics
- **Intelligent Sorting**: Groups and sorts dependencies by type for optimal processing order
- **Dual-Level Progress**: Batch-level timeline shows overall progress; item-level timeline shows current dependency processing
- **Comprehensive Results**: Summary view groups generated files by type and reports detailed failure information
- **Backward Compatibility**: Single-mode processing remains unchanged; batch mode is an optional enhancement

**Implementation Architecture**:
1. **Input Parsing Layer** (`batchInputParser.ts`): Parses various input formats and validates file paths
2. **Classification Layer** (`dependencyClassifier.ts`): Auto-detects source types and normalizes identifiers
3. **Orchestration Layer** (`batchGeneration.ts`): Coordinates batch processing with progress tracking
4. **UI Components**:
   - `GenerationPrompt.tsx`: Mode selection and batch input collection
   - `BatchProgressView.tsx`: Dual-level progress display component
   - `CompletionSummary.tsx`: Enhanced to show batch results with statistics
   - `ProgressTimeline.tsx`: Extended with optional title and progress indicators
5. **Flow Integration** (`GenerationFlow.tsx`): Routes between single and batch modes

**User Experience**:
- **Mode Selection**: User chooses single or batch processing at start
- **Batch Input**: Enter identifiers directly or provide file path with `@` prefix
- **Live Preview**: Shows detected dependency count and type breakdown
- **Progress Tracking**: Real-time batch and item progress with completion percentages
- **Results Summary**: Statistics, grouped files, failure details, and suggestions

**Batch Input Examples**:
- Inline: `vercel/ai, react, @scope/package`
- Text File: `@deps.txt` (one identifier per line)
- JSON File: `@deps.json` (array of objects with identifier, type, deepWiki fields)

Use this summary to seed the `/speckit.specify` brief for feature `002-…` and to explain why the first cycle stopped short of the intended automation.
