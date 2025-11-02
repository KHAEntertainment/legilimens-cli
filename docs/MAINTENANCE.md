# Maintenance Guide

This document outlines procedures for maintaining the repository, including a protected files policy to prevent accidental deletion of critical configuration or documentation.

## Protected Files Policy

The following files and directories are considered critical and should not be moved, renamed, or deleted without careful consideration and team consensus. Automated cleanup scripts must exclude these paths.

- `AGENTS.md`
- `CLAUDE.md`
- `README.md`
- `.env.example`
- `legillimens.code-workspace`
- `.vscode/**`
- `.specify/**`
- `docs/templates/**`
- `specs/**`

## SAFE Cleanup Checklist

Before running any cleanup or refactoring scripts, follow this checklist to prevent data loss:

1.  **[ ] Verify Protected Files:** Ensure your script or command respects the protected files list above.
2.  **[ ] Run Audits:** Execute the repository's audit scripts (`pnpm run audit:all`) to check for references, duplicates, and other dependencies.
3.  **[ ] Dry Run:** If available, perform a dry run to preview the changes before applying them.
4.  **[ ] Backup:** For major changes, ensure you have a local backup or that the repository is in a clean state with all changes committed.
5.  **[ ] Review Changes:** Carefully review the changes before committing or pushing.

## Post-MVP Review

The `packages/cli/docs/**` directory contains examples and reference material that should be reviewed after the MVP. Unreferenced or outdated examples should be moved to `docs/.archive/examples/` after running `pnpm run audit:assets` and `pnpm run audit:references`.
