import React from 'react';
import { Box, Text } from 'ink';
import type { CliPreferences } from '../config/preferences.js';
import type { LayoutConfig } from '../app.js';
import { ProgressBar } from './ProgressBar.js';
import { parsePercent } from './ProgressUtils.js';

export type ProgressStatus = 'pending' | 'active' | 'complete' | 'error';

export interface TimelineItem {
  id: string;
  label: string;
  status: ProgressStatus;
  detail?: string;
}

export interface ProgressTimelineProps {
  items: TimelineItem[];
  preferences: CliPreferences;
  layout: LayoutConfig;
  title?: string;
  showProgress?: boolean;
  currentCount?: number;
  totalCount?: number;
  compact?: boolean;
}

const statusIcon = (status: ProgressStatus): string => {
  switch (status) {
    case 'complete':
      return '[✓]';
    case 'active':
      return '[>]';
    case 'error':
      return '[!]';
    default:
      return '[ ]';
  }
};

export const ProgressTimeline: React.FC<ProgressTimelineProps> = ({
  items,
  preferences,
  layout,
  title,
  showProgress = false,
  currentCount,
  totalCount,
  compact = false
}) => {
  const { formatters } = preferences.theme;

  // Calculate progress percentage if counts are provided
  const hasProgressCounts =
    showProgress &&
    currentCount !== undefined &&
    totalCount !== undefined &&
    totalCount > 0;

  const progressPercent = hasProgressCounts
    ? Math.round((currentCount / totalCount) * 100)
    : undefined;

  return (
    <Box
      flexDirection="column"
      paddingX={layout.paddingX}
      paddingY={1}
      width={layout.width}
    >
      {/* Optional title header */}
      {title && (
        <Box marginBottom={1}>
          <Text>{formatters.accent(title)}</Text>
        </Box>
      )}

      {/* Optional progress indicator */}
      {hasProgressCounts && progressPercent !== undefined && (
        <Box marginBottom={1}>
          <Text>
            {formatters.neutral(`Progress: ${currentCount}/${totalCount} (${progressPercent}%)`)}
          </Text>
        </Box>
      )}

      {/* Timeline items */}
      {items.map((item) => {
        const icon = statusIcon(item.status);
        const label = (() => {
          if (item.status === 'complete') {
            return formatters.primary(item.label);
          }
          if (item.status === 'active') {
            return formatters.accent(item.label);
          }
          return formatters.neutral(item.label);
        })();

        // In compact mode, suppress detail for completed steps unless error
        const shouldShowDetail = !compact || item.status === 'active' || item.status === 'error';
        const detail = shouldShowDetail && item.detail ? formatters.neutral(` — ${item.detail}`) : '';
        
        // Parse percentage for progress bar on active items
        const percent = item.status === 'active' ? parsePercent(item.detail) : null;

        return (
          <Box key={item.id} flexDirection="column">
            <Text>
              {icon} {label}{detail}
            </Text>
            {percent !== null && (
              <Box marginLeft={2} marginTop={0}>
                <ProgressBar value={percent} preferences={preferences} />
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
};
