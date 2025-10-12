import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from 'ink';
import { resolve } from 'node:path';
import type { CliEnvironment } from './config/env.js';
import { loadCliEnvironment } from './config/env.js';
import { assertSupportedNode } from '@legilimens/core';
import { loadAsciiBanner, type BannerResult } from './assets/asciiBanner.js';
import { WelcomeScreen } from './components/WelcomeScreen.js';
import { GenerationFlow } from './components/GenerationFlow.js';
import { SetupWizard, type SetupConfig } from './components/SetupWizard.js';
import { CompletionSummary } from './components/CompletionSummary.js';
import { saveUserConfig, isSetupRequired, CONFIG_VERSION, type UserConfig } from './config/userConfig.js';
import { loadCliPreferences, type CliPreferences } from './config/preferences.js';
import type { GenerationRunResult } from './flows/runGeneration.js';
import type { BatchGenerationResult } from './flows/batchGeneration.js';
import type { PromptValues } from './components/GenerationPrompt.js';

type ViewState = 'setup' | 'welcome' | 'generation' | 'postrun' | 'exiting';

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
  const [environment, setEnvironment] = useState<CliEnvironment>(
    providedEnvironment ?? (() => {
      // Synchronous fallback for initial state
      const runtime = assertSupportedNode();
      return {
        runtime,
        mode: 'default',
        minimalMode: false,
        lowContrastMode: false,
        directories: runtime.directories,
        rawArgs: [],
        userConfigLoaded: false,
        configSource: 'env'
      };
    })()
  );
  const [preferences, setPreferences] = useState<CliPreferences>(
    providedPreferences ?? (() => {
      // Synchronous fallback for initial state
      const runtime = assertSupportedNode();
      const environment = {
        runtime,
        mode: 'default' as const,
        minimalMode: false,
        lowContrastMode: false,
        directories: runtime.directories,
        rawArgs: [],
        userConfigLoaded: false,
        configSource: 'env' as const
      };
      return {
        environment,
        mode: 'default' as const,
        minimal: false,
        lowContrast: false,
        ansiEnabled: true,
        theme: {
          id: 'modern' as const,
          label: 'Modern mode',
          asciiArtEnabled: true,
          asciiMode: 'full' as const,
          renderOptions: { forcePlain: false },
          palette: {
            primary: '#7F5AF0',
            secondary: '#2CB1BC',
            accent: '#F6C177',
            neutral: '#94A3B8',
            emphasis: '#E2E8F0',
            background: '#0F172A'
          },
          description: 'Default rich experience with gradients, ASCII art, and vivid Legilimens branding.',
          maxContentWidth: 80,
          formatters: {
            primary: (text: string) => text,
            accent: (text: string) => text,
            neutral: (text: string) => text,
            emphasis: (text: string) => text,
            gradient: (text: string) => text,
            error: (text: string) => text,
            warning: (text: string) => text,
            info: (text: string) => text
          }
        }
      };
    })()
  );

  // Check if setup is required
  const setupRequired = useMemo(() => {
    // Force setup if LEGILIMENS_FORCE_SETUP is set
    if (process.env.LEGILIMENS_FORCE_SETUP === 'true') {
      return true;
    }
    return isSetupRequired(process.env);
  }, []);
  const [view, setView] = useState<ViewState>(setupRequired ? 'setup' : 'welcome');
  const [skipUsed, setSkipUsed] = useState(false);
  const [lastResult, setLastResult] = useState<GenerationRunResult | null>(null);
  const [lastBatchResult, setLastBatchResult] = useState<BatchGenerationResult | null>(null);
  const [lastValues, setLastValues] = useState<PromptValues | null>(null);
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

  const handleGenerationComplete = (result: GenerationRunResult | null, batchResult: BatchGenerationResult | null, values: PromptValues | null): void => {
    setLastResult(result);
    setLastBatchResult(batchResult);
    setLastValues(values);
    setView('postrun');
  };

  const handlePostrunChoice = (choice: 'again' | 'quit'): void => {
    if (choice === 'again') {
      setView('generation');
    } else {
      setView('exiting');
    }
  };

  const handleQuit = (): void => {
    setView('exiting');
  };

  const handleSetupComplete = async (config: SetupConfig): Promise<void> => {
    const userConfig: UserConfig = {
      apiKeys: config.apiKeys,
      aiCliTool: config.aiCliTool,
      aiCliCommandOverride: config.aiCliCommandOverride,
      setupCompleted: config.setupCompleted,
      configVersion: CONFIG_VERSION
    };
    
    const result = await saveUserConfig(userConfig);
    if (!result.success) {
      console.error('Failed to save configuration:', result.error);
    }
    
    // Refresh environment and preferences after saving config
    const newEnvironment = await loadCliEnvironment();
    const newPreferences = await loadCliPreferences({
      environment: newEnvironment,
      stdout: process.stdout
    });
    
    setEnvironment(newEnvironment);
    setPreferences(newPreferences);
    setView('welcome');
  };

  const handleSetupSkip = async (): Promise<void> => {
    // Mark setup as completed but with empty config
    const emptyConfig: UserConfig = {
      apiKeys: {},
      setupCompleted: true,
      configVersion: CONFIG_VERSION
    };
    await saveUserConfig(emptyConfig);
    
    // Refresh environment and preferences after saving config
    const newEnvironment = await loadCliEnvironment();
    const newPreferences = await loadCliPreferences({
      environment: newEnvironment,
      stdout: process.stdout
    });
    
    setEnvironment(newEnvironment);
    setPreferences(newPreferences);
    setView('welcome');
  };

  if (view === 'setup') {
    return (
      <SetupWizard
        preferences={preferences}
        onComplete={handleSetupComplete}
        onSkip={handleSetupSkip}
      />
    );
  }

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
        initialValues={lastValues || undefined}
        onComplete={handleGenerationComplete}
      />
    );
  }

  if (view === 'postrun') {
    return (
      <CompletionSummary
        result={lastResult || undefined}
        batchResult={lastBatchResult || undefined}
        preferences={preferences}
        layout={layout}
        onDone={handlePostrunChoice}
      />
    );
  }

  return null;
};

export default App;
