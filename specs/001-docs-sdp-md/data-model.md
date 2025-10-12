## Data Model: Modern Agentic CLI UX for Legilimens

### CLI Session
- **Description**: Represents a single invocation of the Legilimens CLI, including launch presentation, prompt flow, and completion summary.
- **Fields**:
  - `sessionId` (string, UUID) — unique identifier for logging and parity testing.
  - `startTime` (ISO datetime) — timestamp when the CLI session begins.
  - `mode` (enum: `default`, `minimal`, `lowContrast`) — determines presentation profile.
  - `ttyCapabilities` (object) — detected terminal flags (`supportsAnsi`, `width`, `height`).
  - `configOverrides` (object) — user-supplied flags/environment overrides applied to the run.
  - `progressStates` (array of objects) — ordered timeline of major milestones with `step`, `status`, `timestamp`.
  - `outputArtifacts` (object) — references to generated gateway + static-backup artifacts.
- **Relationships**:
  - Consumes `VisualThemeProfile` to render UI.
  - Delegates work to `CoreGatewayModule`.
- **Validation Rules**:
  - `mode` MUST match available profiles.
  - `ttyCapabilities.width` falls back to 80 if detection fails.
  - `outputArtifacts` MUST include canonical template verification status before completion.
- **State Transitions**:
  1. `initialized` → `presentingWelcome` once launch UI begins.
  2. `presentingWelcome` → `collectingInput` when prompts become interactive.
  3. `collectingInput` → `generatingDocs` after required data captured.
  4. `generatingDocs` → `completed` on success or `failed` on error.

### Visual Theme Profile
- **Description**: Declarative theme configuration controlling branding, color usage, and ASCII art availability for a session.
- **Fields**:
  - `name` (string) — profile identifier (`modern`, `minimal`, `lowContrast`).
  - `enableAsciiArt` (boolean) — toggles logo rendering.
  - `colorPalette` (array of strings) — hex/ANSI safe colors for gradients.
  - `useGradients` (boolean) — enables `gradient-string` effects.
  - `maxLineWidth` (number) — truncation width for layout.
  - `spinnerStyle` (string) — style passed to `ora`.
- **Relationships**:
  - Associated with `CLI Session` (one profile per session).
  - References cached `AsciiAssetReference` when `enableAsciiArt` is true.
- **Validation Rules**:
  - `maxLineWidth` MUST be ≥ default terminal minimum (80).
  - `colorPalette` MUST be empty when gradients disabled.
  - `enableAsciiArt` auto-forced to false when terminal lacks ANSI support.

### ASCII Asset Reference
- **Description**: Metadata for ASCII art resources used during the launch sequence.
- **Fields**:
  - `assetId` (string) — unique identifier for the asset.
  - `localPath` (string) — resolved path inside repository assets directory.
  - `font` (string) — figlet font name bundled locally.
  - `checksum` (string) — integrity hash for verification.
  - `approved` (boolean) — indicates governance approval for brand usage.
- **Relationships**:
  - Linked from `VisualThemeProfile` records that render branded ASCII art.
- **Validation Rules**:
  - `localPath` MUST exist before rendering.
  - `approved` MUST be true; otherwise CLI falls back to plain header.

### Core Gateway Module
- **Description**: Shared TypeScript library that encapsulates business logic for gateway generation used by both CLI and service harness.
- **Fields**:
  - `version` (semver string) — release identifier for module.
  - `interfaces` (object) — exported functions (`generateGatewayDoc`, `validateTemplate`, `formatProgress`).
  - `config` (object) — default runtime configuration (timeout thresholds, directory paths).
  - `telemetryHooks` (object) — optional callbacks for logging and metrics.
- **Relationships**:
  - Consumed by `CLI Session` and `Service Harness` components.
  - Reads from filesystem directories mandated by constitution.
- **Validation Rules**:
  - API surface MUST be backwards compatible across CLI and service harness releases.
  - `generateGatewayDoc` MUST return gateway + static-backup outputs referencing canonical template.
  - Module MUST expose pure functions so CLI/service wrappers can run deterministic tests.

### Service Harness Invocation
- **Description**: Represents requests flowing through the parity verification HTTP harness.
- **Fields**:
  - `requestId` (string) — unique identifier for incoming request.
  - `payload` (object) — mirrors CLI input schema.
  - `response` (object) — generated documentation artifacts + metadata.
  - `status` (enum: `pending`, `processing`, `completed`, `error`).
  - `completedAt` (ISO datetime) — timestamp when response finalizes.
- **Relationships**:
  - Invokes `CoreGatewayModule`.
  - Participates in integration tests ensuring parity with `CLI Session`.
- **Validation Rules**:
  - Requests MUST fail fast when payload violates canonical template requirements.
  - Responses MUST include DeepWiki guidance verification flag.
