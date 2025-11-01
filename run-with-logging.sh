#!/bin/bash

# Run Legilimens with full session logging using macOS 'script' command
# This maintains TTY while recording everything

LOG_DIR="$HOME/.legilimens"
SESSION_LOG="$LOG_DIR/session.log"

# Create log directory
mkdir -p "$LOG_DIR"

# Clear old session log
rm -f "$SESSION_LOG"

echo "Starting Legilimens with session recording..."
echo "All output will be saved to: $SESSION_LOG"
echo ""
echo "Note: You'll see 'Script started' and 'Script done' messages from the script command."
echo "Just use the CLI normally between those messages."
echo ""
echo "Press Enter to start..."
read

# Use 'script' to record the session while maintaining TTY
# -q = quiet mode (suppress start/done messages to terminal)
# -F = flush output after each write
cd "$(dirname "$0")"
export LEGILIMENS_DEBUG=true

# Run script command (macOS version)
script -q -F "$SESSION_LOG" bash -c "pnpm --filter @legilimens/cli start"

echo ""
echo "=== Session Complete ==="
echo ""
echo "Full session log saved to:"
echo "  $SESSION_LOG"
echo ""
echo "To view the session:"
echo "  cat '$SESSION_LOG'"
echo ""
echo "To view just the debug log:"
echo "  cat '$LOG_DIR/debug.log'"
