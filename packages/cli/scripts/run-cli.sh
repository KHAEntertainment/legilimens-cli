#!/bin/bash
set -e  # Exit on error

# Force TMPDIR to /tmp to avoid permission issues
export TMPDIR="/tmp"

# Get absolute path to script and CLI package directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Always run from CLI directory for proper workspace resolution
cd "$CLI_DIR"

# Debug output if requested
if [ -n "$LEGILIMENS_DEBUG" ]; then
  echo "[DEBUG] Running from: $CLI_DIR"
  echo "[DEBUG] dist/bin/legilimens.js exists: $([ -f "dist/bin/legilimens.js" ] && echo "yes" || echo "no")"
  echo "[DEBUG] bin/legilimens.ts exists: $([ -f "bin/legilimens.ts" ] && echo "yes" || echo "no")"
  echo "[DEBUG] src/clackApp.ts exists: $([ -f "src/clackApp.ts" ] && echo "yes" || echo "no")"
fi

# LEGILIMENS_FORCE_TSX bypasses dist and forces TypeScript execution
if [ -n "$LEGILIMENS_FORCE_TSX" ]; then
  if [ -n "$LEGILIMENS_DEBUG" ]; then
    echo "[DEBUG] LEGILIMENS_FORCE_TSX set, forcing tsx execution"
  fi
  exec npx tsx src/clackApp.ts "$@"
fi

# Check if compiled version exists, use it if available
if [ -f "dist/bin/legilimens.js" ]; then
  if [ -n "$LEGILIMENS_DEBUG" ]; then
    echo "[DEBUG] Using compiled: dist/bin/legilimens.js"
  fi
  exec node dist/bin/legilimens.js "$@"
elif [ -f "bin/legilimens.ts" ]; then
  # Fallback to tsx with bin entrypoint if it exists
  if [ -n "$LEGILIMENS_DEBUG" ]; then
    echo "[DEBUG] Using tsx with bin: bin/legilimens.ts"
  fi
  exec npx tsx bin/legilimens.ts "$@"
else
  # Final fallback to direct clackApp execution
  if [ -n "$LEGILIMENS_DEBUG" ]; then
    echo "[DEBUG] Using tsx directly: src/clackApp.ts"
  fi
  exec npx tsx src/clackApp.ts "$@"
fi