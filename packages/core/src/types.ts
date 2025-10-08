export interface GatewayRequestContext {
  /**
   * Arbitrary variables extracted from the gateway template to drive generation.
   */
  variables: Record<string, unknown>;
  /**
   * When true, downstream consumers must avoid animated or ANSI-heavy output.
   */
  minimalMode?: boolean;
}

export interface PerformanceMetrics {
  durationMs: number;
  exceededInteractiveTarget: boolean;
  exceededAbsoluteCeiling: boolean;
  minimalModeRequested: boolean;
  minimalModeRecommended: boolean;
}

export interface GatewayGenerationRequest {
  templatePath: string;
  targetDirectory: string;
  context: GatewayRequestContext;
}

export interface GatewayProgressEvent {
  step: string;
  message: string;
  percentComplete: number;
}

export interface GatewayGenerationMetadata {
  sessionId: string;
  dependencyType: string;
  dependencyIdentifier: string;
  templateValidated: boolean;
  generationDurationMs: number;
  deepWikiGuidanceIncluded: boolean;
  gatewayPath: string;
  gatewayFilename: string;
  gatewayRelativePath: string;
  staticBackupPath: string;
  staticBackupFilename: string;
  staticBackupRelativePath: string;
  minimalMode: boolean;
  deepWikiRepository?: string;
  performance: PerformanceMetrics;
  performanceSummary: string;
}

export interface GatewayGenerationResult {
  documentPath: string;
  summary: string;
  artifacts: string[];
  metadata: GatewayGenerationMetadata;
}

export interface TemplateValidationResult {
  valid: boolean;
  issues: string[];
}

export type GenerateGatewayDoc = (
  request: GatewayGenerationRequest
) => Promise<GatewayGenerationResult>;

export type ValidateTemplate = (templatePath: string) => Promise<TemplateValidationResult>;

export type FormatProgress = (event: GatewayProgressEvent) => string;

export interface GatewayModule {
  generateGatewayDoc: GenerateGatewayDoc;
  validateTemplate: ValidateTemplate;
  formatProgress: FormatProgress;
}
