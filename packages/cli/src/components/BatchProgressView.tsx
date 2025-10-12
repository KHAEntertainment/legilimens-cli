import React from 'react';
import { Box, Text } from 'ink';
import { ProgressTimeline, type TimelineItem } from './ProgressTimeline.js';
import { LiveStatus } from './LiveStatus.js';
import { ProgressBar } from './ProgressBar.js';
import type { CliPreferences } from '../config/preferences.js';
import type { LayoutConfig } from '../app.js';

export interface CurrentBatchItem {
  identifier: string;
  type: string;
  index: number;
  total: number;
}

export interface BatchProgressViewProps {
  batchTimeline: TimelineItem[];
  currentItemTimeline: TimelineItem[];
  currentItem: CurrentBatchItem | null;
  preferences: CliPreferences;
  layout: LayoutConfig;
  processedCount?: number;
  totalCount?: number;
  compact?: boolean;
}

export const BatchProgressView: React.FC<BatchProgressViewProps> = ({
  batchTimeline,
  currentItemTimeline,
  currentItem,
  preferences,
  layout,
  processedCount = 0,
  totalCount = 0,
  compact = false
}) => {
  const { formatters } = preferences.theme;

  // Calculate overall completion percentage
  const completedSteps = batchTimeline.filter((item) => item.status === 'complete').length;
  const totalSteps = batchTimeline.length;
  const completionPercent = Math.round((completedSteps / totalSteps) * 100);

  const batchCurrentCount = currentItem ? currentItem.index : processedCount;
  const batchTotalCount = currentItem ? currentItem.total : totalCount;
  const showCountProgress = batchTotalCount > 0;

  return (
    <Box flexDirection="column" width={layout.width}>
      {/* Sticky header region */}
      <Box flexDirection="column" key="header">
        <LiveStatus
          title="Batch Processing"
          subtitle={currentItem ? `${currentItem.identifier} (${currentItem.type})` : undefined}
          preferences={preferences}
        />
        
        {/* Overall completion with progress bar */}
        <Box flexDirection="column" marginTop={1} marginBottom={1}>
          <Text>{formatters.accent('━━━ Batch Processing Progress ━━━')}</Text>
          <Text>
            {formatters.neutral(`Overall Completion: ${completionPercent}%`)}
          </Text>
          <Box marginTop={0}>
            <ProgressBar value={completionPercent} preferences={preferences} />
          </Box>
        </Box>
      </Box>

      {/* Content region */}
      <Box flexDirection="column" key="content">
        {/* Batch-level timeline */}
        <ProgressTimeline
          items={batchTimeline}
          preferences={preferences}
          layout={layout}
          title="Batch Progress"
          showProgress={showCountProgress}
          currentCount={showCountProgress ? batchCurrentCount : undefined}
          totalCount={showCountProgress ? batchTotalCount : undefined}
          compact={compact}
        />

        {/* Current item section */}
        {currentItem && (
          <Box flexDirection="column" marginTop={1}>
            <Text>
              {formatters.accent(
                `━━━ Current Item [${currentItem.index}/${currentItem.total}] ━━━`
              )}
            </Text>
            <Text>
              {formatters.primary(`Processing: ${currentItem.identifier}`)}
              {' '}
              {formatters.neutral(`(${currentItem.type})`)}
            </Text>

            {/* Current item timeline */}
            <Box marginLeft={2}>
              <ProgressTimeline
                items={currentItemTimeline}
                preferences={preferences}
                layout={layout}
                compact={compact}
              />
            </Box>
          </Box>
        )}

        {/* Batch completion message */}
        {!currentItem && completedSteps === totalSteps && (
          <Box marginTop={1}>
            <Text>{formatters.primary('✓ Batch processing complete')}</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};
