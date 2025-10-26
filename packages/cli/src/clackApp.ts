#!/usr/bin/env node
import { intro, outro, select, cancel, note } from '@clack/prompts';
import { runClackWizard } from './wizard/clackWizard.js';
import { runClackGenerationFlow } from './flows/clackGenerationFlow.js';
import { loadUserConfig, isSetupRequired } from './config/userConfig.js';
import { loadAsciiBanner, bannerToString } from './assets/asciiBanner.js';
import { getTerminalManager } from './utils/terminalManager.js';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function runClackApp(): Promise<void> {
  // Check if TUI mode should be disabled via environment variable
  const disableTuiMode = process.env.LEGILIMENS_DISABLE_TUI === 'true';

  // Initialize terminal manager for full-screen TUI experience
  const terminalManager = getTerminalManager({
    useAltScreen: !disableTuiMode,  // Use alternate screen buffer (preserves terminal history)
    hideCursor: false,               // Keep cursor visible for Clack prompts
    clearOnStart: !disableTuiMode,   // Clear screen on start
    enableMouse: false               // Mouse not needed for Clack prompts
  });

  try {
    // Enter full-screen TUI mode (clears screen, preserves history)
    if (!disableTuiMode) {
      terminalManager.enter();
    }

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
      return; // Exit gracefully without error code
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
    process.exit(0);
  }

  if (action === 'setup') {
    await runClackWizard();
    outro('Setup complete. Restart to generate docs.');
    process.exit(0);
  }

    if (action === 'generate') {
      // Determine template path
      const defaultTemplate = join(process.cwd(), 'docs', 'templates', 'legilimens-template.md');
      const bundledTemplate = join(__dirname, '..', '..', '..', 'src', 'assets', 'templates', 'legilimens-template.md');
      
      // Debug logging
      console.log('Default template:', defaultTemplate);
      console.log('Bundled template:', bundledTemplate);
      console.log('Default exists:', existsSync(defaultTemplate));
      console.log('Bundled exists:', existsSync(bundledTemplate));
      
      const templatePath = existsSync(defaultTemplate)
        ? defaultTemplate
        : existsSync(bundledTemplate)
        ? bundledTemplate
        : join(process.cwd(), 'packages', 'cli', 'src', 'assets', 'templates', 'legilimens-template.md');
      
      console.log('Selected template path:', templatePath);

      const targetDirectory = join(process.cwd(), 'docs');

      await runClackGenerationFlow(templatePath, targetDirectory);
    }
  } finally {
    // Always restore terminal state on exit (even if error occurs)
    terminalManager.exit();
  }
}

