#!/usr/bin/env node
import { intro, outro, select, cancel, note } from '@clack/prompts';
import { runClackWizard } from './wizard/clackWizard.js';
import { runClackGenerationFlow } from './flows/clackGenerationFlow.js';
import { loadUserConfig, isSetupRequired } from './config/userConfig.js';
import { loadCliEnvironment } from './config/env.js';
import { loadAsciiBanner, bannerToString } from './assets/asciiBanner.js';
import { getTerminalManager } from './utils/terminalManager.js';
import { join, dirname } from 'path';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function runClackApp(): Promise<void> {
  // Enable color support for Clack prompts
  // Force colors in TTY environments (unless NO_COLOR is set)
  if (process.stdout.isTTY && !process.env.NO_COLOR) {
    process.env.FORCE_COLOR = process.env.FORCE_COLOR || '3';
  }
  
  // Load CLI environment (populates env vars from saved config)
  await loadCliEnvironment();
  
  // Set up crash logging
  const crashLogDir = join(homedir(), '.legilimens');
  const crashLogPath = join(crashLogDir, 'crash.log');
  const logCrash = (error: Error) => {
    try {
      mkdirSync(crashLogDir, { recursive: true });
      const timestamp = new Date().toISOString();
      const logEntry = `\n=== Crash at ${timestamp} ===\n${error.stack}\n`;
      writeFileSync(crashLogPath, logEntry, { flag: 'a' });
    } catch {
      // Ignore logging errors
    }
  };

  // Check if running in a TTY environment
  const isTTY = process.stdin.isTTY && process.stdout.isTTY;
  
  if (!isTTY) {
    console.error('Error: Legilimens requires an interactive terminal (TTY).');
    console.error('This usually happens when:');
    console.error('  - Running in a non-interactive environment (CI/CD)');
    console.error('  - Output is being piped or redirected');
    console.error('  - Running through certain process managers');
    console.error('\nTry running directly in your terminal instead.');
    throw new Error('TTY required');
  }

  // Check if TUI mode should be disabled via environment variable
  const disableTuiMode = process.env.LEGILIMENS_DISABLE_TUI === 'true';

  // Initialize terminal manager for full-screen TUI experience
  const terminalManager = getTerminalManager({
    useAltScreen: !disableTuiMode,  // Use alternate screen buffer (preserves terminal history)
    hideCursor: false,               // Keep cursor visible for Clack prompts
    clearOnStart: !disableTuiMode,   // Clear screen on start
    enableMouse: false               // Mouse not needed for Clack prompts
  });

  let exitCode = 0;

  try {
    // Enter full-screen TUI mode (clears screen, preserves history)
    if (!disableTuiMode) {
      terminalManager.enter();
    }

    // Log start of app
    if (process.env.LEGILIMENS_DEBUG) {
      console.log('[DEBUG] Clack app started');
    }

    // Main application loop
    let shouldContinue = true;
    while (shouldContinue) {
      // Check if setup is needed (async)
      const setupRequired = await isSetupRequired();

      if (setupRequired || process.env.LEGILIMENS_FORCE_SETUP === 'true') {
        // Show why setup is needed
        if (setupRequired) {
          const config = loadUserConfig();
          if (!config.setupCompleted) {
            intro('First-time setup required');
          } else {
            intro('Configuration incomplete');
            console.log('Missing required configuration. Running setup wizard...\n');
          }
        }

        const result = await runClackWizard();

        // Handle wizard cancellation
        if (!result.success) {
          outro('Setup cancelled. You can run setup later with: legilimens setup');
          console.log('Or set environment variables to bypass setup (see README)');
          shouldContinue = false;
          continue;
        }
      }

      const config = loadUserConfig();

      // Display ASCII banner
      try {
        const bannerPath = join(__dirname, 'assets', 'banner.txt');
        const banner = loadAsciiBanner({
          externalPath: existsSync(bannerPath) ? bannerPath : undefined,
          minimal: false,
          width: 80
        });

        // Show the banner as a note (with box) or plain text
        if (banner.source === 'external' || banner.source === 'figlet') {
          console.log('\n' + bannerToString(banner) + '\n');
        } else {
          // Fallback: just show intro
          intro('Legilimens');
        }
      } catch {
        // If banner fails, fall back to simple intro
        intro('Legilimens');
      }

      const action = await select({
        message: 'What would you like to do?',
        options: [
          { value: 'generate', label: 'Generate gateway documentation' },
          { value: 'setup', label: 'Run setup wizard' },
          { value: 'quit', label: 'Quit' },
        ],
      });

      if (typeof action === 'symbol' || action === 'quit') {
        cancel('Goodbye');
        shouldContinue = false;
        continue;
      }

      if (action === 'setup') {
        await runClackWizard();
        outro('Setup complete. You can now generate docs.');
        continue; // Return to menu
      }

      if (action === 'generate') {
        try {
          // Determine template path using import.meta.url for dist compatibility
          const bundledTemplate = new URL('../assets/templates/legilimens-template.md', import.meta.url);
          const defaultTemplate = join(process.cwd(), 'docs', 'templates', 'legilimens-template.md');
          
          // Debug logging (only in debug mode)
          if (process.env.LEGILIMENS_DEBUG) {
            console.log('[DEBUG] __dirname:', __dirname);
            console.log('[DEBUG] process.cwd():', process.cwd());
            console.log('[DEBUG] Bundled template URL:', bundledTemplate.href);
            console.log('[DEBUG] Default template:', defaultTemplate);
            console.log('[DEBUG] Default exists:', existsSync(defaultTemplate));
          }
          
          // Prefer user's custom template if it exists, otherwise use bundled
          let templatePath: string;
          if (existsSync(defaultTemplate)) {
            templatePath = defaultTemplate;
          } else {
            // Convert URL to file path for bundled template
            templatePath = fileURLToPath(bundledTemplate);
          }
          
          if (process.env.LEGILIMENS_DEBUG) {
            console.log('[DEBUG] Selected template path:', templatePath);
            console.log('[DEBUG] Template exists:', existsSync(templatePath));
          }

          // Verify template exists before proceeding
          if (!existsSync(templatePath)) {
            console.error('\n❌ Error: Template file not found at:', templatePath);
            console.error('\nSearched locations:');
            console.error('  1. User template:', defaultTemplate);
            console.error('  2. Bundled template:', fileURLToPath(bundledTemplate));
            console.error('\nPlease ensure the template file exists.');
            exitCode = 1;
            shouldContinue = false;
            continue;
          }

          const targetDirectory = join(process.cwd(), 'docs');

          if (process.env.LEGILIMENS_DEBUG) {
            console.log('[DEBUG] Target directory:', targetDirectory);
            console.log('[DEBUG] Calling runClackGenerationFlow...');
          }

          const result = await runClackGenerationFlow(templatePath, targetDirectory);
          
          if (process.env.LEGILIMENS_DEBUG) {
            console.log('[DEBUG] Generation flow completed');
            console.log('[DEBUG] Result:', JSON.stringify(result, null, 2));
          }
          
          // Set exit code based on result, but allow returning to menu
          if (!result.success) {
            exitCode = 1;
          }
          
          // Ask if user wants to continue
          const continueChoice = await select({
            message: 'What would you like to do next?',
            options: [
              { value: 'menu', label: 'Return to main menu' },
              { value: 'quit', label: 'Quit' },
            ],
          });
          
          if (typeof continueChoice === 'symbol' || continueChoice === 'quit') {
            shouldContinue = false;
          }
        } catch (error) {
          console.error('\n❌ Error in generation flow:');
          if (error instanceof Error) {
            console.error(error.message);
            if (process.env.LEGILIMENS_DEBUG) {
              console.error('\nStack trace:');
              console.error(error.stack);
            }
          } else {
            console.error(String(error));
          }
          exitCode = 1;
          
          // In debug mode, wait for keypress to keep screen visible
          if (process.env.LEGILIMENS_DEBUG && !disableTuiMode) {
            console.log('\n[DEBUG] Press any key to continue...');
            process.stdin.setRawMode(true);
            await new Promise(resolve => process.stdin.once('data', resolve));
            process.stdin.setRawMode(false);
          }
          
          shouldContinue = false;
        }
      }
    }
  } catch (error) {
    // Log crash details
    if (error instanceof Error) {
      logCrash(error);
      
      // Enhanced error display
      console.error('\n❌ Fatal error:', error.message);
      if (process.env.LEGILIMENS_DEBUG) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
      console.error(`\nCrash details saved to: ${crashLogPath}`);
      
      // In debug mode, wait for keypress to keep screen visible
      if (process.env.LEGILIMENS_DEBUG && !disableTuiMode) {
        console.log('\n[DEBUG] Press any key to exit...');
        try {
          process.stdin.setRawMode(true);
          await new Promise(resolve => process.stdin.once('data', resolve));
          process.stdin.setRawMode(false);
        } catch {
          // Ignore errors in debug display
        }
      }
    }
    exitCode = 1;
  } finally {
    // Always restore terminal state on exit (even if error occurs)
    terminalManager.exit();
    
    // Exit with appropriate code after cleanup
    if (exitCode !== 0) {
      process.exit(exitCode);
    }
  }
}

