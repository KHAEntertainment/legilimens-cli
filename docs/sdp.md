# Legilimens CLI Tool - Software Development Plan (SDP) & Product Requirements Document (PRD)
## For Claude Code Development

---

## 🎯 PROJECT INITIALIZATION PROMPT FOR CLAUDE CODE

```
I need you to build a CLI tool called "Legilimens" that automates the generation of gateway documentation files for external dependencies. This tool streamlines a manual workflow I've refined with Gemini for creating lightweight documentation entry points that preserve context windows by referencing full static documentation.

CRITICAL CONTEXT:
- I've validated this workflow manually with Gemini successfully
- The tool must keep Claude Code context windows lean
- Gateway docs use specific template format I've refined
- Full docs are stored separately in static-backup/ subdirectories
- Tool will be used across multiple projects and IDEs

PROJECT NAME: Legilimens
GITHUB REPO: https://github.com/[username]/legilimens-cli (to be created)
LOCATION: /Users/bbrenner/Documents/Scripting Projects/legilimens-cli
```

---

## 📋 EXECUTIVE SUMMARY

### Problem Statement
When working with external dependencies (frameworks, APIs, libraries), developers need quick reference documentation without consuming massive context window space. Current workflow requires:
- Manual fetching from multiple sources (GitHub, Context7, Firecrawl)
- Manual formatting into consistent gateway template
- Manual organization into project structure
- Repetitive process for each new dependency

### Solution
A CLI tool that automates the entire workflow:
1. Accepts dependency name/URL
2. Auto-detects source type and fetches documentation
3. Uses Gemini AI to generate gateway doc from proven template
4. Saves both gateway and full static documentation
5. Integrates with Claude Code slash commands
6. Supports interactive and automated modes
7. Monitors runtime guardrails (≤10s target, 60s ceiling) and recommends minimal mode when sessions stretch

> **2025 Update**: Legilimens now standardizes on a TypeScript workspace targeting Node.js 20 LTS with a reusable `packages/core` module that powers both the CLI and future web adapters. All new work MUST follow this architecture; legacy JavaScript references remain for historical context only. A shared telemetry helper enforces the 10s/60s performance guardrails and signals when minimal mode should be engaged.

### Validation
- Manual workflow proven effective across multiple projects
- Template format refined and validated with Gemini
- Eliminates context bloat in Claude Code/Cursor/other IDEs
- Addresses real pain point in daily development workflow

---

## 🏗️ TECHNICAL ARCHITECTURE

### Core Stack
```javascript
const techStack = {
  runtime: "Node.js 20 LTS",
  language: "TypeScript (ESM, pnpm workspaces)",
  cli: {
    framework: "Commander.js",
    ui: "Ink + Chalk + Ora + gradient-string",
    interactivity: "ink-select-input, ink-text-input",
    packaging: "pnpm --filter @legilimens/cli"
  },
  sharedModule: "packages/core exports reusable gateway orchestration",
  telemetry: {
    guardrails: { interactiveTargetMs: 10_000, hardCeilingMs: 60_000 },
    minimalMode: "Shared helper recommends minimal output when runs stretch"
  },
  adapters: {
    cli: "packages/cli provides polished UX",
    service: "packages/harness-service exposes HTTP harness for parity tests"
  },
  ai: {
    model: "Gemini 2.0 Flash Exp",
    sdk: "@google/generative-ai",
    fallback: "Gemini 2.5 Pro (for complex docs)"
  },
  http: {
    client: "Axios",
    timeout: "60s for large repos"
  },
  apis: {
    refTools: "https://ref.tools/api/generate",
    context7: "https://context7.com/api/*",
    firecrawl: "https://api.firecrawl.dev/v1/*"
  }
};
```

### Project Structure
```
legilimens/
├── packages/
│   ├── core/                     # Reusable TypeScript module with gateway logic
│   │   ├── src/
│   │   ├── tests/
│   │   └── package.json
│   ├── cli/                      # Ink-powered CLI adapter consuming core
│   │   ├── src/
│   │   ├── bin/
│   │   ├── tests/
│   │   └── package.json
│   └── harness-service/          # Thin HTTP harness validating service reuse
│       ├── src/
│       └── package.json
├── docs/                         # Gateway outputs (template-compliant)
├── tests/integration/            # Parity and regression suites
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

### Example Output Structure
```
docs/
├── frameworks/
│   ├── framework_vercel_ai_sdk.md          # Gateway doc
│   └── static-backup/
│       └── framework_vercel_ai_sdk.md      # Full static documentation
├── apis/
│   ├── api_stripe.md                       # Gateway doc
│   └── static-backup/
│       └── api_stripe.md                   # Full static documentation
├── libraries/
│   ├── library_lodash.md                   # Gateway doc
│   └── static-backup/
│       └── library_lodash.md               # Full static documentation
└── tools/
    ├── tool_eslint.md                       # Gateway doc
    └── static-backup/
        └── tool_eslint.md                   # Full static documentation
```

---

## 📦 DETAILED REQUIREMENTS

### Input Detection & Source Selection

**Requirement 1.1: Auto-detect Dependency Type**
```javascript
// Input patterns to detect:
const patterns = {
  github: [
    'github.com/user/repo',
    'user/repo',
    'https://github.com/user/repo'
  ],
  npm: [
    '@scope/package',
    'package-name',
    'react', 'lodash'
  ],
  url: [
    'https://docs.example.com',
    'http://api.example.com'
  ]
};

// Detection priority:
// 1. If contains 'github.com' or matches 'user/repo' → GitHub
// 2. If starts with 'http' → URL
// 3. If starts with '@' or matches npm pattern → NPM
```

**Requirement 1.2: Fetching Strategy Priority**
```javascript
const fetchStrategy = {
  github: {
    primary: 'ref.tools',
    fallback: 'firecrawl (GitHub docs site)'
  },
  npm: {
    primary: 'context7',
    fallback: 'ref.tools (GitHub repo)',
    lastResort: 'firecrawl (npm docs)'
  },
  url: {
    primary: 'firecrawl',
    fallback: null
  }
};
```

### External API Integrations

**Requirement 2.1: ref.tools Integration**
```javascript
// Endpoint: https://ref.tools/api/generate
// Method: POST
// Required: { repo: 'user/repo', format: 'markdown' }
// Optional: { include: ['README', 'docs', 'examples'] }
// Response: { markdown: string, metadata: object }

async function fetchFromRefTools(repo) {
  // 1. Normalize repo format (strip github.com, .git)
  // 2. POST to ref.tools API
  // 3. Handle 60s timeout for large repos
  // 4. Return { source, repo, content, metadata }
  // 5. On failure, fallback to firecrawl
}
```

**Requirement 2.2: Context7 Integration**
```javascript
// Search Endpoint: https://context7.com/api/search?q={library}
// Docs Endpoint: https://context7.com/api/libraries/{id}/docs
// Process:
// 1. Search for library by name
// 2. Get library ID from results
// 3. Fetch documentation markdown
// 4. Return { source, library, content, metadata }
// 5. On not found, return null (trigger fallback)
```

**Requirement 2.3: Firecrawl Integration**
```javascript
// Endpoint: https://api.firecrawl.dev/v1/scrape
// Method: POST
// Headers: { Authorization: 'Bearer API_KEY' }
// Body: { url: string, formats: ['markdown'] }
// Response: { markdown: string, metadata: object }

async function fetchFromFirecrawl(url) {
  // 1. POST to Firecrawl with URL
  // 2. Request markdown format
  // 3. Handle rate limits
  // 4. Return { source, url, content, metadata }
}
```

### Gemini AI Integration

**Requirement 3.1: Gateway Doc Generation**
```javascript
const geminiPrompt = `You are a technical documentation specialist. Generate a concise gateway documentation file following this exact template:

# [Dependency Name]

This document provides an overview of [dependency], [one-sentence description].

## Short Description

[2-3 sentence AI-generated concise description of what this dependency does and why it's useful]

## Key Features
- [Feature 1 - specific capability]
- [Feature 2 - specific capability]
- [Feature 3 - specific capability]
- [Feature 4 - specific capability]
- [Feature 5 - specific capability]

## USE [TOOL] MCP TO ACCESS DEPENDENCY KNOWLEDGE!
To access the most up-to-date documentation for this [framework/api/library], use the [appropriate MCP tool] to retrieve information directly from the source repository/docs.

[Specific guidance based on dependency type:
- GitHub repos: "Access the repository at https://github.com/user/repo and use the 'ask_question' function"
- Known libraries: "Use Context7 to retrieve cached documentation"
- Documentation sites: "Use Firecrawl to extract specific sections as needed"]

For broader context during planning, the full static docs are available at: 
[./static-backup/[dependency_name].md](./static-backup/[dependency_name].md)

## [GitHub Repository / Official Documentation / Website]
[Link to authoritative source]

---

INPUT DOCUMENTATION:
\${fullDocs}

DEPENDENCY TYPE: \${type}
DEPENDENCY NAME: \${name}

Generate ONLY the gateway documentation following the template exactly. Be concise but informative.`;

// EXAMPLE OUTPUT:
const EXAMPLE_OUTPUT = `
# Vercel AI SDK Framework

This document provides an overview of the Vercel AI SDK, a toolkit for building AI-powered applications with React and Next.js.

## Short Description

The Vercel AI SDK is a comprehensive toolkit for building AI-powered applications with React and Next.js. It provides hooks, components, and utilities for integrating AI models, handling streaming responses, and building conversational interfaces. The SDK supports multiple AI providers including OpenAI, Anthropic, and Google, and offers features like automatic retry logic, caching, and error handling.

## Key Features
- React hooks for AI integration
- Streaming response handling
- Support for multiple AI providers
- Conversational UI components
- Automatic retry and error handling

## USE DEEPWIKI MCP TO ACCESS DEPENDENCY KNOWLEDGE!
To access the most up-to-date documentation for this framework, use the DeepWiki MCP to retrieve information directly from the source repository. Access the repository at https://github.com/vercel/ai and use the \`ask_question\` function with specific queries like "how can I build a RAG agent with this SDK" to get targeted guidance.

For broader context during planning, the full static docs are available at: 
[./static-backup/framework_vercel_ai_sdk.md](./static-backup/framework_vercel_ai_sdk.md).

## GitHub Repository
For more detailed implementation examples and updates, visit the [Vercel AI SDK repository](https://github.com/vercel/ai).
`;
```

**Requirement 3.2: Model Selection**
```javascript
const modelConfig = {
  default: 'gemini-2.0-flash-exp',      // Fast, cheap for most docs
  complex: 'gemini-2.0-flash-thinking-exp-1219', // For large/complex docs
  threshold: 50000                       // Character count to switch models
};
```

### File Management

**Requirement 4.1: Directory Structure**
```javascript
const outputStructure = {
  base: './docs',
  types: ['frameworks', 'apis', 'libraries', 'tools'],
  pattern: 'docs/{type}s/{name}.md',
  staticPattern: 'docs/{type}s/static-backup/{name}.md'  // Changed from static-copies
};

// Examples:
// docs/frameworks/framework_vercel_ai_sdk.md
// docs/frameworks/static-backup/framework_vercel_ai_sdk.md
// docs/apis/api_stripe.md
// docs/apis/static-backup/api_stripe.md
```

**Requirement 4.2: File Naming Convention**
```javascript
function generateFilename(dependency, type) {
  // 1. Extract clean name from input
  //    - 'vercel/ai' → 'vercel_ai_sdk'
  //    - '@supabase/supabase-js' → 'supabase_js'
  //    - 'https://stripe.com/docs' → 'stripe'
  // 2. Add type prefix to name
  //    - 'vercel_ai_sdk' + 'framework' → 'framework_vercel_ai_sdk'
  //    - 'stripe' + 'api' → 'api_stripe'
  //    - 'lodash' + 'library' → 'library_lodash'
  // 3. Sanitize for filesystem
  // 4. Return: { gateway: 'name.md', static: 'name.md' }
}
```

### CLI Interface

**Requirement 5.1: Command Structure**
```bash
# Basic usage
legilimens <dependency> [options]

# Interactive mode
legilimens --interactive
legilimens -i

# With type specification
legilimens vercel/ai --type framework
legilimens stripe --type api

# Custom output location
legilimens @supabase/supabase-js --output ./docs --type library

# Skip static docs (gateway only)
legilimens firecrawl --no-static
```

**Requirement 5.2: Options**
```javascript
const cliOptions = {
  '-t, --type <type>': 'Documentation type (framework|api|library|tool)',
  '-o, --output <path>': 'Output directory (default: ./docs)',
  '-i, --interactive': 'Interactive mode with prompts',
  '--no-static': 'Skip saving full static documentation',
  '-v, --version': 'Show version number',
  '-h, --help': 'Show help information'
};
```

**Requirement 5.3: Interactive Prompts**
```javascript
const interactiveQuestions = [
  {
    type: 'text',
    name: 'dependency',
    message: 'Dependency name, GitHub repo, or URL:',
    validate: value => value.length > 0
  },
  {
    type: 'select',
    name: 'type',
    message: 'Documentation type:',
    choices: [
      { title: 'Framework/SDK', value: 'framework' },
      { title: 'API', value: 'api' },
      { title: 'Library', value: 'library' },
      { title: 'Tool', value: 'tool' }
    ]
  }
];
```

---

## 🔑 ENVIRONMENT VARIABLES

```bash
# .env.example
GEMINI_API_KEY=your_gemini_api_key_here
FIRECRAWL_API_KEY=your_firecrawl_api_key_here

# Optional: Override default model
GEMINI_MODEL=gemini-2.0-flash-exp

# Optional: Enable debug logging
DEBUG=true
```

---

## 🎨 USER EXPERIENCE SPECIFICATIONS

### Success Flow Example
```bash
$ legilimens vercel/ai

🚀 Generating documentation for: vercel/ai

✓ Detected source type: GitHub repository
✓ Fetching from ref.tools... (3.2s)
✓ Generating gateway doc with Gemini... (1.8s)
✓ Saved gateway: docs/frameworks/framework_vercel_ai_sdk.md
✓ Saved static: docs/frameworks/static-backup/framework_vercel_ai_sdk.md

✨ Documentation generated successfully!
```

### Error Handling
```bash
$ legilimens invalid-repo

🚀 Generating documentation for: invalid-repo

✓ Detected source type: NPM package
⚠ Not found in Context7
⚠ Attempting fallback to ref.tools...
✗ Failed to fetch from ref.tools: Repository not found
⚠ Attempting fallback to Firecrawl...
✗ Failed to fetch documentation

✗ Error: Could not fetch documentation from any source
  Try:
  - Verify the dependency name is correct
  - Provide a direct URL to documentation
  - Check API keys in .env file
```

---

## 🚀 DEVELOPMENT PLAN (2-Day Sprint)

### Day 1: Core Infrastructure
```javascript
const day1Tasks = [
  {
    task: 'Project Setup',
    time: '30min',
    deliverables: [
      'package.json with all dependencies',
      '.env.example template',
      'Basic README with usage examples',
      'Project structure scaffold'
    ]
  },
  {
    task: 'CLI Framework',
    time: '1hr',
    deliverables: [
      'cli.js with Commander setup',
      'Argument parsing and validation',
      'Interactive mode with Prompts',
      'Help text and version display'
    ]
  },
  {
    task: 'Source Detection',
    time: '1hr',
    deliverables: [
      'detector.js with pattern matching',
      'Input normalization functions',
      'Priority-based strategy selection',
      'Unit tests for detection logic'
    ]
  },
  {
    task: 'File Management',
    time: '1hr',
    deliverables: [
      'file-manager.js for saving docs',
      'Directory structure creation',
      'Filename generation and sanitization',
      'Path resolution and validation'
    ]
  }
];
```

### Day 2: API Integrations & AI
```javascript
const day2Tasks = [
  {
    task: 'API Fetchers',
    time: '3hrs',
    deliverables: [
      'github.js - ref.tools integration',
      'context7.js - Context7 API',
      'firecrawl.js - Firecrawl integration',
      'Error handling and fallback logic',
      'Rate limiting and retry logic'
    ]
  },
  {
    task: 'Gemini Integration',
    time: '2hrs',
    deliverables: [
      'gemini.js - AI doc generation',
      'Template prompt implementation',
      'Model selection logic',
      'Error handling for AI failures'
    ]
  },
  {
    task: 'Testing & Polish',
    time: '2hrs',
    deliverables: [
      'End-to-end testing with real dependencies',
      'Error message refinement',
      'Loading indicators and progress',
      'Documentation and examples'
    ]
  }
];
```

---

## 📝 EXTERNAL DOCUMENTATION REFERENCES

### API Documentation (DO NOT INLINE - Use These Links)

**ref.tools API**
- Documentation: https://ref.tools/docs
- GitHub: https://github.com/ref-tools/ref-tools
- Use DeepWiki MCP: `ask_question("How do I use the ref.tools API to fetch markdown documentation from GitHub repos?")`

**Context7 API**
- Documentation: https://context7.com/docs/api
- Use Firecrawl: Scrape https://context7.com/docs for API reference

**Firecrawl API**
- Documentation: https://docs.firecrawl.dev
- GitHub: https://github.com/mendableai/firecrawl
- Use DeepWiki MCP: `ask_question("What's the API format for scraping a website with Firecrawl?")`

**Gemini API (@google/generative-ai)**
- NPM: https://www.npmjs.com/package/@google/generative-ai
- Docs: https://ai.google.dev/gemini-api/docs/get-started/node
- Use Context7: Should be available as known library

---

## 🔧 CLAUDE CODE DEVELOPMENT INSTRUCTIONS

### Initial Setup Commands
```bash
cd /Users/bbrenner/Documents/Scripting\ Projects/legilimens-cli

# Initialize if not exists
npm init -y

# Install dependencies
npm install @google/generative-ai axios chalk commander ora prompts dotenv

# Create directory structure
mkdir -p src/{fetchers,templates,utils}
mkdir -p docs/{frameworks,apis,libraries,tools}/static-backup

# Create .env from example
cp .env.example .env
# (User will add API keys manually)
```

### Development Workflow
1. **Scaffold pnpm workspace** - Ensure `packages/core`, `packages/cli`, and `packages/harness-service` share TypeScript configuration.
2. **Implement core module** - Build reusable gateway orchestration (source detection, fetchers, template rendering) inside `packages/core`.
3. **Build CLI adapter** - Wrap core module with `commander` + `ink` UX, including ASCII art welcome, DeepWiki reminders, and minimal mode fallbacks.
4. **Add source fetchers sequentially** inside the core module:
   - Start with ref.tools (simplest)
   - Add Context7
   - Add Firecrawl last
5. **Integrate Gemini** - Use proven template for generation through the shared module.
6. **Expose harness service** - Provide thin HTTP adapter in `packages/harness-service` to validate service reuse.
7. **Test with real dependencies** - Compare CLI and service outputs for parity and verify template compliance.

### Testing Strategy
```bash
# Test each dependency type
npm run dev vercel/ai --type framework
npm run dev stripe --type api
npm run dev lodash --type library
npm run dev https://docs.anthropic.com --type api

# Test interactive mode
npm run dev --interactive

# Test error handling
npm run dev non-existent-repo
npm run dev --help
```

---

## 🎯 SUCCESS CRITERIA

### MVP Definition
- ✅ Accepts dependency via CLI argument
- ✅ Auto-detects source type (GitHub/NPM/URL)
- ✅ Fetches docs from at least 2 sources (ref.tools + Firecrawl)
- ✅ Generates gateway doc using Gemini
- ✅ Saves both gateway and static docs in correct structure
- ✅ Follows exact template format
- ✅ Works in interactive mode
- ✅ Handles errors gracefully with helpful messages

### Quality Gates
1. **Output Validation**: Gateway docs must match template exactly
2. **File Structure**: Must create correct directory hierarchy
3. **Error Handling**: Never crash, always provide actionable feedback
4. **Performance**: Complete within 10 seconds for typical dependency
5. **Usability**: Works without reading documentation (intuitive)

---

## 🚦 CHECKPOINTS

### Checkpoint 1: CLI Foundation (2 hours)
**Deliverables:**
- CLI accepts arguments and shows help
- Interactive mode prompts user
- Can detect source type from input
- Creates output directory structure

**Test:** `legilimens --help` and `legilimens --interactive` work

### Checkpoint 2: Single Source Integration (4 hours)
**Deliverables:**
- ref.tools integration functional
- Can fetch GitHub repo documentation
- Gemini generates gateway doc from template
- Files saved to correct locations

**Test:** `legilimens vercel/ai` creates both docs

### Checkpoint 3: Full Integration (7 hours)
**Deliverables:**
- All three fetchers working (ref.tools, Context7, Firecrawl)
- Fallback logic between sources
- Error handling for all failure modes
- Polish and user experience refinements

**Test:** Successfully generate docs for GitHub, NPM, and URL inputs

---

## 📚 INTEGRATION WITH CLAUDE CODE SLASH COMMANDS

### Future Enhancement: Claude Code Integration
```yaml
# ~/.claude/commands/docs/gateway.md
---
name: gateway
description: Generate gateway documentation for dependency
---

Run Legilimens CLI tool to generate documentation.

Usage: /docs:gateway <dependency> [type]

Examples:
- /docs:gateway vercel/ai framework
- /docs:gateway stripe api
- /docs:gateway @supabase/supabase-js library

This command executes: `legilimens <dependency> --type <type>`
```

---

## 🎁 UPCOMING FEATURES (Post-MVP)

### Phase 2 Enhancements
1. **Batch Mode**: Process multiple dependencies from config file
2. **Update Detection**: Check if docs need refresh
3. **Git Integration**: Auto-commit generated docs
4. **Custom Templates**: Support user-defined templates
5. **Cache Layer**: Skip re-fetching unchanged docs

---

## Implementation Notes

### Automatic MCP Tool Detection (2025 Update)
The implementation now correctly follows the original SDP intent: users provide plain language dependency identifiers, and the system automatically determines the appropriate MCP tool (DeepWiki for GitHub, Context7 for NPM, Firecrawl for URLs) without requiring manual URL entry. This fixes the drift that occurred where users were forced to manually provide DeepWiki URLs through interactive prompts, batch JSON format, or environment variables.

**Key Changes:**
- Removed user-facing DeepWiki prompts from interactive wizard
- Made `deepWikiRepository` optional in all interfaces
- Enhanced core module to automatically derive DeepWiki URLs when not provided
- Updated CLI layer to rely on automatic derivation rather than user input
- Modified batch processing to trust core module's automatic derivation
- Updated documentation to reflect automatic MCP tool selection

This aligns with the SDP principle: users provide WHAT (dependency identifier), the system determines HOW (which MCP tool, which URL).

## END OF SDP/PRD

**NEXT STEP FOR CLAUDE CODE:**

Read this entire SDP, then begin with:
1. Project setup and dependency installation
2. CLI framework implementation (cli.js)
3. Source detection logic (detector.js)
4. File management system (file-manager.js)

Then proceed through checkpoints sequentially. Use DeepWiki, Context7, and Firecrawl documentation as needed but DO NOT inline large docs - reference them via MCP tools.
