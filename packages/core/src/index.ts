export type {
  DependencyType,
  FormatProgress,
  GenerateGatewayDoc,
  GatewayGenerationRequest,
  GatewayGenerationResult,
  GatewayGenerationMetadata,
  GatewayModule,
  GatewayProgressEvent,
  TemplateValidationResult,
  ValidateTemplate
} from './types.js';

export {
  generateGatewayDoc,
  validateTemplate,
  formatProgress
} from './gateway.js';

export {
  assertSupportedNode,
  getRuntimeConfig,
  getAiCliConfig,
  isAiGenerationEnabled,
  getPreferredAiTool,
  MINIMUM_NODE_MAJOR
} from './config/runtimeConfig.js';
export type { RuntimeConfig, RuntimeDirectories, AiCliConfig } from './config/runtimeConfig.js';

export type {
  NormalizedGatewayOutput,
  HarnessGatewayResponse
} from './parity/normalizeOutput.js';
export {
  normalizeModuleResult,
  normalizeHarnessResponse
} from './parity/normalizeOutput.js';

export {
  createPerformanceTracker,
  summarizePerformance,
  INTERACTIVE_TARGET_MS,
  ABSOLUTE_MAX_MS
} from './telemetry/performance.js';
export type { PerformanceMetrics } from './types.js';

// Source detection utilities
export type {
  SourceType,
  DetectionResult,
  AsyncDetectionResult
} from './detection/sourceDetector.js';
export {
  detectSourceType,
  detectSourceTypeWithAI,
  deriveDeepWikiUrl,
  isGitHubIdentifier
} from './detection/sourceDetector.js';

// Fetcher types and orchestration
export type {
  FetchMetadata,
  FetchResult,
  FetcherConfig,
  FetchRequest
} from './fetchers/types.js';
export {
  isFetchSuccess
} from './fetchers/types.js';

export {
  fetchDocumentation,
  describeFetchStrategy
} from './fetchers/orchestrator.js';

// Individual fetchers for debugging and testing
export { fetchFromRefTools } from './fetchers/refTools.js';
export { fetchFromContext7 } from './fetchers/context7.js';
export { fetchFromFirecrawl } from './fetchers/firecrawl.js';

// AI CLI tool integration
export type {
  CliToolName,
  CliToolInfo,
  DetectionResult as CliDetectionResult
} from './ai/cliDetector.js';
export {
  detectInstalledCliTools,
  isCliToolAvailable,
  resolveCliToolPath
} from './ai/cliDetector.js';

export type {
  CliExecutionOptions,
  CliOrchestratorConfig,
  CliGenerationResult,
  CliProgressEvent
} from './ai/cliOrchestrator.js';
export {
  generateWithCliTool
} from './ai/cliOrchestrator.js';

export type {
  PromptParams,
  AiGeneratedContent,
  PromptBuildResult
} from './ai/promptBuilder.js';
export {
  buildGatewayGenerationPrompt,
  parseAiResponse,
  generateFallbackContent
} from './ai/promptBuilder.js';

// AI repository discovery
export type {
  RepositoryDiscoveryResult
} from './ai/repositoryDiscovery.js';
export {
  discoverRepositoryWithAI
} from './ai/repositoryDiscovery.js';
