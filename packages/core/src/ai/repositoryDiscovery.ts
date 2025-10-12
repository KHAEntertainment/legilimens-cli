/**
 * AI-Assisted Repository Discovery Module
 * 
 * Uses CLI agents to discover canonical identifiers and repository URLs
 * from natural language descriptions when static mappings fail.
 */

import { getRuntimeConfig } from '../config/runtimeConfig.js';
import { discoverWithPipeline } from './repositoryDiscoveryPipeline.js';

export interface RepositoryDiscoveryResult {
  success: boolean;
  canonicalIdentifier?: string;
  repositoryUrl?: string;
  sourceType?: 'github' | 'npm' | 'url' | 'unknown';
  confidence?: 'high' | 'medium' | 'low';
  error?: string;
  toolUsed?: string;
  attempts?: string[];
}

/**
 * Discover repository information using AI CLI agents
 * 
 * @param naturalLanguageInput - Human-readable description (e.g., "Jumpcloud API 2.0")
 * @param dependencyType - The type of dependency (api, framework, library, tool, other)
 * @returns Promise resolving to discovery result
 */
export async function discoverRepositoryWithAI(
  naturalLanguageInput: string,
  dependencyType: string
): Promise<RepositoryDiscoveryResult> {
  const runtimeConfig = getRuntimeConfig();
  if (!runtimeConfig.localLlm?.enabled || !runtimeConfig.tavily?.enabled) {
    return { success: false, confidence: 'low', error: 'Local LLM or Tavily disabled' };
  }
  const pr = await discoverWithPipeline(naturalLanguageInput, dependencyType);
  return {
    success: pr.confidence !== 'low',
    canonicalIdentifier: pr.normalizedIdentifier,
    repositoryUrl: pr.repositoryUrl,
    sourceType: pr.sourceType,
    confidence: pr.confidence,
  };
}

/**
 * Build AI prompt for repository discovery
 */
function buildRepositoryDiscoveryPrompt(naturalLanguageInput: string, dependencyType: string): string {
  return `You are a dependency discovery assistant with web search capabilities. Use web search to find the REAL, CURRENT canonical identifier and repository/documentation URL for "${naturalLanguageInput}" (dependency type: ${dependencyType}).

CRITICAL: Use web search to find the actual, current information. Do not rely on assumptions, outdated mappings, or generic patterns.

Search for:
1. The official repository (GitHub, GitLab, etc.)
2. The official documentation site
3. The NPM package name (if applicable)
4. The current, active URL for this dependency

For each dependency, determine:
1. The canonical identifier (npm package name, GitHub owner/repo, or official documentation URL)
2. The primary repository URL or official documentation site
3. The source type (github, npm, url, or unknown)
4. Your confidence level based on search results

Examples of what to search for:
- "Supabase" → search for "Supabase official repository" or "Supabase documentation"
- "Jumpcloud API 2.0" → search for "Jumpcloud API documentation" or "Jumpcloud developer docs"
- "React" → search for "React official repository" or "React documentation"

Respond with a JSON object in this exact format:
{
  "canonicalIdentifier": "the-real-current-identifier",
  "repositoryUrl": "https://the-real-current-url.com",
  "sourceType": "github|npm|url|unknown",
  "confidence": "high|medium|low",
  "searchSummary": "brief summary of what you found through web search"
}

If you cannot find reliable, current information through web search, set canonicalIdentifier and repositoryUrl to null and confidence to low.`;
}

/**
 * Parse AI response for repository discovery
 */
function parseRepositoryDiscoveryResponse(
  response: string,
  toolUsed?: string,
  attempts?: string[]
): RepositoryDiscoveryResult {
  try {
    // Clean the response to extract JSON
    const cleanedResponse = response.trim();
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      return {
        success: false,
        error: 'No JSON found in AI response',
        toolUsed,
        attempts
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate required fields
    if (!parsed.canonicalIdentifier || !parsed.sourceType) {
      return {
        success: false,
        error: 'Missing required fields in AI response',
        toolUsed,
        attempts
      };
    }

    // Validate sourceType
    const validSourceTypes = ['github', 'npm', 'url', 'unknown'];
    if (!validSourceTypes.includes(parsed.sourceType)) {
      return {
        success: false,
        error: `Invalid sourceType: ${parsed.sourceType}`,
        toolUsed,
        attempts
      };
    }

    // Validate confidence
    const validConfidences = ['high', 'medium', 'low'];
    if (!validConfidences.includes(parsed.confidence)) {
      return {
        success: false,
        error: `Invalid confidence: ${parsed.confidence}`,
        toolUsed,
        attempts
      };
    }

    return {
      success: true,
      canonicalIdentifier: parsed.canonicalIdentifier,
      repositoryUrl: parsed.repositoryUrl,
      sourceType: parsed.sourceType,
      confidence: parsed.confidence,
      toolUsed,
      attempts
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse AI response: ${error instanceof Error ? error.message : String(error)}`,
      toolUsed,
      attempts
    };
  }
}
