import { readFile } from 'node:fs/promises';
import type { GatewayGenerationResult } from '../types.js';

export interface NormalizedGatewayOutput {
  dependencyType: string;
  dependencyIdentifier: string;
  gatewayFilename: string;
  gatewayContent: string;
  staticBackupFilename: string;
  staticBackupContent: string;
  deepWikiRepository?: string;
  mcpGuidanceSourceType: string;
  mcpGuidanceFlags: {
    deepWiki: boolean;
    context7: boolean;
    firecrawl: boolean;
    staticOnly: boolean;
  };
  templateValidated: boolean;
}

export interface HarnessGatewayResponse {
  gateway: {
    filename: string;
    content: string;
    deepWikiGuidanceIncluded: boolean;
  };
  staticBackup: {
    filename: string;
    content: string;
  };
  metadata: {
    sessionId: string;
    generationDurationMs: number;
    templateValidated: boolean;
    dependencyType: string;
    dependencyIdentifier: string;
    deepWikiRepository?: string;
  };
}

const trimContent = (value: string): string => value.trimEnd();

export const normalizeModuleResult = async (
  result: GatewayGenerationResult
): Promise<NormalizedGatewayOutput> => {
  const [gatewayContent, staticBackupContent] = await Promise.all([
    readFile(result.metadata.gatewayPath, 'utf8'),
    readFile(result.metadata.staticBackupPath, 'utf8')
  ]);

  return {
    dependencyType: result.metadata.dependencyType,
    dependencyIdentifier: result.metadata.dependencyIdentifier,
    gatewayFilename: result.metadata.gatewayRelativePath,
    gatewayContent: trimContent(gatewayContent),
    staticBackupFilename: result.metadata.staticBackupRelativePath,
    staticBackupContent: trimContent(staticBackupContent),
    deepWikiRepository: result.metadata.deepWikiRepository,
    mcpGuidanceSourceType: result.metadata.mcpGuidanceSourceType,
    mcpGuidanceFlags: result.metadata.mcpGuidanceFlags,
    templateValidated: result.metadata.templateValidated
  };
};

export const normalizeHarnessResponse = (
  response: HarnessGatewayResponse
): NormalizedGatewayOutput => ({
  dependencyType: response.metadata.dependencyType,
  dependencyIdentifier: response.metadata.dependencyIdentifier,
  gatewayFilename: response.gateway.filename,
  gatewayContent: trimContent(response.gateway.content),
  staticBackupFilename: response.staticBackup.filename,
  staticBackupContent: trimContent(response.staticBackup.content),
  deepWikiRepository: response.metadata.deepWikiRepository,
  mcpGuidanceSourceType: 'unknown', // Harness doesn't provide this yet
  mcpGuidanceFlags: {
    deepWiki: response.gateway.deepWikiGuidanceIncluded,
    context7: false,
    firecrawl: false,
    staticOnly: false,
  },
  templateValidated: response.metadata.templateValidated
});
