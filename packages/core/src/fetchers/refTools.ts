/**
 * ref.tools fetcher - Documentation retrieval from ref.tools API
 */

import type { AxiosError } from 'axios';
import axios from 'axios';
import type { FetchResult, FetcherConfig } from './types.js';

const REF_TOOLS_BASE_URL = 'https://api.ref.tools/v1';

/**
 * Fetch documentation from ref.tools with retry logic and timeout handling
 */
export async function fetchFromRefTools(
  identifier: string,
  config: FetcherConfig
): Promise<FetchResult> {
  const startTime = Date.now();
  const attempts: string[] = [];

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      attempts.push(`ref.tools (attempt ${attempt + 1})`);

      const response = await axios.get(`${REF_TOOLS_BASE_URL}/docs/${encodeURIComponent(identifier)}`, {
        timeout: config.timeoutMs,
        headers: {
          'Accept': 'application/json',
          ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
        }
      });

      if (response.status === 200 && response.data?.content) {
        return {
          success: true,
          content: response.data.content,
          metadata: {
            source: 'ref.tools',
            durationMs: Date.now() - startTime,
            attempts,
            timestamp: new Date()
          }
        };
      }

      return {
        success: false,
        error: `ref.tools returned status ${response.status} without content`
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
          error: `ref.tools fetch failed: ${axiosError.message}`
        };
      }
    }
  }

  return {
    success: false,
    error: 'ref.tools fetch failed after all retry attempts'
  };
}
