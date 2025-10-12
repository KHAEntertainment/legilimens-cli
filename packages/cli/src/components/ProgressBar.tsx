import React from 'react';
import { Box, Text } from 'ink';
import type { CliPreferences } from '../config/preferences.js';

export interface ProgressBarProps {
  value: number;
  width?: number;
  preferences: CliPreferences;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  width = 20,
  preferences
}) => {
  const { formatters } = preferences.theme;
  
  // Ensure value is between 0 and 100
  const clampedValue = Math.max(0, Math.min(100, value));
  const filledCount = Math.round((clampedValue / 100) * width);
  const emptyCount = width - filledCount;
  
  const filledBar = '#'.repeat(filledCount);
  const emptyBar = '.'.repeat(emptyCount);
  
  return (
    <Box flexDirection="row" alignItems="center">
      <Text>{formatters.accent('[')}</Text>
      <Text>{formatters.primary(filledBar)}</Text>
      <Text>{formatters.neutral(emptyBar)}</Text>
      <Text>{formatters.accent(']')}</Text>
      <Text>{' '}</Text>
      <Text>{formatters.neutral(`${Math.round(clampedValue)}%`)}</Text>
    </Box>
  );
};
