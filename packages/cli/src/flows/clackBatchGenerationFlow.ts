import { intro, outro, text, spinner, note, confirm, cancel } from '@clack/prompts';
import {
  generateGatewayDoc,
  getRuntimeConfig,
  isLocalLlmEnabled,
  detectSourceTypeWithAI,
} from '@legilimens/core';
import type { GatewayGenerationRequest } from '@legilimens/core';
import { loadUserConfig, isSetupRequired } from '../config/userConfig.js';
import { parseBatchInput, type ParsedBatchInput } from '../utils/batchInputParser.js';
import { classifyBatch, type ClassifiedDependency } from '../utils/dependencyClassifier.js';
import { debugLogger } from '../utils/debugLogger.js';

export interface ClackFlowResult {
  success: boolean;
  artifacts?: string[];
  error?: string;
}

interface BatchItemResult {
  identifier: string;
  success: boolean;
  artifact?: string;
  durationMs: number;
  error?: string;
}

/**
 * Interactive batch generation flow (TUI mode)
 */
export async function runClackBatchGenerationFlow(
  templatePath: string,
  targetDirectory: string,
): Promise<ClackFlowResult> {
  intro('Batch Gateway Generation');

  try {
    const userConfig = loadUserConfig();
    const runtimeConfig = getRuntimeConfig();
    const setupRequired = await isSetupRequired();

    // Pre-flight check
    const tavilyPresent = Boolean(process.env.TAVILY_API_KEY || userConfig.apiKeys.tavily);
    const localLlmPresent = isLocalLlmEnabled(runtimeConfig);

    if (!localLlmPresent && !tavilyPresent) {
      outro('Setup required');
      return {
        success: false,
        error: 'No AI provider configured. Run setup wizard first.',
      };
    }

    // Prompt for batch input
    const batchInput = await text({
      message: 'Enter dependencies (comma-separated) or file path (@path/to/file.txt or @file.json):',
      placeholder: 'e.g., react, express, next  OR  @./deps.txt  OR  @./deps.json',
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Batch input cannot be empty';
        }
      },
    });

    if (typeof batchInput === 'symbol') {
      cancel('Cancelled');
      return { success: false, error: 'Operation cancelled by user' };
    }

    // Parse batch input
    const s = spinner();
    s.start('Parsing batch input');

    let parsed: ParsedBatchInput;
    try {
      parsed = await parseBatchInput(String(batchInput));
    } catch (error) {
      s.stop('Parse failed');
      const msg = error instanceof Error ? error.message : String(error);
      note(msg, 'Input Error');
      return { success: false, error: msg };
    }

    s.stop(`Parsed ${parsed.dependencies.length} dependencies from ${parsed.source}${parsed.sourcePath ? ` (${parsed.sourcePath})` : ''}`);

    // Classify dependencies
    s.start('Classifying dependencies');
    const { classified, warnings } = classifyBatch(parsed.dependencies);
    s.stop(`Classified ${classified.length} dependencies`);

    // Show warnings for low-confidence items
    if (warnings.length > 0) {
      note(warnings.join('\n'), 'Classification Warnings');
    }

    // Show what will be processed
    const previewLines = classified.map((dep, i) =>
      `${i + 1}. ${dep.normalizedIdentifier} (${dep.dependencyType}, ${dep.sourceType})`
    );
    note(previewLines.join('\n'), `Will Process ${classified.length} Dependencies`);

    // Confirm
    const proceed = await confirm({
      message: 'Proceed with batch generation?',
      initialValue: true,
    });

    if (proceed !== true) {
      cancel('Cancelled');
      return { success: false, error: 'Operation cancelled by user' };
    }

    // Minimal mode — resolved from flag / env / config at startup
    const minimalMode = process.env.LEGILIMENS_MINIMAL_MODE === 'true';

    // Process each dependency
    const results: BatchItemResult[] = [];
    const startTime = Date.now();

    for (let i = 0; i < classified.length; i++) {
      const dep = classified[i];
      const itemStart = Date.now();

      s.start(`Processing ${i + 1}/${classified.length}: ${dep.normalizedIdentifier}`);

      // Run AI detection for this specific dependency
      let repositoryUrl: string | undefined;
      let normalizedId = dep.normalizedIdentifier;
      let sourceType = dep.sourceType;

      try {
        const detection = await detectSourceTypeWithAI(dep.identifier, { enableSelection: false });
        repositoryUrl = detection.repositoryUrl;
        if (detection.normalizedIdentifier) normalizedId = detection.normalizedIdentifier;
        if (detection.sourceType) sourceType = detection.sourceType;
      } catch {
        // Fall back to classifier results if AI detection fails
        debugLogger.log('BatchFlow', `AI detection failed for ${dep.identifier}, using classifier fallback`);
      }

      const request: GatewayGenerationRequest = {
        templatePath,
        targetDirectory,
        context: {
          variables: {
            dependencyType: dep.dependencyType,
            dependencyIdentifier: normalizedId,
            sourceType,
            repositoryUrl,
          },
          minimalMode,
        },
      };

      try {
        const result = await generateGatewayDoc(request);
        const durationMs = Date.now() - itemStart;
        results.push({
          identifier: dep.normalizedIdentifier,
          success: true,
          artifact: result.artifacts?.[0],
          durationMs,
        });
        s.stop(`[${i + 1}/${classified.length}] ${dep.normalizedIdentifier} - done (${durationMs}ms)`);
      } catch (error) {
        const durationMs = Date.now() - itemStart;
        const msg = error instanceof Error ? error.message : String(error);
        results.push({
          identifier: dep.normalizedIdentifier,
          success: false,
          durationMs,
          error: msg,
        });
        s.stop(`[${i + 1}/${classified.length}] ${dep.normalizedIdentifier} - failed`);
        debugLogger.error('BatchFlow', error instanceof Error ? error : new Error(msg), {
          identifier: dep.identifier,
        });
      }
    }

    const totalDurationMs = Date.now() - startTime;

    // Display summary
    const succeeded = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    const summaryLines = [
      `Processed ${results.length} dependencies in ${(totalDurationMs / 1000).toFixed(1)}s`,
      '',
      ...(succeeded.length > 0
        ? [`Succeeded (${succeeded.length}): ${succeeded.map(r => r.identifier).join(', ')}`]
        : []),
      ...(failed.length > 0
        ? [`Failed (${failed.length}): ${failed.map(r => `${r.identifier} (${r.error})`).join(', ')}`]
        : []),
      '',
      `Artifacts: ${succeeded.length} gateway docs written`,
    ];

    note(summaryLines.filter(Boolean).join('\n'), 'Batch Generation Complete');

    outro('Batch session complete');
    return { success: failed.length === 0, artifacts: succeeded.map(r => r.artifact).filter(Boolean) as string[] };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    debugLogger.error('BatchFlow', error instanceof Error ? error : new Error(msg), { phase: 'batch' });
    outro('Batch generation failed');
    return { success: false, error: msg };
  }
}

/**
 * Non-interactive batch generation (headless mode for CLI flag)
 */
export async function runNonInteractiveBatch(
  batchInput: string,
  templatePath: string,
  targetDirectory: string,
): Promise<ClackFlowResult> {
  try {
    await loadUserConfig();
    const runtimeConfig = getRuntimeConfig();

    // Parse
    const parsed = await parseBatchInput(batchInput);
    console.log(`Parsed ${parsed.dependencies.length} dependencies from ${parsed.source}`);

    // Classify
    const { classified, warnings } = classifyBatch(parsed.dependencies);
    console.log(`Classified ${classified.length} dependencies`);

    for (const w of warnings) {
      console.warn(`Warning: ${w}`);
    }

    // Process
    const results: BatchItemResult[] = [];
    const startTime = Date.now();

    for (let i = 0; i < classified.length; i++) {
      const dep = classified[i];
      const itemStart = Date.now();

      process.stdout.write(`[${i + 1}/${classified.length}] Processing ${dep.normalizedIdentifier}...`);

      let repositoryUrl: string | undefined;
      let normalizedId = dep.normalizedIdentifier;
      let sourceType = dep.sourceType;

      try {
        const detection = await detectSourceTypeWithAI(dep.identifier, { enableSelection: false });
        repositoryUrl = detection.repositoryUrl;
        if (detection.normalizedIdentifier) normalizedId = detection.normalizedIdentifier;
        if (detection.sourceType) sourceType = detection.sourceType;
      } catch {
        // Fall back to classifier results
      }

      const request: GatewayGenerationRequest = {
        templatePath,
        targetDirectory,
        context: {
          variables: {
            dependencyType: dep.dependencyType,
            dependencyIdentifier: normalizedId,
            sourceType,
            repositoryUrl,
          },
          minimalMode: true,
        },
      };

      try {
        await generateGatewayDoc(request);
        const durationMs = Date.now() - itemStart;
        results.push({ identifier: dep.normalizedIdentifier, success: true, durationMs });
        console.log(` done (${durationMs}ms)`);
      } catch (error) {
        const durationMs = Date.now() - itemStart;
        const msg = error instanceof Error ? error.message : String(error);
        results.push({ identifier: dep.normalizedIdentifier, success: false, durationMs, error: msg });
        console.log(` FAILED: ${msg}`);
      }
    }

    const totalDurationMs = Date.now() - startTime;
    const succeeded = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log('');
    console.log(`Batch complete: ${succeeded.length}/${results.length} succeeded in ${(totalDurationMs / 1000).toFixed(1)}s`);

    if (failed.length > 0) {
      console.log('Failed:');
      for (const f of failed) {
        console.log(`  - ${f.identifier}: ${f.error}`);
      }
    }

    return { success: failed.length === 0, artifacts: succeeded.map(r => r.artifact).filter(Boolean) as string[] };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`Batch generation failed: ${msg}`);
    return { success: false, error: msg };
  }
}