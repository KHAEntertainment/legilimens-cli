import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, writeFileSync, mkdirSync, existsSync, chmodSync } from 'fs';
import type { CliToolName } from '@legilimens/core';
import type { RuntimeConfig } from '@legilimens/core';
import { saveApiKey, getApiKey, isKeychainAvailable } from './secrets.js';

export interface UserConfig {
  apiKeys: {
    tavily?: string;
    firecrawl?: string;
    context7?: string;
    refTools?: string;
  };
  aiCliTool?: CliToolName | 'auto-detect';
  aiCliCommandOverride?: string;
  setupCompleted: boolean;
  configVersion: string;
  apiKeysStoredInKeychain?: boolean;
}

export const CONFIG_VERSION = '1.0.0';
const CONFIG_DIR_NAME = '.legilimens';
const CONFIG_FILE_NAME = 'config.json';

/**
 * Get the path to the user configuration file
 */
export const getConfigPath = (): string => {
  const home = homedir();
  const configDir = join(home, CONFIG_DIR_NAME);
  return join(configDir, CONFIG_FILE_NAME);
};

/**
 * Get the configuration directory path
 */
export const getConfigDir = (): string => {
  const home = homedir();
  return join(home, CONFIG_DIR_NAME);
};

/**
 * Load user configuration from disk
 */
export const loadUserConfig = (): UserConfig => {
  const configPath = getConfigPath();

  try {
    if (!existsSync(configPath)) {
      return {
        apiKeys: {},
        setupCompleted: false,
        configVersion: CONFIG_VERSION
      };
    }

    const content = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(content) as UserConfig;

    // Validate structure
    if (typeof config !== 'object' || config === null) {
      throw new Error('Invalid config structure');
    }

    return {
      apiKeys: config.apiKeys ?? {},
      aiCliTool: config.aiCliTool,
      aiCliCommandOverride: config.aiCliCommandOverride,
      setupCompleted: config.setupCompleted ?? false,
      configVersion: config.configVersion ?? CONFIG_VERSION,
      apiKeysStoredInKeychain: config.apiKeysStoredInKeychain ?? false
    };
  } catch (error) {
    console.warn('Failed to load user config, using defaults:', error);
    return {
      apiKeys: {},
      setupCompleted: false,
      configVersion: CONFIG_VERSION,
      apiKeysStoredInKeychain: false
    };
  }
};

/**
 * Save user configuration to disk
 */
export const saveUserConfig = async (config: UserConfig): Promise<{ success: boolean; error?: string }> => {
  const configDir = getConfigDir();
  const configPath = getConfigPath();

  try {
    // Ensure config directory exists
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true, mode: 0o700 });
    }

    // Store API keys securely if present
    const apiKeysToStore = config.apiKeys;
    const hasApiKeys = Object.values(apiKeysToStore).some(Boolean);
    
    if (hasApiKeys) {
      // Store each API key in keychain/file storage
      for (const [service, key] of Object.entries(apiKeysToStore)) {
        if (key) {
          const result = await saveApiKey(service, key);
          if (!result.success) {
            return {
              success: false,
              error: `Failed to store API key for ${service}: ${result.error}`
            };
          }
        }
      }
    }

    // Prepare config without API keys for JSON storage
    const { apiKeys: _apiKeys, ...configWithoutKeys } = config; // eslint-disable-line @typescript-eslint/no-unused-vars
    const configWithMeta = {
      ...configWithoutKeys,
      configVersion: CONFIG_VERSION,
      apiKeysStoredInKeychain: isKeychainAvailable(),
      _warning: hasApiKeys 
        ? 'API keys are stored securely in system keychain or encrypted file. Do not commit this file to version control.'
        : 'This file contains configuration settings. Do not commit to version control.'
    };

    // Write config file
    const content = JSON.stringify(configWithMeta, null, 2);
    writeFileSync(configPath, content, { encoding: 'utf-8', mode: 0o600 });

    // Set restrictive permissions (Unix-like systems)
    if (process.platform !== 'win32') {
      try {
        chmodSync(configPath, 0o600);
      } catch {
        // Ignore chmod errors on platforms that don't support it
      }
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to save config: ${errorMessage}`
    };
  }
};

/**
 * Merge user config with environment variables
 * Environment variables take precedence over config file
 */
export const mergeWithEnvVars = async (
  userConfig: UserConfig,
  env: NodeJS.ProcessEnv = process.env
): Promise<Partial<RuntimeConfig>> => {
  // Get API keys from environment first, then from secure storage
  const apiKeys: { tavily?: string; firecrawl?: string; context7?: string; refTools?: string } = {};
  
  // Check environment variables first
  apiKeys.tavily = env.TAVILY_API_KEY;
  apiKeys.firecrawl = env.FIRECRAWL_API_KEY;
  apiKeys.context7 = env.CONTEXT7_API_KEY;
  apiKeys.refTools = env.REFTOOLS_API_KEY;
  
  // If environment variables are not set, try to get from secure storage
  if (!apiKeys.tavily) {
    apiKeys.tavily = await getApiKey('tavily') ?? userConfig.apiKeys.tavily;
  }
  if (!apiKeys.firecrawl) {
    apiKeys.firecrawl = await getApiKey('firecrawl') ?? userConfig.apiKeys.firecrawl;
  }
  if (!apiKeys.context7) {
    apiKeys.context7 = await getApiKey('context7') ?? userConfig.apiKeys.context7;
  }
  if (!apiKeys.refTools) {
    apiKeys.refTools = await getApiKey('refTools') ?? userConfig.apiKeys.refTools;
  }

  return {
    apiKeys: apiKeys as any,
    aiCliConfig: {
      enabled: env.LEGILIMENS_AI_GENERATION_ENABLED
        ? env.LEGILIMENS_AI_GENERATION_ENABLED.toLowerCase() === 'true'
        : true,
      preferredTool: env.LEGILIMENS_AI_CLI_TOOL ??
                      (userConfig.aiCliTool !== 'auto-detect' ? userConfig.aiCliTool : undefined),
      timeoutMs: env.LEGILIMENS_AI_CLI_TIMEOUT_MS
        ? parseInt(env.LEGILIMENS_AI_CLI_TIMEOUT_MS, 10)
        : 30000,
      commandOverride: env.LEGILIMENS_AI_CLI_COMMAND_OVERRIDE ?? userConfig.aiCliCommandOverride
    },
    localLlm: {
      enabled: env.LEGILIMENS_LOCAL_LLM_ENABLED === 'true',
      binaryPath: env.LEGILIMENS_LOCAL_LLM_BIN,
      modelPath: env.LEGILIMENS_LOCAL_LLM_MODEL,
      tokens: env.LEGILIMENS_LOCAL_LLM_TOKENS ? parseInt(env.LEGILIMENS_LOCAL_LLM_TOKENS, 10) : undefined,
      threads: env.LEGILIMENS_LOCAL_LLM_THREADS ? parseInt(env.LEGILIMENS_LOCAL_LLM_THREADS, 10) : undefined,
      temp: env.LEGILIMENS_LOCAL_LLM_TEMP ? parseFloat(env.LEGILIMENS_LOCAL_LLM_TEMP) : undefined,
      timeoutMs: env.LEGILIMENS_LOCAL_LLM_TIMEOUT ? parseInt(env.LEGILIMENS_LOCAL_LLM_TIMEOUT, 10) : undefined,
      resetBetweenTasks: env.LEGILIMENS_LOCAL_LLM_RESET !== 'false',
    },
    tavily: {
      enabled: env.TAVILY_ENABLED === 'true',
      apiKey: apiKeys.tavily,
      timeoutMs: env.TAVILY_TIMEOUT_MS ? parseInt(env.TAVILY_TIMEOUT_MS, 10) : undefined,
      maxResults: env.TAVILY_MAX_RESULTS ? parseInt(env.TAVILY_MAX_RESULTS, 10) : undefined,
    }
  };
};

/**
 * Check if setup is required
 */
export const isSetupRequired = (env: NodeJS.ProcessEnv = process.env): boolean => {
  // If LEGILIMENS_SKIP_SETUP is set to true, skip setup
  if (env.LEGILIMENS_SKIP_SETUP?.toLowerCase() === 'true') {
    return false;
  }

  const userConfig = loadUserConfig();

  // If setup was completed, skip wizard
  if (userConfig.setupCompleted) {
    return false;
  }

  // If environment variables are set, skip wizard
  if (env.FIRECRAWL_API_KEY || env.CONTEXT7_API_KEY || env.REFTOOLS_API_KEY || env.LEGILIMENS_AI_CLI_TOOL) {
    return false;
  }

  return true;
};
