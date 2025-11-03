import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, writeFileSync, mkdirSync, existsSync, chmodSync } from 'fs';
import type { CliToolName } from '@legilimens/core';
import type { RuntimeConfig } from '@legilimens/core';
import { saveApiKey, getApiKey, isKeychainAvailable, areKeysConfigured, validateStoredKeys, createStorageErrorMessage } from './secrets.js';
import { detectExistingInstallation } from '../utils/dmrInstaller.js';

export interface UserConfig {
  apiKeys: {
    tavily?: string;
    firecrawl?: string;
    context7?: string;
    refTools?: string;
  };
  aiCliTool?: CliToolName | 'auto-detect';
  aiCliCommandOverride?: string;
  localLlm?: {
    enabled: boolean;
    modelName?: string;
    apiEndpoint?: string;
    binaryPath?: string;  // Deprecated: Use modelName instead
    modelPath?: string;   // Deprecated: Use modelName instead
    tokens?: number;
    threads?: number;
    temp?: number;
    timeoutMs?: number;
    resetBetweenTasks?: boolean;
  };
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
      localLlm: config.localLlm,
      setupCompleted: config.setupCompleted ?? false,
      configVersion: config.configVersion ?? CONFIG_VERSION,
      apiKeysStoredInKeychain: config.apiKeysStoredInKeychain ?? false
    };
  } catch (error) {
    console.warn('Failed to load user config, using defaults:', error);
    return {
      apiKeys: {},
      localLlm: undefined,
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
    const storedServices: string[] = [];
    
    if (hasApiKeys) {
      // Store each API key in keychain/file storage
      for (const [service, key] of Object.entries(apiKeysToStore)) {
        if (key) {
          const result = await saveApiKey(service, key);
          if (!result.success) {
            const errorMsg = await createStorageErrorMessage(result.error || 'Unknown error', service);
            return {
              success: false,
              error: errorMsg
            };
          }
          storedServices.push(service);
        }
      }
      
      // Post-save validation: verify keys are retrievable
      if (storedServices.length > 0) {
        if (process.env.LEGILIMENS_DEBUG) {
          console.debug(`[userConfig] Running post-save validation for ${storedServices.length} keys`);
        }
        
        const validation = await validateStoredKeys(storedServices);
        if (!validation.success) {
          return {
            success: false,
            error: `Configuration saved but could not be verified. Failed to retrieve: ${validation.failed.join(', ')}. Please restart setup wizard.`
          };
        }
        
        if (process.env.LEGILIMENS_DEBUG) {
          console.debug(`[userConfig] Post-save validation passed for all ${storedServices.length} keys`);
        }
      }
    }

    // Prepare config without API keys for JSON storage (but keep localLlm)
    const { apiKeys: _apiKeys, ...configWithoutKeys } = config; // eslint-disable-line @typescript-eslint/no-unused-vars
    const configWithMeta = {
      ...configWithoutKeys,
      localLlm: config.localLlm, // Persist local LLM paths
      configVersion: CONFIG_VERSION,
      apiKeysStoredInKeychain: await isKeychainAvailable(),
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

  // If env vars not set, populate from userConfig.localLlm
  const localLlmEnabled = env.LEGILIMENS_LOCAL_LLM_ENABLED === 'true' || 
                          (userConfig.localLlm?.enabled && !env.LEGILIMENS_LOCAL_LLM_ENABLED);
  const localLlmModelName = env.LEGILIMENS_LOCAL_LLM_MODEL_NAME || userConfig.localLlm?.modelName;
  const localLlmApiEndpoint = env.LEGILIMENS_LOCAL_LLM_API_ENDPOINT || userConfig.localLlm?.apiEndpoint;
  const localLlmBinaryPath = env.LEGILIMENS_LOCAL_LLM_BIN || userConfig.localLlm?.binaryPath;
  const localLlmModelPath = env.LEGILIMENS_LOCAL_LLM_MODEL || userConfig.localLlm?.modelPath;

  // Set env vars from config if not already set (for getRuntimeConfig to pick up)
  if (!env.LEGILIMENS_LOCAL_LLM_ENABLED && userConfig.localLlm?.enabled) {
    env.LEGILIMENS_LOCAL_LLM_ENABLED = 'true';
  }
  
  // Set new DMR env vars
  if (!env.LEGILIMENS_LOCAL_LLM_MODEL_NAME && userConfig.localLlm?.modelName) {
    env.LEGILIMENS_LOCAL_LLM_MODEL_NAME = userConfig.localLlm.modelName;
  }
  if (!env.LEGILIMENS_LOCAL_LLM_API_ENDPOINT && userConfig.localLlm?.apiEndpoint) {
    env.LEGILIMENS_LOCAL_LLM_API_ENDPOINT = userConfig.localLlm.apiEndpoint;
  }
  
  // Set legacy env vars for backward compatibility
  if (!env.LEGILIMENS_LOCAL_LLM_BIN && userConfig.localLlm?.binaryPath) {
    env.LEGILIMENS_LOCAL_LLM_BIN = userConfig.localLlm.binaryPath;
  }
  if (!env.LEGILIMENS_LOCAL_LLM_MODEL && userConfig.localLlm?.modelPath) {
    env.LEGILIMENS_LOCAL_LLM_MODEL = userConfig.localLlm.modelPath;
  }
  
  // Backward compatibility: If new vars are set but legacy ones aren't, populate legacy
  if (env.LEGILIMENS_LOCAL_LLM_MODEL_NAME && !env.LEGILIMENS_LOCAL_LLM_BIN) {
    env.LEGILIMENS_LOCAL_LLM_BIN = 'docker';
  }
  if (env.LEGILIMENS_LOCAL_LLM_MODEL_NAME && !env.LEGILIMENS_LOCAL_LLM_MODEL) {
    env.LEGILIMENS_LOCAL_LLM_MODEL = env.LEGILIMENS_LOCAL_LLM_MODEL_NAME;
  }
  
  // Auto-enable Tavily if API key exists and not explicitly disabled
  if (!env.TAVILY_ENABLED && apiKeys.tavily) {
    env.TAVILY_ENABLED = 'true';
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
      enabled: Boolean(localLlmEnabled),
      modelName: localLlmModelName,
      apiEndpoint: localLlmApiEndpoint,
      binaryPath: localLlmBinaryPath,
      modelPath: localLlmModelPath,
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
 * Check if setup is required (async to check stored API keys and local LLM configuration)
 */
export const isSetupRequired = async (env: NodeJS.ProcessEnv = process.env): Promise<boolean> => {
  // If LEGILIMENS_SKIP_SETUP is set to true, skip setup
  if (env.LEGILIMENS_SKIP_SETUP?.toLowerCase() === 'true') {
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug('[isSetupRequired] LEGILIMENS_SKIP_SETUP=true, skipping setup');
    }
    return false;
  }

  const userConfig = loadUserConfig();

  // Check for stored API keys (Tavily is required)
  // This now verifies keys are actually retrievable, not just that setupCompleted=true
  const keyStatus = await areKeysConfigured(['tavily']);
  const tavilyKeyRetrievable = keyStatus.tavily || Boolean(env.TAVILY_API_KEY);

  // Helper to expand tilde in paths
  const expandTilde = (value: string | undefined): string => {
    if (!value || typeof value !== 'string') {
      return '';
    }
    return value.replace(/^~(?=\/|$)/, homedir());
  };

  // Check for local LLM configuration via env vars
  const envBinPath = expandTilde(env.LEGILIMENS_LOCAL_LLM_BIN);
  const envModelPath = expandTilde(env.LEGILIMENS_LOCAL_LLM_MODEL);
  const envModelName = env.LEGILIMENS_LOCAL_LLM_MODEL_NAME;
  
  // DMR mode: docker + model name (no file path checks)
  const isDmrMode = env.LEGILIMENS_LOCAL_LLM_BIN === 'docker' || Boolean(envModelName);
  
  const localLlmEnvConfigured =
    env.LEGILIMENS_LOCAL_LLM_ENABLED === 'true' &&
    (
      // DMR mode: docker + (new model name OR legacy model name)
      (isDmrMode && (Boolean(envModelName) || Boolean(envModelPath))) ||
      // Legacy mode: file paths exist
      (Boolean(envBinPath) && Boolean(envModelPath) && existsSync(envBinPath) && existsSync(envModelPath))
    );

  // Check for existing llama.cpp/DMR installation using robust detection
  const existingInstall = await detectExistingInstallation();
  const localLlmInstalled = existingInstall.found && 
                            Boolean(existingInstall.binaryPath) && 
                            Boolean(existingInstall.modelPath) &&
                            existingInstall.binaryPath !== undefined &&
                            existingInstall.modelPath !== undefined &&
                            // For DMR, binaryPath is 'docker' (not a file path)
                            (existingInstall.binaryPath === 'docker' || existsSync(existingInstall.binaryPath)) &&
                            // Model path for DMR is model name, not file path
                            Boolean(existingInstall.modelPath);

  if (process.env.LEGILIMENS_DEBUG) {
    console.debug(`[isSetupRequired] setupCompleted=${userConfig.setupCompleted}, tavilyKeyRetrievable=${tavilyKeyRetrievable}, localLlmEnvConfigured=${localLlmEnvConfigured}, localLlmInstalled=${localLlmInstalled}`);
    if (localLlmInstalled) {
      console.debug(`[isSetupRequired] Found local LLM: binary=${existingInstall.binaryPath}, model=${existingInstall.modelPath}`);
    }
  }

  // Skip setup only if (Tavily OR Local LLM) is configured AND retrievable
  // 1. Setup was completed AND Tavily key is retrievable (in storage or env)
  if (userConfig.setupCompleted && tavilyKeyRetrievable) {
    return false;
  }

  // 2. Local LLM is fully configured via env vars (Tavily key not required if Local LLM present)
  if (localLlmEnvConfigured) {
    return false;
  }

  // 3. Local LLM is installed and detected (Tavily key not required if Local LLM present)
  if (localLlmInstalled) {
    return false;
  }

  // 4. Tavily key is retrievable alone (without local LLM)
  if (tavilyKeyRetrievable) {
    return false;
  }

  // If neither Tavily nor Local LLM is configured, setup is required
  return true;
};