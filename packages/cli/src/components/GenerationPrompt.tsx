import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import type { DependencyType, SourceType } from '@legilimens/core';
import { detectSourceType, detectSourceTypeWithAI } from '@legilimens/core';
import type { CliPreferences } from '../config/preferences.js';
import type { LayoutConfig } from '../app.js';
import { parseBatchInput } from '../utils/batchInputParser.js';
import { classifyBatch } from '../utils/dependencyClassifier.js';

export interface PromptValues {
  mode: 'single' | 'batch';
  dependencyType: DependencyType;
  dependencyIdentifier: string;
  batchInput?: string;
  batchIdentifiers?: string[];
}

export interface GenerationPromptProps {
  preferences: CliPreferences;
  layout: LayoutConfig;
  initialValues?: Partial<PromptValues>;
  onSubmit: (values: PromptValues) => void;
  onCancel: () => void;
}

type StepId = 'mode' | 'type' | 'identifier' | 'batch-input';

interface PromptStep {
  id: StepId;
  label: string;
  description: string;
}

const SINGLE_MODE_STEPS: PromptStep[] = [
  {
    id: 'mode',
    label: 'Select processing mode',
    description: 'Choose single dependency or batch processing mode.'
  },
  {
    id: 'type',
    label: 'Select dependency classification',
    description:
      'Choose the dependency type so the gateway template can tailor sections and wording.'
  },
  {
    id: 'identifier',
    label: 'Enter dependency identifier',
    description:
      'Provide the dependency name in natural language (e.g., "Jumpcloud API 2.0", "React", "Stripe") or canonical identifier (e.g., vercel/ai, @scope/package).'
  }
];

const BATCH_MODE_STEPS: PromptStep[] = [
  {
    id: 'mode',
    label: 'Select processing mode',
    description: 'Choose single dependency or batch processing mode.'
  },
  {
    id: 'batch-input',
    label: 'Enter batch dependencies',
    description:
      'Enter identifiers separated by commas, one per line, or @path/to/file.txt (.txt or .json files supported)'
  }
];

const DEFAULTS: PromptValues = {
  mode: 'single',
  dependencyType: 'library',
  dependencyIdentifier: ''
};

const dependencyTypeItems = [
  { label: 'Framework', value: 'framework' as const },
  { label: 'API', value: 'api' as const },
  { label: 'Library', value: 'library' as const },
  { label: 'Tool', value: 'tool' as const },
  { label: 'Other', value: 'other' as const }
];

const processingModeItems = [
  { label: 'Single Dependency', value: 'single' as const },
  { label: 'Batch Processing', value: 'batch' as const }
];

const combineDefaults = (initial?: Partial<PromptValues>): PromptValues => ({
  ...DEFAULTS,
  ...initial
});

export const GenerationPrompt: React.FC<GenerationPromptProps> = ({
  preferences,
  layout,
  initialValues,
  onSubmit,
  onCancel
}) => {
  const [values, setValues] = useState<PromptValues>(() => combineDefaults(initialValues));
  const [currentStep, setCurrentStep] = useState<StepId>('mode');
  const [error, setError] = useState<string>();
  const [detectedSource, setDetectedSource] = useState<SourceType | null>(null);
  const [isAiAssisted, setIsAiAssisted] = useState<boolean>(false);
  const [batchPreview, setBatchPreview] = useState<string | null>(null);
  const { formatters } = preferences.theme;

  useInput((input, key) => {
    if (key.escape || input?.toLowerCase() === 'q') {
      onCancel();
    }
  });

  // Determine which steps to use based on mode
  const STEPS = values.mode === 'batch' ? BATCH_MODE_STEPS : SINGLE_MODE_STEPS;
  const stepIndex = STEPS.findIndex((step) => step.id === currentStep);
  const totalSteps = STEPS.length;
  const stepMeta = STEPS[stepIndex] ?? STEPS[0];

  const advanceStep = (nextValues?: PromptValues): void => {
    setError(undefined);
    const latestValues = nextValues ?? values;
    if (stepIndex + 1 >= totalSteps) {
      onSubmit(latestValues);
      return;
    }
    setCurrentStep(STEPS[stepIndex + 1]?.id ?? 'mode');
  };

  const handleModeSelect = (mode: 'single' | 'batch'): void => {
    const next = { ...values, mode };
    setValues(next);
    advanceStep(next);
  };

  const handleIdentifierChange = (input: string): void => {
    setValues((prev) => ({ ...prev, dependencyIdentifier: input }));
    if (error) {
      setError(undefined);
    }

    // Detect source type on change to show feedback immediately
    if (input.trim()) {
      const detection = detectSourceType(input.trim());
      setDetectedSource(detection.sourceType);
      setIsAiAssisted(false); // Static detection
    } else {
      setDetectedSource(null);
      setIsAiAssisted(false);
    }
  };

  const handleIdentifierSubmit = async (input: string): Promise<void> => {
    if (!input.trim()) {
      setError('Dependency identifier cannot be empty.');
      return;
    }

    // Try AI-assisted detection first
    try {
      const detection = await detectSourceTypeWithAI(input.trim());
      setDetectedSource(detection.sourceType);
      setIsAiAssisted(detection.aiAssisted || false);
    } catch (error) {
      // Fall back to static detection
      const detection = detectSourceType(input.trim());
      setDetectedSource(detection.sourceType);
      setIsAiAssisted(false);
    }

    const next = {
      ...values,
      dependencyIdentifier: input.trim()
    };
    setValues(next);
    advanceStep(next);
  };


  const handleBatchInputChange = async (input: string): Promise<void> => {
    setValues((prev) => ({ ...prev, batchInput: input }));
    if (error) {
      setError(undefined);
    }

    // Show preview for batch input
    if (input.trim()) {
      try {
        const parsed = await parseBatchInput(input.trim());
        const classificationResult = classifyBatch(parsed.dependencies);
        const classified = classificationResult.classified;
        const typeGroups = classified.reduce((acc, dep) => {
          acc[dep.dependencyType] = (acc[dep.dependencyType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const preview = Object.entries(typeGroups)
          .map(([type, count]) => `${type}: ${count}`)
          .join(', ');
        const sampleItems = classified
          .slice(0, 5)
          .map((dep) => `${dep.identifier} — ${dep.dependencyType}`)
          .join(', ');
        const sampleSuffix = classified.length > 5 ? ', …' : '';

        setBatchPreview(
          `${classified.length} dependencies detected (${preview})\nSamples: ${sampleItems}${sampleSuffix}`
        );
      } catch (err) {
        setBatchPreview(null);
      }
    } else {
      setBatchPreview(null);
    }
  };

  const handleBatchInputSubmit = async (input: string): Promise<void> => {
    if (!input.trim()) {
      setError('Batch input cannot be empty.');
      return;
    }

    try {
      const parsed = await parseBatchInput(input.trim());
      const identifiers = parsed.dependencies.map(d => d.identifier);

      const next = {
        ...values,
        batchInput: input.trim(),
        batchIdentifiers: identifiers
      };
      setValues(next);
      advanceStep(next);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Batch input error: ${errorMessage}`);
    }
  };

  return (
    <Box
      flexDirection="column"
      paddingX={layout.paddingX}
      paddingY={1}
      width={layout.width}
    >
      <Text>
        {formatters.accent(`Step ${stepIndex + 1} of ${totalSteps}`)}
      </Text>
      <Box marginTop={1}>
        <Text>
          {formatters.primary(stepMeta.label)}
        </Text>
      </Box>
      <Box>
        <Text>
          {formatters.neutral(stepMeta.description)}
        </Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        {currentStep === 'mode' && (
          <SelectInput
            items={processingModeItems}
            onSelect={(item) => handleModeSelect(item.value)}
          />
        )}

        {currentStep === 'type' && (
          <SelectInput
            items={dependencyTypeItems}
            onSelect={(item) => {
              const next = { ...values, dependencyType: item.value };
              setValues(next);
              advanceStep(next);
            }}
          />
        )}

        {currentStep === 'identifier' && (
          <>
            <TextInput
              value={values.dependencyIdentifier}
              placeholder="e.g. vercel/ai or @scope/package"
              onChange={handleIdentifierChange}
              onSubmit={handleIdentifierSubmit}
            />
            {detectedSource && (
              <Box marginTop={1}>
                {detectedSource === 'github' && (
                  <Text color="green">✓ GitHub repository detected{isAiAssisted ? ' (AI-assisted)' : ''}</Text>
                )}
                {detectedSource === 'npm' && (
                  <Text color="blue">📦 NPM package detected{isAiAssisted ? ' (AI-assisted)' : ''}</Text>
                )}
                {detectedSource === 'url' && (
                  <Text color="cyan">🌐 URL detected{isAiAssisted ? ' (AI-assisted)' : ''}</Text>
                )}
                {detectedSource === 'unknown' && (
                  <Text color="yellow">⚠ Source type unclear - system will attempt automatic detection{isAiAssisted ? ' (AI-assisted)' : ''}</Text>
                )}
              </Box>
            )}
          </>
        )}


        {currentStep === 'batch-input' && (
          <>
            <TextInput
              value={values.batchInput || ''}
              placeholder="e.g. vercel/ai, @scope/pkg, react or @deps.txt"
              onChange={(value) => void handleBatchInputChange(value)}
              onSubmit={(value) => void handleBatchInputSubmit(value)}
            />
            {batchPreview && (
              <Box marginTop={1}>
                <Text color="green">✓ {batchPreview}</Text>
              </Box>
            )}
            <Box marginTop={1}>
              <Text dimColor>
                Supported formats: .txt (one per line), .json (array of objects with identifier, type?, deepWiki?)
              </Text>
            </Box>
          </>
        )}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>
          Step {stepIndex + 1} of {totalSteps}. Press Enter to continue. Press Q or Esc to
          cancel and exit.
        </Text>
      </Box>

      {error && (
        <Box marginTop={1}>
          <Text color="red">{error}</Text>
        </Box>
      )}
    </Box>
  );
};
