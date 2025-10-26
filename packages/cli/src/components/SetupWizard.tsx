import React, { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import { detectInstalledCliTools, type CliToolName } from '@legilimens/core';
import type { CliPreferences } from '../config/preferences.js';
import { getStorageMethod } from '../config/secrets.js';
import { loadAsciiBanner, type BannerResult } from '../assets/asciiBanner.js';

export interface SetupConfig {
  apiKeys: {
    firecrawl?: string;
    context7?: string;
    refTools?: string;
  };
  aiCliTool?: CliToolName | 'auto-detect';
  aiCliCommandOverride?: string;
  setupCompleted: boolean;
  configVersion?: string;
}

export interface SetupWizardProps {
  preferences?: CliPreferences;
  onComplete: (config: SetupConfig) => void;
  onSkip: () => void;
}

type StepId = 'welcome' | 'api-keys' | 'ai-tool' | 'command-override' | 'confirm';

interface WizardStep {
  id: StepId;
  label: string;
  description: string;
}

const STEPS: WizardStep[] = [
  {
    id: 'welcome',
    label: 'Welcome to Legilimens Setup',
    description: 'This wizard will guide you through configuring API keys and AI CLI tools.'
  },
  {
    id: 'api-keys',
    label: 'API Keys Configuration',
    description: 'Configure API keys for documentation fetchers (optional).'
  },
  {
    id: 'ai-tool',
    label: 'AI CLI Tool Selection',
    description: 'Select your preferred AI CLI tool or auto-detect.'
  },
  {
    id: 'command-override',
    label: 'Custom Command Path',
    description: 'Optionally specify a custom path for your AI CLI tool.'
  },
  {
    id: 'confirm',
    label: 'Review Configuration',
    description: 'Review and confirm your configuration.'
  }
];

export const SetupWizard: React.FC<SetupWizardProps> = ({
  preferences,
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState<StepId>('welcome');
  const [config, setConfig] = useState<SetupConfig>({
    apiKeys: {},
    setupCompleted: false
  });
  const [tempInput, setTempInput] = useState('');
  const [error, setError] = useState<string>();
  const [focusedFieldIndex, setFocusedFieldIndex] = useState(0);

  const stepIndex = STEPS.findIndex(step => step.id === currentStep);
  const step = STEPS[stepIndex] ?? STEPS[0];
  const theme = preferences?.theme.formatters;

  // Load ASCII banner for setup wizard
  const banner: BannerResult = useMemo(() => {
    const width = Math.min(80, process.stdout.columns ?? 80);
    return loadAsciiBanner({
      minimal: preferences?.minimal ?? false,
      width,
      externalPath: undefined
    });
  }, [preferences?.minimal]);

  useInput((input, key) => {
    if (key.escape || input?.toLowerCase() === 'q') {
      onSkip();
    }
    if (key.return && currentStep === 'welcome') {
      advanceStep();
    }
    if (key.return && currentStep === 'api-keys') {
      advanceStep();
    }
    if (key.return && currentStep === 'confirm') {
      advanceStep();
    }
    if (key.tab && currentStep === 'api-keys') {
      // Cycle through API key fields
      setFocusedFieldIndex((prev) => (prev + 1) % 3);
    }
    if (key.shift && key.tab && currentStep === 'api-keys') {
      // Cycle backwards through API key fields
      setFocusedFieldIndex((prev) => (prev - 1 + 3) % 3);
    }
    if (input?.toLowerCase() === 'b' && stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1]?.id ?? 'welcome');
      setError(undefined);
      setFocusedFieldIndex(0);
    }
  });

  const advanceStep = () => {
    setError(undefined);
    setFocusedFieldIndex(0);
    const nextIndex = stepIndex + 1;
    if (nextIndex >= STEPS.length) {
      onComplete({ ...config, setupCompleted: true });
      return;
    }
    setCurrentStep(STEPS[nextIndex]?.id ?? 'welcome');
  };

  const handleApiKeySubmit = () => {
    // API keys are optional, so we can always advance
    advanceStep();
  };

  const handleAiToolSelect = (item: { value: CliToolName | 'auto-detect' }) => {
    setConfig(prev => ({ ...prev, aiCliTool: item.value }));
    advanceStep();
  };

  const handleCommandOverrideSubmit = (input: string) => {
    if (input.trim()) {
      setConfig(prev => ({ ...prev, aiCliCommandOverride: input.trim() }));
    }
    advanceStep();
  };

  const handleApiKeyChange = (key: keyof SetupConfig['apiKeys'], value: string) => {
    setConfig(prev => ({
      ...prev,
      apiKeys: { ...prev.apiKeys, [key]: value }
    }));
  };

  // Detect available AI tools
  const { availableTools } = detectInstalledCliTools();
  const aiToolItems = [
    { label: 'Auto-detect (recommended)', value: 'auto-detect' as const },
    ...availableTools.map(tool => ({
      label: `${tool.name} ${tool.available ? '✓' : ''}`,
      value: tool.name
    }))
  ];

  // Get storage method for confirmation
  const storageMethod = getStorageMethod();

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      {/* ASCII Banner */}
      {currentStep === 'welcome' && (
        <Box marginBottom={2}>
          <Text>{banner.lines.join('\n')}</Text>
        </Box>
      )}

      <Text>
        {theme?.accent(`Step ${stepIndex + 1} of ${STEPS.length}`) ?? `Step ${stepIndex + 1} of ${STEPS.length}`}
      </Text>

      <Box marginTop={1}>
        <Text>{theme?.primary(step.label) ?? step.label}</Text>
      </Box>

      <Box marginTop={1}>
        <Text>{theme?.neutral(step.description) ?? step.description}</Text>
      </Box>

      <Box marginTop={2} flexDirection="column">
        {currentStep === 'welcome' && (
          <>
            <Text>Press Enter to begin configuration</Text>
            <Box marginTop={1}>
              <Text dimColor>Or press Q/Esc to skip setup and use environment variables</Text>
            </Box>
          </>
        )}

        {currentStep === 'api-keys' && (
          <>
            <Box marginBottom={1}>
              <Text dimColor>Press Tab/Shift+Tab to move, Enter to continue. Keys are optional.</Text>
            </Box>
            
            <Box flexDirection="column">
              <Text>{focusedFieldIndex === 0 ? '> ' : '  '}Firecrawl API Key (optional):</Text>
              <TextInput
                value={config.apiKeys.firecrawl ?? ''}
                placeholder="Enter key or leave empty to skip"
                mask="*"
                focus={focusedFieldIndex === 0}
                onChange={(value) => handleApiKeyChange('firecrawl', value)}
              />
            </Box>

            <Box marginTop={1} flexDirection="column">
              <Text>{focusedFieldIndex === 1 ? '> ' : '  '}Context7 API Key (optional):</Text>
              <TextInput
                value={config.apiKeys.context7 ?? ''}
                placeholder="Enter key or leave empty to skip"
                mask="*"
                focus={focusedFieldIndex === 1}
                onChange={(value) => handleApiKeyChange('context7', value)}
              />
            </Box>

            <Box marginTop={1} flexDirection="column">
              <Text>{focusedFieldIndex === 2 ? '> ' : '  '}RefTools API Key (optional):</Text>
              <TextInput
                value={config.apiKeys.refTools ?? ''}
                placeholder="Enter key or leave empty to skip"
                mask="*"
                focus={focusedFieldIndex === 2}
                onChange={(value) => handleApiKeyChange('refTools', value)}
                onSubmit={handleApiKeySubmit}
              />
            </Box>
          </>
        )}

        {currentStep === 'ai-tool' && (
          <>
            <SelectInput
              items={aiToolItems}
              onSelect={handleAiToolSelect}
            />
            {availableTools.length === 0 && (
              <Box marginTop={1}>
                <Text color="yellow">⚠ No AI CLI tools detected on system</Text>
              </Box>
            )}
          </>
        )}

        {currentStep === 'command-override' && (
          <>
            <TextInput
              value={tempInput}
              placeholder="e.g., /custom/path/to/gemini (or leave empty)"
              onChange={setTempInput}
              onSubmit={handleCommandOverrideSubmit}
            />
            <Box marginTop={1}>
              <Text dimColor>Leave empty to use system PATH</Text>
            </Box>
          </>
        )}

        {currentStep === 'confirm' && (
          <>
            <Box flexDirection="column">
              <Text color="green">✓ Configuration Summary:</Text>
              <Box marginTop={1} flexDirection="column">
                <Text>• API Keys: {Object.values(config.apiKeys).filter(Boolean).length} configured</Text>
                <Text>• AI Tool: {config.aiCliTool ?? 'auto-detect'}</Text>
                {config.aiCliCommandOverride && (
                  <Text>• Custom Path: {config.aiCliCommandOverride}</Text>
                )}
                {Object.values(config.apiKeys).some(Boolean) && (
                  <Text>• Storage: Keys will be stored in {storageMethod}</Text>
                )}
              </Box>
            </Box>

            {/* AI Tool Detection Results */}
            {availableTools.length > 0 && (
              <Box marginTop={1} flexDirection="column">
                <Text color="blue">Detected AI CLI Tools:</Text>
                {availableTools.map((tool, idx) => (
                  <Box key={idx} marginLeft={2}>
                    <Text>
                      {tool.available ? '✓' : '✗'} {tool.name}
                      {tool.available ? ' (available)' : ' (not available)'}
                    </Text>
                  </Box>
                ))}
                <Box marginTop={1} marginLeft={2}>
                  <Text dimColor>
                    Override with LEGILIMENS_AI_CLI_TOOL environment variable
                  </Text>
                </Box>
              </Box>
            )}

            <Box marginTop={2}>
              <Text>Press Enter to save configuration</Text>
            </Box>
            <Box>
              <Text dimColor>Configuration will be saved to ~/.legilimens/config.json</Text>
            </Box>
          </>
        )}
      </Box>

      {error && (
        <Box marginTop={1}>
          <Text color="red">{error}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>
          {stepIndex > 0 ? 'Press B to go back • ' : ''}Press Q or Esc to skip setup
        </Text>
      </Box>
    </Box>
  );
};
