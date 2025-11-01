#!/bin/bash
set -e

# Capture all output
exec 2>&1

# Set TMPDIR
export TMPDIR=/tmp

echo "=== Starting CLI with full error capture ==="
echo "Working directory: $(pwd)"
echo "Node version: $(node --version)"
echo ""

# Run tsx with error handling
npx tsx bin/legilimens.ts || {
  EXIT_CODE=$?
  echo ""
  echo "=== CLI EXITED WITH CODE: $EXIT_CODE ==="
  exit $EXIT_CODE
}
