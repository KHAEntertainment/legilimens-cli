import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { fetchFromFirecrawl } from '../../src/fetchers/firecrawl.js';
import type { FetcherConfig } from '../../src/fetchers/types.js';

vi.mock('axios');

describe('Firecrawl fetcher', () => {
  const mockConfig: FetcherConfig = {
    timeoutMs: 60000,
    maxRetries: 2,
    apiKey: 'test-firecrawl-key'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches web content successfully', async () => {
    const mockResponse = {
      status: 200,
      data: {
        data: {
          markdown: '# Web Page\n\nContent from the web page.'
        }
      }
    };

    vi.mocked(axios.post).mockResolvedValueOnce(mockResponse);

    const result = await fetchFromFirecrawl('https://example.com/docs', mockConfig);

    expect(result.success).toBe(true);
    expect(result.content).toBe('# Web Page\n\nContent from the web page.');
    expect(result.metadata?.source).toBe('Firecrawl');
    expect(result.metadata?.attempts).toHaveLength(1);
  });

  it('requires API key', async () => {
    const configWithoutKey: FetcherConfig = {
      timeoutMs: 60000,
      maxRetries: 2
    };

    const result = await fetchFromFirecrawl('https://example.com', configWithoutKey);

    expect(result.success).toBe(false);
    expect(result.error).toContain('API key is required');
  });

  it('retries on server errors', async () => {
    const error503 = {
      response: { status: 503 },
      message: 'Service unavailable'
    };

    const mockSuccess = {
      status: 200,
      data: {
        data: {
          markdown: '# Content'
        }
      }
    };

    vi.mocked(axios.post)
      .mockRejectedValueOnce(error503)
      .mockResolvedValueOnce(mockSuccess);

    const result = await fetchFromFirecrawl('https://example.com', mockConfig);

    expect(result.success).toBe(true);
    expect(result.metadata?.attempts).toHaveLength(2);
  });

  it('handles 429 with Retry-After header', async () => {
    const error429 = {
      response: {
        status: 429,
        headers: { 'retry-after': '2' }
      },
      message: 'Rate limited'
    };

    const mockSuccess = {
      status: 200,
      data: {
        data: {
          markdown: '# Content'
        }
      }
    };

    vi.mocked(axios.post)
      .mockRejectedValueOnce(error429)
      .mockResolvedValueOnce(mockSuccess);

    const result = await fetchFromFirecrawl('https://example.com', mockConfig);

    expect(result.success).toBe(true);
  });

  it('fails after max retries', async () => {
    const error500 = {
      response: { status: 500 },
      message: 'Server error'
    };

    vi.mocked(axios.post).mockRejectedValue(error500);

    const result = await fetchFromFirecrawl('https://example.com', mockConfig);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Firecrawl fetch failed');
    expect(axios.post).toHaveBeenCalledTimes(3);
  });

  it('sends correct request payload', async () => {
    const mockResponse = {
      status: 200,
      data: {
        data: {
          markdown: '# Content'
        }
      }
    };

    vi.mocked(axios.post).mockResolvedValueOnce(mockResponse);

    await fetchFromFirecrawl('https://example.com/page', mockConfig);

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/scrape'),
      expect.objectContaining({
        url: 'https://example.com/page',
        formats: ['markdown', 'html'],
        onlyMainContent: true
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-firecrawl-key'
        })
      })
    );
  });

  it('handles missing markdown in response', async () => {
    const mockResponse = {
      status: 200,
      data: {
        data: {}
      }
    };

    vi.mocked(axios.post).mockResolvedValueOnce(mockResponse);

    const result = await fetchFromFirecrawl('https://example.com', mockConfig);

    expect(result.success).toBe(false);
    expect(result.error).toContain('without markdown content');
  });
});
