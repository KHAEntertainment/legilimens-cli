#!/usr/bin/env bash
#
# Test script to verify Joomla CMS detection and fetching
# Tests the full pipeline: Tavily detection → normalized identifier → fetch → generation
#

set -e

echo "=========================================="
echo "Testing Joomla CMS Detection & Fetch"
echo "=========================================="
echo ""

# Enable debug mode
export LEGILIMENS_DEBUG=true

# Suppress llama logs (in case local LLM is used)
export LLAMA_LOG_LEVEL=40
export LLAMA_LOG_COLORS=0

# Use claude as preferred AI CLI tool (if available)
export LEGILIMENS_AI_CLI_TOOL=claude

echo "Environment:"
echo "  LEGILIMENS_DEBUG: $LEGILIMENS_DEBUG"
echo "  LLAMA_LOG_LEVEL: $LLAMA_LOG_LEVEL"
echo "  LEGILIMENS_AI_CLI_TOOL: $LEGILIMENS_AI_CLI_TOOL"
echo ""

echo "Running CLI with 'Joomla CMS' input..."
echo ""

# Run the CLI
# Note: This will be interactive, so user needs to:
# 1. Enter "Joomla CMS" at the dependency prompt
# 2. Choose minimal mode (y/n)
# 3. Observe the debug output

cd "$(dirname "$0")"
pnpm --filter @legilimens/cli start

echo ""
echo "=========================================="
echo "Test Complete"
echo "=========================================="
echo ""
echo "Expected Results:"
echo "  ✓ Detection finds 'joomla/joomla-cms' (AI-assisted)"
echo "  ✓ Fetch uses normalized identifier 'joomla/joomla-cms'"
echo "  ✓ Success via ref.tools → Firecrawl for GitHub"
echo "  ✓ No 'Unknown dependency type' errors"
echo "  ✓ Gateway doc generated successfully"
echo ""
