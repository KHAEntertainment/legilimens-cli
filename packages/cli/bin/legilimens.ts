#!/usr/bin/env node

// CRITICAL: Force color support BEFORE any imports
// This ensures picocolors (used by @clack/prompts) detects color support
// Must be set before any module that checks color support is loaded
if (!process.env.NO_COLOR && !process.env.FORCE_COLOR) {
  process.env.FORCE_COLOR = '3'; // Enable TrueColor support
}

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command-line arguments
const args = process.argv.slice(2);

// Handle --help flag
if (args.includes('--help') || args.includes('-h')) {
  const { renderHelp } = await import('../src/commands/help.js');
  console.log(renderHelp());
  process.exit(0);
}

// Handle --version flag
if (args.includes('--version') || args.includes('-v')) {
  try {
    const packageJsonPath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as { version: string };
    console.log(`legilimens v${packageJson.version}`);
  } catch (error) {
    console.error('Error reading version:', error);
  }
  process.exit(0);
}

// Handle --setup flag
if (args.includes('--setup')) {
  process.env.LEGILIMENS_FORCE_SETUP = 'true';
}

// Handle --reset flag
if (args.includes('--reset')) {
  const { getConfigPath } = await import('../src/config/userConfig.js');
  const { unlinkSync, existsSync } = await import('fs');
  const configPath = getConfigPath();
  if (existsSync(configPath)) {
    unlinkSync(configPath);
  }
  process.env.LEGILIMENS_FORCE_SETUP = 'true';
}

// Run Clack-based CLI
void (async () => {
  try {
    const { runClackApp } = await import('../src/clackApp.js');
    await runClackApp();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\nError: ${error.message}`);
      
      // Show stack trace in debug mode
      if (process.env.LEGILIMENS_DEBUG) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }

      // Provide helpful message for Node.js version errors
      if (error.message.includes('requires Node.js')) {
        console.error('\nPlease upgrade to Node.js 20 LTS or newer.');
        console.error('Visit https://nodejs.org/ for installation instructions.');
      }
    } else {
      console.error('An unexpected error occurred:', error);
    }

    process.exit(1);
  }
})();
