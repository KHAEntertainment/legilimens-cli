/**
 * Source Detection Module
 *
 * Provides pattern matching utilities for identifying dependency sources
 * (GitHub repositories, URLs) and deriving DeepWiki URLs from GitHub identifiers.
 * NPM package detection is handled by Context7 search API (see repositoryDiscoveryPipeline).
 */

import type { Context7SearchResult } from '../fetchers/context7.js';

// Type Definitions

export type SourceType = 'github' | 'npm' | 'url' | 'unknown';

export interface DetectionResult {
  sourceType: SourceType;
  normalizedIdentifier: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface AsyncDetectionResult extends DetectionResult {
  aiAssisted?: boolean;
  aiToolUsed?: string;
  dependencyType?: string;
  repositoryUrl?: string;
  context7Results?: Array<{ name: string; score: number; url: string }>;
}

// Detection Patterns

const GITHUB_PATTERNS = [
  // github.com/owner/repo (with or without protocol, optional www subdomain)
  /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+\/[^\/]+?)(?:\.git)?(?:\/.*)?$/i,
  // owner/repo format (two segments separated by slash, optional trailing slash)
  /^([^\/]+\/[^\/]+?)(?:\.git)?\/?$/,
];

const URL_PATTERN = /^https?:\/\//i;

// Natural Language Processing Functions

/**
 * AI-assisted repository discovery using CLI agents
 *
 * @param input - Natural language description (e.g., "Jumpcloud API 2.0")
 * @returns Promise resolving to canonical identifier if AI can find it, original input otherwise
 */
async function discoverRepositoryWithAI(input: string): Promise<string> {
  try {
    // Import here to avoid circular dependencies
    const { discoverRepositoryWithAI: aiDiscovery } = await import('../ai/repositoryDiscovery.js');

    const result = await aiDiscovery(input);

    if (result.success && result.canonicalIdentifier && result.confidence !== 'low') {
      return result.canonicalIdentifier;
    }

    return input;
  } catch (error) {
    // If AI discovery fails, return original input
    console.debug(`AI repository discovery failed for "${input}":`, error);
    return input;
  }
}

/**
 * Normalizes input by trimming whitespace only.
 * This function no longer performs natural language mapping to avoid 
 * reintroducing heuristic-based detection after removal of looksNaturalLanguage.
 * All intelligent mapping is delegated to Context7 and Tavily pipelines.
 * 
 * @param input - User input to normalize
 * @returns Trimmed input
 */
function mapNaturalLanguageToIdentifier(input: string): string {
  // Only trim whitespace - no heuristic mapping
  // All natural language interpretation is delegated to Context7/Tavily
  return input.trim();
}

// Core Functions

/**
 * Detects the source type of a dependency identifier
 *
 * @param input - The dependency identifier to detect
 * @returns Detection result with source type, normalized identifier, and confidence
 */
export function detectSourceType(input: string): DetectionResult {
  // Normalize input
  const trimmed = input.trim();

  // Handle empty input
  if (!trimmed) {
    return {
      sourceType: 'unknown',
      normalizedIdentifier: input,
      confidence: 'low',
    };
  }

  // Normalize input (trim only - no heuristic mapping)
  const normalizedInput = mapNaturalLanguageToIdentifier(trimmed);

  // Exclude scoped packages (starting with @) from GitHub detection
  // These should return unknown and trigger AI pipeline
  if (!normalizedInput.startsWith('@')) {
    // Test GitHub patterns (priority 1)
    for (const pattern of GITHUB_PATTERNS) {
      const match = normalizedInput.match(pattern);
      if (match) {
        // Extract owner/repo, removing .git suffix and trailing slashes
        const ownerRepo = match[1].replace(/\.git$/, '').replace(/\/$/, '');
        return {
          sourceType: 'github',
          normalizedIdentifier: ownerRepo,
          confidence: 'high',
        };
      }
    }
  }

  // Test URL pattern (priority 2) - exclude GitHub URLs
  if (URL_PATTERN.test(normalizedInput) && !normalizedInput.toLowerCase().includes('github.com')) {
    return {
      sourceType: 'url',
      normalizedIdentifier: normalizedInput,
      confidence: 'high',
    };
  }

  // No match found
  return {
    sourceType: 'unknown',
    normalizedIdentifier: trimmed,
    confidence: 'low',
  };
}

/**
 * Derives a DeepWiki URL from a dependency identifier if it's a GitHub repository
 *
 * @param input - The dependency identifier
 * @returns DeepWiki URL if GitHub source detected, null otherwise
 */
export function deriveDeepWikiUrl(input: string): string | null {
  const detection = detectSourceType(input);

  if (detection.sourceType === 'github') {
    // Use the normalized identifier which is already in owner/repo format
    return `https://deepwiki.com/${detection.normalizedIdentifier}`;
  }

  return null;
}

export interface DetectionOptions {
  enableSelection?: boolean;
}

/**
 * Detects the source type of a dependency identifier with AI assistance
 *
 * Strategy:
 * - High-confidence GitHub/URL pattern matches return immediately (skip AI)
 * - Unknown inputs try Context7 search first (fast NPM package detection)
 * - Context7 failures fall back to Tavily pipeline for intelligent discovery
 * - Final fallback to pattern detection if all AI methods fail
 *
 * @param input - The dependency identifier to detect
 * @param options - Detection options (enableSelection for interactive flows)
 * @returns Promise resolving to detection result with AI assistance metadata including dependency type
 */
export async function detectSourceTypeWithAI(
  input: string,
  options?: DetectionOptions
): Promise<AsyncDetectionResult> {
  // Normalize input
  const trimmed = input.trim();

  // Handle empty input
  if (!trimmed) {
    return {
      sourceType: 'unknown',
      normalizedIdentifier: input,
      confidence: 'low',
      aiAssisted: false,
    };
  }

  // Try pattern detection first for canonical identifiers
  const staticResult = detectSourceType(trimmed);
  
  if (process.env.LEGILIMENS_DEBUG) {
    console.debug(`[detector] Starting detection for "${trimmed}"`);
    console.debug(`[detector] Pattern detection result: ${staticResult.sourceType} (${staticResult.confidence})`);
  }
  
  // Only skip AI pipeline for high-confidence GitHub/URL matches
  if (staticResult.confidence === 'high' && staticResult.sourceType !== 'unknown') {
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug(`[detector] High-confidence ${staticResult.sourceType} match, skipping AI pipeline`);
    }
    return { ...staticResult, aiAssisted: false };
  }

  // Get runtime config for Context7 access
  const { getRuntimeConfig } = await import('../config/runtimeConfig.js');
  const rc = getRuntimeConfig();

  if (process.env.LEGILIMENS_DEBUG) {
    console.debug(`[detector] Context7 API key: ${rc.apiKeys.context7 ? 'configured' : 'missing'}`);
  }

  // Variable to preserve Context7 results when falling through to Tavily
  let preservedContext7Results: Array<{ name: string; score: number; url: string }> | undefined;

  // Try Context7 search if API key available
  if (rc.apiKeys.context7) {
    try {
      if (process.env.LEGILIMENS_DEBUG) {
        console.debug(`[detector] Attempting Context7 search for "${trimmed}"`);
        console.debug(`[detector] Calling Context7 search API`);
      }

      const { searchContext7 } = await import('../fetchers/context7.js');
      const context7Result: Context7SearchResult = await searchContext7(trimmed, {
        apiKey: rc.apiKeys.context7,
        timeoutMs: rc.fetcherConfig.timeoutMs,
        maxRetries: rc.fetcherConfig.maxRetries
      });

      if (process.env.LEGILIMENS_DEBUG) {
        console.debug(`[detector] Context7 search: ${context7Result.success ? 'success' : 'failed'}`);
        console.debug(`[detector] Context7 search completed: ${context7Result.results.length} results`);
        if (context7Result.results.length > 0) {
          const topMatches = context7Result.results.slice(0, 3).map(r => `${r.name} (${r.score.toFixed(2)})`).join(', ');
          console.debug(`[detector] Top 3 matches: ${topMatches}`);
        }
      }

      // Scenario 1: Single high-score result
      if (context7Result.success && 
          context7Result.results.length === 1 && 
          context7Result.results[0].score > 0.8) {
        
        if (process.env.LEGILIMENS_DEBUG) {
          console.debug(`[detector] Context7 high-confidence match: ${context7Result.results[0].name} (score: ${context7Result.results[0].score})`);
          console.debug(`[detector] Returning immediately, skipping Tavily`);
          console.debug(`[detector] Routing: auto-select`);
        }

        // Return immediately with npm source type
        return {
          sourceType: 'npm',
          normalizedIdentifier: context7Result.results[0].name,
          confidence: 'high',
          aiAssisted: false,
          dependencyType: 'library'
        };
      }

      // Scenario 2: Multiple results
      if (context7Result.success && context7Result.results.length > 1) {
        // User selection flow controlled by options parameter (defaults to false for non-interactive callers)
        const enableSelection = options?.enableSelection ?? false;
        
        if (enableSelection) {
          // Selection enabled: return early for user selection in interactive CLI
          if (process.env.LEGILIMENS_DEBUG) {
            console.debug(`[detector] Context7 found ${context7Result.results.length} results`);
            const topMatches = context7Result.results.slice(0, 3).map(r => `${r.name} (${r.score.toFixed(2)})`).join(', ');
            console.debug(`[detector] Top 3 matches: ${topMatches}`);
            console.debug(`[detector] Multiple matches require user selection (Phase 6)`);
            console.debug(`[detector] Routing: user-selection (enableSelection option set to true)`);
          }

          return {
            sourceType: 'unknown',
            normalizedIdentifier: trimmed,
            confidence: 'low',
            aiAssisted: false,
            context7Results: context7Result.results
          };
        } else {
          // Selection disabled: preserve results and fall through to Tavily
          if (process.env.LEGILIMENS_DEBUG) {
            console.debug(`[detector] Context7 found ${context7Result.results.length} results`);
            const topMatches = context7Result.results.slice(0, 3).map(r => `${r.name} (${r.score.toFixed(2)})`).join(', ');
            console.debug(`[detector] Top 3 matches: ${topMatches}`);
            console.debug(`[detector] Selection not enabled, preserving candidates and falling through to Tavily`);
            console.debug(`[detector] Routing: tavily-fallback (enableSelection option not set)`);
          }

          // Store results for attachment to final response, then fall through
          preservedContext7Results = context7Result.results;
        }
      }

      // Scenario 3: No results or low score - fall through to Tavily
      if (process.env.LEGILIMENS_DEBUG) {
        if (!context7Result.success) {
          console.debug(`[detector] Context7 search failed: ${context7Result.error}, falling back to Tavily`);
        } else if (context7Result.results.length === 0) {
          console.debug(`[detector] Context7 found no results, falling back to Tavily`);
        } else {
          console.debug(`[detector] Context7 single result score too low (${context7Result.results[0].score} <= 0.8), falling back to Tavily`);
        }
        console.debug(`[detector] Routing: tavily-fallback`);
      }

    } catch (error) {
      // Log and fall through to Tavily
      if (process.env.LEGILIMENS_DEBUG) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.debug(`[detector] Context7 search exception: ${errorMessage}`);
        console.debug(`[detector] Falling back to Tavily`);
      }
    }
  } else {
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug(`[detector] Context7 API key not configured, skipping search`);
    }
  }

  if (process.env.LEGILIMENS_DEBUG) {
    console.debug(`[detector] Calling Tavily pipeline (Context7 search completed with no actionable results)`);
  }

  // Try AI-assisted discovery via local pipeline (llama.cpp + Tavily)
  try {
    const { discoverWithPipeline } = await import('../ai/repositoryDiscoveryPipeline.js');
    const pr = await discoverWithPipeline(trimmed);
    
    // Attach preserved Context7 results if they exist
    const result: AsyncDetectionResult = {
      sourceType: pr.sourceType,
      normalizedIdentifier: pr.normalizedIdentifier,
      confidence: pr.confidence,
      dependencyType: pr.dependencyType,
      repositoryUrl: pr.repositoryUrl,
      aiAssisted: true,
    };
    
    // Only attach Context7 results when enableSelection is true (interactive mode)
    if (preservedContext7Results && options?.enableSelection) {
      result.context7Results = preservedContext7Results;
    }
    
    return result;
  } catch (error) {
    console.debug(`AI-assisted pipeline failed for "${trimmed}":`, error);
  }

  // Fall back to regular detection
  const regularResult = detectSourceType(trimmed);
  return {
    ...regularResult,
    aiAssisted: false,
  };
}

/**
 * Checks if the input is a GitHub repository identifier
 *
 * @param input - The dependency identifier to check
 * @returns true if the input matches any GitHub pattern
 */
export function isGitHubIdentifier(input: string): boolean {
  return detectSourceType(input).sourceType === 'github';
}
