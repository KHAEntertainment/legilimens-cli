import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { brandTheme } from '../theme/brandTheme.js';
import type { GenerationRunResult } from '../flows/runGeneration.js';
import type { BatchGenerationResult } from '../flows/batchGeneration.js';
import type { CliPreferences } from '../config/preferences.js';
import type { LayoutConfig } from '../app.js';
import type { DependencyType } from '@legilimens/core';

export interface CompletionSummaryProps {
  result?: GenerationRunResult;
  batchResult?: BatchGenerationResult;
  preferences: CliPreferences;
  layout: LayoutConfig;
  onDone?: (choice: 'again' | 'quit') => void;
}

/**
 * Group results by dependency type
 */
function groupResultsByType(results: GenerationRunResult[]): Record<DependencyType, GenerationRunResult[]> {
  const grouped: Partial<Record<DependencyType, GenerationRunResult[]>> = {};

  for (const result of results) {
    if (result.success) {
      const type = result.input.dependencyType as DependencyType;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(result);
    }
  }

  return grouped as Record<DependencyType, GenerationRunResult[]>;
}

/**
 * Format batch statistics
 */
function formatBatchStatistics(statistics: BatchGenerationResult['statistics']): string {
  const durationSec = (statistics.durationMs / 1000).toFixed(1);
  return `Total: ${statistics.total} | Succeeded: ${statistics.succeeded} | Failed: ${statistics.failed} | Duration: ${durationSec}s`;
}

/**
 * Format failure list
 */
function formatFailureList(results: GenerationRunResult[]): string[] {
  return results
    .filter((r) => !r.success)
    .map((r) => `• ${r.input.dependencyIdentifier}: ${r.error.message}`);
}

export const CompletionSummary: React.FC<CompletionSummaryProps> = ({
  result,
  batchResult,
  preferences,
  layout,
  onDone
}) => {
  const { formatters } = preferences.theme;

  const handleSelect = (item: { value: 'again' | 'quit' }) => {
    onDone?.(item.value);
  };

  const restartOptions = [
    { label: 'Process another', value: 'again' as const },
    { label: 'Quit', value: 'quit' as const }
  ];

  // Batch mode rendering
  if (batchResult) {
    const grouped = groupResultsByType(batchResult.results);
    const failures = batchResult.results.filter((r) => !r.success);

    return (
      <Box
        flexDirection="column"
        paddingX={layout.paddingX}
        paddingY={1}
        width={layout.width}
      >
        <Text>
          {formatters.accent('Batch Generation Summary')}
        </Text>

        {/* Statistics header */}
        <Box marginTop={1}>
          <Text>
            {formatters.primary(formatBatchStatistics(batchResult.statistics))}
          </Text>
        </Box>

        {/* Generated files grouped by type */}
        {Object.keys(grouped).length > 0 && (
          <Box marginTop={1} flexDirection="column">
            <Text>{formatters.accent('Generated Files:')}</Text>
            {Object.entries(grouped).map(([type, results]) => (
              <Box key={type} marginLeft={2} flexDirection="column">
                <Text>
                  {formatters.primary(`${type} (${results.length}):`)}
                </Text>
                <Box marginLeft={2} flexDirection="column">
                  {results.map((r, idx) => (
                    <Text key={idx} dimColor>
                      • {r.success ? r.result.metadata.gatewayRelativePath : `${r.input.dependencyIdentifier} (failed)`}
                    </Text>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* Failures section */}
        {failures.length > 0 && (
          <Box marginTop={1} flexDirection="column">
            <Text color="yellow">{formatters.accent('Failures:')}</Text>
            {formatFailureList(batchResult.results).map((failure, idx) => (
              <Box key={idx} marginLeft={2}>
                <Text color="red">{failure}</Text>
              </Box>
            ))}
            <Box marginTop={1} marginLeft={2} flexDirection="column">
              <Text color="yellow">{formatters.accent('Troubleshooting:')}</Text>
              <Box marginLeft={2} flexDirection="column">
                <Text dimColor>• Check identifier format (GitHub: owner/repo, NPM: @scope/pkg)</Text>
                <Text dimColor>• Verify API keys are configured and valid</Text>
                <Text dimColor>• Ensure network connectivity and firewall settings</Text>
                <Text dimColor>• Check docsDir/template overrides via environment variables</Text>
                <Text dimColor>• Review template path resolution in error messages</Text>
              </Box>
            </Box>
          </Box>
        )}

        {/* Aggregate DeepWiki references */}
        <Box marginTop={1}>
          <Text>
            {formatters.neutral(
              'Review the generated gateway files and static backups in your docs directory.'
            )}
          </Text>
        </Box>

        <Box marginTop={1}>
          <Text dimColor>{batchResult.summary}</Text>
        </Box>

        <Box marginTop={1}>
          <Text>
            {formatters.primary(`${brandTheme.bullets.primary} ${brandTheme.tagline}`)}
          </Text>
        </Box>

        <Box marginTop={1}>
          <SelectInput
            items={restartOptions}
            onSelect={handleSelect}
          />
        </Box>
      </Box>
    );
  }

  // Single mode rendering (existing behavior)
  if (result) {
    return (
      <Box
        flexDirection="column"
        paddingX={layout.paddingX}
        paddingY={1}
        width={layout.width}
      >
        <Text>
          {formatters.accent('Generation summary')}
        </Text>

        {result.success ? (
          <>
            <Box marginTop={1}>
              <Text>
                {formatters.primary(`Gateway doc: ${result.result.metadata.gatewayRelativePath}`)}
              </Text>
            </Box>
            <Box>
              <Text>
                {formatters.primary(
                  `Static backup: ${result.result.metadata.staticBackupRelativePath}`
                )}
              </Text>
            </Box>
            <Box marginTop={1}>
              <Text>
                {formatters.neutral(
                  `DeepWiki reference: ${result.result.metadata.deepWikiRepository ?? 'Not provided'}`
                )}
              </Text>
            </Box>
            <Box>
              <Text>
                {formatters.neutral(
                  'Review the generated files and commit when they match the canonical template expectations.'
                )}
              </Text>
            </Box>
            <Box marginTop={1}>
              <Text dimColor>{result.result.summary}</Text>
            </Box>
            <Box>
              <Text dimColor>{`Session ID: ${result.result.metadata.sessionId}`}</Text>
            </Box>
          </>
        ) : (
          <>
            <Box marginTop={1}>
              <Text color="yellow">
                Generation failed due to a template error.
              </Text>
            </Box>
            <Box marginTop={1}>
              <Text dimColor>Template path: {result.input.templatePath}</Text>
            </Box>
            <Box marginTop={1}>
              <Text dimColor>{result.error.message}</Text>
            </Box>
            <Box marginTop={1}>
              <Text>
                {formatters.neutral(
                  'Ensure template exists at the path above or set LEGILIMENS_DOCS_DIR or pass a custom template path.'
                )}
              </Text>
            </Box>
          </>
        )}

        <Box marginTop={1}>
          <Text>
            {formatters.primary(`${brandTheme.bullets.primary} ${brandTheme.tagline}`)}
          </Text>
        </Box>

        <Box marginTop={1}>
          <SelectInput
            items={restartOptions}
            onSelect={handleSelect}
          />
        </Box>
      </Box>
    );
  }

  return null;
};
