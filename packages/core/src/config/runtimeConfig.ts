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

export interface RuntimeConfig {
  nodeVersion: string;
  supportsRequiredNode: boolean;
  directories: RuntimeDirectories;
  apiKeys: ApiKeys;
  fetcherConfig: FetcherConfig;
  aiCliConfig: AiCliConfig;
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
    aiCliConfig
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
 * Helper to get preferred AI tool
 */
export const getPreferredAiTool = (config: RuntimeConfig): string | undefined => {
  return config.aiCliConfig.preferredTool;
};
