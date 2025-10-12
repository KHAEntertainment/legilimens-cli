/**
 * Source Detection Module
 *
 * Provides pattern matching utilities for identifying dependency sources
 * (GitHub repositories, NPM packages, URLs) and deriving DeepWiki URLs
 * from GitHub identifiers.
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
}

// Detection Patterns

const GITHUB_PATTERNS = [
  // github.com/owner/repo (with or without protocol, optional www subdomain)
  /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+\/[^\/]+?)(?:\.git)?(?:\/.*)?$/i,
  // owner/repo format (two segments separated by slash, optional trailing slash)
  /^([^\/]+\/[^\/]+?)(?:\.git)?\/?$/,
];

const URL_PATTERN = /^https?:\/\//i;

const NPM_PATTERNS = [
  // @scope/package format
  /^@[a-z0-9-]+\/[a-z0-9-]+$/,
  // simple package names (lowercase, hyphens, no slashes) - more restrictive
  // Must start with letter and avoid common non-package patterns
  /^[a-z][a-z0-9-]*[a-z0-9]$/,
];

// Common non-package patterns that should be treated as unknown
const NON_PACKAGE_PATTERNS = [
  /^unknown-/,
  /^test-/,
  /\d{4,}$/, // ends with 4+ digits
  /format-\d+$/,
];

// Natural Language Processing Functions

/**
 * AI-assisted repository discovery using CLI agents
 * 
 * @param input - Natural language description (e.g., "Jumpcloud API 2.0")
 * @param dependencyType - The type of dependency (api, framework, library, tool, other)
 * @returns Promise resolving to canonical identifier if AI can find it, original input otherwise
 */
async function discoverRepositoryWithAI(input: string, dependencyType: string): Promise<string> {
  try {
    // Import here to avoid circular dependencies
    const { discoverRepositoryWithAI: aiDiscovery } = await import('../ai/repositoryDiscovery.js');
    
    const result = await aiDiscovery(input, dependencyType);
    
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

  // Test NPM scoped packages FIRST (before GitHub, since they contain slashes)
  if (identifierToTest.startsWith('@')) {
    if (NPM_PATTERNS[0].test(identifierToTest)) {
      return {
        sourceType: 'npm',
        normalizedIdentifier: identifierToTest,
        confidence: isMapped ? 'medium' : 'high',
      };
    }
  }

  // Test GitHub patterns (priority 2)
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

  // Test URL pattern (priority 3) - exclude GitHub URLs
  if (URL_PATTERN.test(identifierToTest) && !identifierToTest.toLowerCase().includes('github.com')) {
    return {
      sourceType: 'url',
      normalizedIdentifier: identifierToTest,
      confidence: isMapped ? 'medium' : 'high',
    };
  }

  // Test simple NPM packages (priority 4)
  if (!identifierToTest.includes('/')) {
    const lowerIdentifier = identifierToTest.toLowerCase();
    
    // Check non-package patterns first
    for (const pattern of NON_PACKAGE_PATTERNS) {
      if (pattern.test(lowerIdentifier)) {
        return {
          sourceType: 'unknown',
          normalizedIdentifier: trimmed,
          confidence: 'low',
        };
      }
    }
    
    // Then test NPM pattern
    if (NPM_PATTERNS[1].test(lowerIdentifier)) {
      return {
        sourceType: 'npm',
        normalizedIdentifier: identifierToTest,
        confidence: isMapped ? 'medium' : 'medium',
      };
    }
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
 * @param dependencyType - The type of dependency (api, framework, library, tool, other)
 * @returns Promise resolving to detection result with AI assistance metadata
 */
export async function detectSourceTypeWithAI(
  input: string, 
  dependencyType: string = 'other'
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
  
  // If we got a confident result from pattern detection, use it
  if (staticResult.confidence === 'high' || staticResult.confidence === 'medium') {
    return {
      ...staticResult,
      aiAssisted: false,
    };
  }

  // Try AI-assisted discovery
  try {
    const aiDiscoveredIdentifier = await discoverRepositoryWithAI(trimmed, dependencyType);
    const isAiDiscovered = aiDiscoveredIdentifier !== trimmed;

    if (isAiDiscovered) {
      const aiResult = detectSourceType(aiDiscoveredIdentifier);
      return {
        ...aiResult,
        aiAssisted: true,
        confidence: 'medium', // AI-assisted results are medium confidence
      };
    }
  } catch (error) {
    console.debug(`AI-assisted discovery failed for "${trimmed}":`, error);
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
