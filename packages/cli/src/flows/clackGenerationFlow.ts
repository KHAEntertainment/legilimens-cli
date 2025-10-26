import { intro, outro, text, select, spinner, note, confirm, cancel } from '@clack/prompts';
import {
  generateGatewayDoc,
  detectSourceTypeWithAI,
  getRuntimeConfig,
  isLocalLlmEnabled
} from '@legilimens/core';
import type { GatewayGenerationRequest } from '@legilimens/core';
import { join } from 'path';
import { existsSync } from 'fs';
import { loadUserConfig, isSetupRequired } from '../config/userConfig.js';
import { loadAsciiBanner, bannerToString } from '../assets/asciiBanner.js';

export interface ClackFlowResult {
  success: boolean;
  artifacts?: string[];
  error?: string;
}

export async function runClackGenerationFlow(templatePath: string, targetDirectory: string): Promise<ClackFlowResult> {
  const termWidth = typeof process?.stdout?.columns === 'number' ? process.stdout.columns : 100;
  const banner = loadAsciiBanner({ minimal: false, width: termWidth });
  console.log(bannerToString(banner));

  intro('🪄 Reading the minds of repositories');

  try {
    const userConfig = loadUserConfig();
    const runtimeConfig = getRuntimeConfig();
    const setupRequired = await isSetupRequired();

    // Pre-flight check: Enforce at least one AI provider before proceeding
    const tavilyPresent = Boolean(process.env.TAVILY_API_KEY || userConfig.apiKeys.tavily);
    const localLlmPresent = isLocalLlmEnabled(runtimeConfig);

    if (!localLlmPresent && !tavilyPresent) {
      cancel('Cannot generate docs: No AI provider configured. At least one of (Tavily API key OR Local LLM) is required. Run setup wizard first.');
      return { success: false, error: 'No AI provider configured' };
    }

    if (!isLocalLlmEnabled(runtimeConfig) && !tavilyPresent) {
      note('Local LLM not configured and Tavily API key not present.\n\nRun \'legilimens setup\' to configure', 'Configuration Warning');
    }

    // Step 1: Dependency identifier (natural language or canonical)
    const identifier = await text({
      message: 'Enter dependency identifier',
      placeholder: 'e.g., "Jumpcloud API 2.0", "React", or "vercel/ai"',
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Dependency identifier cannot be empty';
        }
      },
    });

    if (typeof identifier === 'symbol') {
      cancel('Operation cancelled');
      return { success: false };
    }

    // Step 2: Detect source type and dependency type with AI assistance
    const s = spinner();
    s.start('Detecting dependency source and type with AI');

    const detection = await detectSourceTypeWithAI(String(identifier));
    const sourceHint = detection.aiAssisted ? ' (AI-assisted)' : '';
    const dependencyType = detection.dependencyType || 'other';

    s.stop(`Source detected: ${detection.sourceType}, Type: ${dependencyType}${sourceHint}`);

    // Step 3: Minimal mode
    const minimalMode = await confirm({
      message: 'Enable minimal mode (low-contrast, ANSI-free)?',
      initialValue: false,
    });

    if (typeof minimalMode === 'symbol') {
      cancel('Operation cancelled');
      return { success: false };
    }

    // Step 4: Generate (multi-stage progress)
    const s1 = spinner();
    s1.start('Validating template');
    
    const request: GatewayGenerationRequest = {
      templatePath,
      targetDirectory,
      context: {
        variables: {
          dependencyType: String(dependencyType),
          dependencyIdentifier: String(identifier),
        },
        minimalMode: Boolean(minimalMode),
      },
    };

    s1.stop('Template validated');

    const s2 = spinner();
    s2.start('Fetching documentation');
    
    const result = await generateGatewayDoc(request);

    s2.stop('Documentation fetched');

    const s3 = spinner();
    s3.start('Writing gateway files');
    s3.stop('Gateway files written');

    // Step 5: Summary
    note(
      [
        `Gateway doc: ${result.metadata.gatewayRelativePath}`,
        `Static backup: ${result.metadata.staticBackupRelativePath}`,
        result.metadata.deepWikiRepository ? `DeepWiki: ${result.metadata.deepWikiRepository}` : '',
        `Duration: ${result.metadata.generationDurationMs}ms`,
      ].filter(Boolean).join('\n'),
      'Generation Summary'
    );

    // Step 6: Continue or quit
    const continueFlow = await confirm({
      message: 'Process another dependency?',
      initialValue: true,
    });

    if (continueFlow === true) {
      return runClackGenerationFlow(templatePath, targetDirectory);
    }

    outro('Session complete');
    return { success: true, artifacts: result.artifacts };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    cancel(`Generation failed: ${msg}`);
    return { success: false, error: msg };
  }
}
