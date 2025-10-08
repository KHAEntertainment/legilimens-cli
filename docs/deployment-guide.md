# Legilimens Deployment Guide

This guide captures the end-to-end steps for packaging and distributing the Legilimens CLI once
feature work and testing are complete. Follow the sections in order when you are ready to ship a
new version.

---

## 1. Pre-release Checklist

- Ensure `main` (or your release branch) includes the latest feature work.
- Verify automated checks locally:
  - `pnpm lint`
  - `pnpm test`
  - `pnpm typecheck`
  - `pnpm --filter @legilimens/cli build-assets`
- Update `CHANGELOG.md` with a concise entry for the release.
- Decide on the target version bump (semver) and confirm constitution compliance.

---

## 2. Prepare the CLI Package for Publishing

1. Open `packages/cli/package.json` and make these adjustments:
   - Set `"private": false`.
   - Update `"version"` to the semver tag you want to publish (e.g., `"1.1.0"`).
   - Add a `files` array so installs include the built artifacts and docs:
     ```json
     "files": [
       "dist",
       "bin",
       "docs/ascii-art.md",
       "package.json",
       "README.md"
     ]
     ```
   - Add a `prepublishOnly` script to guarantee assets are ready:
     ```json
     "prepublishOnly": "pnpm run build && pnpm run build-assets"
     ```
2. Build the workspace:
   ```bash
   pnpm install
   pnpm --filter @legilimens/cli build
   pnpm --filter @legilimens/cli build-assets
   ```
3. Confirm `packages/cli/dist/` contains compiled files and `packages/cli/dist/assets/` has the
   ASCII banner copies.

---

## 3. Publish to npm (Preferred)

1. Authenticate once per environment:
   ```bash
   pnpm login
   ```
2. From the repository root, publish the CLI package:
   ```bash
   pnpm publish --filter @legilimens/cli --access public
   ```
3. Tag the release in git:
   ```bash
   git tag -a v1.1.0 -m "Release Legilimens CLI v1.1.0"
   git push origin v1.1.0
   ```
4. Update documentation (README, CHANGELOG) with the new install command:
   ```bash
   pnpm dlx legilimens-cli --help
   ```

> Tip: Set up a GitHub Actions workflow to run the prepublish build, publish to npm, and create a
> release automatically once you push a version tag.

---

## 4. Optional: GitHub Install Script

If you want an alternative to npm, package a simple installer script:

1. Create a shell script (e.g., `scripts/install.sh`) that:
   - Clones the repository at the desired tag.
   - Runs `pnpm install`.
   - Builds assets.
   - Symlinks `packages/cli/dist/bin/legilimens.js` into `/usr/local/bin/legilimens`.
2. Add the script to the release tarball or reference it in documentation:
   ```bash
   curl -sSL https://raw.githubusercontent.com/<org>/legilimens-cli/v1.1.0/scripts/install.sh | bash
   ```
3. Ensure the script respects existing NODE_PATH/PNPM requirements and verifies Node.js 20 LTS is
   available.

---

## 5. Post-release Verification

- Install the CLI fresh on a clean machine or container via npm:
  ```bash
  pnpm dlx legilimens-cli --help
  ```
- Run the welcome flow in both default and `--minimal` modes to confirm the external ASCII art
  loads correctly.
- Execute the parity integration tests (`pnpm test:integration`) to ensure the CLI and harness
  stay aligned after publishing.
- Share the release notes in your primary communication channels (workspace README, DeepWiki entry,
  internal chat, etc.).

---

## 6. Maintenance Reminders

- Always bump the version in `package.json` before publishing new builds.
- Keep `docs/ascii-art.md` under version control; the build process depends on it.
- Re-run the constitution gates if governance principles change prior to deployment.
- Archive generated tarballs or npm publish logs for auditing.

With these steps documented, a future release is primarily a matter of bumping the version, running
the release commands, and publishing with confidence. Happy shipping!
