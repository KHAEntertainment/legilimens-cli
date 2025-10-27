import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { fetchFromContext7 } from '../../src/fetchers/context7.js';
import type { FetcherConfig } from '../../src/fetchers/types.js';

vi.mock('axios');

describe('Context7 fetcher', () => {
  const mockConfig: FetcherConfig = {
    timeoutMs: 60000,
    maxRetries: 2,
    apiKey: 'test-context7-key'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches NPM package documentation successfully', async () => {
    const mockResponse = {
      status: 200,
      data: { documentation: '# React Documentation\n\nReact is a library...' }
    };

    vi.mocked(axios.get).mockResolvedValueOnce(mockResponse);

    const result = await fetchFromContext7('react', mockConfig);

    expect(result.success).toBe(true);
    expect(result.content).toBe('# React Documentation\n\nReact is a library...');
    expect(result.metadata?.source).toBe('Context7');
    expect(result.metadata?.attempts).toHaveLength(1);
  });

  it('retries on network errors', async () => {
    const networkError = {
      code: 'ECONNABORTED',
      message: 'Network error'
    };

    const mockSuccess = {
      status: 200,
      data: { documentation: '# Documentation' }
    };

    vi.mocked(axios.get)
      .mockRejectedValueOnce(networkError)
      .mockResolvedValueOnce(mockSuccess);

    const result = await fetchFromContext7('lodash', mockConfig);

    expect(result.success).toBe(true);
    expect(result.metadata?.attempts).toHaveLength(2);
  });

  it('handles 429 rate limiting with exponential backoff', async () => {
    const error429 = {
      response: {
        status: 429,
        headers: {}
      },
      message: 'Rate limited'
    };

    const mockSuccess = {
      status: 200,
      data: { documentation: '# Documentation' }
    };

    vi.mocked(axios.get)
      .mockRejectedValueOnce(error429)
      .mockResolvedValueOnce(mockSuccess);

    const result = await fetchFromContext7('express', mockConfig);

    expect(result.success).toBe(true);
  });

  it('fails after max retries', async () => {
    const error500 = {
      response: { status: 500 },
      message: 'Server error'
    };

    vi.mocked(axios.get).mockRejectedValue(error500);

    const result = await fetchFromContext7('package', mockConfig);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Context7 fetch failed');
    expect(axios.get).toHaveBeenCalledTimes(3);
  });

  it('uses correct API key header', async () => {
    const mockResponse = {
      status: 200,
      data: { documentation: '# Docs' }
    };

    vi.mocked(axios.get).mockResolvedValueOnce(mockResponse);

    await fetchFromContext7('test-package', mockConfig);

    expect(axios.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-API-Key': 'test-context7-key'
        })
      })
    );
  });

  it('handles missing documentation field in response', async () => {
    const mockResponse = {
      status: 200,
      data: {}
    };

    vi.mocked(axios.get).mockResolvedValueOnce(mockResponse);

    const result = await fetchFromContext7('package', mockConfig);

    expect(result.success).toBe(false);
    expect(result.error).toContain('without documentation');
  });
});
