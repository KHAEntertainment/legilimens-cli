import type { DetectionResult } from '../detection/sourceDetector.js';
import { runLocalJson } from './localLlmRunner.js';
import { searchPreferredSources } from './webSearch.js';
import { extractFirstJson, safeParseJson, validateDiscoveryJson, validateToolCallJson } from './json.js';
import { callTool } from './toolsRegistry.js';

export interface PipelineResult extends DetectionResult {
  repositoryUrl?: string;
  aiAssisted: boolean;
  confidence: 'high' | 'medium' | 'low';
  searchSummary?: string;
  dependencyType: 'framework' | 'api' | 'library' | 'tool' | 'other';
}

export async function discoverWithPipeline(natural: string): Promise<PipelineResult> {
  // Let AI infer dependency type from natural language
  const results = await searchPreferredSources(buildQuery(natural), natural);

  const llmPrompt = [
    'Given these candidate sources, choose the canonical identifier, primary URL, source type, confidence, and dependency type.',
    'Respond with a single JSON object with fields:',
    '{ "canonicalIdentifier": string|null, "repositoryUrl": string|null, "sourceType": "github|npm|url|unknown", "confidence": "high|medium|low", "dependencyType": "framework|api|library|tool|other", "searchSummary": string }',
    `Natural: ${natural}`,
    `Candidates: ${JSON.stringify(results, null, 2)}`,
  ].join('\n');

  const decision = await runLocalJson<any>({ prompt: llmPrompt });
  if (!decision.success || !decision.json || !validateDiscoveryJson(decision.json)) {
    return { sourceType: 'unknown', normalizedIdentifier: natural, aiAssisted: true, confidence: 'low', dependencyType: 'other' };
  }

  const choice = decision.json;
  const normalizedIdentifier = String(choice.canonicalIdentifier ?? natural);

  // Optional tool call stage
  const toolPrompt = [
    'If fetching markdown would help, propose ONE tool call as JSON:',
    '{ "tool": "firecrawl|context7|ref", "args": { "url": string, "owner?": string, "repo?": string } }',
    'Otherwise, respond with {}',
    `Primary URL: ${choice.repositoryUrl}`,
  ].join('\n');

  const tool = await runLocalJson<any>({ prompt: toolPrompt });
  if (tool.success && tool.json && validateToolCallJson(tool.json)) {
    await callTool(tool.json.tool, tool.json.args);
  }

  return {
    sourceType: choice.sourceType,
    normalizedIdentifier,
    repositoryUrl: choice.repositoryUrl ?? undefined,
    aiAssisted: true,
    confidence: choice.confidence,
    searchSummary: choice.searchSummary,
    dependencyType: choice.dependencyType ?? 'other',
  };
}

function buildQuery(natural: string): string {
  return `Find official sources for: ${natural}. Prefer GitHub repo, Context7, DeepWiki, official docs.`;
}


