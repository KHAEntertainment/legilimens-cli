# Terminology Replacement Strategy

## Purpose

This document scopes the terminology cleanup currently tracked by `KHA-146` and the umbrella issue `KHA-145`.

The goal is to reduce or remove confusing product-facing use of the term `gateway` without triggering a risky repo-wide rename that breaks exports, tests, generated output, or downstream workflows.

## Current State

The term `gateway` appears in four different layers of the project:

1. Product-facing copy
   - CLI menu labels
   - prompt text
   - help text
   - walkthrough docs
   - README messaging

2. Generated output and templates
   - user-visible titles such as `Legilimens Gateway: ...`
   - generated file copy describing `gateway docs`
   - template guidance text

3. Internal code and exports
   - `generateGatewayDoc`
   - `GatewayGenerationRequest`
   - `GatewayGenerationResult`
   - `packages/core/src/gateway.ts`
   - parity helpers and harness response types

4. Historical and planning artifacts
   - SDP and older planning docs
   - archived migration summaries
   - screenshots and walkthrough docs

These layers should not be treated equally. Product-facing copy is safe to update quickly. Internal API names and paths are much riskier.

## Problem Framing

`Gateway` made sense as an internal shorthand for a lightweight documentation artifact that points toward deeper sources. But in product-facing copy, it is not self-explanatory. New users are more likely to understand terms like:

- documentation
- dependency documentation
- quick reference
- documentation index

The codebase already contains evidence of this tension in `docs/PRE-PHASE-4-CLI-REFACTORING.md`, where earlier work explicitly called out `Gateway` as confusing.

## Recommended Terminology Target

Use a layered terminology strategy instead of a universal rename:

- Product-facing default:
  - `documentation`
  - `dependency documentation`
  - `quick reference`

- Generated artifact framing:
  - `quick reference`
  - `documentation index`

- Internal code, for now:
  - keep existing `Gateway*` identifiers until a later dedicated refactor proves the rename is worth the blast radius

This gives users clearer language without forcing a breaking internal rename immediately.

## What Should Change Now

These are good candidates for the first implementation pass:

1. CLI copy
   - `Generate gateway documentation` -> `Generate dependency documentation`
   - `Batch Gateway Generation` -> `Batch Documentation Generation`
   - `Gateway files written` -> `Documentation files written`
   - success messages and notes that mention `gateway docs`

2. README and top-level docs
   - replace broad product descriptions that depend on the word `gateway`
   - introduce one short explanation if the concept still matters:
     - example: `Legilimens creates lightweight quick-reference docs plus static backups.`

3. Template and generated copy
   - update visible headings and explanatory text where safe
   - prefer `quick reference` or `dependency documentation` in the rendered content

## What Should Not Change Yet

These should stay unchanged in the first wave:

1. Core module and exported symbol names
   - `generateGatewayDoc`
   - `GatewayGenerationRequest`
   - `GatewayGenerationResult`
   - `packages/core/src/gateway.ts`

2. Harness and parity response structure
   - response shape fields like `gateway`
   - parity helper types and normalizers

3. File and directory output conventions
   - current output folder structure
   - generated file naming
   - existing tests that depend on those paths

4. Historical planning docs
   - keep them historically accurate unless specifically refreshing them

## Why Internal Renames Are Deferred

Internal renames would touch:

- public exports from `@legilimens/core`
- harness response contracts
- parity normalization types
- tests across `packages/core/tests` and `tests/integration`
- logging and debugging output
- GraphRAG planning documents that reference `gateway.ts`

That is refactor work, not copy cleanup. It should only happen after the product-facing rename is stable and only if the new terminology proves durable.

## Execution Phases

### Phase 1: Product-Facing CLI Copy

Track under `KHA-147`.

Scope:
- menu labels
- prompts
- help text
- visible success/failure/status messages

Success criteria:
- user sees clearer wording in the CLI
- no internal API rename required

### Phase 2: Docs and Templates

Track under `KHA-148`.

Scope:
- `README.md`
- `CLAUDE.md`
- `AGENTS.md`
- `docs/templates/legilimens-template.md`
- other high-visibility docs

Success criteria:
- docs consistently describe the product without leaning on `gateway` as unexplained jargon

### Phase 3: Evaluate Internal Refactor Need

Do not start automatically.

Only create a new issue if, after Phases 1 and 2:
- internal naming is causing real confusion, and
- the team is willing to absorb the test/export/path churn

If that happens, create a separate refactor issue specifically for internal symbols and contracts.

## Decision Rules For Future Agents

- If a change only affects user-facing copy, it is in scope for the current terminology cleanup.
- If a change touches exported types, file names, response schemas, or output paths, stop and treat it as a separate refactor.
- Do not run a global find/replace for `gateway`.
- Prefer small, reviewable slices over broad renames.

## Recommended Follow-Up Issues

- `KHA-147` Update User-Facing CLI Copy Away From `Gateway`
- `KHA-148` Update Docs and Templates Terminology Away From `Gateway`

If needed later:
- new issue for internal symbol/contract refactor
- new issue for generated artifact title/path migration

## Handoff Summary

The safest path is:

1. rename product-facing copy first
2. update docs/templates second
3. defer internal API/path renames unless they are still clearly worth the churn

That approach improves clarity for users immediately while protecting current integrations and in-flight feature work.
