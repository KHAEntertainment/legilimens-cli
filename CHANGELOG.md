# Changelog

## 2025-10-08 - Phase 7 polish

- `pnpm lint` PASS - typed lint passes with workspace tsconfig projects; tests directories intentionally ignored until dedicated configs land.
- `pnpm test` PASS - core gateway suite green; CLI and harness runners use `--passWithNoTests` pending future coverage.
- `pnpm typecheck` PASS - all packages compile cleanly with NodeNext resolution.
- `pnpm --filter @legilimens/cli build-assets` PASS - external banner from `docs/ascii-art.md` validated within 80 columns and minimal-mode fallback emitted.
- ANSI fallback verified via generated `packages/cli/dist/assets/banner-minimal.txt`; 80-column guardrail enforced during asset build.
- Full-access validation completed 2025-10-08.
