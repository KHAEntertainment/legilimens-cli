import { argv, env as processEnv } from 'node:process';
import { assertSupportedNode, type RuntimeConfig } from '@legilimens/core';
import { loadUserConfig, mergeWithEnvVars } from './userConfig.js';

export const FLAG_MINIMAL = '--minimal';
export const FLAG_LOW_CONTRAST = '--low-contrast';
export const ENV_MODE = 'LEGILIMENS_MODE';

export type CliMode = 'default' | 'minimal' | 'low-contrast';

export interface CliEnvironment {
  runtime: RuntimeConfig;
  mode: CliMode;
  minimalMode: boolean;
  lowContrastMode: boolean;
  directories: RuntimeConfig['directories'];
  rawArgs: string[];
  userConfigLoaded: boolean;
  configSource: 'env' | 'file' | 'mixed';
}

const parseModeFromEnv = (env: NodeJS.ProcessEnv): CliMode => {
  const value = env[ENV_MODE]?.toLowerCase();
  if (value === 'minimal') {
    return 'minimal';
  }
  if (value === 'low-contrast' || value === 'low_contrast') {
    return 'low-contrast';
  }
  return 'default';
};

const resolveMode = (args: string[], env: NodeJS.ProcessEnv): CliMode => {
  if (args.includes(FLAG_LOW_CONTRAST)) {
    return 'low-contrast';
  }
  if (args.includes(FLAG_MINIMAL)) {
    return 'minimal';
  }
  return parseModeFromEnv(env);
};

export const loadCliEnvironment = async (
  args: string[] = argv.slice(2),
  env: NodeJS.ProcessEnv = processEnv
): Promise<CliEnvironment> => {
  // Load user config first
  const userConfig = loadUserConfig();
  const mergedConfig = await mergeWithEnvVars(userConfig, env);

  // Determine config source
  const hasEnvVars = !!(env.TAVILY_API_KEY || env.FIRECRAWL_API_KEY || env.CONTEXT7_API_KEY || env.REFTOOLS_API_KEY || env.LEGILIMENS_AI_CLI_TOOL);
  const hasFileConfig = !!(userConfig.apiKeys.tavily || userConfig.apiKeys.firecrawl || userConfig.apiKeys.context7 || userConfig.apiKeys.refTools || userConfig.aiCliTool);
  const configSource = hasEnvVars && hasFileConfig ? 'mixed' : hasEnvVars ? 'env' : hasFileConfig ? 'file' : 'env';

  // Apply merged config to environment before loading runtime config
  if (mergedConfig.apiKeys) {
    if (mergedConfig.apiKeys.firecrawl) env.FIRECRAWL_API_KEY = mergedConfig.apiKeys.firecrawl;
    if (mergedConfig.apiKeys.context7) env.CONTEXT7_API_KEY = mergedConfig.apiKeys.context7;
    if (mergedConfig.apiKeys.refTools) env.REFTOOLS_API_KEY = mergedConfig.apiKeys.refTools;
  }
  
  // Tavily key needs to be set from mergedConfig since it's not in core ApiKeys interface
  // mergeWithEnvVars includes tavily in apiKeys object for compatibility
  if (mergedConfig.apiKeys && 'tavily' in mergedConfig.apiKeys && mergedConfig.apiKeys.tavily) {
    env.TAVILY_API_KEY = String(mergedConfig.apiKeys.tavily);
  }
  if (mergedConfig.aiCliConfig) {
    if (mergedConfig.aiCliConfig.preferredTool) env.LEGILIMENS_AI_CLI_TOOL = mergedConfig.aiCliConfig.preferredTool;
    if (mergedConfig.aiCliConfig.commandOverride) env.LEGILIMENS_AI_CLI_COMMAND_OVERRIDE = mergedConfig.aiCliConfig.commandOverride;
    if (mergedConfig.aiCliConfig.timeoutMs) env.LEGILIMENS_AI_CLI_TIMEOUT_MS = String(mergedConfig.aiCliConfig.timeoutMs);
  }
  
  // Apply local LLM configuration from mergedConfig
  if (mergedConfig.localLlm) {
    if (mergedConfig.localLlm.enabled !== undefined) {
      env.LEGILIMENS_LOCAL_LLM_ENABLED = String(mergedConfig.localLlm.enabled);
    }
    if (mergedConfig.localLlm.binaryPath) {
      env.LEGILIMENS_LOCAL_LLM_BIN = mergedConfig.localLlm.binaryPath;
    }
    if (mergedConfig.localLlm.modelPath) {
      env.LEGILIMENS_LOCAL_LLM_MODEL = mergedConfig.localLlm.modelPath;
    }
    if (mergedConfig.localLlm.tokens !== undefined) {
      env.LEGILIMENS_LOCAL_LLM_TOKENS = String(mergedConfig.localLlm.tokens);
    }
    if (mergedConfig.localLlm.threads !== undefined) {
      env.LEGILIMENS_LOCAL_LLM_THREADS = String(mergedConfig.localLlm.threads);
    }
    if (mergedConfig.localLlm.temp !== undefined) {
      env.LEGILIMENS_LOCAL_LLM_TEMP = String(mergedConfig.localLlm.temp);
    }
    if (mergedConfig.localLlm.timeoutMs !== undefined) {
      env.LEGILIMENS_LOCAL_LLM_TIMEOUT = String(mergedConfig.localLlm.timeoutMs);
    }
    if (mergedConfig.localLlm.resetBetweenTasks !== undefined) {
      env.LEGILIMENS_LOCAL_LLM_RESET = String(mergedConfig.localLlm.resetBetweenTasks);
    }
  }
  
  // Apply Tavily configuration from mergedConfig
  if (mergedConfig.tavily) {
    if (mergedConfig.tavily.enabled !== undefined) {
      env.TAVILY_ENABLED = String(mergedConfig.tavily.enabled);
    }
    if (mergedConfig.tavily.apiKey) {
      env.TAVILY_API_KEY = mergedConfig.tavily.apiKey;
    }
    if (mergedConfig.tavily.timeoutMs !== undefined) {
      env.TAVILY_TIMEOUT_MS = String(mergedConfig.tavily.timeoutMs);
    }
    if (mergedConfig.tavily.maxResults !== undefined) {
      env.TAVILY_MAX_RESULTS = String(mergedConfig.tavily.maxResults);
    }
  }

  const runtime = assertSupportedNode(env);
  const mode = resolveMode(args, env);

  return {
    runtime,
    mode,
    minimalMode: mode === 'minimal',
    lowContrastMode: mode === 'low-contrast',
    directories: runtime.directories,
    rawArgs: args,
    userConfigLoaded: userConfig.setupCompleted,
    configSource
  };
};