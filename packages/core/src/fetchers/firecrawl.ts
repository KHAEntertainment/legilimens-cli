/**
 * Firecrawl fetcher - Web scraping and content extraction
 */

import type { AxiosError } from 'axios';
import axios from 'axios';
import type { FetchResult, FetcherConfig } from './types.js';

const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v1';

/**
 * Fetch web content via Firecrawl with retry logic and timeout handling
 */
export async function fetchFromFirecrawl(
  url: string,
  config: FetcherConfig
): Promise<FetchResult> {
  const startTime = Date.now();
  const attempts: string[] = [];

  if (!config.apiKey) {
    return {
      success: false,
      error: 'Firecrawl API key is required'
    };
  }

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      attempts.push(`Firecrawl (attempt ${attempt + 1})`);

      const response = await axios.post(
        `${FIRECRAWL_BASE_URL}/scrape`,
        {
          url,
          formats: ['markdown', 'html'],
          onlyMainContent: true
        },
        {
          timeout: config.timeoutMs,
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 200 && response.data?.data?.markdown) {
        return {
          success: true,
          content: response.data.data.markdown,
          metadata: {
            source: 'Firecrawl',
            durationMs: Date.now() - startTime,
            attempts,
            timestamp: new Date()
          }
        };
      }

      return {
        success: false,
        error: `Firecrawl returned status ${response.status} without markdown content`
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
          error: `Firecrawl fetch failed: ${axiosError.message}`
        };
      }
    }
  }

  return {
    success: false,
    error: 'Firecrawl fetch failed after all retry attempts'
  };
}
