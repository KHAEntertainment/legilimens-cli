#!/usr/bin/env node

import { render } from 'ink';
import React from 'react';
import App from '../src/app.js';
import { renderHelp } from '../src/commands/help.js';
import { loadCliEnvironment } from '../src/config/env.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command-line arguments
const args = process.argv.slice(2);

// Handle --help flag
if (args.includes('--help') || args.includes('-h')) {
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
  void (async () => {
    try {
      const { getConfigPath } = await import('../src/config/userConfig.js');
      const { unlinkSync, existsSync } = await import('fs');
      const configPath = getConfigPath();
      if (existsSync(configPath)) {
        unlinkSync(configPath);
      }
      process.env.LEGILIMENS_FORCE_SETUP = 'true';
    } catch (error) {
      console.error('Error resetting configuration:', error);
      process.exit(1);
    }
  })();
}

// Load environment and start the CLI
void (async () => {
  try {
    const environment = await loadCliEnvironment(args, process.env);

    // Render the Ink app
    const { waitUntilExit } = render(React.createElement(App, { environment }));

  // Handle graceful shutdown
  const handleShutdown = (signal: string) => {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    process.exit(0);
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  // Wait for the app to exit
  void waitUntilExit();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);

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
