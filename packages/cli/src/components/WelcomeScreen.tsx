import React from 'react';
import { Box, Text, useInput } from 'ink';
import type { BannerResult } from '../assets/asciiBanner.js';
import { brandTheme, formatModeLabel } from '../theme/brandTheme.js';
import type { CliPreferences } from '../config/preferences.js';
import type { LayoutConfig } from '../app.js';

export interface WelcomeScreenProps {
  banner: BannerResult;
  preferences: CliPreferences;
  layout: LayoutConfig;
  onContinue: () => void;
  onSkip: () => void;
  onQuit: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  banner,
  preferences,
  layout,
  onContinue,
  onSkip,
  onQuit
}) => {
  const { theme } = preferences;
  const bannerLines = theme.asciiArtEnabled ? banner.lines : [];
  const bannerDiagnostics =
    banner.source !== 'figlet' && theme.asciiArtEnabled
      ? banner.diagnostics
      : undefined;

  useInput((input, key) => {
    if (key.return || input?.toLowerCase() === 'c') {
      onContinue();
      return;
    }

    if (input?.toLowerCase() === 's') {
      onSkip();
      return;
    }

    if (key.escape || input?.toLowerCase() === 'q') {
      onQuit();
    }
  });

  return (
    <Box
      flexDirection="column"
      paddingX={layout.paddingX}
      paddingY={1}
      width={layout.width}
    >
      {bannerLines.length > 0 && (
        <Box flexDirection="column">
          {bannerLines.map((line, index) => (
            <Text key={`banner-${index}`}>
              {theme.formatters.gradient(line)}
            </Text>
          ))}
        </Box>
      )}

      {bannerLines.length === 0 && (
        <Text>
          {theme.formatters.primary('Legilimens CLI')}
        </Text>
      )}

      <Box marginTop={1}>
        <Text>
          {theme.formatters.accent('Welcome to Legilimens')}
        </Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text>
          {theme.formatters.primary(
            `${brandTheme.bullets.primary} Build modern gateway docs with an agentic CLI that feels familiar from Codex, Copilot, and Claude experiences.`,
          )}
        </Text>
        <Text>
          {theme.formatters.primary(
            `${brandTheme.bullets.primary} ${brandTheme.tagline}`,
          )}
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text>
          {theme.formatters.neutral(`Active mode: ${formatModeLabel(preferences.mode)}`)}
        </Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text>
          {theme.formatters.accent('Controls')}
        </Text>
        <Text>
          {theme.formatters.primary(
            `${brandTheme.bullets.secondary} Press Enter to start the guided generation flow.`,
          )}
        </Text>
        <Text>
          {theme.formatters.primary(
            `${brandTheme.bullets.secondary} Press S to skip the welcome and jump straight into prompts.`,
          )}
        </Text>
        <Text>
          {theme.formatters.primary(
            `${brandTheme.bullets.secondary} Press Q or Esc to exit at any time.`,
          )}
        </Text>
      </Box>

      {bannerDiagnostics && (
        <Box marginTop={1}>
          <Text dimColor>{bannerDiagnostics}</Text>
        </Box>
      )}

      {preferences.minimal && (
        <Box marginTop={1}>
          <Text dimColor>
            Minimal mode trims ASCII art and gradients while keeping the workflow intact.
          </Text>
        </Box>
      )}
    </Box>
  );
};
