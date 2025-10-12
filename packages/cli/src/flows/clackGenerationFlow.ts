import { intro, outro, text, select, spinner, note, confirm, cancel } from '@clack/prompts';
import { generateGatewayDoc } from '@legilimens/core';
import type { GatewayGenerationRequest } from '@legilimens/core';
import { detectSourceTypeWithAI } from '@legilimens/core';
import { join } from 'path';
import { existsSync } from 'fs';

export interface ClackFlowResult {
  success: boolean;
  artifacts?: string[];
  error?: string;
}

export async function runClackGenerationFlow(templatePath: string, targetDirectory: string): Promise<ClackFlowResult> {
  intro('Legilimens Gateway Generator');

  try {
    // Step 1: Dependency type
    const dependencyType = await select({
      message: 'Select dependency type',
      options: [
        { value: 'framework', label: 'Framework' },
        { value: 'api', label: 'API' },
        { value: 'library', label: 'Library' },
        { value: 'tool', label: 'Tool' },
        { value: 'other', label: 'Other' },
      ],
    });

    if (typeof dependencyType === 'symbol') {
      cancel('Operation cancelled');
      return { success: false };
    }

    // Step 2: Dependency identifier (natural language or canonical)
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

    // Step 3: Detect source type (with AI assistance for natural language)
    const s = spinner();
    s.start('Detecting dependency source');
    
    const detection = await detectSourceTypeWithAI(String(identifier), String(dependencyType));
    const sourceHint = detection.aiAssisted ? ' (AI-assisted)' : '';
    
    s.stop(`Source detected: ${detection.sourceType}${sourceHint}`);

    // Step 4: Minimal mode
    const minimalMode = await confirm({
      message: 'Enable minimal mode (low-contrast, ANSI-free)?',
      initialValue: false,
    });

    if (typeof minimalMode === 'symbol') {
      cancel('Operation cancelled');
      return { success: false };
    }

    // Step 5: Generate (multi-stage progress)
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

    // Step 6: Summary
    note(
      [
        `Gateway doc: ${result.metadata.gatewayRelativePath}`,
        `Static backup: ${result.metadata.staticBackupRelativePath}`,
        result.metadata.deepWikiRepository ? `DeepWiki: ${result.metadata.deepWikiRepository}` : '',
        `Duration: ${result.metadata.generationDurationMs}ms`,
      ].filter(Boolean).join('\n'),
      'Generation Summary'
    );

    // Step 7: Continue or quit
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

