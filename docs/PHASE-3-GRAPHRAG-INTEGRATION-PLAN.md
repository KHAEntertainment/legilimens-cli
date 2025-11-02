# Phase 3: GraphRAG Integration Plan
## Comprehensive Strategy for Merging GraphRAG-with-SQLite-Vec into Legilimens CLI

**Document Version:** 1.1
**Created:** November 1, 2025
**Last Updated:** November 2, 2025
**Status:** Ready for Review (includes Phase 4 preview)
**Target Completion:** Phase 3d (Q1 2026)

---

## Executive Summary

This document outlines a comprehensive, phased approach to integrating the GraphRAG-with-SQLite-Vec system into the Legilimens CLI project. The integration will transform Legilimens from a documentation fetching tool into a powerful, local-first knowledge management system with advanced semantic search, graph-based querying, and intelligent MCP server capabilities.

### Key Integration Goals

1. **Preserve Existing Functionality**: Maintain backward compatibility with current Legilimens documentation generation
2. **Add Optional GraphRAG Layer**: Provide users with opt-in knowledge graph and semantic search capabilities
3. **Enable MCP Integration**: Expose GraphRAG capabilities via Model Context Protocol for coding assistants
4. **Unify AI Infrastructure**: Standardize on shared llama.cpp binary and model management
5. **Monorepo Structure**: Integrate GraphRAG as `@legilimens/graphrag` package within pnpm workspace

### Success Criteria

- ✅ GraphRAG runs as optional feature (users can disable and fallback to DeepWiki)
- ✅ New CLI commands: `legilimens rag index`, `legilimens rag query`, `legilimens rag serve`
- ✅ MCP server provides surgical context to coding assistants
- ✅ Shared llama.cpp infrastructure (no duplicate binaries)
- ✅ All existing Legilimens tests remain green
- ✅ Documentation updated with GraphRAG workflows

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [GraphRAG User Stories & Integration Points](#2-graphrag-user-stories--integration-points)
3. [Architecture & Design Decisions](#3-architecture--design-decisions)
4. [Phased Implementation Roadmap](#4-phased-implementation-roadmap)
5. [Risk Assessment & Mitigation](#5-risk-assessment--mitigation)
6. [Testing Strategy](#6-testing-strategy)
7. [Documentation Requirements](#7-documentation-requirements)
8. [Appendices](#appendices)

---

## 1. Current State Analysis

### 1.1 Legilimens CLI - Current Architecture

**Project Structure:**
```
legilimens-cli/
├── packages/
│   ├── core/           # Business logic (detection, fetchers, AI orchestration)
│   ├── cli/            # Clack/Ink TUI interface
│   └── harness-service/ # Fastify HTTP parity testing
├── docs/               # Constitution, templates, guides
└── tests/integration/  # Cross-surface parity suite
```

**Core Capabilities:**
- **Repository Discovery**: Tavily-first pipeline with AI-assisted detection
- **Documentation Fetching**: DeepWiki, Context7, Firecrawl, RefTools
- **AI Generation**: Local LLM (llama.cpp) or cloud providers (OpenAI, Gemini)
- **Template Enforcement**: Strict adherence to `docs/templates/legilimens-template.md`
- **Configuration Management**: System keychain integration, setup wizard
- **Performance Tracking**: <10s typical runs, 60s absolute max

**Technology Stack:**
- TypeScript 5.4+ (strict mode, ESM modules)
- Node.js 20 LTS
- pnpm workspaces
- Local LLM: llama.cpp (phi-4/Granite Micro via auto-installer)
- External APIs: Tavily (required), Firecrawl, Context7 (optional)
- Storage: File-based config (`~/.legilimens/config.json`), keychain for secrets

**Key Integration Points:**
- `@legilimens/core/gateway.ts` - Main orchestration flow
- `@legilimens/core/ai/cliOrchestrator.ts` - LLM execution
- `@legilimens/cli/clackApp.ts` - User interaction loop
- `@legilimens/cli/config/userConfig.ts` - Configuration management

### 1.2 GraphRAG System - Current Architecture

**Project Structure:**
```
graphrag-with-sqlite_vec/
├── src/
│   ├── lib/              # Core GraphRAG logic
│   │   ├── graph-manager.ts          # Knowledge graph builder
│   │   ├── repository-indexer.ts     # Multi-repo indexing
│   │   ├── entity-embedder.ts        # Node embeddings
│   │   ├── edge-embedder.ts          # Relationship embeddings
│   │   ├── document-processor.ts     # Entity extraction
│   │   ├── query-handler.ts          # Query orchestration
│   │   ├── query-analyzer.ts         # LLM-based query classification
│   │   └── embedding-manager.ts      # Embedding provider abstraction
│   ├── mcp/              # MCP server integration
│   │   ├── server.ts                 # Main MCP server
│   │   ├── tools/
│   │   │   ├── query-engine.ts       # Semantic search
│   │   │   └── hybrid-search.ts      # Multi-strategy search
│   │   └── attendant/
│   │       └── granite-micro.ts      # Intelligent filtering
│   ├── providers/        # AI provider factory (Vercel AI SDK)
│   ├── utils/            # Markdown chunking, caching, trigrams
│   └── types/            # TypeScript schemas
├── data/                 # SQLite database storage
└── docs/                 # Architecture & usage documentation
```

**Core Capabilities:**
- **Knowledge Graph Construction**: Entity/relationship extraction using LLMs
- **Multi-Repository Support**: Project-scoped indexing with isolation
- **Hybrid Search**: Dense (semantic) + Sparse (BM25) + Pattern (fuzzy) + Graph (traversal)
- **Embedding Generation**: Entity embeddings ("name :: kind :: hints"), Edge embeddings ("S <predicate> O :: context")
- **MCP Server**: Intelligent attendant pattern with Granite Micro filtering
- **Query Analysis**: LLM-powered classification (Conceptual, Identifier, Relationship, Fuzzy, Pattern, Mixed)
- **Centrality Analysis**: Graph algorithms to identify key concepts

**Technology Stack:**
- TypeScript 5.5+ (strict mode, ESM modules)
- Node.js 20+
- npm (with workarounds for llamacpp-ai-provider)
- Vercel AI SDK: Unified LLM interface (@ai-sdk/openai, llamacpp-ai-provider)
- Local LLM: llama.cpp (Granite 4.0 Micro, Triplex for extraction)
- Embeddings: @xenova/transformers (IBM Granite Embedding 125M-278M)
- Database: better-sqlite3 + sqlite-vec extension
- Storage: `.graphrag/database.sqlite`

**Key Integration Points:**
- `src/lib/repository-indexer.ts` - Main indexing workflow
- `src/mcp/server.ts` - MCP server entry point
- `src/providers/factory.ts` - AI provider creation (Vercel AI SDK)
- `src/lib/embedding-manager.ts` - Embedding abstraction layer

### 1.3 Dependency Overlap & Complementarity Matrix

| Dependency Type | GraphRAG | Legilimens | Overlap/Conflict | Resolution Strategy |
|----------------|----------|------------|------------------|---------------------|
| **TypeScript Version** | 5.5+ | 5.4+ | ✅ High Overlap | Use TypeScript 5.5+ across monorepo |
| **Node.js Runtime** | 20+ | 20 LTS | ✅ Perfect Match | No conflict |
| **Package Manager** | npm | pnpm workspaces | ⚠️ Difference | Migrate GraphRAG to pnpm workspace |
| **Local LLM Engine** | llamacpp-ai-provider | Direct llama.cpp orchestration | ⚠️ Integration Pattern Conflict | Create shared LLM abstraction layer |
| **AI Provider Abstraction** | Vercel AI SDK | @legilimens/core custom | ⚠️ Architectural Difference | Adopt Vercel AI SDK as optional layer |
| **Database** | better-sqlite3 (knowledge graph) | File-based config | ✅ Complementary (no conflict) | GraphRAG adds structured knowledge layer |
| **Embeddings** | @xenova/transformers | Not used | ✅ New capability | Pure addition, no conflict |
| **External Search** | Not used | Tavily, Firecrawl, Context7 | ✅ Complementary | Legilimens fetches → GraphRAG indexes |
| **Zod Schemas** | zod 3.23.8 | zod 4.1.12 | ⚠️ Version Conflict | Upgrade GraphRAG to zod 4.x |

---

## 2. GraphRAG User Stories & Integration Points

### 2.1 Core User Stories (from NotebookLM Analysis)

#### US-1: Knowledge Graph Creation from Documentation
**As a developer,**  
**I want to** index my project's dependencies and documentation into a queryable knowledge graph  
**So that** I can understand entity relationships and key concepts without reading entire docs

**Acceptance Criteria:**
- System extracts entities (classes, functions, modules) and relationships from markdown/code
- Knowledge graph stored in SQLite with node/edge tables
- Multi-repository support with project isolation
- Progress indicators show indexing status
- Generated embeddings enable semantic similarity search

**Legilimens Integration Point:**  
→ After `legilimens generate` fetches documentation, offer `legilimens rag index <dependency>` to build knowledge graph

#### US-2: Semantic & Hybrid Search Queries
**As a developer,**  
**I want to** ask natural language questions about my dependencies  
**So that** I get precise, context-aware answers combining semantic search and graph traversal

**Acceptance Criteria:**
- Support queries like "How does authentication work?" or "What uses the database module?"
- Query analyzer determines optimal search strategy (dense/sparse/pattern/graph)
- Results ranked using Reciprocal Rank Fusion (RRF)
- Configurable similarity thresholds and result limits

**Legilimens Integration Point:**  
→ New command: `legilimens rag query "authentication patterns" --repos my-project`

#### US-3: MCP Server for Coding Assistants
**As a coding assistant (Claude, Cursor, etc.),**  
**I want to** query dependency knowledge graphs via MCP tools  
**So that** I can provide accurate implementation guidance without context pollution

**Acceptance Criteria:**
- MCP server exposes tools: `query_repositories`, `query_dependency`, `get_cross_references`, `smart_query`
- Granite Micro attendant filters results for surgical precision
- Optional escalation to Gemini 2.5 Pro for complex queries
- 100% offline operation (reads from local SQLite)

**Legilimens Integration Point:**  
→ New command: `legilimens rag serve` starts MCP server, configurable in Claude Desktop/Cursor

#### US-4: Flexible AI Model Selection
**As a user,**  
**I want to** choose between local models (llama.cpp) and cloud providers (OpenAI, Ollama)  
**So that** I can balance cost, privacy, and performance based on my needs

**Acceptance Criteria:**
- Support OpenAI, llama.cpp, Ollama via Vercel AI SDK
- Recommended models: Triplex (3.8B) for extraction, Granite Embedding for vectors
- Configuration stored in `~/.legilimens/config.json`
- Auto-detection of available providers

**Legilimens Integration Point:**  
→ Extend setup wizard to configure GraphRAG-specific models (extraction vs. embedding vs. attendant)

#### US-5: Offline-First Knowledge Management
**As a user in a restrictive environment,**  
**I want to** run all GraphRAG operations offline  
**So that** I can work without internet access or cloud dependencies

**Acceptance Criteria:**
- Local LLM for entity extraction (Granite Micro/Triplex)
- Local embeddings via @xenova/transformers
- All data stored in local SQLite database
- No required network calls after initial setup

**Legilimens Integration Point:**  
→ Align with existing Legilimens local-first philosophy (llama.cpp installer, offline templates)

### 2.2 Integration Point Mapping

| GraphRAG Feature | Legilimens Touch Point | Integration Type |
|------------------|------------------------|------------------|
| **Repository Indexing** | `@legilimens/core/gateway.ts` post-generation hook | Workflow Extension |
| **Query Engine** | New `@legilimens/cli` command + flow | New Feature |
| **MCP Server** | Standalone service via new package | New Service |
| **LLM Management** | `@legilimens/cli/utils/llamaInstaller.ts` | Shared Infrastructure |
| **Embedding Generation** | New capability in `@legilimens/graphrag` | Pure Addition |
| **SQLite Storage** | New `.legilimens/graphrag/database.sqlite` | New Data Store |
| **Configuration** | Extend `~/.legilimens/config.json` with `graphrag` section | Config Extension |

---

## 3. Architecture & Design Decisions

### 3.1 Monorepo Structure

**Decision:** Integrate GraphRAG as `@legilimens/graphrag` package in pnpm workspace

**Rationale:**
- Maintains Legilimens' existing monorepo pattern (`@legilimens/core`, `@legilimens/cli`, `@legilimens/harness-service`)
- Enables shared TypeScript configurations, linting, and build processes
- Simplifies dependency management via pnpm workspace protocols
- Allows gradual migration and testing without disrupting existing codebase

**Implementation:**
```
legilimens-cli/
├── packages/
│   ├── core/           # Existing business logic
│   ├── cli/            # Existing TUI interface
│   ├── harness-service/ # Existing test harness
│   └── graphrag/       # NEW: GraphRAG integration
│       ├── src/
│       │   ├── lib/    # Core GraphRAG logic (ported from graphrag-with-sqlite_vec)
│       │   ├── mcp/    # MCP server
│       │   ├── providers/ # Vercel AI SDK abstraction
│       │   └── index.ts   # Public API exports
│       ├── package.json
│       └── tsconfig.json
├── pnpm-workspace.yaml  # Add packages/graphrag
└── package.json
```

**Migration Path (from "Refactor and Enhancements.md"):**
1. **Phase 3a**: Clone graphrag-with-sqlite_vec into Legilimens root, add to `.gitignore`
2. **Phase 3b-3c**: Incrementally port code into `packages/graphrag/`, test in isolation
3. **Phase 3d**: Remove nested repo setup after full integration, commit `@legilimens/graphrag`

### 3.2 Shared LLM Infrastructure

**Decision:** Create `@legilimens/llm-runtime` abstraction layer for unified llama.cpp management

**Problem Statement:**
- **GraphRAG** uses `llamacpp-ai-provider` (Vercel AI SDK wrapper)
- **Legilimens** uses custom `@legilimens/core/ai/cliOrchestrator.ts` with direct binary calls
- Both need access to same llama.cpp binary at `~/.legilimens/bin/build/bin/llama-cli`
- Risk of duplicate downloads, conflicting binary paths, resource contention

**Solution Architecture:**
```typescript
// NEW: @legilimens/llm-runtime package
export interface LlmRuntimeConfig {
  binaryPath: string;          // ~/.legilimens/bin/build/bin/llama-cli
  modelPath: string;           // ~/.legilimens/models/{model-name}.gguf
  contextLength: number;       // 128000 for Granite Micro
  threads?: number;            // CPU thread allocation
}

export class LlmRuntime {
  // Unified llama.cpp binary management
  static async getBinaryPath(): Promise<string> { ... }
  static async ensureBinaryInstalled(): Promise<void> { ... }
  
  // Dual API support
  createVercelProvider(): LanguageModelV1 { ... }  // For GraphRAG
  createLegacyExecutor(): LegacyLlmExecutor { ... } // For existing Legilimens
}
```

**Benefits:**
- Single source of truth for llama.cpp binary location
- Prevents duplicate installations
- Enables smooth migration: existing Legilimens code uses legacy executor, new GraphRAG uses Vercel provider
- Future-proofs for full Vercel AI SDK migration

### 3.3 Vercel AI SDK Integration Strategy

**Decision:** Adopt Vercel AI SDK as optional layer, not mandatory replacement

**Rationale:**
- **GraphRAG requires** Vercel AI SDK for provider abstraction (`@ai-sdk/openai`, `llamacpp-ai-provider`)
- **Legilimens currently** has custom AI orchestration that works well
- **Risk of forced migration**: Breaking changes to existing generation flows
- **Solution**: Dual-path approach during transition

**Implementation Phases:**

**Phase 3b (Initial Integration):**
- GraphRAG package uses Vercel AI SDK internally
- Legilimens core continues using existing `cliOrchestrator.ts`
- Shared llama.cpp binary via `@legilimens/llm-runtime`

**Phase 3c (Gradual Migration - Optional):**
- Extend `@legilimens/core` to support Vercel AI SDK as alternative
- Add feature flag: `config.aiProvider: 'legacy' | 'vercel'`
- Parallel implementation: both paths maintained for 2-3 releases
- Users can opt-in to Vercel SDK for testing

**Phase 3d+ (Future Consolidation):**
- Evaluate user feedback on Vercel AI SDK
- If positive: deprecate legacy path, migrate fully
- If negative: maintain dual-path indefinitely

### 3.4 Database & Storage Strategy

**Decision:** Separate GraphRAG database from Legilimens config, shared namespace

**File Structure:**
```
~/.legilimens/
├── config.json                # Existing Legilimens config
├── secrets.json               # Encrypted API keys (existing)
├── bin/                       # Shared llama.cpp binary (existing)
│   └── build/bin/llama-cli
├── models/                    # Shared GGUF models
│   ├── granite-4.0-micro.gguf
│   ├── phi-4.gguf
│   └── triplex-3.8b.gguf      # NEW: For entity extraction
└── graphrag/                  # NEW: GraphRAG namespace
    ├── database.sqlite        # Knowledge graph + embeddings
    ├── cache/                 # LLM extraction cache
    └── config.json            # GraphRAG-specific config
```

**Configuration Extension:**
```json
// ~/.legilimens/config.json (extended)
{
  "setupCompleted": true,
  "localLlm": { ... },          // Existing
  "graphrag": {                 // NEW SECTION
    "enabled": true,
    "autoIndexAfterGenerate": false,
    "defaultEmbeddingModel": "ibm-granite-embedding-125m",
    "mcpServer": {
      "enabled": false,
      "port": 3100,
      "attendantMode": "granite" // "none" | "granite" | "gemini"
    },
    "repositories": []           // Indexed repos list
  }
}
```

**Rationale:**
- Clean separation of concerns (config vs. data)
- SQLite file can grow large (embeddings), isolate from config
- Easy to backup/restore GraphRAG data independently
- Namespace prevents future conflicts

### 3.5 CLI Command Structure

**Decision:** Add `rag` subcommand namespace to Legilimens CLI

**New Command Hierarchy:**
```bash
# Existing commands (unchanged)
legilimens generate <dependency>
legilimens setup
legilimens --help
legilimens --version

# NEW: GraphRAG commands
legilimens rag index <dependency> [options]
legilimens rag query <question> [options]
legilimens rag list [--repos <pattern>]
legilimens rag serve [--port 3100]
legilimens rag unindex <repo-id>
legilimens rag stats
```

**Command Details:**

#### `legilimens rag index <dependency>`
**Purpose:** Index a dependency's documentation into the knowledge graph

**Options:**
```bash
--source <type>         # Force source type (github|npm|url)
--embedding-model <id>  # Override default embedding model
--skip-embeddings       # Build graph only, no semantic search
--repo-id <id>          # Custom repository identifier
```

**Flow:**
1. If dependency not yet documented → run `legilimens generate <dependency>` first
2. Locate generated markdown in `docs/{type}/{dependency}.md`
3. Invoke `@legilimens/graphrag` RepositoryIndexer
4. Extract entities/relationships using Triplex LLM
5. Generate embeddings using Granite Embedding
6. Store in `~/.legilimens/graphrag/database.sqlite`
7. Update `config.json` with indexed repo metadata

#### `legilimens rag query <question>`
**Purpose:** Query indexed knowledge graphs with natural language

**Options:**
```bash
--repos <ids>           # Comma-separated repo IDs to search
--strategy <type>       # Force search strategy (dense|sparse|pattern|graph|hybrid)
--max-results <n>       # Limit result count (default: 10)
--similarity <float>    # Minimum similarity threshold (0.0-1.0)
--format <type>         # Output format (markdown|json|table)
```

**Examples:**
```bash
# Semantic search across all repos
legilimens rag query "authentication middleware patterns"

# Graph traversal query
legilimens rag query "what depends on UserService" --strategy graph

# Scoped to specific repos
legilimens rag query "error handling" --repos copilotkit,mem0
```

#### `legilimens rag serve`
**Purpose:** Start MCP server for coding assistant integration

**Options:**
```bash
--port <n>              # Server port (default: 3100)
--attendant <mode>      # Filtering mode (none|granite|gemini)
--host <addr>           # Bind address (default: localhost)
--stdio                 # Use stdio transport instead of HTTP
```

**Integration:**
- Updates Claude Desktop config automatically
- Provides example Cursor configuration
- Runs as background service with graceful shutdown

### 3.6 Optional Feature Toggle Design

**Decision:** GraphRAG as opt-in feature with graceful degradation

**Configuration Flag:**
```json
{
  "graphrag": {
    "enabled": false  // DEFAULT: Disabled for existing users
  }
}
```

**Behavior Matrix:**

| Scenario | GraphRAG Enabled | Action |
|----------|------------------|--------|
| User runs `legilimens generate` | ❌ No | Normal flow, no change |
| User runs `legilimens generate` | ✅ Yes | Generate docs + prompt for indexing |
| User runs `legilimens rag index` | ❌ No | Error: "GraphRAG disabled. Run `legilimens setup` to enable." |
| User runs `legilimens rag query` | ❌ No | Same error as above |
| User disables mid-session | ✅ → ❌ | Existing indices preserved, queries blocked |

**Setup Wizard Integration:**
```
┌  🔍 Advanced Features
│
◆  Enable GraphRAG knowledge graph and semantic search?
│  ● Yes - Local knowledge graph with semantic search (recommended)
│  ○ No - Use DeepWiki references only (simpler, faster)
│
└  ℹ  You can change this later with: legilimens setup
```

**Fallback Chain (when GraphRAG disabled):**
1. User docs reference DeepWiki URLs (existing behavior)
2. No local knowledge graph indexing
3. MCP server unavailable
4. CLI commands under `rag` namespace blocked

---

## 4. Phased Implementation Roadmap

### Phase 3a: GraphRAG Package Setup & Infrastructure
**Duration:** 2 weeks  
**Goal:** Create `@legilimens/graphrag` package skeleton with shared LLM runtime

#### Tasks
- [ ] **3a.1** Clone graphrag-with-sqlite_vec into Legilimens root, add to `.gitignore`
- [ ] **3a.2** Create `packages/graphrag/` directory structure
  - [ ] `src/lib/` (core logic)
  - [ ] `src/mcp/` (server stub)
  - [ ] `src/providers/` (Vercel AI SDK)
  - [ ] `src/types/` (TypeScript schemas)
- [ ] **3a.3** Create `@legilimens/llm-runtime` shared package
  - [ ] `LlmRuntime` class for binary path management
  - [ ] `createVercelProvider()` for GraphRAG
  - [ ] `createLegacyExecutor()` for Legilimens
  - [ ] Integration tests with existing llama installer
- [ ] **3a.4** Update `pnpm-workspace.yaml` to include new packages
- [ ] **3a.5** Port GraphRAG dependencies to `packages/graphrag/package.json`
  - Upgrade zod 3.23.8 → 4.1.12 (match Legilimens)
  - Add `@ai-sdk/openai`, `llamacpp-ai-provider`
  - Add `better-sqlite3`, `@xenova/transformers`
- [ ] **3a.6** Configure TypeScript project references
  - `@legilimens/graphrag` depends on `@legilimens/llm-runtime`
  - Strict mode enabled, ESM modules
- [ ] **3a.7** Set up build pipeline
  - `pnpm build` compiles all packages
  - `pnpm --filter @legilimens/graphrag test` runs isolated tests

**Deliverables:**
- Empty `@legilimens/graphrag` package compiles successfully
- Shared `@legilimens/llm-runtime` tested with both Legilimens and GraphRAG patterns
- Dependency resolution clean (no version conflicts)
- All existing Legilimens tests pass

**Success Criteria:**
- `pnpm build` completes without errors
- `pnpm typecheck` validates all packages
- No regressions in existing `@legilimens/core` or `@legilimens/cli` tests

---

### Phase 3b: Core GraphRAG Logic Migration
**Duration:** 3 weeks  
**Goal:** Port GraphRAG core modules into `@legilimens/graphrag` with parity tests

#### Tasks
- [ ] **3b.1** Port `src/lib/graph-database.ts` (SQLite connection management)
  - Update storage path to `~/.legilimens/graphrag/database.sqlite`
  - Add migration runner for schema updates
  - Write unit tests for CRUD operations
- [ ] **3b.2** Port `src/lib/graph-manager.ts` (knowledge graph builder)
  - Entity/relationship extraction from LLM summaries
  - Centrality analysis algorithms
  - Unit tests with sample graph data
- [ ] **3b.3** Port `src/lib/document-processor.ts` (entity extraction)
  - Integration with Vercel AI SDK
  - Caching layer for LLM responses
  - Test with Triplex model for triple extraction
- [ ] **3b.4** Port `src/lib/embedding-manager.ts` (embedding abstraction)
  - Support @xenova/transformers for local embeddings
  - Batch processing (50 entities, 100 edges per batch)
  - Integration tests with Granite Embedding model
- [ ] **3b.5** Port `src/lib/entity-embedder.ts` and `src/lib/edge-embedder.ts`
  - Format: "name :: kind :: hints" (entities)
  - Format: "S <predicate> O :: context:..." (edges)
  - Transaction-safe SQLite writes
- [ ] **3b.6** Port `src/lib/repository-indexer.ts` (multi-repo indexing)
  - File scanning (TypeScript, JavaScript, Markdown)
  - Content chunking (600 chars, 100 overlap)
  - Progress tracking with Clack spinners
  - Error resilience and retry logic
- [ ] **3b.7** Port query components
  - `src/lib/query-analyzer.ts` (LLM-based query classification)
  - `src/lib/query-handler.ts` (query orchestration)
  - `src/lib/reciprocal-rank-fusion.ts` (RRF algorithm)
- [ ] **3b.8** Port utility modules
  - `src/utils/markdown-chunker.ts`
  - `src/utils/trigram.ts` (fuzzy matching)
  - `src/utils/cache.ts`
- [ ] **3b.9** Create `@legilimens/graphrag` public API
  ```typescript
  // packages/graphrag/src/index.ts
  export { RepositoryIndexer } from './lib/repository-indexer.js';
  export { GraphManager } from './lib/graph-manager.js';
  export { QueryEngine } from './lib/query-engine.js';
  export { HybridSearchEngine } from './lib/hybrid-search.js';
  export type { RepositoryInfo, IndexingStatus, QueryResult } from './types/index.js';
  ```
- [ ] **3b.10** Write comprehensive unit tests
  - Mock LLM responses for deterministic testing
  - Test entity/edge embedding generation
  - Test hybrid search result ranking
  - Coverage target: >80%

**Deliverables:**
- All GraphRAG core modules ported and compiling
- Unit tests passing with >80% coverage
- Sample indexing workflow runs end-to-end
- Documentation: `docs/graphrag/ARCHITECTURE.md`

**Success Criteria:**
- Can index a sample repository (e.g., CoPilotKit docs) successfully
- Generated knowledge graph viewable in SQLite browser
- Entity/edge embeddings stored correctly
- Query returns relevant results

---

### Phase 3c: CLI Integration & MCP Server
**Duration:** 3 weeks  
**Goal:** Add `legilimens rag` commands and deploy MCP server

#### Tasks
- [ ] **3c.1** Extend Legilimens configuration schema
  - Add `graphrag` section to `~/.legilimens/config.json`
  - Update `@legilimens/cli/config/userConfig.ts` with new fields
  - Migration logic for existing users (defaults to disabled)
- [ ] **3c.2** Extend setup wizard
  - New step: "Enable GraphRAG?" (opt-in)
  - Configure embedding model preference
  - Download Triplex model if GraphRAG enabled
- [ ] **3c.3** Implement `legilimens rag index` command
  - Add to `@legilimens/cli/commands/rag/index.ts`
  - Clack prompts for dependency selection
  - Progress indicators (Ora spinners) during indexing
  - Integration with existing `generateGatewayDoc` flow
  - Error handling: fallback if GraphRAG disabled
- [ ] **3c.4** Implement `legilimens rag query` command
  - Add to `@legilimens/cli/commands/rag/query.ts`
  - Query input via Clack text prompt
  - Results display with Ink table component
  - Repository filtering via `--repos` flag
- [ ] **3c.5** Implement `legilimens rag list` command
  - Display indexed repositories
  - Show stats: node count, edge count, index date
  - Table format with Ink
- [ ] **3c.6** Implement `legilimens rag serve` command
  - Start MCP server as background process
  - Port GraphRAG MCP server from `src/mcp/server.ts`
  - Update to use `@legilimens/graphrag` package
  - Graceful shutdown on Ctrl+C
- [ ] **3c.7** Port MCP server components
  - `packages/graphrag/src/mcp/server.ts` (main server)
  - `packages/graphrag/src/mcp/tools/query-engine.ts` (semantic search)
  - `packages/graphrag/src/mcp/tools/hybrid-search.ts` (multi-strategy)
  - `packages/graphrag/src/mcp/attendant/granite-micro.ts` (filtering)
- [ ] **3c.8** MCP server configuration
  - Auto-generate Claude Desktop config snippet
  - Provide Cursor integration instructions
  - Support stdio and HTTP transports
- [ ] **3c.9** Update main CLI menu
  ```typescript
  // @legilimens/cli/clackApp.ts
  const action = await select({
    message: 'What would you like to do?',
    options: [
      { value: 'generate', label: 'Generate dependency documentation' },
      { value: 'rag-index', label: '🔍 Index documentation into knowledge graph' },
      { value: 'rag-query', label: '💬 Query knowledge graph' },
      { value: 'rag-serve', label: '🚀 Start MCP server' },
      { value: 'setup', label: 'Run setup wizard' },
      { value: 'quit', label: 'Quit' },
    ],
  });
  ```
- [ ] **3c.10** Add help documentation
  - Update `@legilimens/cli/commands/help.ts` with RAG commands
  - Create `docs/graphrag/CLI-GUIDE.md`
  - Create `docs/graphrag/MCP-INTEGRATION.md`

**Deliverables:**
- All `legilimens rag` commands functional
- MCP server deployable and connectable from Claude Desktop
- Setup wizard guides users through GraphRAG enablement
- Documentation: CLI guide, MCP integration guide

**Success Criteria:**
- User can run full workflow: `generate` → `rag index` → `rag query`
- MCP server responds to Claude Desktop queries
- Progress indicators show real-time status
- Error messages are clear and actionable

---

### Phase 3d: Migration, Testing & Documentation
**Duration:** 2 weeks  
**Goal:** Remove nested repo, finalize integration, comprehensive testing

#### Tasks
- [ ] **3d.1** Remove nested graphrag-with-sqlite_vec repo
  - Delete cloned repo from Legilimens root
  - Remove from `.gitignore`
  - Verify all code ported to `packages/graphrag/`
- [ ] **3d.2** Integration testing suite
  - Add `tests/integration/graphrag-parity.spec.ts`
  - Test: Generate docs → Index → Query → Verify results
  - Test: MCP server responds correctly to tool calls
  - Test: Configuration migration for existing users
  - Test: Graceful degradation when GraphRAG disabled
- [ ] **3d.3** Update parity tests
  - Ensure `tests/integration/parity.spec.ts` remains green
  - Add GraphRAG-specific scenarios
  - Verify no regressions in existing flows
- [ ] **3d.4** Performance benchmarking
  - Measure indexing time (target: <30s for 1000-line doc)
  - Measure query latency (target: <2s for hybrid search)
  - Compare with Legilimens constitution guardrails (<10s typical, <60s max)
- [ ] **3d.5** Update project documentation
  - Update `CLAUDE.md` with GraphRAG workflows
  - Update `AGENTS.md` with new package details
  - Update `docs/quickstart.md` with GraphRAG setup
  - Create `docs/graphrag/USER-GUIDE.md`
  - Create `docs/graphrag/DEVELOPER-GUIDE.md`
- [ ] **3d.6** Update constitution
  - Add GraphRAG governance rules to `.specify/memory/constitution.md`
  - Define quality standards for knowledge graph extraction
  - Set performance benchmarks
- [ ] **3d.7** Create migration guide
  - Document upgrade path for existing Legilimens users
  - Highlight breaking changes (if any)
  - Provide rollback instructions
- [ ] **3d.8** Update README
  - Add GraphRAG feature highlights
  - Include MCP integration screenshot
  - Link to new documentation
- [ ] **3d.9** Final QA checklist
  - [ ] All TypeScript compiles without errors
  - [ ] All tests passing (unit + integration + parity)
  - [ ] No console warnings in dev mode
  - [ ] Help text accurate and complete
  - [ ] Setup wizard works for first-time users
  - [ ] Existing users can upgrade without data loss
  - [ ] MCP server connects to Claude Desktop
  - [ ] Performance meets targets
- [ ] **3d.10** Release preparation
  - Version bump to 2.0.0 (major release)
  - Changelog generation
  - Tag release candidate
  - Internal testing sprint

**Deliverables:**
- Fully integrated `@legilimens/graphrag` package
- Comprehensive test coverage
- Complete documentation suite
- Migration guide for existing users
- Release candidate ready for beta testing

**Success Criteria:**
- All tests passing (100% of existing + new GraphRAG tests)
- Documentation covers all user journeys
- Performance benchmarks met
- No regressions in existing functionality
- Beta testers can successfully use GraphRAG features

---

## 5. Risk Assessment & Mitigation

### 5.1 Technical Risks

#### Risk 1: LLM Binary Path Conflicts
**Likelihood:** High  
**Impact:** High  
**Description:** GraphRAG's `llamacpp-ai-provider` and Legilimens' custom orchestrator may point to different llama.cpp binaries

**Mitigation:**
- Phase 3a: Create `@legilimens/llm-runtime` as single source of truth
- Environment variable: `LEGILIMENS_LLM_BINARY` overrides all paths
- Automated tests verify binary discovery logic
- Installer checks for existing binaries before downloading

**Contingency:**
- If conflicts persist, maintain separate binaries in namespaced directories
- Document manual override instructions

#### Risk 2: Zod Version Incompatibility
**Likelihood:** Medium  
**Impact:** Medium  
**Description:** GraphRAG uses zod 3.23.8, Legilimens uses 4.1.12

**Mitigation:**
- Phase 3a: Upgrade GraphRAG to zod 4.x during initial port
- Thorough testing of schema validation logic
- Pin zod version in workspace root `package.json`

**Contingency:**
- If breaking changes found, vendor older zod version in GraphRAG package only
- Use type assertion wrappers at package boundaries

#### Risk 3: Vercel AI SDK Learning Curve
**Likelihood:** Medium  
**Impact:** Low  
**Description:** Team unfamiliar with Vercel AI SDK patterns

**Mitigation:**
- Phase 3b: Comprehensive code comments in ported modules
- Create `docs/graphrag/VERCEL-AI-SDK-PRIMER.md`
- Pair programming during initial provider setup
- Fallback: Use GraphRAG's existing provider code as reference

**Contingency:**
- If SDK proves too complex, maintain dual-path (legacy + Vercel) indefinitely
- Evaluate alternative LLM abstraction libraries

#### Risk 4: SQLite Database Corruption
**Likelihood:** Low  
**Impact:** High  
**Description:** Concurrent writes or improper shutdown could corrupt knowledge graph

**Mitigation:**
- Strict transaction handling (as per GraphRAG's existing code)
- Graceful shutdown hooks in MCP server
- Automated backups before major operations
- Write-ahead logging (WAL) mode enabled

**Contingency:**
- Database repair tools documented
- Export/import functionality for graph migration
- Version-controlled test databases for rollback

#### Risk 5: Performance Degradation
**Likelihood:** Medium  
**Impact:** Medium  
**Description:** Indexing/querying slower than expected, violating <10s typical rule

**Mitigation:**
- Phase 3b: Profiling during development
- Batch processing for embeddings (50 entities, 100 edges)
- Caching layer for LLM responses
- Configurable indexing concurrency

**Contingency:**
- Progressive enhancement: offer "quick index" (graph only) vs. "full index" (+ embeddings)
- Background indexing with progress indicators
- User can skip embeddings entirely (`--skip-embeddings`)

#### Risk 6: Resource Exhaustion Without Throttling
**Likelihood:** Medium
**Impact:** High
**Description:** Heavy indexing operations or concurrent MCP queries exhaust system resources (RAM, tokens, CPU) without adaptive throttling mechanisms in place.

**Mitigation:**
- Phase 3: Lightweight metrics collection only (no enforcement) - **OPTIONAL**
- Phase 3: Document resource-aware coding patterns in developer guides
- Phase 4: Full Resource Guard System with adaptive throttling (separate implementation phase)
- Reference: See `graphrag-with-sqlite_vec/docs/planning/RESOURCE-GUARD-SYSTEM.md` for complete specification

**Contingency:**
- Manual intervention: Users manually stop operations if system becomes unresponsive
- Simple circuit breaker: Hard limit on concurrent LLM calls (e.g., max 3 simultaneous)
- Fallback to lighter models: Skip embedding generation, use smaller extraction models
- Progressive disclosure: Warn users about resource requirements during setup wizard

**Phase 4 Preview:**
The Resource Guard System (planned for Phase 4) will provide:
- **3 Resource Modes:** Standard (10.5GB RAM), Efficiency (3GB RAM), Ultra-Efficient (500MB + cloud)
- **Automatic Container Orchestration:** Start/stop DMR containers based on operation type
- **Operation-Aware Management:** Different resource profiles for indexing vs. query vs. idle
- **Cloud Hybrid Support:** Route heavy models to cloud APIs when local resources constrained
- **Performance Targets:** 70-95% RAM reduction with <15s transition times

**Decision:** Phase 3 focuses on functional integration; Phase 4 adds production-grade resource management.

### 5.2 User Experience Risks

#### Risk 7: Feature Overwhelm
**Likelihood:** High
**Impact:** Medium
**Description:** Too many new commands/options confuse existing users

**Mitigation:**
- GraphRAG disabled by default
- Setup wizard clearly explains opt-in
- Progressive disclosure: show RAG commands only when enabled
- Comprehensive `--help` text with examples

**Contingency:**
- Create "Simple Mode" vs. "Advanced Mode" configuration
- Guided workflows via interactive prompts (not just flags)

#### Risk 8: Migration Friction
**Likelihood:** Medium
**Impact:** Medium
**Description:** Existing users resist enabling GraphRAG due to complexity

**Mitigation:**
- Highlight benefits in release notes (semantic search, MCP integration)
- Provide video tutorial for setup
- Offer "Try GraphRAG" guided demo in CLI
- Clear ROI messaging (faster dependency understanding)

**Contingency:**
- Accept that some users prefer simple mode
- Maintain DeepWiki fallback indefinitely
- Collect feedback via telemetry (opt-in)

### 5.3 Project Management Risks

#### Risk 9: Scope Creep
**Likelihood:** Medium
**Impact:** High
**Description:** Phases expand beyond planned 10 weeks

**Mitigation:**
- Strict phase gates (deliverables + success criteria)
- Weekly progress reviews
- Defer nice-to-haves to Phase 4 (post-launch enhancements)
- Use feature flags to isolate experimental work

**Contingency:**
- De-scope Phase 3d tasks if timeline slips
- Ship MCP server as beta in Phase 4
- Incremental releases (3b → 3c → 3d as separate minor versions)

#### Risk 9: Incomplete Documentation
**Likelihood:** Medium  
**Impact:** High  
**Description:** Users can't figure out how to use GraphRAG features

**Mitigation:**
- Documentation tasks in every phase (not just 3d)
- Mandate code comments during porting
- User testing with fresh eyes before release
- Built-in examples via `legilimens rag demo`

**Contingency:**
- Record screencast walkthroughs as stopgap
- Community Q&A sessions to identify gaps
- Iterative doc updates based on support tickets

---

## 6. Testing Strategy

### 6.1 Unit Testing

**Coverage Target:** >80% for `@legilimens/graphrag`

**Key Test Suites:**
1. **Graph Database** (`graph-database.spec.ts`)
   - SQLite connection management
   - Schema migrations
   - CRUD operations on nodes/edges
   - Transaction rollback scenarios

2. **Entity Extraction** (`document-processor.spec.ts`)
   - Mock LLM responses for deterministic testing
   - Test entity/relationship parsing
   - Validate schema compliance

3. **Embedding Generation** (`embedding-manager.spec.ts`)
   - Mock @xenova/transformers
   - Batch processing logic
   - Format validation ("name :: kind :: hints")

4. **Hybrid Search** (`hybrid-search.spec.ts`)
   - Query analyzer classification accuracy
   - RRF algorithm correctness
   - Result ranking stability

5. **MCP Server** (`mcp-server.spec.ts`)
   - Tool registration
   - Request/response validation
   - Attendant filtering logic

**Tooling:**
- Vitest for test runner
- Mock factories for LLM responses
- In-memory SQLite for fast testing
- Snapshot testing for query results

### 6.2 Integration Testing

**Test Scenarios:**

1. **End-to-End Workflow** (`graphrag-e2e.spec.ts`)
   ```typescript
   test('full workflow: generate → index → query', async () => {
     // 1. Generate docs for CoPilotKit
     await generateGatewayDoc({ dependency: 'CoPilotKit', source: 'github' });
     
     // 2. Index into knowledge graph
     const indexer = new RepositoryIndexer(...);
     await indexer.indexRepository('copilotkit', './docs/frameworks/copilotkit.md');
     
     // 3. Query for relationships
     const engine = new HybridSearchEngine(...);
     const results = await engine.search('authentication patterns', { repos: ['copilotkit'] });
     
     expect(results.length).toBeGreaterThan(0);
     expect(results[0].score).toBeGreaterThan(0.7);
   });
   ```

2. **MCP Server Parity** (`mcp-parity.spec.ts`)
   - Start MCP server
   - Send `query_repositories` tool call
   - Validate response format
   - Verify attendant filtering

3. **Configuration Migration** (`config-migration.spec.ts`)
   - Load legacy config (pre-GraphRAG)
   - Run migration logic
   - Verify GraphRAG section added with correct defaults

4. **Performance Benchmarks** (`performance.spec.ts`)
   - Index 1000-line document in <30s
   - Hybrid query returns in <2s
   - Embedding generation: <5s per 100 entities

### 6.3 Parity Testing

**Objective:** Ensure existing Legilimens functionality unaffected

**Extended Parity Suite:**
- All existing `tests/integration/parity.spec.ts` tests must pass
- New scenario: Generate docs with GraphRAG enabled (should auto-prompt for indexing)
- New scenario: Generate docs with GraphRAG disabled (should work as before)

**Regression Testing:**
- CLI commands: `generate`, `setup`, `--help`, `--version`
- Setup wizard: AI provider detection, llama.cpp installation
- Template validation: Output format compliance
- Performance: <10s typical runs maintained

### 6.4 User Acceptance Testing (UAT)

**Beta Testing Program:**
- Recruit 5-10 beta testers from community
- Provide test script with representative workflows
- Collect feedback via structured survey

**UAT Test Script:**
1. Install Legilimens 2.0 (with GraphRAG)
2. Run setup wizard, enable GraphRAG
3. Generate docs for familiar dependency
4. Index docs into knowledge graph
5. Query: "How do I authenticate users?"
6. Start MCP server
7. Query via Claude Desktop
8. Rate experience (1-5 stars) for each step

**Success Criteria:**
- 80% of testers rate setup as "Easy" or "Very Easy"
- 90% successfully complete indexing workflow
- 70% successfully connect MCP server to Claude Desktop
- Average query relevance rating >4/5

---

## 7. Documentation Requirements

### 7.1 User-Facing Documentation

#### `docs/graphrag/USER-GUIDE.md`
**Audience:** End users (developers using Legilimens)

**Contents:**
- What is GraphRAG? (benefits vs. DeepWiki)
- Setup: Enabling GraphRAG in wizard
- Workflow: Generate → Index → Query
- CLI command reference (`rag index`, `rag query`, `rag serve`)
- MCP integration: Connecting to Claude Desktop/Cursor
- Troubleshooting: Common errors and fixes
- FAQ

#### `docs/graphrag/MCP-INTEGRATION.md`
**Audience:** Coding assistant users (Claude, Cursor, etc.)

**Contents:**
- MCP server overview
- Installation: `legilimens rag serve`
- Configuration for Claude Desktop
- Configuration for Cursor
- Available tools: `query_repositories`, `query_dependency`, etc.
- Example queries and expected responses
- Attendant modes: none, granite, gemini
- Performance tips

#### `docs/graphrag/CLI-GUIDE.md`
**Audience:** Power users

**Contents:**
- Complete command reference with all flags
- Configuration file reference (`~/.legilimens/config.json`)
- Advanced workflows: batch indexing, custom embedding models
- Performance tuning
- Database management: backup, restore, unindex

### 7.2 Developer-Facing Documentation

#### `docs/graphrag/ARCHITECTURE.md`
**Audience:** Contributors, maintainers

**Contents:**
- High-level architecture diagram
- Package structure: `@legilimens/graphrag`, `@legilimens/llm-runtime`
- Data flow: Document → Entities → Graph → Embeddings → Query
- Database schema reference
- Integration points with `@legilimens/core`
- Vercel AI SDK usage patterns

#### `docs/graphrag/DEVELOPER-GUIDE.md`
**Audience:** Contributors

**Contents:**
- Development setup
- Running tests: `pnpm --filter @legilimens/graphrag test`
- Adding new search strategies
- Extending MCP server tools
- Debugging: logging, SQLite browser, profiling
- Code style guidelines
- Contribution workflow

#### `docs/graphrag/VERCEL-AI-SDK-PRIMER.md`
**Audience:** Developers new to Vercel AI SDK

**Contents:**
- Why Vercel AI SDK? (provider abstraction benefits)
- Core concepts: LanguageModelV1, generateText, streamText
- Provider setup: OpenAI, llama.cpp, Ollama
- Error handling patterns
- Caching and performance
- Migration from legacy Legilimens orchestrator

### 7.3 Inline Code Documentation

**Standards:**
- JSDoc comments for all public APIs
- Example usage in docstrings
- Type annotations for complex parameters
- Link to relevant architecture docs

**Example:**
```typescript
/**
 * Index a repository's documentation into the knowledge graph
 * 
 * This function performs entity extraction, relationship mapping,
 * and optional embedding generation for semantic search.
 * 
 * @param repositoryId - Unique identifier (e.g., "copilotkit")
 * @param documentPath - Path to markdown file or directory
 * @param options - Indexing configuration
 * @returns Indexing status with node/edge counts
 * 
 * @example
 * ```typescript
 * const indexer = new RepositoryIndexer(db, logger, embeddings, model);
 * const status = await indexer.indexRepository(
 *   'copilotkit',
 *   './docs/frameworks/copilotkit.md',
 *   { skipEmbeddings: false }
 * );
 * console.log(`Indexed ${status.stats.nodes_count} entities`);
 * ```
 * 
 * @see {@link docs/graphrag/ARCHITECTURE.md} for data flow details
 */
async indexRepository(
  repositoryId: string,
  documentPath: string,
  options?: IndexingOptions
): Promise<IndexingStatus>
```

### 7.4 Migration & Upgrade Documentation

#### `docs/graphrag/MIGRATION-GUIDE.md`
**Audience:** Existing Legilimens users upgrading to 2.0

**Contents:**
- What's new in 2.0?
- Breaking changes (if any)
- Upgrade steps
- Configuration migration
- Rollback procedure
- FAQ

**Example Upgrade Workflow:**
```bash
# 1. Backup existing config
cp ~/.legilimens/config.json ~/.legilimens/config.json.backup

# 2. Upgrade Legilimens
npm install -g legilimens@2.0.0

# 3. Run migration (automatic on first launch)
legilimens

# 4. Enable GraphRAG (optional)
legilimens setup
# Select: "Enable GraphRAG? → Yes"

# 5. Index existing docs (optional)
legilimens rag index <dependency>
```

---

## Appendices

### Appendix A: Technology Stack Comparison

| Component | Legilimens (Current) | GraphRAG (Standalone) | Integrated Solution |
|-----------|---------------------|----------------------|---------------------|
| **Language** | TypeScript 5.4+ | TypeScript 5.5+ | TypeScript 5.5+ |
| **Runtime** | Node.js 20 LTS | Node.js 20+ | Node.js 20 LTS |
| **Package Manager** | pnpm workspaces | npm | pnpm workspaces |
| **Build Tool** | tsc | tsup | tsc (core/cli), tsup (graphrag) |
| **Test Runner** | vitest | vitest | vitest |
| **LLM Engine** | llama.cpp (direct) | llamacpp-ai-provider | Both (unified via runtime) |
| **AI Abstraction** | Custom orchestrator | Vercel AI SDK | Dual-path (gradual migration) |
| **Embeddings** | N/A | @xenova/transformers | Added in graphrag package |
| **Database** | File-based config | better-sqlite3 | File (config) + SQLite (graph) |
| **CLI Framework** | Clack + Commander | N/A (standalone) | Clack + Commander |
| **TUI Components** | Ink (progress, tables) | N/A | Ink (extended for GraphRAG) |

### Appendix B: File Structure (Final State)

```
legilimens-cli/
├── packages/
│   ├── core/                      # Existing business logic
│   │   ├── src/
│   │   │   ├── ai/                # AI orchestration
│   │   │   ├── detection/         # Source detection
│   │   │   ├── fetchers/          # DeepWiki, Context7, etc.
│   │   │   ├── gateway.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── cli/                       # CLI interface
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── help.ts
│   │   │   │   └── rag/           # NEW: GraphRAG commands
│   │   │   │       ├── index.ts   # legilimens rag index
│   │   │   │       ├── query.ts   # legilimens rag query
│   │   │   │       ├── serve.ts   # legilimens rag serve
│   │   │   │       └── list.ts    # legilimens rag list
│   │   │   ├── flows/
│   │   │   │   └── clackGenerationFlow.ts
│   │   │   ├── wizard/
│   │   │   │   └── clackWizard.ts # Extended for GraphRAG
│   │   │   ├── clackApp.ts
│   │   │   └── config/
│   │   │       └── userConfig.ts  # Extended schema
│   │   ├── bin/
│   │   │   └── legilimens.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── harness-service/           # Test harness
│   ├── llm-runtime/               # NEW: Shared LLM abstraction
│   │   ├── src/
│   │   │   ├── runtime.ts         # LlmRuntime class
│   │   │   ├── vercel-provider.ts # Vercel AI SDK wrapper
│   │   │   └── legacy-executor.ts # Existing pattern wrapper
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── graphrag/                  # NEW: GraphRAG integration
│       ├── src/
│       │   ├── lib/
│       │   │   ├── graph-database.ts
│       │   │   ├── graph-manager.ts
│       │   │   ├── repository-indexer.ts
│       │   │   ├── entity-embedder.ts
│       │   │   ├── edge-embedder.ts
│       │   │   ├── document-processor.ts
│       │   │   ├── query-handler.ts
│       │   │   ├── query-analyzer.ts
│       │   │   ├── embedding-manager.ts
│       │   │   └── reciprocal-rank-fusion.ts
│       │   ├── mcp/
│       │   │   ├── server.ts
│       │   │   ├── tools/
│       │   │   │   ├── query-engine.ts
│       │   │   │   └── hybrid-search.ts
│       │   │   └── attendant/
│       │   │       └── granite-micro.ts
│       │   ├── providers/
│       │   │   ├── factory.ts
│       │   │   └── config.ts
│       │   ├── utils/
│       │   │   ├── markdown-chunker.ts
│       │   │   ├── trigram.ts
│       │   │   └── cache.ts
│       │   ├── types/
│       │   │   └── index.ts
│       │   └── index.ts           # Public API
│       ├── tests/
│       │   ├── unit/
│       │   └── integration/
│       ├── package.json
│       └── tsconfig.json
├── docs/
│   ├── graphrag/                  # NEW: GraphRAG docs
│   │   ├── ARCHITECTURE.md
│   │   ├── USER-GUIDE.md
│   │   ├── DEVELOPER-GUIDE.md
│   │   ├── MCP-INTEGRATION.md
│   │   ├── CLI-GUIDE.md
│   │   ├── VERCEL-AI-SDK-PRIMER.md
│   │   └── MIGRATION-GUIDE.md
│   ├── templates/
│   │   └── legilimens-template.md
│   ├── AGENTS.md                  # Updated with GraphRAG
│   ├── CLAUDE.md                  # Updated with GraphRAG
│   └── quickstart.md              # Updated with GraphRAG
├── tests/integration/
│   ├── parity.spec.ts             # Existing parity tests
│   └── graphrag-parity.spec.ts    # NEW: GraphRAG integration tests
├── pnpm-workspace.yaml            # Includes graphrag, llm-runtime
├── package.json
└── tsconfig.json
```

### Appendix C: Configuration Schema (Extended)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Legilimens Configuration",
  "type": "object",
  "properties": {
    "setupCompleted": { "type": "boolean" },
    "localLlm": {
      "type": "object",
      "properties": {
        "binaryPath": { "type": "string" },
        "modelPath": { "type": "string" },
        "modelName": { "type": "string" },
        "contextLength": { "type": "number" }
      }
    },
    "graphrag": {
      "type": "object",
      "properties": {
        "enabled": {
          "type": "boolean",
          "default": false,
          "description": "Enable GraphRAG knowledge graph and semantic search"
        },
        "autoIndexAfterGenerate": {
          "type": "boolean",
          "default": false,
          "description": "Automatically prompt to index after generating docs"
        },
        "defaultEmbeddingModel": {
          "type": "string",
          "default": "ibm-granite-embedding-125m",
          "enum": ["ibm-granite-embedding-125m", "ibm-granite-embedding-278m", "nomic-embed-text"]
        },
        "extractionModel": {
          "type": "string",
          "default": "triplex-3.8b",
          "description": "LLM model for entity/relationship extraction"
        },
        "mcpServer": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean", "default": false },
            "port": { "type": "number", "default": 3100 },
            "host": { "type": "string", "default": "localhost" },
            "attendantMode": {
              "type": "string",
              "enum": ["none", "granite", "gemini"],
              "default": "granite",
              "description": "Intelligent result filtering mode"
            }
          }
        },
        "repositories": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string" },
              "name": { "type": "string" },
              "indexed_at": { "type": "string", "format": "date-time" },
              "stats": {
                "type": "object",
                "properties": {
                  "nodes_count": { "type": "number" },
                  "edges_count": { "type": "number" },
                  "chunks_count": { "type": "number" }
                }
              }
            }
          },
          "default": []
        }
      }
    }
  },
  "required": ["setupCompleted"]
}
```

### Appendix D: MCP Server Tools Reference

#### Tool: `query_repositories`
**Description:** Query indexed repositories with natural language

**Arguments:**
```typescript
{
  query: string;           // Natural language question
  repositories?: string[]; // Filter by repo IDs (optional)
  attendant?: 'none' | 'granite' | 'gemini'; // Override filtering mode
  maxTokens?: number;      // Limit response length
}
```

**Example:**
```json
{
  "query": "How does authentication middleware work?",
  "repositories": ["copilotkit", "nextjs"],
  "attendant": "granite",
  "maxTokens": 500
}
```

**Response:**
```json
{
  "answer": "Authentication middleware in CoPilotKit uses...",
  "sources": [
    { "repository": "copilotkit", "entity": "AuthMiddleware", "relevance": 0.92 }
  ],
  "metadata": {
    "attendant_used": "granite",
    "strategies": { "dense": 0.4, "graph": 0.6 },
    "query_time_ms": 1247
  }
}
```

#### Tool: `query_dependency`
**Description:** Get focused information about a specific dependency

**Arguments:**
```typescript
{
  dependency: string;       // Dependency name
  repositories?: string[];  // Scope search (optional)
  aspect?: string;          // Focus area (e.g., "authentication", "configuration")
  attendant?: 'none' | 'granite' | 'gemini';
}
```

#### Tool: `get_cross_references`
**Description:** Find cross-repository entity relationships

**Arguments:**
```typescript
{
  repositories?: string[];  // Filter by repos (optional)
  minStrength?: number;     // Minimum relationship strength (0.0-1.0)
  attendant?: 'none' | 'granite' | 'gemini';
}
```

#### Tool: `smart_query`
**Description:** Adaptive query using AI-powered strategy selection

**Arguments:**
```typescript
{
  query: string;
  repositories?: string[];
  useGraph?: boolean;       // Enable graph traversal (default: true)
  attendant?: 'none' | 'granite' | 'gemini';
}
```

### Appendix E: Performance Benchmarks

**Target Performance:**

| Operation | Target | Measurement |
|-----------|--------|-------------|
| **Generate Docs** | <10s typical, <60s max | Existing |
| **Index Repository (1000 lines)** | <30s | New |
| **Entity Extraction** | <5s per 100 entities | New |
| **Embedding Generation** | <5s per 100 entities | New |
| **Hybrid Query** | <2s | New |
| **MCP Server Response** | <1s (cached), <3s (fresh) | New |
| **Database Write (1000 nodes)** | <10s | New |

**Profiling Points:**
- LLM inference time (separate embeddings vs. extraction)
- SQLite write batching efficiency
- RRF algorithm computational cost
- Network latency (if cloud models used)

**Optimization Strategies:**
- Batch writes (50 entities, 100 edges)
- Aggressive LLM response caching
- Lazy embedding generation (optional flag)
- Parallel processing for independent operations

---

## Phase 4 Preview: Resource Guard System

### Overview

While Phase 3 focuses on **functional integration** of GraphRAG into Legilimens, **Phase 4** will add production-grade **resource management and adaptive throttling** through the Resource Guard System. This is a separate implementation phase planned to begin after Phase 3 completion and stabilization.

> **📖 Full Specification:** See `../graphrag-with-sqlite_vec/docs/planning/RESOURCE-GUARD-SYSTEM.md` (137-page SDP/PRP)

### Motivation

GraphRAG uses up to 4 different AI models (Triplex 3.8B, Granite Embedding 125M, Granite 4.0 Micro 3B, optional StructLM 7B) totaling **~10.5GB RAM**. For developers with limited resources (16-32GB machines running IDE, browser, and other tools), this can cause:
- System slowdowns during indexing
- Out-of-memory errors with concurrent operations
- Poor developer experience on moderate hardware

**Resource Guard System** solves this through **intelligent container lifecycle management** for DMR-based deployments.

### Key Features (Phase 4)

#### 1. Three Resource Modes

| Mode | Target Hardware | Peak RAM | Orchestration |
|------|----------------|----------|---------------|
| **Standard** | 64GB+ | ~10.5GB | None (all models always running) |
| **Efficiency** ⭐ Default | 16-32GB | ~3GB | Automatic start/stop (2 models max) |
| **Ultra-Efficient** | 8-16GB | ~500MB | Cloud hybrid (1 local + cloud APIs) |

#### 2. Operation-Based Orchestration

**Efficiency Mode** (default) automatically manages containers based on operation type:

| Operation | Running Containers | RAM Usage |
|-----------|-------------------|-----------|
| **Indexing** | Triplex + Granite Embedding | ~3GB |
| **Query** | Granite 4.0 Micro + Granite Embedding | ~3GB |
| **Idle (MCP)** | Granite 4.0 Micro only | ~2.5GB |

#### 3. Performance Targets

- **70% RAM reduction** in Efficiency Mode (10.5GB → 3GB)
- **95% RAM reduction** in Ultra-Efficient Mode (10.5GB → 500MB local)
- Container startup: **< 10 seconds**
- Container shutdown: **< 5 seconds**
- Operation transition: **< 15 seconds**

#### 4. Cloud Hybrid Support (Ultra-Efficient)

For developers with severely constrained resources:
- **Granite Embedding always runs locally** (~500MB, required for both indexing and query)
- **Heavy models route to cloud APIs** (Triplex, Granite 4.0 Micro via HuggingFace Inference)
- **Cost estimates:** $0.02-$0.50 per repo (small-large), ~$0.50-$2.00/month moderate dev usage
- **Automatic fallback to local** if cloud unavailable

### Architecture Integration Points

**Phase 4 will integrate with Phase 3 deliverables:**

1. **`@legilimens/llm-runtime`** (Phase 3a)
   - Extend with `ResourceGuardManager` class
   - Add container lifecycle control via dockerode
   - Health checks before marking models ready

2. **`packages/graphrag/src/lib/repository-indexer.ts`** (Phase 3b)
   - Wrap indexing with `ensureModelsForOperation('indexing')`
   - Automatic transition to idle after completion

3. **`packages/graphrag/src/mcp/tools/query-engine.ts`** (Phase 3b)
   - Wrap queries with `ensureModelsForOperation('query')`
   - No unnecessary container restarts

4. **`packages/graphrag/src/mcp/server.ts`** (Phase 3c)
   - Initialize Resource Guard at startup
   - Graceful shutdown stops all containers

5. **`~/.legilimens/config.json`** (Phase 3c)
   - Add `graphrag.resourceLimits` section
   - Mode selection, thresholds, cloud API keys

### Timeline & Dependencies

**Estimated Duration:** 9-14 days (5 phases)

**Dependencies:**
- ✅ Phase 3 completion (GraphRAG integrated into Legilimens)
- ✅ DMR Integration Plan (Phases 1-2 complete)
- ✅ Stable production usage of GraphRAG+Legilimens

**Phased Approach:**
1. **Phase 4a (2-3 days):** Core ResourceGuardManager + mode configuration
2. **Phase 4b (2-3 days):** Docker container lifecycle control (dockerode)
3. **Phase 4c (1-2 days):** Integration with repository indexer and query engine
4. **Phase 4d (2-3 days):** Cloud hybrid support (HuggingFace Inference API)
5. **Phase 4e (2-3 days):** Testing, documentation, performance benchmarks

### Decision: Separate Phase

**Rationale for deferring to Phase 4:**
1. Phase 3 is already ambitious (10 weeks, 4 sub-phases)
2. Resource Guard can be cleanly added without foundation code in Phase 3
3. System should stabilize in production before adding resource complexity
4. DMR integration (Resource Guard dependency) not yet in scope
5. Allows time to gather real-world resource usage patterns from Phase 3 deployments

**Optional Phase 3 Preparation (if desired):**
- Add lightweight metrics collection (`ResourceMetrics` interface)
- Track token usage and operation durations
- Store metrics in SQLite for post-analysis
- Document resource-aware coding patterns
- Extend config schema with stub `resourceLimits` section

These preparations are **NOT required** for Phase 3 success but can accelerate Phase 4 if resources permit.

### References

- **Full specification:** `graphrag-with-sqlite_vec/docs/planning/RESOURCE-GUARD-SYSTEM.md`
- **DMR integration:** `graphrag-with-sqlite_vec/docs/planning/DMR-INTEGRATION-PLAN.md`
- **Model specifications:** `graphrag-with-sqlite_vec/CONSTITUTION.md` (Resource Management section)

---

## Summary & Next Steps

### Phase 3 Integration Summary

This comprehensive plan outlines a **10-week, 4-phase integration** of GraphRAG into Legilimens CLI:

1. **Phase 3a (2 weeks):** Infrastructure setup, shared LLM runtime
2. **Phase 3b (3 weeks):** Core GraphRAG logic migration, unit tests
3. **Phase 3c (3 weeks):** CLI commands, MCP server deployment
4. **Phase 3d (2 weeks):** Migration completion, testing, documentation

**Key Success Factors:**
- ✅ Backward compatibility maintained (GraphRAG is optional)
- ✅ Shared infrastructure prevents conflicts (unified llama.cpp)
- ✅ Gradual migration path (dual AI orchestration support)
- ✅ Comprehensive testing at every phase
- ✅ Clear documentation for users and developers

### Immediate Next Steps

1. **Review & Approval:**
   - Stakeholder review of this plan
   - Identify any gaps or concerns
   - Confirm resource availability (10 weeks)

2. **Phase 3a Kickoff:**
   - Create `@legilimens/llm-runtime` package skeleton
   - Clone graphrag-with-sqlite_vec into Legilimens root
   - Set up `packages/graphrag/` structure
   - Update `pnpm-workspace.yaml`

3. **Risk Mitigation Prep:**
   - Test zod 3.x → 4.x upgrade in isolation
   - Prototype Vercel AI SDK provider creation
   - Benchmark SQLite write performance

4. **Team Alignment:**
   - Assign phase leads
   - Schedule weekly progress reviews
   - Set up documentation tracking (Notion/Confluence)

---

**Document Status:** Ready for Review
**Approval Required:** Yes
**Version Control:** Track changes in `docs/graphrag/INTEGRATION-PLAN.md`

**Version History:**
- **v1.0** (November 1, 2025) - Initial comprehensive Phase 3 plan
- **v1.1** (November 2, 2025) - Added Phase 4 Resource Guard System preview, Risk #6 (Resource Exhaustion)

---

**Prepared by:** Claude Code (AI Assistant)
**Date:** November 1, 2025 (created), November 2, 2025 (updated)  
**Next Review:** Upon stakeholder feedback
