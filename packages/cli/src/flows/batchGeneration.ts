import type { DependencyType } from '@legilimens/core';
import type { TimelineItem, ProgressStatus } from '../components/ProgressTimeline.js';
import {
  runGeneration,
  type GenerationInput,
  type GenerationRunResult,
  createDependencyTimeline,
  updateTimelineItem
} from './runGeneration.js';
import { parseBatchInput } from '../utils/batchInputParser.js';
import { classifyBatch, type ClassifiedDependency } from '../utils/dependencyClassifier.js';
import type { CliProgressEvent } from '@legilimens/core';

/**
 * Batch generation input specification
 */
export interface BatchGenerationInput {
  batchInput: string; // raw input (inline or file path)
  templatePath: string;
  targetDirectory: string;
  minimalMode: boolean;
}

/**
 * Batch-level progress event
 */
export interface BatchProgressEvent {
  step: string;
  message: string;
  currentIndex?: number;
  totalCount?: number;
  percentComplete: number;
  status: ProgressStatus;
}

/**
 * Item-level progress event
 */
export interface ItemProgressEvent {
  dependencyIdentifier: string;
  dependencyType: DependencyType;
  itemIndex: number;
  totalItems: number;
  timeline: TimelineItem[];
}

/**
 * Batch generation options
 */
export interface BatchGenerationOptions {
  onBatchProgress?: (event: BatchProgressEvent) => void;
  onItemProgress?: (event: ItemProgressEvent) => void;
  onCliProgress?: (event: CliProgressEvent) => void;
  onWarnings?: (warnings: string[]) => void;
}

/**
 * Batch generation result
 */
export interface BatchGenerationResult {
  success: boolean;
  results: GenerationRunResult[];
  timeline: TimelineItem[];
  statistics: {
    total: number;
    succeeded: number;
    failed: number;
    durationMs: number;
  };
  summary: string;
}

const BATCH_TIMELINE_TEMPLATE: Array<Omit<TimelineItem, 'status'>> = [
  { id: 'parse-input', label: 'Parse and validate batch input' },
  { id: 'classify-dependencies', label: 'Auto-detect types and sort' },
  { id: 'process-batch', label: 'Process each dependency' },
  { id: 'aggregate-results', label: 'Summarize batch results' }
];

export const createBatchTimeline = (): TimelineItem[] =>
  BATCH_TIMELINE_TEMPLATE.map((item, index) => ({
    ...item,
    status: index === 0 ? ('active' as ProgressStatus) : ('pending' as ProgressStatus),
  }));

const updateBatchTimeline = (
  timeline: TimelineItem[],
  id: string,
  status: ProgressStatus,
  detail?: string
): void => {
  const target = timeline.find((item) => item.id === id);
  if (target) {
    target.status = status;
    target.detail = detail;
  }
};

/**
 * Run batch generation for multiple dependencies
 */
export async function runBatchGeneration(
  input: BatchGenerationInput,
  options: BatchGenerationOptions = {}
): Promise<BatchGenerationResult> {
  const startTime = Date.now();
  const timeline = createBatchTimeline();
  const results: GenerationRunResult[] = [];
  let classifiedDependencies: ClassifiedDependency[] = [];
  let classificationWarnings: string[] = [];

  try {
    // Step 1: Parse input
    options.onBatchProgress?.({
      step: 'parse-input',
      message: 'Parsing batch input...',
      percentComplete: 5,
      status: 'active'
    });

    const parsed = await parseBatchInput(input.batchInput);

    updateBatchTimeline(
      timeline,
      'parse-input',
      'complete',
      `Parsed ${parsed.dependencies.length} dependencies from ${parsed.source}`
    );

    options.onBatchProgress?.({
      step: 'parse-input',
      message: `Found ${parsed.dependencies.length} dependencies`,
      percentComplete: 15,
      status: 'complete'
    });

    // Step 2: Classify dependencies
    updateBatchTimeline(timeline, 'classify-dependencies', 'active');

    options.onBatchProgress?.({
      step: 'classify-dependencies',
      message: 'Auto-detecting types...',
      percentComplete: 20,
      status: 'active'
    });

    const classificationResult = classifyBatch(parsed.dependencies);
    classifiedDependencies = classificationResult.classified;
    classificationWarnings = classificationResult.warnings;

    updateBatchTimeline(
      timeline,
      'classify-dependencies',
      'complete',
      `Classified and sorted ${classifiedDependencies.length} dependencies`
    );

    // Emit warnings if any
    if (classificationWarnings.length > 0) {
      options.onWarnings?.(classificationWarnings);
    }

    options.onBatchProgress?.({
      step: 'classify-dependencies',
      message: `Dependencies classified and sorted${classificationWarnings.length > 0 ? ` (${classificationWarnings.length} warnings)` : ''}`,
      percentComplete: 30,
      status: 'complete'
    });

    // Step 3: Process batch
    updateBatchTimeline(timeline, 'process-batch', 'active');

    for (let i = 0; i < classifiedDependencies.length; i++) {
      const dep = classifiedDependencies[i];
      const itemNumber = i + 1;
      let dependencyTimeline = createDependencyTimeline(dep.identifier, dep.dependencyType);

      options.onItemProgress?.({
        dependencyIdentifier: dep.identifier,
        dependencyType: dep.dependencyType,
        itemIndex: itemNumber,
        totalItems: classifiedDependencies.length,
        timeline: dependencyTimeline.map((item) => ({ ...item }))
      });

      // Emit batch progress
      const batchProgress = 30 + ((i / classifiedDependencies.length) * 60);
      options.onBatchProgress?.({
        step: 'process-batch',
        message: `Processing ${dep.identifier} (${dep.dependencyType})`,
        currentIndex: itemNumber,
        totalCount: classifiedDependencies.length,
        percentComplete: batchProgress,
        status: 'active'
      });

      // Create generation input for this dependency
      const generationInput: GenerationInput = {
        dependencyType: dep.dependencyType,
        dependencyIdentifier: dep.normalizedIdentifier,
        ...(dep.deepWikiUrl && { deepWikiRepository: dep.deepWikiUrl }),
        templatePath: input.templatePath,
        targetDirectory: input.targetDirectory,
        minimalMode: input.minimalMode,
      };

      try {
        // Run generation for this dependency
        const result = await runGeneration(generationInput, {
          onProgress: (event) => {
            // Forward item-level progress
            updateTimelineItem(dependencyTimeline, {
              id: event.id,
              status: event.status,
              detail: event.detail
            });

            options.onItemProgress?.({
              dependencyIdentifier: dep.identifier,
              dependencyType: dep.dependencyType,
              itemIndex: itemNumber,
              totalItems: classifiedDependencies.length,
              timeline: dependencyTimeline.map((item) => ({ ...item }))
            });
          },
          onCliProgress: options.onCliProgress,
        });

        results.push(result);

        dependencyTimeline = result.timeline.map((item) => ({ ...item }));
        options.onItemProgress?.({
          dependencyIdentifier: dep.identifier,
          dependencyType: dep.dependencyType,
          itemIndex: itemNumber,
          totalItems: classifiedDependencies.length,
          timeline: dependencyTimeline.map((item) => ({ ...item }))
        });
      } catch (error) {
        // If runGeneration throws, wrap in a failure result
        const err = error instanceof Error ? error : new Error(String(error));

        updateTimelineItem(dependencyTimeline, {
          id: 'generate-docs',
          status: 'error',
          detail: err.message
        });

        const failureTimeline = dependencyTimeline.map((item) => ({ ...item }));

        results.push({
          success: false,
          input: generationInput,
          error: err,
          timeline: failureTimeline,
        });

        options.onItemProgress?.({
          dependencyIdentifier: dep.identifier,
          dependencyType: dep.dependencyType,
          itemIndex: itemNumber,
          totalItems: classifiedDependencies.length,
          timeline: dependencyTimeline.map((item) => ({ ...item }))
        });
      }
    }

    updateBatchTimeline(
      timeline,
      'process-batch',
      'complete',
      `Processed ${classifiedDependencies.length} dependencies`
    );

    options.onBatchProgress?.({
      step: 'process-batch',
      message: 'All dependencies processed',
      percentComplete: 90,
      status: 'complete'
    });

    // Step 4: Aggregate results
    updateBatchTimeline(timeline, 'aggregate-results', 'active');

    options.onBatchProgress?.({
      step: 'aggregate-results',
      message: 'Aggregating batch results...',
      percentComplete: 95,
      status: 'active'
    });

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const durationMs = Date.now() - startTime;

    const summary = buildSummary(results, classifiedDependencies.length, durationMs);

    updateBatchTimeline(
      timeline,
      'aggregate-results',
      'complete',
      `${succeeded} succeeded, ${failed} failed`
    );

    options.onBatchProgress?.({
      step: 'aggregate-results',
      message: summary,
      percentComplete: 100,
      status: 'complete'
    });

    return {
      success: succeeded > 0,
      results,
      timeline,
      statistics: {
        total: classifiedDependencies.length,
        succeeded,
        failed,
        durationMs,
      },
      summary,
    };
  } catch (error) {
    // Handle parsing or classification errors
    const err = error instanceof Error ? error : new Error(String(error));

    // Mark current step as error
    const currentStep = timeline.find((item) => item.status === 'active');
    if (currentStep) {
      currentStep.status = 'error';
      currentStep.detail = err.message;
    }

    if (currentStep) {
      options.onBatchProgress?.({
        step: currentStep.id,
        message: err.message,
        percentComplete: currentStep.id === 'parse-input' ? 5 : 0,
        status: 'error'
      });
    }

    return {
      success: false,
      results,
      timeline,
      statistics: {
        total: classifiedDependencies.length,
        succeeded: 0,
        failed: classifiedDependencies.length,
        durationMs: Date.now() - startTime,
      },
      summary: `Batch processing failed: ${err.message}`,
    };
  }
}

/**
 * Build summary message for batch results
 */
function buildSummary(
  results: GenerationRunResult[],
  total: number,
  durationMs: number
): string {
  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const durationSec = (durationMs / 1000).toFixed(1);

  return `Batch processing complete: ${succeeded}/${total} succeeded, ${failed} failed in ${durationSec}s`;
}
