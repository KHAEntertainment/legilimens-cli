import { type DependencyType } from '@legilimens/core';
import { detectSourceType, deriveDeepWikiUrl, type SourceType } from '@legilimens/core';
import type { BatchDependency } from './batchInputParser.js';

/**
 * Classified dependency with metadata
 */
export interface ClassifiedDependency {
  identifier: string;
  normalizedIdentifier: string;
  dependencyType: DependencyType;
  sourceType: SourceType;
  deepWikiUrl: string | null;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Result of dependency classification with optional warnings
 */
export interface ClassificationResult {
  classified: ClassifiedDependency;
  warnings: string[];
}

/**
 * Classify a single dependency and map source type to dependency type
 */
export function classifyDependency(
  identifier: string,
  explicitType?: DependencyType,
  explicitDeepWiki?: string
): ClassificationResult {
  const { sourceType, normalizedIdentifier } = detectSourceType(identifier);
  const warnings: string[] = [];

  // If explicit type is provided (from JSON file), use it with high confidence
  if (explicitType) {
    const deepWikiUrl = (explicitDeepWiki && explicitDeepWiki.trim()) ? explicitDeepWiki : deriveDeepWikiUrl(normalizedIdentifier);
    return {
      classified: {
        identifier,
        normalizedIdentifier,
        dependencyType: explicitType,
        sourceType,
        deepWikiUrl,
        confidence: 'high',
      },
      warnings
    };
  }

  // Auto-detect dependency type based on source type
  const { dependencyType, confidence } = mapSourceTypeToDependencyType(sourceType, normalizedIdentifier);
  const deepWikiUrl = (explicitDeepWiki && explicitDeepWiki.trim()) ? explicitDeepWiki : deriveDeepWikiUrl(normalizedIdentifier);

  const classified: ClassifiedDependency = {
    identifier,
    normalizedIdentifier,
    dependencyType,
    sourceType,
    deepWikiUrl,
    confidence,
  };

  // Collect warnings for low-confidence classifications
  if (confidence === 'low') {
    warnings.push(
      `Low confidence classification for "${identifier}": detected as "${dependencyType}". ` +
      `Consider specifying the type explicitly in JSON format.`
    );
  }

  return { classified, warnings };
}

/**
 * Map source type to dependency type using heuristics
 */
function mapSourceTypeToDependencyType(
  sourceType: SourceType,
  normalizedIdentifier: string
): { dependencyType: DependencyType; confidence: 'high' | 'medium' | 'low' } {
  const lowerIdentifier = normalizedIdentifier.toLowerCase();

  switch (sourceType) {
    case 'github': {
      // Analyze repo name for keywords
      if (lowerIdentifier.includes('framework') || lowerIdentifier.includes('sdk')) {
        return { dependencyType: 'framework', confidence: 'high' };
      }
      if (lowerIdentifier.includes('api') || lowerIdentifier.includes('client')) {
        return { dependencyType: 'api', confidence: 'medium' };
      }
      if (lowerIdentifier.includes('cli') || lowerIdentifier.includes('tool')) {
        return { dependencyType: 'tool', confidence: 'medium' };
      }
      // Default to library for GitHub repos
      return { dependencyType: 'library', confidence: 'medium' };
    }

    case 'npm': {
      // Most npm packages are libraries
      return { dependencyType: 'library', confidence: 'high' };
    }

    case 'url': {
      // Analyze URL path for API indicators
      if (lowerIdentifier.includes('/api/') || lowerIdentifier.includes('/docs/api')) {
        return { dependencyType: 'api', confidence: 'medium' };
      }
      // Default to 'other' for generic URLs
      return { dependencyType: 'other', confidence: 'low' };
    }

    case 'unknown':
    default: {
      return { dependencyType: 'other', confidence: 'low' };
    }
  }
}

/**
 * Result of batch classification with warnings
 */
export interface BatchClassificationResult {
  classified: ClassifiedDependency[];
  warnings: string[];
}

/**
 * Classify and sort a batch of dependencies
 */
export function classifyBatch(dependencies: BatchDependency[]): BatchClassificationResult {
  const allWarnings: string[] = [];
  const classified = dependencies.map(dep => {
    const result = classifyDependency(dep.identifier, dep.type, dep.deepWiki);
    allWarnings.push(...result.warnings);
    return result.classified;
  });

  // Sort by dependency type for organized processing
  const typeOrder: Record<DependencyType, number> = {
    framework: 1,
    api: 2,
    library: 3,
    tool: 4,
    other: 5,
  };

  const sorted = classified.sort((a, b) => {
    const orderA = typeOrder[a.dependencyType] || 999;
    const orderB = typeOrder[b.dependencyType] || 999;
    return orderA - orderB;
  });

  return {
    classified: sorted,
    warnings: allWarnings
  };
}
