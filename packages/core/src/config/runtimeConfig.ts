import { resolve } from 'node:path';
import { cwd, env as processEnv, version as nodeVersion } from 'node:process';

export const MINIMUM_NODE_MAJOR = 20;
export const ENV_ROOT = 'LEGILIMENS_ROOT';
export const ENV_CONSTITUTION_DIR = 'LEGILIMENS_CONSTITUTION_DIR';
export const ENV_DOCS_DIR = 'LEGILIMENS_DOCS_DIR';

// Environment variables for API keys
export const ENV_FIRECRAWL_API_KEY = 'FIRECRAWL_API_KEY';
export const ENV_CONTEXT7_API_KEY = 'CONTEXT7_API_KEY';
export const ENV_REFTOOLS_API_KEY = 'REFTOOLS_API_KEY';
export const ENV_FETCHER_TIMEOUT_MS = 'LEGILIMENS_FETCHER_TIMEOUT_MS';
export const ENV_MAX_RETRIES = 'LEGILIMENS_MAX_RETRIES';

// Environment variables for AI CLI tools
export const ENV_AI_CLI_TOOL = 'LEGILIMENS_AI_CLI_TOOL';
export const ENV_AI_CLI_TIMEOUT_MS = 'LEGILIMENS_AI_CLI_TIMEOUT_MS';
export const ENV_AI_CLI_COMMAND_OVERRIDE = 'LEGILIMENS_AI_CLI_COMMAND_OVERRIDE';
export const ENV_AI_GENERATION_ENABLED = 'LEGILIMENS_AI_GENERATION_ENABLED';

export interface RuntimeDirectories {
  rootDir: string;
  constitutionDir: string;
  docsDir: string;
  staticBackupDir: string;
}

export interface ApiKeys {
  firecrawl?: string;
  context7?: string;
  refTools?: string;
}

export interface FetcherConfig {
  timeoutMs: number;
  maxRetries: number;
}

export interface AiCliConfig {
  enabled: boolean;
  preferredTool?: string;
  timeoutMs: number;
  commandOverride?: string;
}

/**
 * Local LLM configuration. For local inference to be considered available:
 * - DMR mode: `enabled` + `modelName` + `apiEndpoint`
 * - Legacy mode: `enabled` + `binaryPath` + `modelPath`
 */
export interface LocalLlmConfig {
  enabled: boolean;
  modelName?: string;
  apiEndpoint?: string;
  binaryPath?: string;  // Deprecated: Use modelName instead
  modelPath?: string;   // Deprecated: Use modelName instead
  tokens?: number;      // Context window size (deprecated for output control)
  outputTokens?: number; // Maximum output tokens (recommended)
  threads?: number;
  temp?: number;
  timeoutMs?: number;
  resetBetweenTasks?: boolean;
}

export interface TavilyConfig {
  enabled: boolean;
  apiKey?: string;
  timeoutMs?: number;
  maxResults?: number;
}

export interface RuntimeConfig {
  nodeVersion: string;
  supportsRequiredNode: boolean;
  directories: RuntimeDirectories;
  apiKeys: ApiKeys;
  fetcherConfig: FetcherConfig;
  aiCliConfig: AiCliConfig;
  localLlm?: LocalLlmConfig;
  tavily?: TavilyConfig;
}

export const parseNodeVersion = (
  version: string
): { major: number; minor: number; patch: number } => {
  const match = version.match(/v?(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return { major: 0, minor: 0, patch: 0 };
  }

  return {
    major: Number.parseInt(match[1] ?? '0', 10),
    minor: Number.parseInt(match[2] ?? '0', 10),
    patch: Number.parseInt(match[3] ?? '0', 10)
  };
};

export const getRuntimeConfig = (
  env: NodeJS.ProcessEnv = processEnv
): RuntimeConfig => {
  const version = nodeVersion;
  const { major } = parseNodeVersion(version);
  const rootDir = resolve(env[ENV_ROOT] ?? cwd());
  const docsDir = resolve(rootDir, env[ENV_DOCS_DIR] ?? 'docs');
  const constitutionDir = resolve(rootDir, env[ENV_CONSTITUTION_DIR] ?? '.specify/memory');
  const staticBackupDir = resolve(docsDir, 'static-backup');

  // Parse API keys from environment
  const apiKeys: ApiKeys = {
    firecrawl: env[ENV_FIRECRAWL_API_KEY],
    context7: env[ENV_CONTEXT7_API_KEY],
    refTools: env[ENV_REFTOOLS_API_KEY]
  };

  // Parse fetcher configuration from environment with defaults
  const fetcherConfig: FetcherConfig = {
    timeoutMs: env[ENV_FETCHER_TIMEOUT_MS]
      ? Number.parseInt(env[ENV_FETCHER_TIMEOUT_MS], 10)
      : 60000,
    maxRetries: env[ENV_MAX_RETRIES]
      ? Number.parseInt(env[ENV_MAX_RETRIES], 10)
      : 2
  };

  // Parse AI CLI configuration from environment with defaults
  const aiCliConfig: AiCliConfig = {
    enabled: env[ENV_AI_GENERATION_ENABLED]
      ? env[ENV_AI_GENERATION_ENABLED].toLowerCase() === 'true'
      : true,
    preferredTool: env[ENV_AI_CLI_TOOL],
    timeoutMs: env[ENV_AI_CLI_TIMEOUT_MS]
      ? Number.parseInt(env[ENV_AI_CLI_TIMEOUT_MS], 10)
      : 120000, // Increased to 2 minutes for AI generation
    commandOverride: env[ENV_AI_CLI_COMMAND_OVERRIDE]
  };

  const localLlm: LocalLlmConfig = {
    enabled: (env.LEGILIMENS_LOCAL_LLM_ENABLED ?? 'false').toLowerCase() === 'true',
    // Prefer new DMR env vars
    modelName: env.LEGILIMENS_LOCAL_LLM_MODEL_NAME,
    apiEndpoint: env.LEGILIMENS_LOCAL_LLM_API_ENDPOINT,
    // Fallback to legacy env vars for backward compatibility
    binaryPath: env.LEGILIMENS_LOCAL_LLM_BIN,
    modelPath: env.LEGILIMENS_LOCAL_LLM_MODEL,
    tokens: env.LEGILIMENS_LOCAL_LLM_TOKENS ? Number.parseInt(env.LEGILIMENS_LOCAL_LLM_TOKENS, 10) : undefined,
    outputTokens: env.LEGILIMENS_LOCAL_LLM_OUTPUT_TOKENS ? Number.parseInt(env.LEGILIMENS_LOCAL_LLM_OUTPUT_TOKENS, 10) : undefined,
    threads: env.LEGILIMENS_LOCAL_LLM_THREADS ? Number.parseInt(env.LEGILIMENS_LOCAL_LLM_THREADS, 10) : undefined,
    temp: env.LEGILIMENS_LOCAL_LLM_TEMP ? Number.parseFloat(env.LEGILIMENS_LOCAL_LLM_TEMP) : undefined,
    timeoutMs: env.LEGILIMENS_LOCAL_LLM_TIMEOUT ? Number.parseInt(env.LEGILIMENS_LOCAL_LLM_TIMEOUT, 10) : undefined,
    resetBetweenTasks: (env.LEGILIMENS_LOCAL_LLM_RESET ?? 'true').toLowerCase() === 'true',
  };

  // Auto-enable Tavily if API key exists and TAVILY_ENABLED is not explicitly set
  const tavilyEnabled = env.TAVILY_ENABLED 
    ? env.TAVILY_ENABLED.toLowerCase() === 'true'
    : Boolean(env.TAVILY_API_KEY); // Auto-enable if key exists
  
  const tavily: TavilyConfig = {
    enabled: tavilyEnabled,
    apiKey: env.TAVILY_API_KEY,
    timeoutMs: env.TAVILY_TIMEOUT_MS ? Number.parseInt(env.TAVILY_TIMEOUT_MS, 10) : undefined,
    maxResults: env.TAVILY_MAX_RESULTS ? Number.parseInt(env.TAVILY_MAX_RESULTS, 10) : undefined,
  };

  return {
    nodeVersion: version,
    supportsRequiredNode: major >= MINIMUM_NODE_MAJOR,
    directories: {
      rootDir,
      constitutionDir,
      docsDir,
      staticBackupDir
    },
    apiKeys,
    fetcherConfig,
    aiCliConfig,
    localLlm,
    tavily
  };
};

export const assertSupportedNode = (env: NodeJS.ProcessEnv = processEnv): RuntimeConfig => {
  const config = getRuntimeConfig(env);
  if (!config.supportsRequiredNode) {
    throw new Error(
      `Legilimens requires Node.js ${MINIMUM_NODE_MAJOR} LTS or newer. Detected ${config.nodeVersion}.`
    );
  }

  return config;
};

/**
 * Helper to get a specific API key from runtime config
 */
export const getApiKey = (
  config: RuntimeConfig,
  service: 'firecrawl' | 'context7' | 'refTools'
): string | undefined => {
  return config.apiKeys[service];
};

/**
 * Helper to get fetcher timeout
 */
export const getFetcherTimeout = (config: RuntimeConfig): number => {
  return config.fetcherConfig.timeoutMs;
};

/**
 * Helper to get max retries
 */
export const getMaxRetries = (config: RuntimeConfig): number => {
  return config.fetcherConfig.maxRetries;
};

/**
 * Helper to get AI CLI configuration
 */
export const getAiCliConfig = (config: RuntimeConfig): AiCliConfig => {
  return config.aiCliConfig;
};

/**
 * Helper to check if AI generation is enabled
 */
export const isAiGenerationEnabled = (config: RuntimeConfig): boolean => {
  return config.aiCliConfig.enabled;
};

/**
 * Helper to check if the local LLM is fully configured.
 * Currently only supports DMR mode (modelName + apiEndpoint).
 * Legacy mode (binaryPath + modelPath) is not supported until reintroduced in localLlmRunner.
 */
export const isLocalLlmEnabled = (config: RuntimeConfig): boolean => {
  if (!config.localLlm?.enabled) {
    return false;
  }
  
  // DMR mode: modelName + apiEndpoint (required)
  return Boolean(
    config.localLlm.modelName &&
    config.localLlm.apiEndpoint
  );
};

/**
 * Helper to get preferred AI tool
 */
export const getPreferredAiTool = (config: RuntimeConfig): string | undefined => {
  return config.aiCliConfig.preferredTool;
};
