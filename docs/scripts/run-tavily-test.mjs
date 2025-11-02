#!/usr/bin/env node

/**
 * Wrapper script to load Tavily API key and run prompt tests
 */

import { getApiKey } from '../../cli/dist/src/config/secrets.js';

async function loadKeyAndRun() {
  try {
    const tavilyKey = await getApiKey('tavily');
    
    if (!tavilyKey) {
      console.error('❌ No Tavily API key found in secure storage');
      console.error('💡 Run the CLI setup wizard first: pnpm --filter @legilimens/cli start');
      process.exit(1);
    }
    
    // Set environment variable
    process.env.TAVILY_API_KEY = tavilyKey;
    console.log('✅ Loaded Tavily API key from secure storage\n');
    
    // Import and run the test script
    await import('./test-tavily-prompts.mjs');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

loadKeyAndRun();
