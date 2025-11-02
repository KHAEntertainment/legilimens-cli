## CLI Utility Headless - Non-Interactive Modes.Modes

## OpenAI Codez
Here are all the non-interactive command options available for `codex exec`:


## Example Command
'''
codex exec "Extract details of the project" --output-schema ~/schema.json
'''

### Core Options

**Prompt Input:**
- `PROMPT` - The task prompt (positional argument, or use `-` to read from stdin) [1](#0-0) 

**Model & Provider:**
- `--model`, `-m` - Override model selection [2](#0-1) 
- `--oss` - Use local open source model provider (Ollama) [3](#0-2) 

**Security & Execution:**
- `--sandbox`, `-s` - Set sandbox policy (`read-only`, `workspace-write`, `danger-full-access`) [4](#0-3) 
- `--full-auto` - Convenience flag for low-friction sandboxed automatic execution (equivalent to `--sandbox workspace-write` with `on-failure` approval) [5](#0-4) 
- `--dangerously-bypass-approvals-and-sandbox` (alias: `--yolo`) - Skip all confirmations and disable sandboxing (EXTREMELY DANGEROUS) [6](#0-5) 

**Configuration:**
- `--profile`, `-p` - Select configuration profile from config.toml [7](#0-6) 
- `--cd`, `-C` - Set working directory [8](#0-7) 
- `--skip-git-repo-check` - Allow running outside Git repositories [9](#0-8) 

**Output Control:**
- `--json` - Output events as JSONL to stdout instead of human-readable text [10](#0-9) 
- `--output-last-message`, `-o` - Write final agent message to specified file [11](#0-10) 
- `--output-schema` - JSON Schema file for structured final response [12](#0-11) 
- `--color` - Color output control (`always`, `never`, `auto`) [13](#0-12) 

**Images:**
- `--image`, `-i` - Attach image(s) to the initial prompt (comma-separated) [14](#0-13) 

**Experimental:**
- `--include-plan-tool` - Enable experimental plan tracking [15](#0-14) 

### Subcommands

`codex exec` also supports a `resume` subcommand to continue previous sessions: [16](#0-15) 

```shell
codex exec resume <SESSION_ID> "Follow-up prompt"
codex exec resume --last "Continue from most recent"
```

## Notes

The default behavior of `codex exec` is non-interactive with `approval_policy = "never"`, meaning it never prompts for approvals and works within the constraints you provide. [17](#0-16)  By default, it runs in `read-only` mode for safety. [18](#0-17) 

Wiki pages you might want to explore:
- [Configuration System (openai/codex)](/wiki/openai/codex#2.2)
- [Headless Execution Mode (openai/codex)](/wiki/openai/codex#4.2)

### Citations

**File:** codex-rs/exec/src/cli.rs (L13-15)
```rust
    /// Optional image(s) to attach to the initial prompt.
    #[arg(long = "image", short = 'i', value_name = "FILE", value_delimiter = ',', num_args = 1..)]
    pub images: Vec<PathBuf>,
```

**File:** codex-rs/exec/src/cli.rs (L17-19)
```rust
    /// Model the agent should use.
    #[arg(long, short = 'm')]
    pub model: Option<String>,
```

**File:** codex-rs/exec/src/cli.rs (L21-22)
```rust
    #[arg(long = "oss", default_value_t = false)]
    pub oss: bool,
```

**File:** codex-rs/exec/src/cli.rs (L24-27)
```rust
    /// Select the sandbox policy to use when executing model-generated shell
    /// commands.
    #[arg(long = "sandbox", short = 's', value_enum)]
    pub sandbox_mode: Option<codex_common::SandboxModeCliArg>,
```

**File:** codex-rs/exec/src/cli.rs (L29-31)
```rust
    /// Configuration profile from config.toml to specify default options.
    #[arg(long = "profile", short = 'p')]
    pub config_profile: Option<String>,
```

**File:** codex-rs/exec/src/cli.rs (L33-35)
```rust
    /// Convenience alias for low-friction sandboxed automatic execution (-a on-failure, --sandbox workspace-write).
    #[arg(long = "full-auto", default_value_t = false)]
    pub full_auto: bool,
```

**File:** codex-rs/exec/src/cli.rs (L37-45)
```rust
    /// Skip all confirmation prompts and execute commands without sandboxing.
    /// EXTREMELY DANGEROUS. Intended solely for running in environments that are externally sandboxed.
    #[arg(
        long = "dangerously-bypass-approvals-and-sandbox",
        alias = "yolo",
        default_value_t = false,
        conflicts_with = "full_auto"
    )]
    pub dangerously_bypass_approvals_and_sandbox: bool,
```

**File:** codex-rs/exec/src/cli.rs (L47-49)
```rust
    /// Tell the agent to use the specified directory as its working root.
    #[clap(long = "cd", short = 'C', value_name = "DIR")]
    pub cwd: Option<PathBuf>,
```

**File:** codex-rs/exec/src/cli.rs (L51-53)
```rust
    /// Allow running Codex outside a Git repository.
    #[arg(long = "skip-git-repo-check", default_value_t = false)]
    pub skip_git_repo_check: bool,
```

**File:** codex-rs/exec/src/cli.rs (L55-57)
```rust
    /// Path to a JSON Schema file describing the model's final response shape.
    #[arg(long = "output-schema", value_name = "FILE")]
    pub output_schema: Option<PathBuf>,
```

**File:** codex-rs/exec/src/cli.rs (L62-64)
```rust
    /// Specifies color settings for use in the output.
    #[arg(long = "color", value_enum, default_value_t = Color::Auto)]
    pub color: Color,
```

**File:** codex-rs/exec/src/cli.rs (L66-68)
```rust
    /// Print events to stdout as JSONL.
    #[arg(long = "json", alias = "experimental-json", default_value_t = false)]
    pub json: bool,
```

**File:** codex-rs/exec/src/cli.rs (L70-72)
```rust
    /// Whether to include the plan tool in the conversation.
    #[arg(long = "include-plan-tool", default_value_t = false)]
    pub include_plan_tool: bool,
```

**File:** codex-rs/exec/src/cli.rs (L74-76)
```rust
    /// Specifies file where the last message from the agent should be written.
    #[arg(long = "output-last-message", short = 'o', value_name = "FILE")]
    pub last_message_file: Option<PathBuf>,
```

**File:** codex-rs/exec/src/cli.rs (L78-81)
```rust
    /// Initial instructions for the agent. If not provided as an argument (or
    /// if `-` is used), instructions are read from stdin.
    #[arg(value_name = "PROMPT", value_hint = clap::ValueHint::Other)]
    pub prompt: Option<String>,
```

**File:** docs/exec.md (L9-11)
```markdown
In non-interactive mode, Codex does not ask for command or edit approvals. By default it runs in `read-only` mode, so it cannot edit files or run commands that require network access.

Use `codex exec --full-auto` to allow file edits. Use `codex exec --sandbox danger-full-access` to allow edits and networked commands.
```

**File:** docs/exec.md (L88-95)
```markdown
### Resuming non-interactive sessions

Resume a previous non-interactive session with `codex exec resume <SESSION_ID>` or `codex exec resume --last`. This preserves conversation context so you can ask follow-up questions or give new tasks to the agent.

```shell
codex exec "Review the change, look for use-after-free issues"
codex exec resume --last "Fix use-after-free issues"
```
```


--------------------------------------- 

### Gemini CLI

## Example Command with JSON output

'''
gemini -p "Explain the architecture of this codebase" --output-format json
'''

## Core Headless Options

**Basic invocation:**
- `--prompt` or `-p`: Run in non-interactive mode with a direct prompt [1](#0-0) 
- `--prompt-interactive` or `-i`: Execute a prompt and continue in interactive mode [2](#0-1) 
- Positional argument: `gemini "query"` (synonymous with `-p`) [3](#0-2) 

**Output control:**
- `--output-format`: Specify output format (`text` or `json`) [4](#0-3) 

## Model and Context Options

- `--model` or `-m`: Specify the Gemini model to use [5](#0-4) 
- `--all-files` or `-a`: Include all files in context recursively [6](#0-5) 
- `--include-directories`: Include additional directories (max 5) [7](#0-6) 

## Approval and Security Options

- `--yolo` or `-y`: Auto-approve all tool calls [8](#0-7) 
- `--approval-mode`: Set approval mode (`default`, `auto_edit`, or `yolo`) [9](#0-8) 
- `--allowed-tools`: Comma-separated list of tools that bypass confirmation [10](#0-9) 
- `--checkpointing` or `-c`: Enable checkpointing of file edits [11](#0-10) 

## Sandbox Options

- `--sandbox` or `-s`: Run in sandbox mode [12](#0-11) 
- `--sandbox-image`: Specify sandbox image URI [13](#0-12) 

## Extension and MCP Options

- `--extensions` or `-e`: Specify extensions to use (or `none` to disable all) [14](#0-13) 
- `--list-extensions` or `-l`: List all available extensions and exit [15](#0-14) 
- `--allowed-mcp-server-names`: Specify allowed MCP server names [16](#0-15) 

## Telemetry Options

- `--telemetry`: Enable/disable telemetry [17](#0-16) 
- `--telemetry-target`: Set telemetry target (`local` or `gcp`) [18](#0-17) 
- `--telemetry-otlp-endpoint`: Set OTLP endpoint for telemetry [19](#0-18) 
- `--telemetry-otlp-protocol`: Set OTLP protocol (`grpc` or `http`) [20](#0-19) 
- `--telemetry-log-prompts`: Enable/disable logging of user prompts [21](#0-20) 
- `--telemetry-outfile`: Redirect telemetry output to a file [22](#0-21) 

## Other Options

- `--debug` or `-d`: Enable debug mode [23](#0-22) 
- `--proxy`: Set proxy for Gemini client [24](#0-23) 
- `--show-memory-usage`: Show memory usage in status bar [25](#0-24) 
- `--experimental-acp`: Start agent in ACP mode [26](#0-25) 

## Notes

All command-line arguments are parsed using yargs in `parseArguments()` [27](#0-26) . The headless mode documentation provides comprehensive examples of using these options for scripting and automation [28](#0-27) . Note that several telemetry flags are deprecated in favor of settings.json configuration [29](#0-28) .

Wiki pages you might want to explore:
- [Architecture Overview (google-gemini/gemini-cli)](/wiki/google-gemini/gemini-cli#1.1)

### Citations

**File:** packages/cli/src/config/config.ts (L93-100)
```typescript
export async function parseArguments(settings: Settings): Promise<CliArgs> {
  const rawArgv = hideBin(process.argv);
  const yargsInstance = yargs(rawArgv)
    .locale('en')
    .scriptName('gemini')
    .usage(
      'Usage: gemini [options] [command]\n\nGemini CLI - Launch an interactive CLI, use -p/--prompt for non-interactive mode',
    )
```

**File:** packages/cli/src/config/config.ts (L101-105)
```typescript
    .option('telemetry', {
      type: 'boolean',
      description:
        'Enable telemetry? This flag specifically controls if telemetry is sent. Other --telemetry-* flags set specific values but do not enable telemetry on their own.',
    })
```

**File:** packages/cli/src/config/config.ts (L106-111)
```typescript
    .option('telemetry-target', {
      type: 'string',
      choices: ['local', 'gcp'],
      description:
        'Set the telemetry target (local or gcp). Overrides settings files.',
    })
```

**File:** packages/cli/src/config/config.ts (L112-116)
```typescript
    .option('telemetry-otlp-endpoint', {
      type: 'string',
      description:
        'Set the OTLP endpoint for telemetry. Overrides environment variables and settings files.',
    })
```

**File:** packages/cli/src/config/config.ts (L117-122)
```typescript
    .option('telemetry-otlp-protocol', {
      type: 'string',
      choices: ['grpc', 'http'],
      description:
        'Set the OTLP protocol for telemetry (grpc or http). Overrides settings files.',
    })
```

**File:** packages/cli/src/config/config.ts (L123-127)
```typescript
    .option('telemetry-log-prompts', {
      type: 'boolean',
      description:
        'Enable or disable logging of user prompts for telemetry. Overrides settings files.',
    })
```

**File:** packages/cli/src/config/config.ts (L128-131)
```typescript
    .option('telemetry-outfile', {
      type: 'string',
      description: 'Redirect all telemetry output to the specified file.',
    })
```

**File:** packages/cli/src/config/config.ts (L132-155)
```typescript
    .deprecateOption(
      'telemetry',
      'Use the "telemetry.enabled" setting in settings.json instead. This flag will be removed in a future version.',
    )
    .deprecateOption(
      'telemetry-target',
      'Use the "telemetry.target" setting in settings.json instead. This flag will be removed in a future version.',
    )
    .deprecateOption(
      'telemetry-otlp-endpoint',
      'Use the "telemetry.otlpEndpoint" setting in settings.json instead. This flag will be removed in a future version.',
    )
    .deprecateOption(
      'telemetry-otlp-protocol',
      'Use the "telemetry.otlpProtocol" setting in settings.json instead. This flag will be removed in a future version.',
    )
    .deprecateOption(
      'telemetry-log-prompts',
      'Use the "telemetry.logPrompts" setting in settings.json instead. This flag will be removed in a future version.',
    )
    .deprecateOption(
      'telemetry-outfile',
      'Use the "telemetry.outfile" setting in settings.json instead. This flag will be removed in a future version.',
    )
```

**File:** packages/cli/src/config/config.ts (L156-161)
```typescript
    .option('debug', {
      alias: 'd',
      type: 'boolean',
      description: 'Run in debug mode?',
      default: false,
    })
```

**File:** packages/cli/src/config/config.ts (L162-166)
```typescript
    .option('proxy', {
      type: 'string',
      description:
        'Proxy for gemini client, like schema://user:password@host:port',
    })
```

**File:** packages/cli/src/config/config.ts (L171-176)
```typescript
    .command('$0 [query..]', 'Launch Gemini CLI', (yargsInstance) =>
      yargsInstance
        .positional('query', {
          description:
            'Positional prompt. Defaults to one-shot; use -i/--prompt-interactive for interactive.',
        })
```

**File:** packages/cli/src/config/config.ts (L177-181)
```typescript
        .option('model', {
          alias: 'm',
          type: 'string',
          description: `Model`,
        })
```

**File:** packages/cli/src/config/config.ts (L182-186)
```typescript
        .option('prompt', {
          alias: 'p',
          type: 'string',
          description: 'Prompt. Appended to input on stdin (if any).',
        })
```

**File:** packages/cli/src/config/config.ts (L187-192)
```typescript
        .option('prompt-interactive', {
          alias: 'i',
          type: 'string',
          description:
            'Execute the provided prompt and continue in interactive mode',
        })
```

**File:** packages/cli/src/config/config.ts (L193-197)
```typescript
        .option('sandbox', {
          alias: 's',
          type: 'boolean',
          description: 'Run in sandbox?',
        })
```

**File:** packages/cli/src/config/config.ts (L198-201)
```typescript
        .option('sandbox-image', {
          type: 'string',
          description: 'Sandbox image URI.',
        })
```

**File:** packages/cli/src/config/config.ts (L202-207)
```typescript
        .option('all-files', {
          alias: ['a'],
          type: 'boolean',
          description: 'Include ALL files in context?',
          default: false,
        })
```

**File:** packages/cli/src/config/config.ts (L208-212)
```typescript
        .option('show-memory-usage', {
          type: 'boolean',
          description: 'Show memory usage in status bar',
          default: false,
        })
```

**File:** packages/cli/src/config/config.ts (L213-219)
```typescript
        .option('yolo', {
          alias: 'y',
          type: 'boolean',
          description:
            'Automatically accept all actions (aka YOLO mode, see https://www.youtube.com/watch?v=xvFZjo5PgG0 for more details)?',
          default: false,
        })
```

**File:** packages/cli/src/config/config.ts (L220-225)
```typescript
        .option('approval-mode', {
          type: 'string',
          choices: ['default', 'auto_edit', 'yolo'],
          description:
            'Set the approval mode: default (prompt for approval), auto_edit (auto-approve edit tools), yolo (auto-approve all tools)',
        })
```

**File:** packages/cli/src/config/config.ts (L226-231)
```typescript
        .option('checkpointing', {
          alias: 'c',
          type: 'boolean',
          description: 'Enables checkpointing of file edits',
          default: false,
        })
```

**File:** packages/cli/src/config/config.ts (L232-235)
```typescript
        .option('experimental-acp', {
          type: 'boolean',
          description: 'Starts the agent in ACP mode',
        })
```

**File:** packages/cli/src/config/config.ts (L236-245)
```typescript
        .option('allowed-mcp-server-names', {
          type: 'array',
          string: true,
          description: 'Allowed MCP server names',
          coerce: (mcpServerNames: string[]) =>
            // Handle comma-separated values
            mcpServerNames.flatMap((mcpServerName) =>
              mcpServerName.split(',').map((m) => m.trim()),
            ),
        })
```

**File:** packages/cli/src/config/config.ts (L246-253)
```typescript
        .option('allowed-tools', {
          type: 'array',
          string: true,
          description: 'Tools that are allowed to run without confirmation',
          coerce: (tools: string[]) =>
            // Handle comma-separated values
            tools.flatMap((tool) => tool.split(',').map((t) => t.trim())),
        })
```

**File:** packages/cli/src/config/config.ts (L254-266)
```typescript
        .option('extensions', {
          alias: 'e',
          type: 'array',
          string: true,
          nargs: 1,
          description:
            'A list of extensions to use. If not provided, all extensions are used.',
          coerce: (extensions: string[]) =>
            // Handle comma-separated values
            extensions.flatMap((extension) =>
              extension.split(',').map((e) => e.trim()),
            ),
        })
```

**File:** packages/cli/src/config/config.ts (L267-271)
```typescript
        .option('list-extensions', {
          alias: 'l',
          type: 'boolean',
          description: 'List all available extensions and exit.',
        })
```

**File:** packages/cli/src/config/config.ts (L272-274)
```typescript
        .option('include-directories', {
          type: 'array',
          string: true,
```

**File:** docs/cli/headless.md (L1-40)
```markdown
# Headless Mode

Headless mode allows you to run Gemini CLI programmatically from command line
scripts and automation tools without any interactive UI. This is ideal for
scripting, automation, CI/CD pipelines, and building AI-powered tools.

- [Headless Mode](#headless-mode)
  - [Overview](#overview)
  - [Basic Usage](#basic-usage)
    - [Direct Prompts](#direct-prompts)
    - [Stdin Input](#stdin-input)
    - [Combining with File Input](#combining-with-file-input)
  - [Output Formats](#output-formats)
    - [Text Output (Default)](#text-output-default)
    - [JSON Output](#json-output)
      - [Response Schema](#response-schema)
      - [Example Usage](#example-usage)
    - [File Redirection](#file-redirection)
  - [Configuration Options](#configuration-options)
  - [Examples](#examples)
    - [Code review](#code-review)
    - [Generate commit messages](#generate-commit-messages)
    - [API documentation](#api-documentation)
    - [Batch code analysis](#batch-code-analysis)
    - [Code review](#code-review-1)
    - [Log analysis](#log-analysis)
    - [Release notes generation](#release-notes-generation)
    - [Model and tool usage tracking](#model-and-tool-usage-tracking)
  - [Resources](#resources)

## Overview

The headless mode provides a headless interface to Gemini CLI that:

- Accepts prompts via command line arguments or stdin
- Returns structured output (text or JSON)
- Supports file redirection and piping
- Enables automation and scripting workflows
- Provides consistent exit codes for error handling

```

**File:** docs/cli/headless.md (L83-86)
```markdown
### JSON Output

Returns structured data including response, statistics, and metadata. This
format is ideal for programmatic processing and automation scripts.
```
---------------------------------------------------------   

### Claude Code

## Example Command
Here's a practical example combining several headless options:

claude -p \  
  --add-dir /path/to/project \  
  --mcp-config /tmp/mcp-config/mcp-servers.json \  
  --system-prompt-file /tmp/custom-prompt.txt \  
  --output-format=stream-json \  
  --dangerously-skip-permissions \  
  --debug

## Print Mode (`-p` flag)

Claude Code's primary headless mode is **Print Mode**, activated with the `-p` or `--print` flag. [1](#0-0)  This mode provides non-interactive batch processing with JSON output and streaming support. [2](#0-1) 

### Key Print Mode Features

- **JSON Output Format**: Print mode returns structured JSON output for programmatic consumption. [3](#0-2) 
- **Streaming Support**: Use `--output-format=stream-json` for streaming JSON output. [4](#0-3) 
- **Streaming Input**: Supports streaming input without requiring the `-p` flag explicitly. [5](#0-4) 
- **Partial Message Streaming**: Enable with `--include-partial-messages` CLI flag for SDK usage. [6](#0-5) 
- **Sub-task Messages**: Emits messages from sub-tasks (identifiable via `parent_tool_use_id` property). [7](#0-6) 

## Additional Headless Configuration Flags

### System Prompt Customization
- `--system-prompt-file`: Override the system prompt in print mode. [8](#0-7) 
- `--append-system-prompt`: Can be used in both interactive and print modes. [9](#0-8) 
- `--system-prompt`: Documented for system prompt customization. [10](#0-9) 

### Permission Management
- `--dangerously-skip-permissions`: Skip permission checks in print mode (with some historical reliability issues that were fixed). [11](#0-10) 
- `--disallowedTools`: Specify tools that should not be available. [12](#0-11) 

### Context and Configuration
- `--add-dir`: Specify additional working directories. [13](#0-12) 
- `--mcp-config`: Specify MCP server configuration file path. [14](#0-13) 
- `--settings`: Load settings from a JSON file. [15](#0-14) 
- `--agents`: Add subagents dynamically. [16](#0-15) 

### Conversation Management
- `--continue`: Resume previous conversations (works in headless mode). [17](#0-16) 
- `--resume`: Switch between conversations. [18](#0-17) 
- `--replay-user-messages`: Replay user messages back to stdout (SDK feature). [19](#0-18) 

### Debugging and Logging
- `--debug`: Enable debug mode (replaces deprecated `DEBUG=true`). [20](#0-19) 
- `--mcp-debug`: Get detailed information about MCP server errors. [21](#0-20) 

## GitHub Actions Integration

For CI/CD workflows, Claude Code can be used in GitHub Actions via the `anthropics/claude-code-base-action@beta` action, which provides a fully headless execution environment with parameters like `prompt_file`, `allowed_tools`, `timeout_minutes`, and `mcp_config`. [22](#0-21) 

## Notes

The print mode (`-p`) is the core headless interface, designed specifically for programmatic usage and automation scenarios.<cite /> Historical bug fixes show that print mode has been continuously improved, including fixes for @-mentioned files needing to be read before writing and thinking mode support. [23](#0-22) [24](#0-23)  The SDK (TypeScript and Python) provides additional programmatic interfaces built on top of these headless capabilities. [25](#0-24) 

Wiki pages you might want to explore:
- [Claude Code Overview (anthropics/claude-code)](/wiki/anthropics/claude-code#1)

### Citations

**File:** CHANGELOG.md (L5-6)
```markdown
- Fixed bug with resuming where previously created files needed to be read again before writing
- Fixed bug with `-p` mode where @-mentioned files needed to be read again before writing
```

**File:** CHANGELOG.md (L14-14)
```markdown
- Document --system-prompt
```

**File:** CHANGELOG.md (L87-87)
```markdown
- Add subagents dynamically with `--agents` flag
```

**File:** CHANGELOG.md (L170-170)
```markdown
- SDK: Added partial message streaming support via `--include-partial-messages` CLI flag
```

**File:** CHANGELOG.md (L208-208)
```markdown
- SDK: Added `--replay-user-messages` to replay user messages back to stdout
```

**File:** CHANGELOG.md (L315-315)
```markdown
- Settings: Added `--settings` flag to load settings from a JSON file
```

**File:** CHANGELOG.md (L358-358)
```markdown
- Add --system-prompt-file option to override system prompt in print mode
```

**File:** CHANGELOG.md (L382-382)
```markdown
- `--append-system-prompt` can now be used in interactive mode, not just --print/-p.
```

**File:** CHANGELOG.md (L500-500)
```markdown
- /resume slash command to switch conversations within Claude Code
```

**File:** CHANGELOG.md (L516-517)
```markdown
- Released TypeScript SDK: import @anthropic-ai/claude-code to get started
- Released Python SDK: pip install claude-code-sdk to get started
```

**File:** CHANGELOG.md (L518-518)
```markdown

```

**File:** CHANGELOG.md (L531-531)
```markdown
- Added --add-dir CLI argument for specifying additional working directories
```

**File:** CHANGELOG.md (L532-532)
```markdown
- Added streaming input support without require -p flag
```

**File:** CHANGELOG.md (L542-542)
```markdown
- We now emit messages from sub-tasks in -p mode (look for the parent_tool_use_id property)
```

**File:** CHANGELOG.md (L574-574)
```markdown
- Fixed a bug where --dangerously-skip-permissions sometimes didn't work in --print mode
```

**File:** CHANGELOG.md (L608-608)
```markdown
- Breaking change: --print JSON output now returns nested message objects, for forwards-compatibility as we introduce new metadata fields
```

**File:** CHANGELOG.md (L611-611)
```markdown
- Introduced --debug mode
```

**File:** CHANGELOG.md (L617-617)
```markdown
- Fixed a bug where thinking was not working in -p mode
```

**File:** CHANGELOG.md (L659-659)
```markdown
- Resume conversations from where you left off from with "claude --continue" and "claude --resume"
```

**File:** CHANGELOG.md (L664-664)
```markdown
- Added support for --disallowedTools
```

**File:** CHANGELOG.md (L672-672)
```markdown
- Run one-off MCP servers with `claude --mcp-config <path-to-file>`
```

**File:** CHANGELOG.md (L701-701)
```markdown
- Print mode (-p) now supports streaming output via --output-format=stream-json
```

**File:** CHANGELOG.md (L776-776)
```markdown
- MCP debug mode: Run with --mcp-debug flag to get more information about MCP server errors
```

**File:** .github/workflows/claude-issue-triage.yml (L98-104)
```yaml
        uses: anthropics/claude-code-base-action@beta
        with:
          prompt_file: /tmp/claude-prompts/triage-prompt.txt
          allowed_tools: "Bash(gh label list),mcp__github__get_issue,mcp__github__get_issue_comments,mcp__github__update_issue,mcp__github__search_issues,mcp__github__list_issues"
          timeout_minutes: "5"
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          mcp_config: /tmp/mcp-config/mcp-servers.json
```
