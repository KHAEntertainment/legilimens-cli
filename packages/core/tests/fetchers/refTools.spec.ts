import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { fetchFromRefTools } from '../../src/fetchers/refTools.js';
import type { FetcherConfig } from '../../src/fetchers/types.js';

vi.mock('axios');

describe('refTools fetcher', () => {
  const mockConfig: FetcherConfig = {
    timeoutMs: 60000,
    maxRetries: 2,
    apiKey: 'test-api-key'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches documentation successfully on first attempt', async () => {
    const mockResponse = {
      status: 200,
      data: { content: '# Test Documentation\n\nThis is test content.' }
    };

    vi.mocked(axios.get).mockResolvedValueOnce(mockResponse);

    const result = await fetchFromRefTools('test-package', mockConfig);

    expect(result.success).toBe(true);
    expect(result.content).toBe('# Test Documentation\n\nThis is test content.');
    expect(result.metadata?.source).toBe('ref.tools');
    expect(result.metadata?.attempts).toHaveLength(1);
  });

  it('retries on 5xx errors with exponential backoff', async () => {
    const error500 = {
      response: { status: 500 },
      message: 'Internal Server Error'
    };

    const mockSuccess = {
      status: 200,
      data: { content: '# Documentation' }
    };

    vi.mocked(axios.get)
      .mockRejectedValueOnce(error500)
      .mockResolvedValueOnce(mockSuccess);

    const result = await fetchFromRefTools('test-package', mockConfig);

    expect(result.success).toBe(true);
    expect(result.metadata?.attempts).toHaveLength(2);
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it('handles 429 rate limiting with Retry-After header', async () => {
    const error429 = {
      response: {
        status: 429,
        headers: { 'retry-after': '1' }
      },
      message: 'Too Many Requests'
    };

    const mockSuccess = {
      status: 200,
      data: { content: '# Documentation' }
    };

    vi.mocked(axios.get)
      .mockRejectedValueOnce(error429)
      .mockResolvedValueOnce(mockSuccess);

    const result = await fetchFromRefTools('test-package', mockConfig);

    expect(result.success).toBe(true);
    expect(result.metadata?.attempts).toHaveLength(2);
  });

  it('fails after max retries on persistent errors', async () => {
    const error500 = {
      response: { status: 500 },
      message: 'Internal Server Error'
    };

    vi.mocked(axios.get).mockRejectedValue(error500);

    const result = await fetchFromRefTools('test-package', mockConfig);

    expect(result.success).toBe(false);
    expect(result.error).toContain('ref.tools fetch failed');
    expect(axios.get).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('handles timeout errors with retry', async () => {
    const timeoutError = {
      code: 'ETIMEDOUT',
      message: 'Request timeout'
    };

    const mockSuccess = {
      status: 200,
      data: { content: '# Documentation' }
    };

    vi.mocked(axios.get)
      .mockRejectedValueOnce(timeoutError)
      .mockResolvedValueOnce(mockSuccess);

    const result = await fetchFromRefTools('test-package', mockConfig);

    expect(result.success).toBe(true);
    expect(result.metadata?.attempts).toHaveLength(2);
  });

  it('includes API key in request headers when provided', async () => {
    const mockResponse = {
      status: 200,
      data: { content: '# Documentation' }
    };

    vi.mocked(axios.get).mockResolvedValueOnce(mockResponse);

    await fetchFromRefTools('test-package', mockConfig);

    expect(axios.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-api-key'
        })
      })
    );
  });

  it('handles missing content in response', async () => {
    const mockResponse = {
      status: 200,
      data: {}
    };

    vi.mocked(axios.get).mockResolvedValueOnce(mockResponse);

    const result = await fetchFromRefTools('test-package', mockConfig);

    expect(result.success).toBe(false);
    expect(result.error).toContain('without content');
  });
});
