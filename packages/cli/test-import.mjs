#!/usr/bin/env node

/**
 * Diagnostic script to test if all imports work correctly
 */

console.log('Testing imports from packages/cli directory...\n');

try {
  console.log('1. Testing @legilimens/core import...');
  const core = await import('@legilimens/core');
  console.log('   ✓ @legilimens/core imported successfully');
  console.log('   Exports:', Object.keys(core).join(', '));
} catch (error) {
  console.error('   ✗ Failed to import @legilimens/core');
  console.error('   Error:', error.message);
  process.exit(1);
}

try {
  console.log('\n2. Testing clackApp import...');
  const { runClackApp } = await import('./src/clackApp.js');
  console.log('   ✓ clackApp imported successfully');
  console.log('   runClackApp type:', typeof runClackApp);
} catch (error) {
  console.error('   ✗ Failed to import clackApp');
  console.error('   Error:', error.message);
  console.error('   Stack:', error.stack);
  process.exit(1);
}

try {
  console.log('\n3. Testing clackGenerationFlow import...');
  const { runClackGenerationFlow } = await import('./src/flows/clackGenerationFlow.js');
  console.log('   ✓ clackGenerationFlow imported successfully');
  console.log('   runClackGenerationFlow type:', typeof runClackGenerationFlow);
} catch (error) {
  console.error('   ✗ Failed to import clackGenerationFlow');
  console.error('   Error:', error.message);
  console.error('   Stack:', error.stack);
  process.exit(1);
}

console.log('\n✅ All imports successful!');
console.log('\nIf the CLI is still crashing, the issue is likely in the runtime execution,');
console.log('not in the module resolution. Check ~/.legilimens/crash.log for details.');
