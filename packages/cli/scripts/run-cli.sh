#!/bin/bash
# Wrapper script to ensure tsx uses correct temp directory
# Force TMPDIR to /tmp to avoid permission issues
export TMPDIR="/tmp"
# Change to script directory and run tsx
cd "$(dirname "$0")/.."
exec npx tsx bin/legilimens.ts "$@"
