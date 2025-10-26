#!/bin/bash
# Wrapper script to ensure tsx uses correct temp directory
export TMPDIR="${TMPDIR:-/tmp}"
# Change to script directory and run tsx
cd "$(dirname "$0")/.."
exec npx tsx bin/legilimens.ts "$@"
