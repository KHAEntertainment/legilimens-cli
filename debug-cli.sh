#!/bin/bash
# Debug script to capture CLI crash details

echo "=== Legilimens CLI Debug ==="
echo "Date: $(date)"
echo "Node version: $(node --version)"
echo "TTY check:"
node -e "console.log('stdin.isTTY:', process.stdin.isTTY); console.log('stdout.isTTY:', process.stdout.isTTY);"
echo ""
echo "=== Running CLI with debug ==="
cd "/Users/bbrenner/Documents/Scripting Projects/doc-gateway-cli"
LEGILIMENS_DEBUG=true pnpm --filter @legilimens/cli start 2>&1
echo ""
echo "=== Exit code: $? ==="
