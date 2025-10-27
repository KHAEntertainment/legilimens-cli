#!/bin/bash

echo "=== Running Legilimens CLI in Debug Mode ==="
echo ""
echo "This will show detailed logging to help diagnose issues."
echo "Press Ctrl+C to exit at any time."
echo ""
echo "Starting in 2 seconds..."
sleep 2

cd "$(dirname "$0")"
export LEGILIMENS_DEBUG=true
exec node dist/bin/legilimens.js "$@"
