/**
 * Fetcher orchestrator - Coordinates fallback chains across different fetchers
 */

import { detectDependencyType } from '../detection/detector.js';
import { fetchFromRefTools } from './refTools.js';
import { fetchFromContext7 } from './context7.js';
import { fetchFromFirecrawl } from './firecrawl.js';
import type { FetchResult, FetcherConfig } from './types.js';
import type { RuntimeConfig } from '../config/runtimeConfig.js';

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
    const refToolsConfig = { ...fetcherConfig, apiKey: runtimeConfig.apiKeys.refTools };
    const refToolsResult = await fetchFromRefTools(identifier, refToolsConfig);
    if (refToolsResult.success) return refToolsResult;

    if (runtimeConfig.apiKeys.firecrawl) {
      const firecrawlConfig = { ...fetcherConfig, apiKey: runtimeConfig.apiKeys.firecrawl };
      const githubUrl = identifier.startsWith('http') ? identifier : `https://github.com/${identifier}`;
      const firecrawlResult = await fetchFromFirecrawl(githubUrl, firecrawlConfig);
      if (firecrawlResult.success) return firecrawlResult;
    }

    return {
      success: false,
      error: `GitHub documentation fetch failed for ${identifier}. Attempted: ref.tools${runtimeConfig.apiKeys.firecrawl ? ', Firecrawl' : ''}`
    };
  }

  // NPM fallback chain: Context7 → ref.tools → Firecrawl
  if (dependencyType === 'npm') {
    const context7Config = { ...fetcherConfig, apiKey: runtimeConfig.apiKeys.context7 };
    const context7Result = await fetchFromContext7(identifier, context7Config);
    if (context7Result.success) return context7Result;

    const refToolsConfig = { ...fetcherConfig, apiKey: runtimeConfig.apiKeys.refTools };
    const refToolsResult = await fetchFromRefTools(identifier, refToolsConfig);
    if (refToolsResult.success) return refToolsResult;

    if (runtimeConfig.apiKeys.firecrawl) {
      const firecrawlConfig = { ...fetcherConfig, apiKey: runtimeConfig.apiKeys.firecrawl };
      const npmUrl = `https://www.npmjs.com/package/${identifier}`;
      const firecrawlResult = await fetchFromFirecrawl(npmUrl, firecrawlConfig);
      if (firecrawlResult.success) return firecrawlResult;
    }

    return {
      success: false,
      error: `NPM documentation fetch failed for ${identifier}. Attempted: Context7, ref.tools${runtimeConfig.apiKeys.firecrawl ? ', Firecrawl' : ''}`
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
    error: `Unknown dependency type for identifier: ${identifier}`
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
