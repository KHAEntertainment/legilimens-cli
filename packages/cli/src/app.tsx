import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from 'ink';
import { resolve } from 'node:path';
import type { CliEnvironment } from './config/env.js';
import { loadCliEnvironment } from './config/env.js';
import { loadAsciiBanner, type BannerResult } from './assets/asciiBanner.js';
import { WelcomeScreen } from './components/WelcomeScreen.js';
import { GenerationFlow } from './components/GenerationFlow.js';
import { loadCliPreferences, type CliPreferences } from './config/preferences.js';

type ViewState = 'welcome' | 'generation' | 'exiting';

export interface AppProps {
  environment?: CliEnvironment;
  preferences?: CliPreferences;
}

const resolveTerminalWidth = (): number | undefined => {
  const stdout = process.stdout;
  if (stdout && typeof stdout.columns === 'number' && Number.isFinite(stdout.columns)) {
    return stdout.columns;
  }
  return undefined;
};

export interface LayoutConfig {
  width: number;
  paddingX: number;
}

export const App: React.FC<AppProps> = ({
  environment: providedEnvironment,
  preferences: providedPreferences
}) => {
  const environment = useMemo<CliEnvironment>(
    () => providedEnvironment ?? loadCliEnvironment(),
    [providedEnvironment]
  );
  const preferences = useMemo<CliPreferences>(
    () =>
      providedPreferences ??
      loadCliPreferences({
        environment,
        stdout: process.stdout
      }),
    [providedPreferences, environment]
  );
  const [view, setView] = useState<ViewState>('welcome');
  const [skipUsed, setSkipUsed] = useState(false);
  const { exit } = useApp();
  const asciiAssetPath = useMemo(
    () => resolve(environment.directories.rootDir, 'docs/ascii-art.md'),
    [environment.directories.rootDir]
  );
  const layout = useMemo<LayoutConfig>(() => {
    const terminalWidth = resolveTerminalWidth();
    const maxWidth = preferences.theme.maxContentWidth;
    const width = Math.min(maxWidth, terminalWidth ?? maxWidth);
    const paddingX = width < maxWidth ? 0 : 1;
    return { width, paddingX };
  }, [preferences.theme.maxContentWidth]);

  const banner: BannerResult = useMemo(
    () =>
      loadAsciiBanner({
        minimal: !preferences.theme.asciiArtEnabled,
        width: layout.width,
        externalPath: asciiAssetPath
      }),
    [preferences.theme.asciiArtEnabled, layout.width, asciiAssetPath]
  );

  useEffect(() => {
    if (view === 'exiting') {
      exit();
    }
  }, [view, exit]);

  const handleContinue = (): void => {
    setSkipUsed(false);
    setView('generation');
  };

  const handleSkip = (): void => {
    setSkipUsed(true);
    setView('generation');
  };

  const handleQuit = (): void => {
    setView('exiting');
  };

  if (view === 'welcome') {
    return (
      <WelcomeScreen
        banner={banner}
        preferences={preferences}
        layout={layout}
        onContinue={handleContinue}
        onSkip={handleSkip}
        onQuit={handleQuit}
      />
    );
  }

  if (view === 'generation') {
    return (
      <GenerationFlow
        environment={environment}
        preferences={preferences}
        layout={layout}
        skipUsed={skipUsed}
        onExit={handleQuit}
      />
    );
  }

  return null;
};

export default App;
