#!/bin/bash

# Full debug session logger for Legilimens CLI
# Captures ALL terminal output (stdout, stderr, and debug info)

LOG_DIR="$HOME/.legilimens"
SESSION_LOG="$LOG_DIR/session.log"
DEBUG_LOG="$LOG_DIR/debug.log"

# Create log directory
mkdir -p "$LOG_DIR"

# Clear old logs
rm -f "$SESSION_LOG" "$DEBUG_LOG"

echo "=== Legilimens Debug Session ===" | tee "$SESSION_LOG"
echo "Started: $(date)" | tee -a "$SESSION_LOG"
echo "Log location: $SESSION_LOG" | tee -a "$SESSION_LOG"
echo "" | tee -a "$SESSION_LOG"
echo "Press Enter to start the CLI..." | tee -a "$SESSION_LOG"
read

# Run the CLI with debug mode enabled, capturing ALL output
cd "$(dirname "$0")"
LEGILIMENS_DEBUG=true pnpm --filter @legilimens/cli start 2>&1 | tee -a "$SESSION_LOG"

# Show log locations when done
echo "" | tee -a "$SESSION_LOG"
echo "=== Session Complete ===" | tee -a "$SESSION_LOG"
echo "Ended: $(date)" | tee -a "$SESSION_LOG"
echo "" | tee -a "$SESSION_LOG"
echo "Logs saved to:" | tee -a "$SESSION_LOG"
echo "  Full session: $SESSION_LOG" | tee -a "$SESSION_LOG"
echo "  Debug log: $DEBUG_LOG" | tee -a "$SESSION_LOG"
echo "" | tee -a "$SESSION_LOG"
echo "To view full session:" | tee -a "$SESSION_LOG"
echo "  cat $SESSION_LOG" | tee -a "$SESSION_LOG"
echo "" | tee -a "$SESSION_LOG"
echo "To view debug log:" | tee -a "$SESSION_LOG"
echo "  cat $DEBUG_LOG" | tee -a "$SESSION_LOG"
