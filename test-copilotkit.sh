#!/bin/bash

# Test script to verify CoPilotKit search improvements
# Tests the new Tavily-first approach with domain filtering

echo "🧪 Testing CoPilotKit search with enhanced pipeline..."
echo ""
echo "Expected behavior:"
echo "- Tavily finds github.com/CopilotKit/CopilotKit as #1 result"
echo "- Pipeline uses direct Tavily path (skips LLM)"
echo "- Detection completes in <2 seconds"
echo "- Source type: github, Confidence: high"
echo ""
echo "Press Ctrl+C at any time to cancel"
echo ""
sleep 2

# Enable debug mode to see what's happening
export LEGILIMENS_DEBUG=true

# Run the CLI (will prompt for input)
cd "$(dirname "$0")"
pnpm --filter @legilimens/cli start
