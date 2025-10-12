/**
 * Fetcher types for documentation retrieval from external sources
 */

export interface FetchMetadata {
  source: string;
  durationMs: number;
  attempts: string[];
  timestamp: Date;
}

export interface FetchResult {
  success: boolean;
  content?: string;
  metadata?: FetchMetadata;
  error?: string;
}

export interface FetcherConfig {
  timeoutMs: number;
  maxRetries: number;
  apiKey?: string;
}

export interface FetchRequest {
  identifier: string;
  type: 'github' | 'npm' | 'url';
  config: FetcherConfig;
}

/**
 * Type guard to check if fetch was successful
 */
export function isFetchSuccess(result: FetchResult): result is FetchResult & { success: true; content: string; metadata: FetchMetadata } {
  return result.success === true && typeof result.content === 'string' && result.content.length > 0;
}
