import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchDocumentation, describeFetchStrategy } from '../../src/fetchers/orchestrator.js';
import * as refTools from '../../src/fetchers/refTools.js';
import * as context7 from '../../src/fetchers/context7.js';
import * as firecrawl from '../../src/fetchers/firecrawl.js';
import * as detector from '../../src/detection/detector.js';
import type { RuntimeConfig } from '../../src/config/runtimeConfig.js';
import type { FetchResult } from '../../src/fetchers/types.js';

vi.mock('../../src/fetchers/refTools.js');
vi.mock('../../src/fetchers/context7.js');
vi.mock('../../src/fetchers/firecrawl.js');
vi.mock('../../src/detection/detector.js');

describe('Fetcher orchestrator', () => {
  const mockRuntimeConfig: RuntimeConfig = {
    nodeVersion: 'v20.0.0',
    supportsRequiredNode: true,
    directories: {
      rootDir: '/test',
      constitutionDir: '/test/.specify/memory',
      docsDir: '/test/docs',
      staticBackupDir: '/test/docs/static-backup'
    },
    apiKeys: {
      firecrawl: 'fc-key',
      context7: 'c7-key',
      refTools: 'rt-key'
    },
    fetcherConfig: {
      timeoutMs: 60000,
      maxRetries: 2
    }
  };

  const successResult: FetchResult = {
    success: true,
    content: '# Documentation',
    metadata: {
      source: 'test',
      durationMs: 100,
      attempts: ['test'],
      timestamp: new Date()
    }
  };

  const failureResult: FetchResult = {
    success: false,
    error: 'Failed to fetch'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GitHub fallback chain', () => {
    beforeEach(() => {
      vi.mocked(detector.detectDependencyType).mockReturnValue('github');
    });

    it('uses ref.tools first for GitHub repos', async () => {
      vi.mocked(refTools.fetchFromRefTools).mockResolvedValue(successResult);

      const result = await fetchDocumentation('owner/repo', mockRuntimeConfig);

      expect(result.success).toBe(true);
      expect(refTools.fetchFromRefTools).toHaveBeenCalledWith(
        'owner/repo',
        expect.objectContaining({ apiKey: 'rt-key' })
      );
      expect(firecrawl.fetchFromFirecrawl).not.toHaveBeenCalled();
    });

    it('falls back to Firecrawl if ref.tools fails', async () => {
      vi.mocked(refTools.fetchFromRefTools).mockResolvedValue(failureResult);
      vi.mocked(firecrawl.fetchFromFirecrawl).mockResolvedValue(successResult);

      const result = await fetchDocumentation('owner/repo', mockRuntimeConfig);

      expect(result.success).toBe(true);
      expect(refTools.fetchFromRefTools).toHaveBeenCalled();
      expect(firecrawl.fetchFromFirecrawl).toHaveBeenCalled();
    });

    it('returns error if both fetchers fail', async () => {
      const refFailure: FetchResult = {
        success: false,
        error: 'ref.tools failed'
      };
      const firecrawlFailure: FetchResult = {
        success: false,
        error: 'Firecrawl failed'
      };

      vi.mocked(refTools.fetchFromRefTools).mockResolvedValue(refFailure);
      vi.mocked(firecrawl.fetchFromFirecrawl).mockResolvedValue(firecrawlFailure);

      const result = await fetchDocumentation('owner/repo', mockRuntimeConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain('GitHub documentation fetch failed');
    });
  });

  describe('NPM fallback chain', () => {
    beforeEach(() => {
      vi.mocked(detector.detectDependencyType).mockReturnValue('npm');
    });

    it('tries Context7 → ref.tools → Firecrawl', async () => {
      vi.mocked(context7.fetchFromContext7).mockResolvedValue(failureResult);
      vi.mocked(refTools.fetchFromRefTools).mockResolvedValue(failureResult);
      vi.mocked(firecrawl.fetchFromFirecrawl).mockResolvedValue(successResult);

      const result = await fetchDocumentation('lodash', mockRuntimeConfig);

      expect(result.success).toBe(true);
      expect(context7.fetchFromContext7).toHaveBeenCalled();
      expect(refTools.fetchFromRefTools).toHaveBeenCalled();
      expect(firecrawl.fetchFromFirecrawl).toHaveBeenCalled();
    });

    it('stops at first success', async () => {
      vi.mocked(context7.fetchFromContext7).mockResolvedValue(successResult);

      const result = await fetchDocumentation('react', mockRuntimeConfig);

      expect(result.success).toBe(true);
      expect(context7.fetchFromContext7).toHaveBeenCalled();
      expect(refTools.fetchFromRefTools).not.toHaveBeenCalled();
      expect(firecrawl.fetchFromFirecrawl).not.toHaveBeenCalled();
    });
  });

  describe('URL fallback chain', () => {
    beforeEach(() => {
      vi.mocked(detector.detectDependencyType).mockReturnValue('url');
    });

    it('uses only Firecrawl for URLs', async () => {
      vi.mocked(firecrawl.fetchFromFirecrawl).mockResolvedValue(successResult);

      const result = await fetchDocumentation('https://example.com/docs', mockRuntimeConfig);

      expect(result.success).toBe(true);
      expect(firecrawl.fetchFromFirecrawl).toHaveBeenCalled();
      expect(context7.fetchFromContext7).not.toHaveBeenCalled();
      expect(refTools.fetchFromRefTools).not.toHaveBeenCalled();
    });

    it('requires Firecrawl API key for URLs', async () => {
      const configWithoutFirecrawl = {
        ...mockRuntimeConfig,
        apiKeys: {}
      };

      const result = await fetchDocumentation('https://example.com', configWithoutFirecrawl);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Firecrawl API key required');
    });
  });

  describe('describeFetchStrategy', () => {
    it('describes GitHub strategy', () => {
      vi.mocked(detector.detectDependencyType).mockReturnValue('github');

      const description = describeFetchStrategy('owner/repo', mockRuntimeConfig);

      expect(description).toContain('GitHub');
      expect(description).toContain('ref.tools');
      expect(description).toContain('Firecrawl');
    });

    it('describes NPM strategy', () => {
      vi.mocked(detector.detectDependencyType).mockReturnValue('npm');

      const description = describeFetchStrategy('lodash', mockRuntimeConfig);

      expect(description).toContain('NPM');
      expect(description).toContain('Context7');
      expect(description).toContain('ref.tools');
    });

    it('describes URL strategy', () => {
      vi.mocked(detector.detectDependencyType).mockReturnValue('url');

      const description = describeFetchStrategy('https://example.com', mockRuntimeConfig);

      expect(description).toContain('URL');
      expect(description).toContain('Firecrawl');
    });

    it('handles unknown type', () => {
      vi.mocked(detector.detectDependencyType).mockReturnValue('unknown');

      const description = describeFetchStrategy('???', mockRuntimeConfig);

      expect(description).toContain('Unknown');
    });
  });
});
