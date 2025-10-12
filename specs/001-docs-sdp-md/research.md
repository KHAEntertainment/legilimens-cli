## Research Findings: Modern Agentic CLI UX for Legilimens

### CLI Runtime Stack
- **Decision**: Use `commander` for argument parsing combined with `ink` for interactive rendering and `ink-use-stdout` for controlled output piping.
- **Rationale**: `commander` provides mature, declarative CLI command/option handling without dictating presentation, while `ink` delivers React-style component composition that mirrors the polished UX of tools like Claude-Code. The pairing supports rich interactive sequences, declarative fallback rendering, and integrates with testing utilities such as `ink-testing-library`.
- **Alternatives considered**:
  - `oclif`: Strong scaffolding for multi-command CLIs but heavier, less flexible for bespoke animated layouts, and overkill for a single-command experience.
  - `clack`: Offers modern prompts but lacks the layout control needed for branded launch sequences and progressive render states.
  - `ink` alone with manual argument parsing: Possible but would duplicate parsing logic that `commander` already solves.

### Styling, Colors, and ASCII Art
- **Decision**: Adopt `chalk` for color management, `gradient-string` for optional accent gradients, and `figlet` for rendering ASCII art logos with a local font bundle.
- **Rationale**: `chalk` remains the de-facto standard for ANSI-safe coloring with built-in detection to disable styling when unsupported. `gradient-string` layers on modern “agentic” gradients while allowing easy bypass in minimal mode. `figlet` gives deterministic ASCII art rendering from local font definitions, removing any network dependency.
- **Alternatives considered**:
  - `colorette` / `kleur`: Smaller but lack the ecosystem integrations and gradient helpers requested.
  - `cfonts`: Attractive output but less flexible for swapping to plain headers when minimal mode is active.
  - Custom ASCII rendering: Higher effort with no quality gain versus proven libraries.

### Prompting and Progress Feedback
- **Decision**: Leverage `ink` ecosystem components (`ink-text-input`, `ink-select-input`, custom stepper) supplemented by `ora` for non-interactive spinners when the CLI runs in scripted environments.
- **Rationale**: Staying inside the `ink` ecosystem keeps rendering consistent and testable, while `ora` offers a lightweight fallback spinner that honors TTY detection. This combination simplifies implementing progress indicators that degrade gracefully in minimal mode.
- **Alternatives considered**:
  - `enquirer`: Rich prompts but does not integrate with `ink` layouts cleanly; mixing the two complicates state management.
  - `listr2`: Geared towards task lists but opinionated about formatting, limiting brand customization.

### Testing & Quality Tooling
- **Decision**: Standardize on `vitest` for unit and integration testing, paired with `tsx` for TypeScript-friendly script execution and `ink-testing-library` for component assertions.
- **Rationale**: `vitest` offers fast TypeScript-native execution, first-class ESM support, and compatible mocking utilities. It also aligns with Node 20 features and integrates smoothly with `ink` testing helpers. `tsx` keeps CLI scripts and harness utilities simple without a heavy bundler.
- **Alternatives considered**:
  - `jest`: Mature but slower cold-starts and requires additional configuration for ESM + `ink`.
  - `uvu`: Minimalist but lacks snapshot tooling and ecosystem support for `ink`.

### Service Harness for Reuse Validation
- **Decision**: Provide a thin `fastify` harness in `packages/harness-service` that exposes the shared module via an HTTP endpoint used in parity tests.
- **Rationale**: `fastify` is lightweight, high-performance, and straightforward to spin up in tests. It also mirrors patterns we can extend later if the web experience graduates beyond a harness.
- **Alternatives considered**:
  - `express`: Familiar but requires additional middleware for modern JSON handling and has lower out-of-the-box performance.
  - Pure Node `http` server: Minimal dependencies but increases boilerplate and complicates test instrumentation.
