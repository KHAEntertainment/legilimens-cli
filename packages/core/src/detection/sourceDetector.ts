/**
 * Source Detection Module
 *
 * Provides pattern matching utilities for identifying dependency sources
 * (GitHub repositories, URLs) and deriving DeepWiki URLs from GitHub identifiers.
 * NPM package detection is handled by Context7 search API (see repositoryDiscoveryPipeline).
 */

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
 * Maps natural language descriptions to canonical identifiers
 * 
 * @param input - Natural language description (e.g., "Jumpcloud API 2.0")
 * @returns Canonical identifier if mapping found, original input otherwise
 */
function mapNaturalLanguageToIdentifier(input: string): string {
  // Only handle very basic, unambiguous cases
  const normalized = input.toLowerCase().trim();
  
  // Basic framework names that are unambiguous
  const basicMappings: Record<string, string> = {
    'react': 'react',
    'vue': 'vue', 
    'angular': 'angular',
    'svelte': 'svelte',
    'express': 'express',
    'typescript': 'typescript',
    'eslint': 'eslint',
    'prettier': 'prettier',
    'jest': 'jest',
    'mocha': 'mocha',
    'webpack': 'webpack',
    'rollup': 'rollup',
    'vite': 'vite',
  };

  // Only return mapped value for exact matches
  if (basicMappings[normalized]) {
    return basicMappings[normalized];
  }

  // For everything else, return original input and let AI handle it
  return input;
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

  // Try natural language mapping first
  const mappedIdentifier = mapNaturalLanguageToIdentifier(trimmed);
  const isMapped = mappedIdentifier !== trimmed;

  // Use mapped identifier for detection if mapping was successful
  const identifierToTest = isMapped ? mappedIdentifier : trimmed;

  // Exclude scoped packages (starting with @) from GitHub detection
  // These should return unknown and trigger AI pipeline
  if (!identifierToTest.startsWith('@')) {
    // Test GitHub patterns (priority 1)
    for (const pattern of GITHUB_PATTERNS) {
      const match = identifierToTest.match(pattern);
      if (match) {
        // Extract owner/repo, removing .git suffix and trailing slashes
        const ownerRepo = match[1].replace(/\.git$/, '').replace(/\/$/, '');
        return {
          sourceType: 'github',
          normalizedIdentifier: ownerRepo,
          confidence: isMapped ? 'medium' : 'high',
        };
      }
    }
  }

  // Test URL pattern (priority 2) - exclude GitHub URLs
  if (URL_PATTERN.test(identifierToTest) && !identifierToTest.toLowerCase().includes('github.com')) {
    return {
      sourceType: 'url',
      normalizedIdentifier: identifierToTest,
      confidence: isMapped ? 'medium' : 'high',
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

/**
 * Detects the source type of a dependency identifier with AI assistance
 *
 * @param input - The dependency identifier to detect
 * @returns Promise resolving to detection result with AI assistance metadata including dependency type
 */
export async function detectSourceTypeWithAI(
  input: string
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
  
  // If we got a confident result from pattern detection, use it,
  // UNLESS the input looks like natural language (capitalized or contains spaces),
  // in which case prefer AI-assisted pipeline to resolve ambiguity.
  const looksNaturalLanguage = /[A-Z]/.test(trimmed) || /\s/.test(trimmed);
  if (!looksNaturalLanguage && (staticResult.confidence === 'high' || staticResult.confidence === 'medium')) {
    return { ...staticResult, aiAssisted: false };
  }

  // Try AI-assisted discovery via local pipeline (llama.cpp + Tavily)
  try {
    const { discoverWithPipeline } = await import('../ai/repositoryDiscoveryPipeline.js');
    const pr = await discoverWithPipeline(trimmed);
    return {
      sourceType: pr.sourceType,
      normalizedIdentifier: pr.normalizedIdentifier,
      confidence: pr.confidence,
      dependencyType: pr.dependencyType,
      aiAssisted: true,
    };
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
