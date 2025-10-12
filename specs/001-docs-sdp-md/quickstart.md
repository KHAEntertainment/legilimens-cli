## Quickstart: Modern Agentic CLI UX

1. **Install dependencies**
   ```bash
   pnpm install
   ```
   - Workspace expects Node.js 20 LTS with `corepack` enabled.
   - Shared packages (`packages/core`, `packages/cli`, `packages/harness-service`) register via pnpm workspaces.

2. **Run the polished CLI experience**
   ```bash
   pnpm --filter @legilimens/cli start
   ```
   - Launches the modern welcome sequence rendered via `ink`.
   - Press `m` at runtime or pass `--minimal` to disable ASCII art and gradients.

3. **Verify minimal and low-contrast modes**
   ```bash
   pnpm --filter @legilimens/cli start -- --minimal
   pnpm --filter @legilimens/cli start -- --low-contrast
   ```
   - Confirms ANSI-less fallbacks and 80-column safe layouts.

4. **Run shared module directly (service parity)**
   ```bash
   pnpm --filter @legilimens/harness-service dev
   curl -X POST http://localhost:8787/legilimens/generate -d @fixtures/request.json
   ```
   - Validates SC-005 by comparing JSON output to CLI artifacts.

5. **Execute automated tests**
   ```bash
   pnpm test
   pnpm --filter @legilimens/cli test
   pnpm --filter @legilimens/core test
   ```
   - `vitest` suites cover module logic, CLI render states (via `ink-testing-library`), and parity checks.

6. **Lint and type-check before publishing**
   ```bash
   pnpm lint
   pnpm typecheck
   ```
   - Ensures shared TypeScript definitions remain stable for CLI and service consumers.

7. **Bundle ASCII assets**
   ```bash
   pnpm --filter @legilimens/cli build-assets
   ```
   - Prepares `figlet` fonts and gradient configurations for packaging; safe to skip when running in minimal mode only.
