#!/bin/bash

echo "=== Legilimens CLI Diagnostic ==="
echo ""

echo "1. Checking Node.js version..."
node --version
echo ""

echo "2. Checking if we're in a TTY..."
if [ -t 0 ]; then
  echo "   ✓ stdin is a TTY"
else
  echo "   ✗ stdin is NOT a TTY"
fi

if [ -t 1 ]; then
  echo "   ✓ stdout is a TTY"
else
  echo "   ✗ stdout is NOT a TTY"
fi
echo ""

echo "3. Checking wrapper exists..."
if [ -f "dist/bin/legilimens.js" ]; then
  echo "   ✓ Wrapper found at dist/bin/legilimens.js"
else
  echo "   ✗ Wrapper NOT found"
  exit 1
fi
echo ""

echo "4. Testing wrapper with --version..."
node dist/bin/legilimens.js --version
echo ""

echo "5. Testing wrapper with --help..."
node dist/bin/legilimens.js --help | head -5
echo ""

echo "6. Checking for crash logs..."
if [ -f ~/.legilimens/crash.log ]; then
  echo "   Found crash log. Last 20 lines:"
  tail -20 ~/.legilimens/crash.log
else
  echo "   No crash log found"
fi
echo ""

echo "7. Testing import resolution..."
node -e "import('@legilimens/core').then(() => console.log('   ✓ @legilimens/core imports successfully')).catch(e => console.error('   ✗ Import failed:', e.message))"
echo ""

echo "=== Diagnostic Complete ==="
echo ""
echo "If all checks pass, try running the CLI directly:"
echo "  node dist/bin/legilimens.js"
echo ""
echo "Or with debug mode:"
echo "  LEGILIMENS_DEBUG=true node dist/bin/legilimens.js"
