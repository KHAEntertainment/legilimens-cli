# Quickstart: Legilimens CLI

The Legilimens CLI embraces a modern agentic UX with a branded welcome sequence and DeepWiki
guidance. Follow these steps to get started locally.

## 1. Install dependencies

```bash
pnpm install
```

The workspace targets Node.js 20 LTS with Corepack-enabled package management. The CLI, core module,
and harness service register automatically through pnpm workspaces.

## 2. Launch the welcome experience

```bash
pnpm --filter @legilimens/cli start
```

On launch you will see the ASCII banner (or a fallback header if assets are unavailable), the
Legilimens tagline, and the DeepWiki reminder: **DeepWiki for coding, static files for planning.**

Controls:

- Press `Enter` to proceed into the guided generation flow.
- Press `S` to skip the welcome while keeping prompts intact.
- Press `Q` or `Esc` to exit instantly.

## 3. Choose an accessibility profile

```bash
pnpm --filter @legilimens/cli start -- --minimal
pnpm --filter @legilimens/cli start -- --low-contrast
LEGILIMENS_MODE=low-contrast pnpm --filter @legilimens/cli start
```

- `--minimal` (or `LEGILIMENS_MODE=minimal`) disables gradients and ASCII art while keeping the flow
  identical for CI pipelines.
- `--low-contrast` softens the palette and keeps a compact ASCII banner for readability on
  lower-contrast terminals.
- The CLI auto-detects ANSI color support and falls back to plain text when colors are unavailable.

## 4. Credential Storage

Legilimens stores API keys securely using your system's keychain when available:

### Storage Methods (in order of preference)

1. **System Keychain** (recommended)
   - **macOS**: Keychain Access
   - **Windows**: Credential Manager
   - **Linux**: Secret Service (GNOME Keyring, KDE Wallet)

2. **Environment Variables** (CI/CD)
   ```bash
   export FIRECRAWL_API_KEY=your-key
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
3. Config file (legacy, being phased out)

### Managing Stored Credentials

```bash
# View storage method
pnpm --filter @legilimens/cli start -- --setup

# Rotate credentials
# 1. Update keys in setup wizard
# 2. Or set new environment variables
# 3. Or delete ~/.legilimens/ and reconfigure

# Delete all stored credentials
rm -rf ~/.legilimens
```

## 5. Where to go next

- Review `docs/sdp.md` for the product brief and UX doctrine.
- Check `specs/001-docs-sdp-md/tasks.md` for the current implementation roadmap.
- Upcoming user stories add the guided generation flow, accessibility profiles, and reusable core
  module parity with the harness service.
