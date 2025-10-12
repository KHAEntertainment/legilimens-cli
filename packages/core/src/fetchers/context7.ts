/**
 * Context7 fetcher - NPM package documentation retrieval
 */

import type { AxiosError } from 'axios';
import axios from 'axios';
import type { FetchResult, FetcherConfig } from './types.js';

const CONTEXT7_BASE_URL = 'https://api.context7.ai/v1';

/**
 * Fetch NPM package documentation from Context7 with retry logic and timeout handling
 */
export async function fetchFromContext7(
  packageName: string,
  config: FetcherConfig
): Promise<FetchResult> {
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
