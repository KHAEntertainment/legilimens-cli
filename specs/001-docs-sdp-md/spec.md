# Feature Specification: Modern Agentic CLI UX for Legilimens

**Feature Branch**: `001-docs-sdp-md`  
**Created**: 2025-10-07  
**Status**: Draft  
**Input**: User description: "docs/sdp.md In addition to the SDP also adhere these notes: The CLI should have a modern, clean, simple UI, similar to the ones used by other agentic CLI tools. Codex, CoPilot CLI, Claude-Code, etc. The UX needs to be in-line with those tools as well. We can even implement a ASCII art logo on opening which can be supplied as an external reference."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Launch immersion (Priority: P1)

A developer starts the Legilimens CLI and is greeted with a polished welcome sequence that includes optional ASCII art branding, clear mode selection cues, and immediate reassurance that the tool aligns with modern agentic CLI norms while reinforcing the DeepWiki-first doctrine.

**Why this priority**: First impressions set confidence for the entire workflow and were explicitly requested to mirror leading agentic CLI experiences.

**Independent Test**: Run the CLI locally with default settings and confirm the opening sequence delivers branding, navigation hints, and exits gracefully when the user opts out.

**Acceptance Scenarios**:

1. **Given** a developer launches Legilimens without arguments, **When** the CLI boots, **Then** the user sees the branded welcome, summary of core actions, a reminder that "DeepWiki for coding, static files for planning," and a prompt to choose the next step.
2. **Given** ASCII art assets are unavailable, **When** the CLI launches, **Then** the tool renders a visually balanced fallback header that still signals the modern UI approach.

---

### User Story 2 - Guided generation flow (Priority: P1)

A developer generates gateway documentation and receives clean, structured prompts with progress indicators and summaries that resemble other agentic CLIs, ensuring the workflow feels modern yet unobtrusive while consistently guiding them toward DeepWiki for live answers.

**Why this priority**: The core value of Legilimens is rapid, clear documentation generation; the experience must remain focused yet polished.

**Independent Test**: Execute a full gateway generation run and verify that each step surfaces concise instructions, progress signals, and completion feedback without overwhelming the terminal.

**Acceptance Scenarios**:

1. **Given** a developer initiates documentation generation, **When** the CLI prompts for required inputs, **Then** the prompts follow the modern style guide and group related information logically.
2. **Given** the fetch sequence progresses, **When** each milestone completes, **Then** the CLI emits succinct progress updates, reminds users how to access DeepWiki for further questions, and delivers a friendly completion summary in the modern UI tone.

---

### User Story 3 - Accessible configuration (Priority: P2)

A developer working in automated or low-contrast environments can configure the UI to disable ASCII art, reduce embellishments, or switch to minimal mode while preserving modern clarity.

**Why this priority**: Accessibility and non-interactive use cases must be supported without sacrificing the new UX benefits for interactive sessions.

**Independent Test**: Launch the CLI with configuration flags or environment overrides that request minimal output and verify the experience still feels deliberate and consistent.

**Acceptance Scenarios**:

1. **Given** the user runs Legilimens in CI, **When** minimal mode is enabled, **Then** the CLI skips ASCII art and non-essential styling but retains structured progress messages.
2. **Given** the developer prefers reduced color output, **When** they opt into low-contrast mode, **Then** the CLI presents legible text and maintains workflow guidance.

---

### User Story 4 - Service reuse foundation (Priority: P2)

An internal platform engineer needs to plug Legilimens capabilities into a forthcoming web application without rewriting the core logic, so the CLI must expose its functionality through a reusable TypeScript/Node module.

**Why this priority**: Sharing the same logic across CLI and web experiences avoids divergence and accelerates future integrations the business already anticipates.

**Independent Test**: Execute an automated script that imports the shared module directly and produces identical Legilimens outputs as the CLI for a sample scenario.

**Acceptance Scenarios**:

1. **Given** the shared module is imported into a thin HTTP harness, **When** the harness invokes gateway generation, **Then** the responses match the CLI output after normalizing whitespace and timestamps.
2. **Given** engineering ships an update to the shared module, **When** the CLI consumes the new version, **Then** no duplicated logic requires manual synchronization to keep behaviors aligned.

---

### Edge Cases

- What happens when the terminal width is extremely narrow? The layout must gracefully wrap without breaking readability.
- How does system handle environments that do not support ANSI styling? The CLI must downgrade styling automatically while maintaining structure.
- What if an external ASCII art reference fails to load? The launch sequence must fall back to a local default without blocking usage.
- How does the CLI behave when advanced options are provided via CLI arguments instead of interactive prompts? The experience must remain coherent and modern even in non-interactive flows.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST present a launch sequence that mirrors modern agentic CLIs, including branding, quick-start options, and guidance that can be skipped instantly.
- **FR-002**: System MUST support integration of an ASCII art logo supplied externally, validating its availability before rendering and providing a fallback header when unavailable.
- **FR-003**: System MUST deliver structured, concise prompts and progress updates during documentation generation, aligning with the canonical gateway template and UI tone.
- **FR-004**: System MUST consistently surface canonical DeepWiki guidance (or highlights of the instructions block) during onboarding, help flows, and completion summaries.
- **FR-005**: System MUST provide configuration options (flags or environment variables) enabling minimal, low-contrast, or non-branded modes without losing clarity.
- **FR-006**: System MUST ensure all outputs remain legible across common terminal widths, automatically adapting layout when horizontal space is limited.
- **FR-007**: System MUST detect when ANSI styling is unsupported and automatically shift to a plain-text presentation while retaining the modern UX flow.
- **FR-008**: System MUST document the modern UI guidelines in `docs/sdp.md`, ensuring the specification stays synchronized with the canonical constitution template instructions.
- **FR-009**: System MUST implement core Legilimens logic as a reusable TypeScript module targeting Node.js so the CLI and forthcoming web experiences consume the same capabilities without duplication.

### Key Entities *(include if feature involves data)*

- **CLI Session**: Represents a runtime interaction with the Legilimens CLI, including launch sequence, user input prompts, and progress feedback states.
- **Visual Theme Profile**: Defines styling preferences such as ASCII art usage, color depth, minimal mode toggles, and low-contrast settings that can be applied per session.
- **ASCII Asset Reference**: Points to external or local ASCII art resources, including metadata for validation and fallback handling.
- **Core Gateway Module**: The shared TypeScript/Node package that encapsulates business rules for documentation generation and is consumed by both the CLI and future service adapters.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of first-time CLI sessions reach the completion summary without emitting a fatal error or invoking manual help, as captured through internal telemetry logs.
- **SC-002**: At least 95% of interactive runs display all required prompts and progress updates without layout breakage at terminal widths as low as 80 characters.
- **SC-003**: Minimal or low-contrast modes maintain a task completion success rate within 2% of the default mode across usability tests.
- **SC-004**: Orientation time for new users drops below 2 minutes, measured by the time between first launch and first successful gateway generation.
- **SC-005**: A reference harness outside the CLI (e.g., internal web stub) can invoke the shared module to generate documentation with parity validated across three representative scenarios.

## Assumptions

- Developers typically run the CLI in terminals that support ANSI colors; however, the system must auto-degrade gracefully when unsupported.
- ASCII art assets can be provided as static files within the repository or referenced via trusted local paths; no network fetch is required.
- UX expectations should align with the canonical template and DeepWiki doctrine described in `docs/consitution-original.md`, ensuring gateway outputs remain concise while directing users to DeepWiki for live answers.
- Core Legilimens capabilities will be implemented in TypeScript targeting the Node.js runtime so they can power both the CLI and upcoming web-delivered workflows.
