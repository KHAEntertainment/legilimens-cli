import React from 'react';
import { Box, Text } from 'ink';
import type { CliPreferences } from '../config/preferences.js';

export interface LogEntry {
  timestamp: number;
  message: string;
  level: 'info' | 'warn' | 'error' | 'debug';
}

export interface LiveLogProps {
  entries: LogEntry[];
  maxEntries?: number;
  preferences: CliPreferences;
}

export const LiveLog: React.FC<LiveLogProps> = ({
  entries,
  maxEntries = 10,
  preferences
}) => {
  const { formatters } = preferences.theme;
  
  // Show only the most recent entries
  const recentEntries = entries.slice(-maxEntries);
  
  if (recentEntries.length === 0) {
    return null;
  }

  const formatLevel = (level: LogEntry['level']): string => {
    switch (level) {
      case 'error':
        return formatters.error('[ERROR]');
      case 'warn':
        return formatters.warning('[WARN]');
      case 'debug':
        return formatters.neutral('[DEBUG]');
      default:
        return formatters.info('[INFO]');
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 1
    });
  };

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text>{formatters.accent('━━━ Live Log ━━━')}</Text>
      {recentEntries.map((entry, index) => (
        <Text key={`${entry.timestamp}-${index}`}>
          <Text>{formatters.neutral(formatTimestamp(entry.timestamp))}</Text>
          <Text>{' '}</Text>
          <Text>{formatLevel(entry.level)}</Text>
          <Text>{' '}</Text>
          <Text>{entry.message}</Text>
        </Text>
      ))}
    </Box>
  );
};
