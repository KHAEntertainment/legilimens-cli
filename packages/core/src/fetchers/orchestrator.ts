/**
 * Fetcher orchestrator - Coordinates fallback chains across different fetchers
 */

import { detectDependencyType } from '../detection/detector.js';
import { fetchFromRefTools } from './refTools.js';
import { fetchFromContext7 } from './context7.js';
import { fetchFromFirecrawl } from './firecrawl.js';
import type { FetchResult, FetcherConfig } from './types.js';
import type { RuntimeConfig } from '../config/runtimeConfig.js';
import type { SourceType } from '../detection/sourceDetector.js';

/**
 * Normalize GitHub/NPM identifiers before URL construction
 */
function normalizeIdentifierForUrl(identifier: string, sourceType: SourceType): string {
  let normalized = identifier.trim();
  
  // Strip .git suffix
  normalized = normalized.replace(/\.git$/i, '');
  
  // Strip trailing slashes
  normalized = normalized.replace(/\/+$/, '');
  
  // For GitHub, ensure exactly one slash (owner/repo format)
  if (sourceType === 'github') {
    // Remove any leading/trailing whitespace around slash
    normalized = normalized.replace(/\s*\/\s*/g, '/');
    
    // Ensure we have exactly one slash for owner/repo
    const parts = normalized.split('/').filter(p => p.length > 0);
    if (parts.length >= 2) {
      normalized = `${parts[0]}/${parts[1]}`;
    }
  }
  
  return normalized;
}

/**
 * Fetch documentation using appropriate fallback chain based on dependency type
 */
export async function fetchDocumentation(
  identifier: string,
  runtimeConfig: RuntimeConfig
): Promise<FetchResult> {
  const dependencyType = detectDependencyType(identifier);

  const fetcherConfig: FetcherConfig = {
    timeoutMs: runtimeConfig.fetcherConfig.timeoutMs,
    maxRetries: runtimeConfig.fetcherConfig.maxRetries
  };

  // GitHub fallback chain: ref.tools → Firecrawl
  if (dependencyType === 'github') {
    const normalizedId = normalizeIdentifierForUrl(identifier, 'github');
    const refToolsConfig = { ...fetcherConfig, apiKey: runtimeConfig.apiKeys.refTools };
    const refToolsResult = await fetchFromRefTools(normalizedId, refToolsConfig);
    if (refToolsResult.success) return refToolsResult;

    if (runtimeConfig.apiKeys.firecrawl) {
      const firecrawlConfig = { ...fetcherConfig, apiKey: runtimeConfig.apiKeys.firecrawl };
      const githubUrl = normalizedId.startsWith('http') ? normalizedId : `https://github.com/${normalizedId}`;
      const firecrawlResult = await fetchFromFirecrawl(githubUrl, firecrawlConfig);
      if (firecrawlResult.success) return firecrawlResult;
    }

    return {
      success: false,
      error: `GitHub documentation fetch failed for ${identifier}. Try using owner/repo format (e.g., vercel/ai). Attempted: ref.tools${runtimeConfig.apiKeys.firecrawl ? ', Firecrawl' : ''}`
    };
  }

  // NPM fallback chain: Context7 → ref.tools → Firecrawl
  if (dependencyType === 'npm') {
    const normalizedId = normalizeIdentifierForUrl(identifier, 'npm');
    const context7Config = { ...fetcherConfig, apiKey: runtimeConfig.apiKeys.context7 };
    const context7Result = await fetchFromContext7(normalizedId, context7Config);
    if (context7Result.success) return context7Result;

    const refToolsConfig = { ...fetcherConfig, apiKey: runtimeConfig.apiKeys.refTools };
    const refToolsResult = await fetchFromRefTools(normalizedId, refToolsConfig);
    if (refToolsResult.success) return refToolsResult;

    if (runtimeConfig.apiKeys.firecrawl) {
      const firecrawlConfig = { ...fetcherConfig, apiKey: runtimeConfig.apiKeys.firecrawl };
      const npmUrl = `https://www.npmjs.com/package/${normalizedId}`;
      const firecrawlResult = await fetchFromFirecrawl(npmUrl, firecrawlConfig);
      if (firecrawlResult.success) return firecrawlResult;
    }

    return {
      success: false,
      error: `NPM documentation fetch failed for ${identifier}. Try using package name (e.g., react). Attempted: Context7, ref.tools${runtimeConfig.apiKeys.firecrawl ? ', Firecrawl' : ''}`
    };
  }

  // URL fallback chain: Firecrawl only
  if (dependencyType === 'url') {
    if (!runtimeConfig.apiKeys.firecrawl) {
      return {
        success: false,
        error: 'Firecrawl API key required for URL fetching'
      };
    }

    const firecrawlConfig = { ...fetcherConfig, apiKey: runtimeConfig.apiKeys.firecrawl };
    return await fetchFromFirecrawl(identifier, firecrawlConfig);
  }

  return {
    success: false,
    error: `Unknown dependency type for identifier: ${identifier}. Supported formats: GitHub owner/repo (e.g., vercel/ai), NPM package name (e.g., react), or direct URL (e.g., https://example.com/docs)`
  };
}

/**
 * Fetch documentation using a precomputed source type (avoids re-detection)
 * Recommended when source type is already known from AI detection pipeline
 */
export async function fetchDocumentationWithSource(
  identifier: string,
  sourceType: SourceType,
  runtimeConfig: RuntimeConfig,
  repositoryUrl?: string
): Promise<FetchResult> {
  const fetcherConfig: FetcherConfig = {
    timeoutMs: runtimeConfig.fetcherConfig.timeoutMs,
    maxRetries: runtimeConfig.fetcherConfig.maxRetries
  };

  // GitHub fallback chain: ref.tools → Firecrawl (prefer repositoryUrl if provided)
  if (sourceType === 'github') {
    const normalizedId = normalizeIdentifierForUrl(identifier, 'github');
    const refToolsConfig = { ...fetcherConfig, apiKey: runtimeConfig.apiKeys.refTools };
    const refToolsResult = await fetchFromRefTools(normalizedId, refToolsConfig);
    if (refToolsResult.success) return refToolsResult;

    if (runtimeConfig.apiKeys.firecrawl) {
      const firecrawlConfig = { ...fetcherConfig, apiKey: runtimeConfig.apiKeys.firecrawl };
      // Prefer repositoryUrl from AI detection if available
      const githubUrl = repositoryUrl || 
        (normalizedId.startsWith('http') ? normalizedId : `https://github.com/${normalizedId}`);
      const firecrawlResult = await fetchFromFirecrawl(githubUrl, firecrawlConfig);
      if (firecrawlResult.success) return firecrawlResult;
    }

    return {
      success: false,
      error: `GitHub documentation fetch failed for ${identifier}. Try using owner/repo format (e.g., vercel/ai). Attempted: ref.tools${runtimeConfig.apiKeys.firecrawl ? ', Firecrawl' : ''}`
    };
  }

  // NPM fallback chain: Context7 → ref.tools → Firecrawl
  if (sourceType === 'npm') {
    const normalizedId = normalizeIdentifierForUrl(identifier, 'npm');
    const context7Config = { ...fetcherConfig, apiKey: runtimeConfig.apiKeys.context7 };
    const context7Result = await fetchFromContext7(normalizedId, context7Config);
    if (context7Result.success) return context7Result;

    const refToolsConfig = { ...fetcherConfig, apiKey: runtimeConfig.apiKeys.refTools };
    const refToolsResult = await fetchFromRefTools(normalizedId, refToolsConfig);
    if (refToolsResult.success) return refToolsResult;

    if (runtimeConfig.apiKeys.firecrawl) {
      const firecrawlConfig = { ...fetcherConfig, apiKey: runtimeConfig.apiKeys.firecrawl };
      const npmUrl = `https://www.npmjs.com/package/${normalizedId}`;
      const firecrawlResult = await fetchFromFirecrawl(npmUrl, firecrawlConfig);
      if (firecrawlResult.success) return firecrawlResult;
    }

    return {
      success: false,
      error: `NPM documentation fetch failed for ${identifier}. Try using package name (e.g., react). Attempted: Context7, ref.tools${runtimeConfig.apiKeys.firecrawl ? ', Firecrawl' : ''}`
    };
  }

  // URL fallback chain: Firecrawl only (prefer repositoryUrl if provided)
  if (sourceType === 'url') {
    if (!runtimeConfig.apiKeys.firecrawl) {
      return {
        success: false,
        error: 'Firecrawl API key required for URL fetching'
      };
    }

    const firecrawlConfig = { ...fetcherConfig, apiKey: runtimeConfig.apiKeys.firecrawl };
    const urlToFetch = repositoryUrl || identifier;
    return await fetchFromFirecrawl(urlToFetch, firecrawlConfig);
  }

  return {
    success: false,
    error: `Unknown source type for identifier: ${identifier}. Supported formats: GitHub owner/repo (e.g., vercel/ai), NPM package name (e.g., react), or direct URL (e.g., https://example.com/docs)`
  };
}

/**
 * Describe the fetch strategy that will be used for a given identifier
 */
export function describeFetchStrategy(identifier: string, runtimeConfig: RuntimeConfig): string {
  const dependencyType = detectDependencyType(identifier);

  if (dependencyType === 'github') {
    const strategies = ['ref.tools'];
    if (runtimeConfig.apiKeys.firecrawl) strategies.push('Firecrawl');
    return `GitHub: ${strategies.join(' → ')}`;
  }

  if (dependencyType === 'npm') {
    const strategies = ['Context7', 'ref.tools'];
    if (runtimeConfig.apiKeys.firecrawl) strategies.push('Firecrawl');
    return `NPM: ${strategies.join(' → ')}`;
  }

  if (dependencyType === 'url') {
    return runtimeConfig.apiKeys.firecrawl ? 'URL: Firecrawl' : 'URL: No API key configured';
  }

  return 'Unknown type: No strategy available';
}
