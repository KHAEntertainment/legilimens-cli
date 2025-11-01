# Pre-Phase 4: CLI Refactoring & Modernization

**Status:** Planning Complete - Required Before Phase 4 Integration
**Date:** October 29, 2025
**Duration Estimate:** 1-2 weeks
**Priority:** HIGH (Blocks Phase 4 GraphRAG integration)

---

## Table of Contents

- [Overview](#overview)
- [Objectives](#objectives)
- [UX Enhancements](#ux-enhancements)
- [Core Changes](#core-changes)
- [Non-Interactive Mode](#non-interactive-mode)
- [New Functions](#new-functions)
- [Implementation Plan](#implementation-plan)
- [Testing Strategy](#testing-strategy)
- [Success Criteria](#success-criteria)

---

## Overview

### Current State

Legilimens CLI is functional but needs modernization before Phase 4 GraphRAG integration:
- Heavy reliance on ENV variables (uncommon for CLI tools)
- Confusing terminology ("Gateway" unclear to new users)
- No model management (can't uninstall LLMs)
- Interactive-only mode (agents can't use CLI)
- No agent instruction file generation

### Goals

1. **Better UX:** Clear terminology, flag-based configuration
2. **Model Flexibility:** Multiple LLM choices, easy uninstall
3. **Automation-Friendly:** Non-interactive mode for agents
4. **Agent Integration:** Auto-generate instruction files
5. **Foundation for Phase 4:** Clean codebase ready for GraphRAG

### Why This Matters

**Blocks Phase 4 because:**
- GraphRAG integration adds complexity (needs clean base)
- Non-interactive mode required for auto-indexing
- Agent instructions must be in place before GraphRAG MCP
- Model management needed (Granite 4 Micro as new default)

---

## Objectives

### Primary Goals

1. ✅ **Migrate ENV variables to CLI flags** (with ENV fallback)
2. ✅ **Update terminology** for clarity ("Generate Documentation" not "Generate Gateway")
3. ✅ **Add model management** (uninstall, multi-model selection)
4. ✅ **Implement non-interactive mode** (all commands)
5. ✅ **Generate agent instruction files** (`.claude/CLAUDE.md`, etc.)
6. ✅ **Prepare for Claude skill** distribution

### Secondary Goals

- Improve error messages
- Add progress indicators
- Better help documentation
- Consistent output formatting

---

## UX Enhancements

### 1. ENV Variables → CLI Flags

**Problem:** Too many ENV variables, uncommon for CLI tools

**Current Usage:**
```bash
DEBUG=true legilimens
MINIMAL_MODE=true legilimens
```

**New Usage:**
```bash
legilimens --debug
legilimens --minimal
legilimens generate vercel/ai --output ./docs
```

**Implementation:**

```typescript
// packages/cli/src/cli.ts

interface GlobalOptions {
  debug?: boolean;
  minimal?: boolean;
  output?: string;
  nonInteractive?: boolean;
}

const program = new Command();

program
  .option('--debug', 'Enable debug mode')
  .option('--minimal', 'Enable minimal mode (low-contrast, ANSI-free)')
  .option('--output <path>', 'Output directory for documentation')
  .option('--non-interactive', 'Non-interactive mode (no prompts)');

program
  .command('generate <dependency>')
  .description('Generate dependency documentation')
  .option('--skip-index', 'Skip GraphRAG indexing')
  .option('--type <type>', 'Source type: auto|github|npm|url')
  .action(async (dependency, options) => {
    const config = {
      ...program.opts(),
      ...options,
      // Fallback to ENV if flag not provided
      debug: options.debug ?? process.env.DEBUG === 'true',
      minimal: options.minimal ?? process.env.MINIMAL_MODE === 'true',
    };
    await generateCommand(dependency, config);
  });
```

**Changes Required:**

| File | Change |
|------|--------|
| `packages/cli/src/cli.ts` | Add global options parsing |
| `packages/cli/src/clackApp.ts` | Accept options from flags |
| `packages/cli/src/wizard/clackWizard.ts` | Check flags before prompting |
| `packages/core/src/config.ts` | Prioritize flags > ENV |

**Backward Compatibility:**
- ENV variables still work (fallback)
- No breaking changes for existing users
- Flags take precedence over ENV

**Testing:**
```bash
# Test flag usage
legilimens --debug generate vercel/ai

# Test ENV fallback
DEBUG=true legilimens generate vercel/ai

# Test precedence (flag should win)
DEBUG=false legilimens --debug generate vercel/ai
```

---

### 2. Terminology Update

**Problem:** "Gateway" is confusing, refers to CLI name not function

**Changes:**

| Current | New | Rationale |
|---------|-----|-----------|
| "Generate Gateway" | "Generate Documentation" | Clear purpose |
| "Gateway file" | "Documentation index" or "Quick reference" | More descriptive |
| "Gateway documentation" | "Dependency documentation" | Standard terminology |

**Files to Update:**

1. **UI/Menu:**
   - `packages/cli/src/clackApp.ts` - Main menu text
   - `packages/cli/src/wizard/clackWizard.ts` - Wizard prompts

2. **Templates:**
   - `packages/core/src/templates/legilimens-template.md` - Header text
   - Documentation comments referring to "gateway"

3. **Documentation:**
   - `README.md` - All references to "gateway"
   - `docs/*.md` - Update terminology
   - Command descriptions in `--help`

**Implementation:**

```typescript
// Before
const action = await select({
  message: 'What would you like to do?',
  options: [
    { value: 'generate', label: 'Generate gateway documentation' },
  ],
});

// After
const action = await select({
  message: 'What would you like to do?',
  options: [
    { value: 'generate', label: 'Generate dependency documentation' },
  ],
});
```

**Testing:**
- Search codebase for "gateway" (case-insensitive)
- Review all user-facing text
- Update screenshots/demos

---

### 3. Minimal Mode Flag

**Current:**
```typescript
◆  Enable minimal mode (low-contrast, ANSI-free)?
│  ○ Yes / ● No
```

**Problem:** Disruptive prompt during retrieval flow

**Solution:**
```bash
# Flag-based
legilimens --minimal generate vercel/ai

# ENV fallback
MINIMAL_MODE=true legilimens generate vercel/ai

# Auto-detect (SSH, CI/CD)
# Automatically enable minimal mode if:
# - TERM=dumb
# - CI=true
# - SSH_TTY not set
```

**Implementation:**

```typescript
// packages/cli/src/utils/terminalDetection.ts

export function shouldUseMinimalMode(options: GlobalOptions): boolean {
  // 1. Explicit flag
  if (options.minimal !== undefined) {
    return options.minimal;
  }

  // 2. ENV variable
  if (process.env.MINIMAL_MODE === 'true') {
    return true;
  }

  // 3. Auto-detect
  if (process.env.TERM === 'dumb') return true;
  if (process.env.CI === 'true') return true;
  if (!process.env.SSH_TTY && process.env.SSH_CLIENT) return true;

  return false;
}
```

**Testing:**
```bash
# Manual flag
legilimens --minimal generate axios

# ENV fallback
MINIMAL_MODE=true legilimens generate axios

# CI environment (auto-detect)
CI=true legilimens generate axios
```

---

## Core Changes

### 1. Model Management

**Add Model Uninstall:**

```bash
legilimens uninstall-model phi-4
legilimens uninstall-model all
```

**Implementation:**

```typescript
// packages/cli/src/commands/uninstall-model.ts

export async function uninstallModel(modelName: string) {
  const modelsDir = join(homeDir, '.legilimens', 'models');
  const installedModels = await getInstalledModels(modelsDir);

  if (modelName === 'all') {
    // Confirm before deleting all
    const confirm = await askConfirmation('Delete all models?');
    if (!confirm) return;

    for (const model of installedModels) {
      await deleteModel(model);
    }
    console.log('✓ All models uninstalled');
  } else {
    const model = installedModels.find(m => m.name === modelName);
    if (!model) {
      console.error(`Model "${modelName}" not found`);
      console.log('Installed models:', installedModels.map(m => m.name).join(', '));
      return;
    }

    await deleteModel(model);
    console.log(`✓ Model "${modelName}" uninstalled`);
  }
}

async function deleteModel(model: ModelInfo) {
  const modelPath = join(homeDir, '.legilimens', 'models', model.filename);
  await fs.unlink(modelPath);

  // Update config to remove deleted model
  const config = await loadConfig();
  if (config.model?.path === modelPath) {
    config.model = undefined;
    await saveConfig(config);
  }
}
```

**Testing:**
```bash
# List models
legilimens list-models

# Uninstall specific model
legilimens uninstall-model phi-4

# Uninstall all
legilimens uninstall-model all
```

---

### 2. Multi-Model Selection

**New Default: Granite 4 Micro**

**Model Comparison:**

| Model | Size | Tool Calling (BFCL) | Context | Best For |
|-------|------|---------------------|---------|----------|
| **Granite 4 Micro** | ~2-3GB | **59.98%** | **128K** | **Balanced quality + speed** ⭐ |
| Phi-4 | ~6-8GB | Unknown | 16K | Maximum quality |
| Qwen 2.5 1.5B | ~1-1.5GB | ~40-45% | 32K | Ultra-light, fast |

**Setup Wizard Update:**

```typescript
// packages/cli/src/wizard/clackWizard.ts

async function selectModel() {
  const model = await select({
    message: 'Choose a local LLM for documentation generation:',
    options: [
      {
        value: 'granite-4-micro',
        label: 'Granite 4 Micro (Recommended)',
        hint: '2-3GB, 128K context, great reasoning'
      },
      {
        value: 'phi-4',
        label: 'Phi-4 (Previous Default)',
        hint: '6-8GB, 16K context, high quality'
      },
      {
        value: 'qwen-2.5-1.5b',
        label: 'Qwen 2.5 1.5B (Lightweight)',
        hint: '1-1.5GB, 32K context, fast'
      },
      {
        value: 'skip',
        label: 'Skip (Use cloud provider)',
        hint: 'Configure OpenRouter, Gemini, or OpenAI instead'
      }
    ],
    initialValue: 'granite-4-micro'
  });

  if (model === 'skip') {
    return await selectCloudProvider();
  }

  return await downloadModel(model);
}
```

**Model Metadata:**

```typescript
// packages/core/src/models/registry.ts

export const MODEL_REGISTRY = {
  'granite-4-micro': {
    name: 'IBM Granite 4 Micro',
    size: '2.3GB',
    context: 128000,
    bfclScore: 59.98,
    url: 'https://huggingface.co/ibm-granite/granite-4.0-micro',
    ggufUrl: 'https://huggingface.co/bartowski/granite-4.0-micro-GGUF/resolve/main/granite-4.0-micro-Q4_K_M.gguf',
    filename: 'granite-4-micro.gguf',
    recommended: true
  },
  'phi-4': {
    name: 'Phi-4',
    size: '7.2GB',
    context: 16000,
    url: 'https://huggingface.co/QuantFactory/phi-4-GGUF',
    ggufUrl: 'https://huggingface.co/QuantFactory/phi-4-GGUF/resolve/main/phi-4.Q4_K_M.gguf',
    filename: 'phi-4.gguf',
    legacy: true
  },
  'qwen-2.5-1.5b': {
    name: 'Qwen 2.5 1.5B Instruct',
    size: '1.2GB',
    context: 32000,
    bfclScore: 42,
    url: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct',
    ggufUrl: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf',
    filename: 'qwen-2.5-1.5b.gguf',
    lightweight: true
  }
};
```

**Testing:**
```bash
# Setup with new default
legilimens setup --non-interactive

# Setup with specific model
legilimens setup --model phi-4

# List available models
legilimens list-available-models

# Switch models
legilimens switch-model granite-4-micro
```

---

### 3. Duplicate Install Prevention

**Review Existing Guards:**

```typescript
// packages/cli/src/services/modelDownloader.ts

async function downloadModel(modelId: string) {
  const modelInfo = MODEL_REGISTRY[modelId];
  const modelPath = join(homeDir, '.legilimens', 'models', modelInfo.filename);

  // Check if already installed
  if (await fileExists(modelPath)) {
    const stats = await fs.stat(modelPath);
    const expectedSize = modelInfo.size; // Convert to bytes

    // Verify file size
    if (stats.size === expectedSize) {
      console.log(`✓ Model "${modelId}" already installed`);
      const shouldRedownload = await confirm('Re-download?');
      if (!shouldRedownload) return modelPath;
    } else {
      console.warn('Model file size mismatch, re-downloading...');
    }
  }

  // Download with progress
  await downloadWithProgress(modelInfo.ggufUrl, modelPath);

  // Verify download
  await verifyChecksum(modelPath, modelInfo.checksum);

  return modelPath;
}
```

**Enhancements:**
- Add SHA256 checksums to model registry
- Verify checksums after download
- Partial download resumption (if supported)
- Better error messages on failure

**Testing:**
```bash
# First install (should download)
legilimens setup --model granite-4-micro

# Second install (should skip)
legilimens setup --model granite-4-micro

# Corrupted file (should re-download)
echo "corrupted" > ~/.legilimens/models/granite-4-micro.gguf
legilimens setup --model granite-4-micro
```

---

### 4. Future: OpenRouter Support

**Planning Only (Not Implementation):**

```typescript
// packages/core/src/providers/openrouter.ts

export async function selectCloudProvider() {
  const provider = await select({
    message: 'Choose cloud AI provider:',
    options: [
      { value: 'openrouter', label: 'OpenRouter (200+ models)' },
      { value: 'openai', label: 'OpenAI (GPT-4, etc.)' },
      { value: 'gemini', label: 'Google Gemini' },
    ]
  });

  if (provider === 'openrouter') {
    const apiKey = await text({
      message: 'Enter OpenRouter API key:',
      validate: (value) => value.startsWith('sk-or-') || 'Invalid API key format'
    });

    const model = await select({
      message: 'Choose model:',
      options: [
        { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
        { value: 'google/gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
        { value: 'openai/gpt-4o', label: 'GPT-4o' },
        // ... 200+ more options via OpenRouter API
      ]
    });

    return { type: 'openrouter', apiKey, model };
  }

  // ... other providers
}
```

**Status:** Deferred to Phase 4 (GraphRAG needs it first)

---

## Non-Interactive Mode

### Objective

Enable agents and scripts to use all Legilimens commands without prompts.

### Requirements

**All commands must support:**
1. Flag-based configuration
2. Exit codes (0 = success, non-zero = error)
3. Machine-readable output (JSON optional)
4. No interactive prompts

### Implementation

**Example: Generate Command**

```bash
# Non-interactive with all flags
legilimens generate vercel/ai \
  --non-interactive \
  --output ./docs \
  --type github \
  --skip-index \
  --format json

# Exit codes
# 0 = Success
# 1 = General error
# 2 = Network error
# 3 = Parse error
# 4 = Configuration error
```

**Code Pattern:**

```typescript
// packages/cli/src/commands/generate.ts

export async function generateCommand(
  dependency: string,
  options: GenerateOptions
) {
  try {
    // Non-interactive mode: skip all prompts
    if (options.nonInteractive) {
      // Use flag values or defaults
      const type = options.type || 'auto';
      const output = options.output || './docs';

      // Proceed without confirmation
      const result = await generate(dependency, { type, output });

      // Output result
      if (options.format === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`✓ Documentation generated: ${result.outputPath}`);
      }

      process.exit(0);
    }

    // Interactive mode: show prompts
    const type = await select({
      message: 'Source type?',
      options: [...]
    });

    // ... rest of interactive flow

  } catch (error) {
    if (options.nonInteractive) {
      console.error(JSON.stringify({ error: error.message }));
      process.exit(1);
    }

    // ... interactive error handling
  }
}
```

**Testing:**

```bash
# Test all commands non-interactively
legilimens generate axios --non-interactive
legilimens setup --non-interactive --model granite-4-micro
legilimens list-models --format json
legilimens uninstall-model phi-4 --non-interactive --force
```

---

## New Functions

### 1. Agent Instruction File Generation

**Command:**
```bash
legilimens setup-agent claude-code
legilimens setup-agent cursor
legilimens setup-agent all
```

**Files Generated:**

#### `.claude/CLAUDE.md` (Claude Code)

```markdown
# Project Documentation

## Legilimens Document Management

This project uses Legilimens for dependency documentation management.

**Documentation Location:** `./docs/`

**Critical Instructions:**
1. **ALWAYS check documentation before implementing dependencies**
2. Check `./docs/<dependency>/` for static documentation
3. Reference official docs via Legilimens-generated files

**Standard Workflow:**
1. User: "Add support for Vercel AI SDK"
2. You: Check `./docs/vercel-ai/` for documentation
3. If not found: Suggest running `legilimens generate vercel/ai`
4. Implement using official documentation as reference

**Available Documentation:**
<!-- AUTO-GENERATED - Last updated: 2025-10-29 -->
- vercel/ai (generated: 2025-10-29)
- lodash (generated: 2025-10-28)
- react (generated: 2025-10-27)

**Important:**
- Don't implement from memory if documentation available
- Always use latest official APIs
- Check for breaking changes and migration guides
```

#### `AGENTS.md` (General Agents)

```markdown
# Agent Instructions

## Documentation Management

This project uses Legilimens for centralized dependency documentation.

**For All Coding Agents:**

1. **Before implementing any dependency:**
   - Check `./docs/<dependency>/` for documentation
   - If missing, suggest generating it:
     ```bash
     legilimens generate <dependency>
     ```

2. **Documentation Standards:**
   - Always reference official documentation
   - Don't rely on training data (may be outdated)
   - Check for breaking changes in changelog

3. **Available Documentation:**
   <!-- AUTO-GENERATED -->
   - vercel/ai (docs/vercel-ai/)
   - lodash (docs/lodash/)
   - react (docs/react/)

**For Agents with Shell Access:**

Generate new documentation:
```bash
legilimens generate <dependency>
```

List available documentation:
```bash
ls -la ./docs/
```
```

#### `.cursorrules` (Cursor)

```
# Documentation Management

This project uses Legilimens for dependency documentation.

Check ./docs/ for official dependency documentation before implementing.

Generate new docs: legilimens generate <dependency>
```

**Implementation:**

```typescript
// packages/cli/src/commands/setup-agent.ts

export async function setupAgent(agentType: string) {
  const agents = {
    'claude-code': {
      path: '.claude/CLAUDE.md',
      template: claudeTemplate,
    },
    'cursor': {
      path: '.cursorrules',
      template: cursorTemplate,
    },
    'agents': {
      path: 'AGENTS.md',
      template: agentsTemplate,
    },
  };

  if (agentType === 'all') {
    for (const [type, config] of Object.entries(agents)) {
      await generateInstructionFile(config);
    }
  } else {
    const config = agents[agentType];
    if (!config) {
      console.error(`Unknown agent type: ${agentType}`);
      console.log('Available:', Object.keys(agents).join(', '));
      return;
    }
    await generateInstructionFile(config);
  }
}

async function generateInstructionFile(config: AgentConfig) {
  // Create directory if needed
  await fs.mkdir(dirname(config.path), { recursive: true });

  // Generate content from template
  const content = await renderTemplate(config.template, {
    availableDocs: await getAvailableDocumentation(),
    lastUpdated: new Date().toISOString().split('T')[0],
  });

  // Write file
  await fs.writeFile(config.path, content);
  console.log(`✓ Generated ${config.path}`);
}
```

**Auto-Update Hook:**

```typescript
// packages/core/src/gateway.ts

async function generateDocumentation(target: string, options: GenerateOptions) {
  // ... existing generation logic

  // Auto-update agent instruction files
  if (!options.skipAgentUpdate) {
    await updateAgentInstructions(target);
  }
}

async function updateAgentInstructions(newDependency: string) {
  const instructionFiles = [
    '.claude/CLAUDE.md',
    'AGENTS.md',
    '.cursorrules',
  ];

  for (const file of instructionFiles) {
    if (await fileExists(file)) {
      await updateDocumentationList(file, newDependency);
    }
  }
}
```

**Testing:**
```bash
# Generate for specific agent
legilimens setup-agent claude-code

# Generate for all
legilimens setup-agent all

# Test auto-update
legilimens generate express
# Verify CLAUDE.md updated with express
```

---

### 2. Claude Skill Preparation

**Objective:** Prepare for Claude skill distribution

**Structure:**
```
skills/
└── legilimens/
    ├── skill.yaml
    ├── README.md
    └── examples/
        ├── generate.md
        ├── setup.md
        └── workflow.md
```

**skill.yaml (Preview):**
```yaml
name: legilimens
version: 1.0.0
description: Local dependency documentation management
author: Legilimens Project

commands:
  - name: generate
    usage: legilimens generate <dependency>
    description: Fetch and generate documentation
    examples:
      - legilimens generate vercel/ai
      - legilimens generate lodash

  - name: setup
    usage: legilimens setup
    description: Initial setup wizard
```

**Status:** Skeleton only, full implementation in Phase 4G

---

## Implementation Plan

### Week 1: Core Refactoring

**Day 1-2: Flag System**
- [ ] Add global options to CLI parser
- [ ] Update all commands to accept flags
- [ ] Maintain ENV variable fallback
- [ ] Test flag precedence

**Day 3: Terminology Update**
- [ ] Search and replace "gateway" terminology
- [ ] Update all user-facing text
- [ ] Update documentation
- [ ] Update templates

**Day 4-5: Model Management**
- [ ] Implement `uninstall-model` command
- [ ] Add model registry with metadata
- [ ] Update setup wizard with multi-model selection
- [ ] Test download guards and verification

### Week 2: Non-Interactive & Agent Integration

**Day 1-2: Non-Interactive Mode**
- [ ] Add `--non-interactive` flag support
- [ ] Update all commands to skip prompts
- [ ] Add JSON output support
- [ ] Define exit codes

**Day 3-4: Agent Instructions**
- [ ] Create instruction templates
- [ ] Implement `setup-agent` command
- [ ] Add auto-update hooks
- [ ] Test with real agents

**Day 5: Testing & Documentation**
- [ ] Comprehensive testing (manual + automated)
- [ ] Update README and docs
- [ ] Create migration guide
- [ ] Prepare for Phase 4

---

## Testing Strategy

### Unit Tests

**New Tests (~30 tests):**
- Flag parsing and precedence
- ENV fallback behavior
- Model management (install, uninstall, list)
- Non-interactive command execution
- Agent instruction generation
- Template rendering

### Integration Tests

**Scenarios:**
1. Fresh install with flags
2. Model install/uninstall cycle
3. Non-interactive full workflow
4. Agent instruction auto-update
5. Mixed flag + ENV usage

### Manual Testing

**Checklist:**
- [ ] Setup wizard with Granite 4 Micro
- [ ] Generate docs with all flags
- [ ] Non-interactive mode for all commands
- [ ] Agent instructions generated correctly
- [ ] Model uninstall and re-install
- [ ] Mixed interactive/non-interactive usage

### Regression Testing

**Ensure no breaking changes:**
- [ ] ENV variables still work
- [ ] Existing workflows unaffected
- [ ] Configuration files compatible
- [ ] Documentation paths unchanged

---

## Success Criteria

### Functional

- ✅ All commands support flags
- ✅ ENV variables work as fallback
- ✅ Granite 4 Micro is default model
- ✅ Can uninstall models
- ✅ Non-interactive mode works for all commands
- ✅ Agent instruction files generated
- ✅ Clear, consistent terminology

### Quality

- ✅ 30+ new unit tests passing
- ✅ Integration tests passing
- ✅ No breaking changes for existing users
- ✅ Documentation updated
- ✅ Error messages clear and helpful

### User Experience

- ✅ Setup wizard < 5 minutes
- ✅ Clear command help (`--help`)
- ✅ Progress indicators for long operations
- ✅ Consistent output formatting
- ✅ Helpful error messages

---

## Risk Assessment

### Low Risk

- Flag system implementation (standard pattern)
- Terminology updates (text changes)
- Non-interactive mode (straightforward)

### Medium Risk

- Model management (file operations, checksums)
- Agent instruction auto-update (must not break custom edits)
- Breaking changes (mitigated by ENV fallback)

### Mitigation

- Comprehensive testing
- ENV variable fallback
- Clear migration guide
- Rollback plan (ENV-only mode)

---

## Next Steps

### This Week

1. **Review and approve** this plan
2. **Create implementation branch** `refactor/pre-phase-4`
3. **Begin Week 1 tasks** (flag system)

### Week 2

1. **Complete non-interactive mode**
2. **Implement agent instructions**
3. **Final testing and documentation**
4. **Prepare for Phase 4 integration**

---

**Document Version:** 1.0
**Last Updated:** October 29, 2025
**Status:** Planning Complete - Ready for Implementation
**Blocks:** Phase 4 GraphRAG Integration
