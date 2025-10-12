import React, { useCallback, useRef, useState } from 'react';
import { Box, Text } from 'ink';
import { resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { existsSync } from 'node:fs';
import type { CliEnvironment } from '../config/env.js';
import { GenerationPrompt, type PromptValues } from './GenerationPrompt.js';
import { ProgressTimeline, type TimelineItem } from './ProgressTimeline.js';
import { BatchProgressView, type CurrentBatchItem } from './BatchProgressView.js';
import { CompletionSummary } from './CompletionSummary.js';
import { LiveStatus } from './LiveStatus.js';
import { LiveLog, type LogEntry } from './LiveLog.js';
import { PreflightWarnings } from './PreflightWarnings.js';
import {
  createInitialTimeline,
  runGeneration,
  type GenerationInput,
  type GenerationRunResult,
  createDependencyTimeline
} from '../flows/runGeneration.js';
import {
  runBatchGeneration,
  type BatchGenerationInput,
  type BatchGenerationResult,
  createBatchTimeline
} from '../flows/batchGeneration.js';
import type { CliPreferences } from '../config/preferences.js';
import type { LayoutConfig } from '../app.js';

// Get bundled template path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BUNDLED_TEMPLATE_PATH = resolvePath(__dirname, '../assets/templates/legilimens-template.md');

export interface GenerationFlowProps {
  environment: CliEnvironment;
  preferences: CliPreferences;
  layout: LayoutConfig;
  skipUsed: boolean;
  onExit: () => void;
  initialValues?: PromptValues;
  onComplete?: (result: GenerationRunResult | null, batchResult: BatchGenerationResult | null, values: PromptValues | null) => void;
}

type FlowPhase = 'prompt' | 'progress' | 'summary';

const toGenerationInput = (
  values: PromptValues,
  environment: CliEnvironment
): GenerationInput => ({
  dependencyType: values.dependencyType,
  dependencyIdentifier: values.dependencyIdentifier,
  templatePath: BUNDLED_TEMPLATE_PATH,
  targetDirectory: environment.directories.docsDir,
  minimalMode: environment.minimalMode
});

const toBatchGenerationInput = (
  values: PromptValues,
  environment: CliEnvironment
): BatchGenerationInput => ({
  batchInput: values.batchInput || '',
  templatePath: BUNDLED_TEMPLATE_PATH,
  targetDirectory: environment.directories.docsDir,
  minimalMode: environment.minimalMode
});

export const GenerationFlow: React.FC<GenerationFlowProps> = ({
  environment,
  preferences,
  layout,
  skipUsed,
  onExit,
  initialValues,
  onComplete
}) => {
  const [phase, setPhase] = useState<FlowPhase>('prompt');
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [compactMode] = useState<boolean>(false);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [preflightWarnings, setPreflightWarnings] = useState<string[]>([]);

  // Single mode state
  const [timeline, setTimeline] = useState<TimelineItem[]>(() => createInitialTimeline());
  const [result, setResult] = useState<GenerationRunResult | null>(null);

  // Batch mode state
  const [batchTimeline, setBatchTimeline] = useState<TimelineItem[]>([]);
  const [currentItemTimeline, setCurrentItemTimeline] = useState<TimelineItem[]>([]);
  const [currentItem, setCurrentItem] = useState<CurrentBatchItem | null>(null);
  const [batchResult, setBatchResult] = useState<BatchGenerationResult | null>(null);
  const [batchCounts, setBatchCounts] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0
  });

  const lastItemIndexRef = useRef<number | null>(null);
  const lastTimelineUpdateRef = useRef<number>(0);
  const lastValuesRef = useRef<PromptValues | null>(initialValues || null);

  const MAX_TIMELINE_STEPS = useRef<number>(createInitialTimeline().length).current;
  const TIMELINE_THROTTLE_MS = 200;

  const hasTimelineChanged = useCallback((prev: TimelineItem[], next: TimelineItem[]): boolean => {
    if (prev.length !== next.length) {
      return true;
    }

    const prevById = new Map(prev.map((item) => [item.id, item]));

    return next.some((item) => {
      const previous = prevById.get(item.id);
      if (!previous) {
        return true;
      }
      return previous.status !== item.status || previous.detail !== item.detail;
    });
  }, []);

  const resetTimeline = useCallback(
    (details: { identifier: string; type: string }) => {
      setTimeline(createDependencyTimeline(details.identifier, details.type));
    },
    []
  );

  const handlePromptSubmit = async (values: PromptValues): Promise<void> => {
    // Preflight check: verify template exists
    if (!existsSync(BUNDLED_TEMPLATE_PATH)) {
      console.error(`Template not found at: ${BUNDLED_TEMPLATE_PATH}`);
      console.error('Please ensure the CLI is properly installed or set LEGILIMENS_TEMPLATE environment variable.');
      return;
    }

    // Store values for potential restart
    lastValuesRef.current = values;
    setMode(values.mode);

    if (values.mode === 'batch') {
      // Batch processing mode
      const batchInput = toBatchGenerationInput(values, environment);
      setPhase('progress');
      setBatchTimeline(createBatchTimeline());
      setBatchCounts({ current: 0, total: 0 });
      setCurrentItem(null);
      setCurrentItemTimeline([]);
      lastItemIndexRef.current = null;
      lastTimelineUpdateRef.current = 0;

      const runResult = await runBatchGeneration(batchInput, {
        onBatchProgress: (event) => {
          setBatchTimeline((prev) =>
            prev.map((item) =>
              item.id === event.step
                ? { ...item, status: event.status, detail: event.message }
                : item
            )
          );

          setBatchCounts((prev) => {
            let current = prev.current;
            let total = prev.total;

            if (typeof event.totalCount === 'number') {
              total = event.totalCount;
            }

            if (typeof event.currentIndex === 'number') {
              current = event.currentIndex;
            } else if (event.step === 'process-batch' && event.status === 'complete') {
              current = total;
            }

            if (current === prev.current && total === prev.total) {
              return prev;
            }

            return { current, total };
          });
        },
        onCliProgress: (event) => {
          setLogEntries((prev) => [
            ...prev,
            {
              timestamp: Date.now(),
              message: event.message,
              level: 'info'
            }
          ]);
        },
        onWarnings: (warnings) => {
          setPreflightWarnings(warnings);
        },
        onItemProgress: (event) => {
          // Update current item info
          setCurrentItem({
            identifier: event.dependencyIdentifier,
            type: event.dependencyType,
            index: event.itemIndex,
            total: event.totalItems
          });

          if (lastItemIndexRef.current !== event.itemIndex) {
            lastItemIndexRef.current = event.itemIndex;
            lastTimelineUpdateRef.current = 0;
            setCurrentItemTimeline([]);
            setCurrentItemTimeline(createDependencyTimeline(event.dependencyIdentifier, event.dependencyType));
          }

          const cappedTimeline = event.timeline
            .slice(0, MAX_TIMELINE_STEPS)
            .map((item) => ({ ...item }));

          const now = Date.now();

          // Update current item timeline
          setCurrentItemTimeline((prev) => {
            const shouldUpdate = hasTimelineChanged(prev, cappedTimeline);

            if (!shouldUpdate) {
              return prev;
            }

            const criticalChange = cappedTimeline.some((item) => {
              const previous = prev.find((entry) => entry.id === item.id);
              return (
                previous &&
                previous.status !== item.status &&
                (item.status === 'complete' || item.status === 'error')
              );
            });

            if (
              lastTimelineUpdateRef.current !== 0 &&
              now - lastTimelineUpdateRef.current < TIMELINE_THROTTLE_MS &&
              !criticalChange
            ) {
              return prev;
            }

            lastTimelineUpdateRef.current = now;
            return cappedTimeline;
          });
        }
      });

      setBatchResult(runResult);
      setBatchTimeline(runResult.timeline);
      setBatchCounts({
        current: runResult.statistics.total,
        total: runResult.statistics.total
      });
      setCurrentItem(null);
      setPhase('summary');
    } else {
      // Single processing mode
      const generationInput = toGenerationInput(values, environment);
      resetTimeline({
        identifier: values.dependencyIdentifier,
        type: values.dependencyType
      });
      setPhase('progress');

      const runResult = await runGeneration(generationInput, {
        onProgress: (event) => {
          setTimeline((prev) =>
            prev.map((item) =>
              item.id === event.id
                ? { ...item, status: event.status, detail: event.detail }
                : item
            )
          );
        },
        onCliProgress: (event) => {
          setLogEntries((prev) => [
            ...prev,
            {
              timestamp: Date.now(),
              message: event.message,
              level: 'info'
            }
          ]);
        }
      });

      setResult(runResult);
      setTimeline(runResult.timeline);
      setPhase('summary');
    }
  };

  const handleCompletionChoice = (choice: 'again' | 'quit'): void => {
    if (choice === 'again') {
      // Reset to prompt phase with last used values
      setPhase('prompt');
      setResult(null);
      setBatchResult(null);
      setTimeline(createInitialTimeline());
      setBatchTimeline([]);
      setCurrentItemTimeline([]);
      setCurrentItem(null);
      setBatchCounts({ current: 0, total: 0 });
    } else {
      // Notify parent of completion
      onComplete?.(result, batchResult, lastValuesRef.current);
      onExit();
    }
  };

  if (phase === 'prompt') {
    return (
      <GenerationPrompt
        preferences={preferences}
        layout={layout}
        onSubmit={handlePromptSubmit}
        onCancel={onExit}
        initialValues={lastValuesRef.current || undefined}
      />
    );
  }

  if (phase === 'progress') {
    if (mode === 'batch') {
      return (
        <Box flexDirection="column">
          {/* Sticky header region */}
          <Box flexDirection="column" key="header">
            <PreflightWarnings
              warnings={preflightWarnings}
              preferences={preferences}
            />
          </Box>
          
          {/* Content region */}
          <Box flexDirection="column" key="content">
            <BatchProgressView
              batchTimeline={batchTimeline}
              currentItemTimeline={currentItemTimeline}
              currentItem={currentItem}
              preferences={preferences}
              layout={layout}
              processedCount={batchCounts.current}
              totalCount={batchCounts.total}
              compact={compactMode}
            />
            <LiveLog
              entries={logEntries}
              preferences={preferences}
            />
            {skipUsed && (
              <Box paddingX={layout.paddingX} width={layout.width}>
                <Text dimColor>Welcome skipped; prompts processed immediately.</Text>
              </Box>
            )}
          </Box>
        </Box>
      );
    }

    // Single mode progress
    const activeStep = timeline.find(item => item.status === 'active');
    const activeStepLabel = activeStep?.label || 'Processing...';

    return (
      <Box flexDirection="column">
        {/* Sticky header region */}
        <Box flexDirection="column" key="header">
          <LiveStatus
            title="Generating gateway documentation"
            subtitle={activeStepLabel}
            preferences={preferences}
          />
        </Box>
        
        {/* Content region */}
        <Box flexDirection="column" key="content">
          <ProgressTimeline
            items={timeline}
            preferences={preferences}
            layout={layout}
            compact={compactMode}
          />
          <LiveLog
            entries={logEntries}
            preferences={preferences}
          />
          {skipUsed && (
            <Box paddingX={layout.paddingX} width={layout.width}>
              <Text dimColor>Welcome skipped; prompts processed immediately.</Text>
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  if (phase === 'summary') {
    if (mode === 'batch' && batchResult) {
      return (
        <Box flexDirection="column">
          <BatchProgressView
            batchTimeline={batchTimeline}
            currentItemTimeline={[]}
            currentItem={null}
            preferences={preferences}
            layout={layout}
            processedCount={batchCounts.current}
            totalCount={batchCounts.total}
            compact={compactMode}
          />
          <CompletionSummary
            batchResult={batchResult}
            preferences={preferences}
            layout={layout}
            onDone={handleCompletionChoice}
          />
        </Box>
      );
    }

    if (mode === 'single' && result) {
      return (
        <Box flexDirection="column">
          <ProgressTimeline
            items={timeline}
            preferences={preferences}
            layout={layout}
            compact={compactMode}
          />
          <CompletionSummary
            result={result}
            preferences={preferences}
            layout={layout}
            onDone={handleCompletionChoice}
          />
        </Box>
      );
    }
  }

  return null;
};
