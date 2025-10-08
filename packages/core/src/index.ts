export type {
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
  MINIMUM_NODE_MAJOR
} from './config/runtimeConfig.js';
export type { RuntimeConfig, RuntimeDirectories } from './config/runtimeConfig.js';

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
