#!/bin/bash
# Force TMPDIR to /tmp to avoid permission issues
export TMPDIR="/tmp"

# Get absolute path to script and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

cd "$PROJECT_ROOT"

# Check if compiled version exists, use it if available
if [ -f "packages/cli/dist/bin/legilimens.js" ]; then
  exec node packages/cli/dist/bin/legilimens.js "$@"
else
  # Fallback to tsx if no compiled version
  cd packages/cli
  exec npx tsx bin/legilimens.ts "$@"
fi