# Quickstart: Legilimens CLI

Get started with Legilimens in 5 minutes. This guide walks you through installation, automatic setup, and generating your first gateway documentation.

The Legilimens CLI embraces a modern agentic UX with a branded welcome sequence and DeepWiki guidance.

## 1. Install dependencies

```bash
git clone <repository-url>
cd doc-gateway-cli
pnpm install
```

The workspace targets Node.js 20 LTS with Corepack-enabled package management. The CLI, core module, and harness service register automatically through pnpm workspaces.

## 2. First Run: Automatic Setup

```bash
pnpm --filter @legilimens/cli start
```

On first run, Legilimens automatically:

1. **Launches setup wizard** to detect existing configuration
2. **Detects existing llama.cpp installations** in common locations
3. **Downloads llama.cpp binary** for your platform (macOS/Linux/Windows) if needed
4. **Downloads phi-4 GGUF model** (~8.5GB, Q4 quantized) if needed
5. **Installs to `~/.legilimens/`** if not using existing installation

**No manual installation required.**

### Setup Wizard

The intelligent setup wizard:

- **Detects existing configuration**: Shows what's already configured and only prompts for missing items
- **Reuses existing installations**: Automatically finds llama.cpp in common paths
- **Pre-fills API keys**: Shows stored keys and lets you keep or update them
- **Smart validation**: Post-save verification ensures keys are retrievable
- **Automatic retry**: If save fails, offers to retry configuration

#### Get Tavily API Key (Required)

Sign up at [tavily.com](https://tavily.com) and get your API key (free tier available). This enables web search for natural language dependency resolution.

#### Complete Setup

The wizard will:

1. Auto-install llama.cpp + phi-4 model (first run only)
2. Prompt for Tavily API key (required)
3. Optionally collect Firecrawl, Context7, RefTools API keys
4. Save configuration to `~/.legilimens/config.json`
5. Store API keys securely in system keychain
6. Verify keys are retrievable before marking setup complete

On subsequent runs, the wizard detects stored keys and skips prompts automatically.

## 3. Generate Your First Gateway Doc

After setup completes, you'll see the main menu. Here are common examples:

### Example: GitHub Repository (vercel/ai)

```
? Enter dependency (name, URL, or GitHub repo): vercel/ai
```

Legilimens will:
- Fetch repository information from GitHub
- Generate short description and features using local LLM
- Create gateway doc pointing to DeepWiki
- Save to `docs/libraries/library_vercel_ai.md`

### Example: NPM Package (lodash)

```
? Enter dependency (name, URL, or GitHub repo): lodash
```

Legilimens will:
- Search Tavily to find official lodash repository
- Detect NPM package type
- Generate gateway documentation
- Save to `docs/libraries/library_lodash.md`

### Example: URL-Based Documentation (Stripe)

```
? Enter dependency (name, URL, or GitHub repo): https://stripe.com/docs
```

Legilimens will:
- Fetch web content using Firecrawl (if configured)
- Generate structured documentation
- Save to `docs/other/other_stripe_docs.md`

## 4. Batch Processing

Process multiple dependencies at once using a JSON file:

```bash
pnpm --filter @legilimens/cli start --batch ./batch.json
```

Example `batch.json`:

```json
{
  "dependencies": [
    { "input": "vercel/ai" },
    { "input": "lodash" },
    { "input": "https://stripe.com/docs" }
  ]
}
```

Progress indicators show batch execution status. Failed items are reported at the end with details.

## 5. Welcome Experience & Controls

On launch you will see the ASCII banner (or a fallback header if assets are unavailable), the Legilimens tagline, and the DeepWiki reminder: **DeepWiki for coding, static files for planning.**

Controls:

- Press `Enter` to proceed into the guided generation flow
- Press `S` to skip the welcome while keeping prompts intact
- Press `Q` or `Esc` to exit instantly

## 6. Terminal Experience & Accessibility

Legilimens uses a full-screen TUI (Text User Interface) similar to vim, less, or claude-code:

- **Clears the screen** on startup for clean workspace
- **Preserves terminal history** using alternate screen buffer
- **Restores previous state** when you exit
- **Graceful cleanup** on errors or interrupts (Ctrl+C)

To disable TUI mode (useful for debugging or CI):

```bash
export LEGILIMENS_DISABLE_TUI=true
legilimens
```

### Choose an accessibility profile

```bash
pnpm --filter @legilimens/cli start -- --minimal
pnpm --filter @legilimens/cli start -- --low-contrast
LEGILIMENS_MODE=low-contrast pnpm --filter @legilimens/cli start
```

- `--minimal` (or `LEGILIMENS_MODE=minimal`) disables gradients and ASCII art while keeping the flow identical for CI pipelines
- `--low-contrast` softens the palette and keeps a compact ASCII banner for readability on lower-contrast terminals
- The CLI auto-detects ANSI color support and falls back to plain text when colors are unavailable

## 7. Credential Storage

Legilimens stores API keys securely using your system's keychain when available:

### Storage Methods (in order of preference)

1. **System Keychain** (recommended)
   - **macOS**: Keychain Access
   - **Windows**: Credential Manager
   - **Linux**: Secret Service (GNOME Keyring, KDE Wallet)

2. **Environment Variables** (CI/CD)
   ```bash
   export TAVILY_API_KEY=tvly-...
   export FIRECRAWL_API_KEY=fc-...
   export CONTEXT7_API_KEY=your-key
   export REFTOOLS_API_KEY=your-key
   ```

3. **Encrypted File Fallback** (0o600 permissions)
   - Used when keychain is unavailable
   - Stored at `~/.legilimens/secrets.json`
   - Automatically encrypted with restrictive permissions

### Credential Precedence

1. Environment variables (highest priority)
2. System keychain/secure storage
3. Encrypted file fallback

### Managing Stored Credentials

```bash
# Re-run setup wizard
pnpm --filter @legilimens/cli start

# Skip setup (advanced users with env vars)
export LEGILIMENS_SKIP_SETUP=true
export TAVILY_API_KEY=tvly-...
pnpm --filter @legilimens/cli start

# Delete all stored credentials and reconfigure
rm -rf ~/.legilimens
```

## 8. Troubleshooting

### Setup wizard repeats on every launch

**Cause**: API keys not stored or retrievable from keychain/file.

**Solution**:
1. Set `LEGILIMENS_DEBUG=true` to see diagnostic logs
2. Check `~/.legilimens/secrets.json` permissions (should be 0600)
3. Re-run setup wizard - it will attempt to fix storage issues
4. Check console for keychain availability messages

### Local LLM not working

**Cause**: Binary or model file not found.

**Solution**:
1. Verify files exist: `~/.legilimens/main` (binary) and `~/.legilimens/phi-4-q4.gguf` (model)
2. Re-run setup wizard to re-download
3. Check disk space (~10GB needed for model + binary)
4. Set `LEGILIMENS_DEBUG=true` for detailed diagnostics

### Generation timeout

**Cause**: Operation exceeded 60s hard limit.

**Solution**:
1. Enable minimal mode: `export LEGILIMENS_DISABLE_TUI=true`
2. Reduce local LLM tokens: `export LEGILIMENS_LOCAL_LLM_TOKENS=256`
3. Use external CLI tools instead of local LLM (gemini, codex, claude, qwen)

For more detailed troubleshooting, see:
- [Full README](../README.md#troubleshooting)
- [Troubleshooting Notes](./troubleshooting-notes-10-12-25.md)

## 9. Where to go next

- **Advanced Configuration**: See [README.md](../README.md) for environment variables and manual setup
- **Architecture Details**: Review [AGENTS.md](../AGENTS.md) for technical implementation notes
- **Product Brief**: Check [docs/sdp.md](./sdp.md) for UX doctrine and design decisions
- **Implementation Roadmap**: See [specs/001-docs-sdp-md/tasks.md](../specs/001-docs-sdp-md/tasks.md)
- **Development Guide**: See [docs/deployment-guide.md](./deployment-guide.md) for contributing

## API Keys Reference

- **Tavily** (required): Natural language dependency resolution - [Get key](https://tavily.com)
- **Firecrawl** (optional): Web documentation fetching - [Get key](https://firecrawl.dev)
- **Context7** (optional): NPM package documentation - [Get key](https://context7.com)
- **RefTools** (optional): Additional reference tools - [Get key](https://reftools.io)

---

**Need help?** Open an issue at your issue tracker or check [README.md](../README.md) for detailed documentation.
