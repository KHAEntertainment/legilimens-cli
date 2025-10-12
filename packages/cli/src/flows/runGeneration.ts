import { generateGatewayDoc, formatProgress } from '@legilimens/core';
import type {
  GatewayGenerationRequest,
  GatewayGenerationResult
} from '@legilimens/core';
import type { TimelineItem, ProgressStatus } from '../components/ProgressTimeline.js';
import type { CliProgressEvent } from '@legilimens/core';

export interface GenerationInput {
  dependencyType: string;
  dependencyIdentifier: string;
  deepWikiRepository?: string;
  templatePath: string;
  targetDirectory: string;
  minimalMode: boolean;
}

export interface GenerationProgressEvent extends TimelineItem {}

export interface RunGenerationOptions {
  onProgress?: (event: GenerationProgressEvent) => void;
  onCliProgress?: (event: CliProgressEvent) => void;
}

export interface GenerationRunSuccess {
  success: true;
  input: GenerationInput;
  result: GatewayGenerationResult;
  timeline: TimelineItem[];
}

export interface GenerationRunFailure {
  success: false;
  input: GenerationInput;
  error: Error;
  timeline: TimelineItem[];
}

export type GenerationRunResult = GenerationRunSuccess | GenerationRunFailure;

const TIMELINE_TEMPLATE: Array<Omit<TimelineItem, 'status'>> = [
  { id: 'collect-input', label: 'Collecting session input' },
  { id: 'validate-template', label: 'Validating template location' },
  { id: 'generate-docs', label: 'Generating gateway documentation' },
  { id: 'summarize-output', label: 'Summarizing results' }
];

const cloneTimeline = (): TimelineItem[] =>
  TIMELINE_TEMPLATE.map((item, index) => ({
    ...item,
    status: index === 0 ? ('complete' as ProgressStatus) : ('pending' as ProgressStatus),
    detail: index === 0 ? 'Interactive prompts captured successfully.' : undefined
  }));

export const createInitialTimeline = (): TimelineItem[] => cloneTimeline();

interface TimelineUpdate {
  id: string;
  status: ProgressStatus;
  detail?: string;
}

export const updateTimelineItem = (
  timeline: TimelineItem[],
  update: TimelineUpdate
): TimelineItem | undefined => {
  const target = timeline.find((item) => item.id === update.id);
  if (!target) {
    return undefined;
  }

  target.status = update.status;
  target.detail = update.detail;
  return target;
};

export const createDependencyTimeline = (
  identifier: string,
  type: string
): TimelineItem[] => {
  const timeline = cloneTimeline();
  updateTimelineItem(timeline, {
    id: 'collect-input',
    status: 'complete',
    detail: `Identifier: ${identifier} (${type})`
  });
  return timeline;
};

const emitProgress = (
  timeline: TimelineItem[],
  event: TimelineUpdate,
  options: RunGenerationOptions
): void => {
  const updated = updateTimelineItem(timeline, event);
  if (updated) {
    options.onProgress?.({ ...updated });
  }
};

const buildRequest = (input: GenerationInput): GatewayGenerationRequest => {
  const variables: Record<string, any> = {
    dependencyType: input.dependencyType,
    dependencyIdentifier: input.dependencyIdentifier
  };
  
  // Only include deepWikiRepository if provided
  if (input.deepWikiRepository) {
    variables.deepWikiRepository = input.deepWikiRepository;
  }

  return {
    templatePath: input.templatePath,
    targetDirectory: input.targetDirectory,
    context: {
      variables,
      minimalMode: input.minimalMode
    }
  };
};

export const runGeneration = async (
  input: GenerationInput,
  options: RunGenerationOptions = {}
): Promise<GenerationRunResult> => {
  const timeline = cloneTimeline();

  emitProgress(
    timeline,
    {
      id: 'validate-template',
      status: 'active',
      detail: formatProgress({
        step: 'validate-template',
        message: 'Confirming template availability',
        percentComplete: 10
      })
    },
    options
  );

  emitProgress(
    timeline,
    {
      id: 'generate-docs',
      status: 'active',
      detail: formatProgress({
        step: 'generate-docs',
        message: 'Invoking shared module',
        percentComplete: 40
      })
    },
    options
  );

  const request = buildRequest(input);

  try {
    const result = await generateGatewayDoc(request);

    emitProgress(
      timeline,
      {
        id: 'validate-template',
        status: 'complete',
        detail: formatProgress({
          step: 'validate-template',
          message: `Template validated for ${result.metadata.gatewayFilename}`,
          percentComplete: 35
        })
      },
      options
    );

    emitProgress(
      timeline,
      {
        id: 'generate-docs',
        status: 'complete',
        detail: formatProgress({
          step: 'generate-docs',
          message: `Artifacts saved to ${result.metadata.gatewayRelativePath}`,
          percentComplete: 80
        })
      },
      options
    );

    emitProgress(
      timeline,
      {
        id: 'summarize-output',
        status: 'complete',
        detail: result.summary
      },
      options
    );

    return {
      success: true,
      input,
      result,
      timeline
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    if (err.message.toLowerCase().includes('template')) {
      emitProgress(
        timeline,
        {
          id: 'validate-template',
          status: 'error',
          detail: err.message
        },
        options
      );
    }

    emitProgress(
      timeline,
      {
        id: 'generate-docs',
        status: 'error',
        detail: err.message
      },
      options
    );

    emitProgress(
      timeline,
      {
        id: 'summarize-output',
        status: 'error',
        detail: 'Generation halted before completion; see error details.'
      },
      options
    );

    return {
      success: false,
      input,
      error: err,
      timeline
    };
  }
};
