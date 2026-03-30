/**
 * Context7 fetcher - NPM package documentation retrieval and search
 */

import type { AxiosError } from 'axios';
import axios from 'axios';
import type { FetchResult, FetcherConfig } from './types.js';

const CONTEXT7_BASE_URL = 'https://api.context7.ai/v1';

/**
 * Search result from Context7 API
 */
export interface Context7SearchResult {
  success: boolean;
  results: Array<{
    name: string;
    score: number;
    url: string;
  }>;
  error?: string;
  metadata?: {
    source: string;
    durationMs: number;
    attempts: string[];
    timestamp: Date;
  };
}

/**
 * Fetch NPM package documentation from Context7 with retry logic and timeout handling
 */
export async function fetchFromContext7(
  packageName: string,
  config: FetcherConfig
): Promise<FetchResult> {
  // Early guard: Context7 requires API key
  if (!config.apiKey) {
    return {
      success: false,
      error: 'Context7 API key is required'
    };
  }

  const startTime = Date.now();
  const attempts: string[] = [];

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      attempts.push(`Context7 (attempt ${attempt + 1})`);

      const response = await axios.get(`${CONTEXT7_BASE_URL}/npm/${encodeURIComponent(packageName)}`, {
        timeout: config.timeoutMs,
        headers: {
          'Accept': 'application/json',
          ...(config.apiKey && { 'X-API-Key': config.apiKey })
        }
      });

      if (response.status === 200 && response.data?.documentation) {
        return {
          success: true,
          content: response.data.documentation,
          metadata: {
            source: 'Context7',
            durationMs: Date.now() - startTime,
            attempts,
            timestamp: new Date()
          }
        };
      }

      return {
        success: false,
        error: `Context7 returned status ${response.status} without documentation`
      };

    } catch (error) {
      const axiosError = error as AxiosError;

      // Handle rate limiting with Retry-After
      if (axiosError.response?.status === 429) {
        const retryAfter = axiosError.response.headers['retry-after'];
        const delayMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 1000 * Math.pow(2, attempt);

        if (attempt < config.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
      }

      // Retry on network errors or 5xx with exponential backoff
      if (
        axiosError.code === 'ECONNABORTED' ||
        axiosError.code === 'ETIMEDOUT' ||
        (axiosError.response?.status && axiosError.response.status >= 500)
      ) {
        if (attempt < config.maxRetries) {
          const backoffMs = 100 * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }
      }

      // Final attempt failed
      if (attempt === config.maxRetries) {
        return {
          success: false,
          error: `Context7 fetch failed: ${axiosError.message}`
        };
      }
    }
  }

  return {
    success: false,
    error: 'Context7 fetch failed after all retry attempts'
  };
}

/**
 * Search for packages on Context7 with retry logic and timeout handling
 *
 * @param query - Search query (e.g., "strapi", "OpenAI Codex")
 * @param config - Fetcher configuration with API key, timeout, and retry settings
 * @returns Promise resolving to search results with package matches
 *
 * @example
 * const result = await searchContext7('strapi', {
 *   apiKey: 'your-api-key',
 *   timeoutMs: 10000,
 *   maxRetries: 2
 * });
 *
 * if (result.success && result.results.length > 0) {
 *   console.log(`Found ${result.results.length} matches`);
 *   console.log(`Top match: ${result.results[0].name} (score: ${result.results[0].score})`);
 * }
 */
export async function searchContext7(
  query: string,
  config: FetcherConfig
): Promise<Context7SearchResult> {
  // Early guard: Context7 requires API key
  if (!config.apiKey) {
    return {
      success: false,
      results: [],
      error: 'Context7 API key is required'
    };
  }

  const startTime = Date.now();
  const attempts: string[] = [];

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      attempts.push(`Context7 search (attempt ${attempt + 1})`);

      if (process.env.LEGILIMENS_DEBUG) {
        console.log(`[context7] Search started: query="${query}", attempt=${attempt + 1}`);
      }

      const response = await axios.get(`${CONTEXT7_BASE_URL}/search?query=${encodeURIComponent(query)}`, {
        timeout: config.timeoutMs,
        headers: {
          'Accept': 'application/json',
          'X-API-Key': config.apiKey
        }
      });

      if (response.status === 200) {
        // Check if results array exists
        if (Array.isArray(response.data?.results)) {
          // Defensively shape/validate search results before returning
          const sanitizedResults = response.data.results
            .map((item: unknown) => {
              if (
                item &&
                typeof item === 'object' &&
                'name' in item &&
                'score' in item &&
                'url' in item &&
                typeof (item as { name: unknown }).name === 'string' &&
                typeof (item as { score: unknown }).score === 'number' &&
                typeof (item as { url: unknown }).url === 'string'
              ) {
                return {
                  name: (item as { name: string }).name,
                  score: (item as { score: number }).score,
                  url: (item as { url: string }).url
                };
              }
              return null;
            })
            .filter((item: { name: string; score: number; url: string } | null): item is { name: string; score: number; url: string } => item !== null);

          if (process.env.LEGILIMENS_DEBUG) {
            console.log(`[context7] Search completed: ${sanitizedResults.length} results for "${query}"`);
            if (sanitizedResults.length > 0) {
              const topMatches = sanitizedResults.slice(0, 3).map((r: { name: string; score: number; url: string }) => `${r.name} (${r.score})`).join(', ');
              console.log(`[context7] Top matches: ${topMatches}`);
            }
          }

          return {
            success: true,
            results: sanitizedResults,
            metadata: {
              source: 'Context7',
              durationMs: Date.now() - startTime,
              attempts,
              timestamp: new Date()
            }
          };
        } else {
          // No results array - return empty results
          return {
            success: true,
            results: [],
            metadata: {
              source: 'Context7',
              durationMs: Date.now() - startTime,
              attempts,
              timestamp: new Date()
            }
          };
        }
      }

      return {
        success: false,
        results: [],
        error: `Context7 search returned status ${response.status}`
      };

    } catch (error) {
      const axiosError = error as AxiosError;

      // Handle rate limiting with Retry-After
      if (axiosError.response?.status === 429) {
        const retryAfter = axiosError.response.headers['retry-after'];
        const delayMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 1000 * Math.pow(2, attempt);

        if (process.env.LEGILIMENS_DEBUG) {
          console.log(`[context7] Rate limited, retrying after ${delayMs}ms`);
        }

        if (attempt < config.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
      }

      // Retry on network errors or 5xx with exponential backoff
      if (
        axiosError.code === 'ECONNABORTED' ||
        axiosError.code === 'ETIMEDOUT' ||
        (axiosError.response?.status && axiosError.response.status >= 500)
      ) {
        if (attempt < config.maxRetries) {
          const backoffMs = 100 * Math.pow(2, attempt);
          
          if (process.env.LEGILIMENS_DEBUG) {
            if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
              console.log(`[context7] Network error, retrying after ${backoffMs}ms`);
            } else {
              console.log(`[context7] Server error (${axiosError.response?.status}), retrying after ${backoffMs}ms`);
            }
          }

          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }
      }

      // Client errors (4xx except 429) - don't retry
      if (axiosError.response?.status && axiosError.response.status >= 400 && axiosError.response.status < 500) {
        if (process.env.LEGILIMENS_DEBUG) {
          console.log(`[context7] Client error (${axiosError.response.status}): ${axiosError.message}`);
        }

        return {
          success: false,
          results: [],
          error: `Context7 search failed: ${axiosError.message}`
        };
      }

      // Final attempt failed
      if (attempt === config.maxRetries) {
        if (process.env.LEGILIMENS_DEBUG) {
          console.log(`[context7] Search failed after ${config.maxRetries + 1} attempts`);
        }

        return {
          success: false,
          results: [],
          error: `Context7 search failed: ${axiosError.message}`
        };
      }
    }
  }

  return {
    success: false,
    results: [],
    error: 'Context7 search failed after all retry attempts'
  };
}