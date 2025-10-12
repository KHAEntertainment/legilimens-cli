import React from 'react';
import { Box, Text } from 'ink';
import type { CliPreferences } from '../config/preferences.js';

export interface PreflightWarningsProps {
  warnings: string[];
  preferences: CliPreferences;
}

export const PreflightWarnings: React.FC<PreflightWarningsProps> = ({
  warnings,
  preferences
}) => {
  const { formatters } = preferences.theme;

  if (warnings.length === 0) {
    return null;
  }

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text>{formatters.warning('━━━ Preflight Warnings ━━━')}</Text>
      {warnings.map((warning, index) => (
        <Text key={index}>
          <Text>{formatters.warning('⚠')}</Text>
          <Text>{' '}</Text>
          <Text>{formatters.neutral(warning)}</Text>
        </Text>
      ))}
    </Box>
  );
};
