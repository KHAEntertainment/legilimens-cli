import { intro, outro, text, spinner, note, confirm, cancel } from '@clack/prompts';
import {
  generateGatewayDoc,
  detectSourceTypeWithAI,
  getRuntimeConfig,
  isLocalLlmEnabled
} from '@legilimens/core';
import type { GatewayGenerationRequest } from '@legilimens/core';
import { loadUserConfig, isSetupRequired } from '../config/userConfig.js';

export interface ClackFlowResult {
  success: boolean;
  artifacts?: string[];
  error?: string;
}

export async function runClackGenerationFlow(templatePath: string, targetDirectory: string): Promise<ClackFlowResult> {
  if (process.env.LEGILIMENS_DEBUG) {
    console.log('[DEBUG] Generation flow started');
    console.log('[DEBUG] Template path:', templatePath);
    console.log('[DEBUG] Target directory:', targetDirectory);
  }

  if (process.env.LEGILIMENS_DEBUG) {
    console.log('[DEBUG] Showing intro...');
  }
  intro('🪄 Reading the minds of repositories');

  try {
    if (process.env.LEGILIMENS_DEBUG) {
      console.log('[DEBUG] Loading user config...');
    }
    const userConfig = loadUserConfig();
    if (process.env.LEGILIMENS_DEBUG) {
      console.log('[DEBUG] User config loaded:', JSON.stringify(userConfig, null, 2));
    }
    
    if (process.env.LEGILIMENS_DEBUG) {
      console.log('[DEBUG] Getting runtime config...');
    }
    const runtimeConfig = getRuntimeConfig();
    if (process.env.LEGILIMENS_DEBUG) {
      console.log('[DEBUG] Runtime config loaded');
    }
    
    if (process.env.LEGILIMENS_DEBUG) {
      console.log('[DEBUG] Checking if setup required...');
    }
    const setupRequired = await isSetupRequired();
    if (process.env.LEGILIMENS_DEBUG) {
      console.log('[DEBUG] Setup required:', setupRequired);
    }

    // Pre-flight check: Enforce at least one AI provider before proceeding
    const tavilyPresent = Boolean(process.env.TAVILY_API_KEY || userConfig.apiKeys.tavily);
    const localLlmPresent = isLocalLlmEnabled(runtimeConfig);

    if (!localLlmPresent && !tavilyPresent) {
      cancel('Cannot generate docs: No AI provider configured. At least one of (Tavily API key OR Local LLM) is required. Run setup wizard first.');
      return { success: false, error: 'No AI provider configured' };
    }

    if (!isLocalLlmEnabled(runtimeConfig) && tavilyPresent) {
      note('Local LLM not configured and will be skipped.\n\nRun \'legilimens setup\' to configure', 'Configuration Warning');
    }

    // Step 1: Dependency identifier (natural language or canonical)
    if (process.env.LEGILIMENS_DEBUG) {
      console.log('[DEBUG] Prompting for dependency identifier...');
    }
    const identifier = await text({
      message: 'What do you need documentation on?',
      placeholder: 'e.g., "AG-UI", "React", "vercel/ai", "https://github.com/org/repo"',
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Dependency identifier cannot be empty';
        }
      },
    });

    if (process.env.LEGILIMENS_DEBUG) {
      console.log('[DEBUG] Identifier received:', identifier);
      console.log('[DEBUG] Identifier type:', typeof identifier);
    }

    if (typeof identifier === 'symbol') {
      if (process.env.LEGILIMENS_DEBUG) {
        console.log('[DEBUG] User cancelled at identifier prompt');
      }
      cancel('Operation cancelled');
      return { success: false };
    }

    // Step 2: Detect source type and dependency type with AI assistance
    const s = spinner();
    s.start('Detecting dependency source and type with AI');

    let detection;
    let sourceHint;
    let dependencyType;
    try {
      detection = await detectSourceTypeWithAI(String(identifier));
      sourceHint = detection.aiAssisted ? ' (AI-assisted)' : '';
      dependencyType = detection.dependencyType || 'other';
      s.stop(`Source detected: ${detection.sourceType}, Type: ${dependencyType}${sourceHint}`);
    } catch (error) {
      s.stop('Detection failed');
      throw error;
    }

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
    
    if (process.env.LEGILIMENS_DEBUG) {
      console.log('[DEBUG] Error caught in generation flow:');
      console.log('[DEBUG] Error type:', error instanceof Error ? 'Error' : typeof error);
      console.log('[DEBUG] Error message:', msg);
      if (error instanceof Error && error.stack) {
        console.log('[DEBUG] Stack trace:');
        console.log(error.stack);
      }
    }
    
    cancel(`Generation failed: ${msg}`);
    return { success: false, error: msg };
  }
}
