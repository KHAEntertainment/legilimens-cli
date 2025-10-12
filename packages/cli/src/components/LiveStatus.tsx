import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import type { CliPreferences } from '../config/preferences.js';

export interface LiveStatusProps {
  title: string;
  subtitle?: string;
  sticky?: boolean;
  preferences: CliPreferences;
}

export const LiveStatus: React.FC<LiveStatusProps> = ({
  title,
  subtitle,
  preferences
}) => {
  const { formatters } = preferences.theme;

  return (
    <Box 
      flexDirection="row" 
      alignItems="center"
      paddingX={1}
      paddingY={0}
      borderStyle="round"
      borderColor="cyan"
      width="100%"
    >
      <Spinner type="dots" />
      <Text>{' '}</Text>
      <Text>{formatters.accent(title)}</Text>
      {subtitle && (
        <>
          <Text>{' — '}</Text>
          <Text>{formatters.neutral(subtitle)}</Text>
        </>
      )}
    </Box>
  );
};
