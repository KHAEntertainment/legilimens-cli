#!/usr/bin/env node
import { intro, outro, select, cancel } from '@clack/prompts';
import { runClackWizard } from './wizard/clackWizard.js';
import { runClackGenerationFlow } from './flows/clackGenerationFlow.js';
import { loadUserConfig, isSetupRequired } from './config/userConfig.js';
import { join } from 'path';
import { existsSync } from 'fs';
import { homedir } from 'os';

export async function runClackApp(): Promise<void> {
  // Check if setup is needed
  if (isSetupRequired() || process.env.LEGILIMENS_FORCE_SETUP === 'true') {
    await runClackWizard();
  }

  const config = loadUserConfig();

  intro('Legilimens');

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
    const templatePath = existsSync(defaultTemplate)
      ? defaultTemplate
      : join(process.cwd(), 'packages', 'cli', 'src', 'assets', 'templates', 'legilimens-template.md');

    const targetDirectory = join(process.cwd(), 'docs');

    await runClackGenerationFlow(templatePath, targetDirectory);
  }
}

