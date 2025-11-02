import { describe, it, expect, vi, beforeEach } from 'vitest';
import { discoverWithPipeline, type PipelineResult } from '../../src/ai/repositoryDiscoveryPipeline.js';

// Mock modules
vi.mock('../../src/ai/webSearch.js', () => ({
  searchPreferredSources: vi.fn(),
}));

vi.mock('../../src/ai/localLlmRunner.js', () => ({
  runLocalJson: vi.fn(),
}));

vi.mock('../../src/config/runtimeConfig.js', () => ({
  getRuntimeConfig: vi.fn(),
  isLocalLlmEnabled: vi.fn(),
}));

vi.mock('../../src/ai/json.js', () => ({
  validateDiscoveryJson: vi.fn(),
  extractFirstJson: vi.fn(),
  safeParseJson: vi.fn(),
  validateToolCallJson: vi.fn(),
}));

describe('repositoryDiscoveryPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('discoverWithPipeline', () => {
    it('uses DMR when ambiguous results and local LLM enabled', async () => {
      const { searchPreferredSources } = await import('../../src/ai/webSearch.js');
      const { runLocalJson } = await import('../../src/ai/localLlmRunner.js');
      const { getRuntimeConfig, isLocalLlmEnabled } = await import('../../src/config/runtimeConfig.js');
      const { validateDiscoveryJson } = await import('../../src/ai/json.js');

      // Mock ambiguous search results (low confidence, no suggested identifier)
      vi.mocked(searchPreferredSources).mockResolvedValue({
        items: [
          {
            url: 'https://github.com/test/repo',
            title: 'Test Repo',
            summary: 'A test repository',
            sourceHint: 'github' as const,
            score: 0.5, // Low confidence
          },
        ],
        tavilyAnswer: undefined,
        suggestedIdentifier: undefined,
      });

      // Mock runtime config with enabled local LLM
      const mockConfig = {
        localLlm: {
          enabled: true,
          modelName: 'test-model',
          apiEndpoint: 'http://localhost:12434',
        },
      };

      vi.mocked(getRuntimeConfig).mockReturnValue(mockConfig as any);
      vi.mocked(isLocalLlmEnabled).mockReturnValue(true);

      // Mock successful LLM response
      const llmResponse = {
        canonicalIdentifier: 'test/repo',
        repositoryUrl: 'https://github.com/test/repo',
        sourceType: 'github',
        confidence: 'high',
        dependencyType: 'library',
        searchSummary: 'Test repository for testing',
      };

      vi.mocked(runLocalJson).mockResolvedValue({
        success: true,
        json: llmResponse,
      } as any);

      vi.mocked(validateDiscoveryJson).mockReturnValue(true);

      const result = await discoverWithPipeline('test-package');

      // Should have called LLM
      expect(runLocalJson).toHaveBeenCalled();

      // Should return LLM decision
      expect(result).toEqual({
        sourceType: 'github',
        normalizedIdentifier: 'test/repo',
        repositoryUrl: 'https://github.com/test/repo',
        aiAssisted: true,
        confidence: 'high',
        searchSummary: 'Test repository for testing',
        dependencyType: 'library',
      });
    });

    it('falls back to Tavily top result when DMR fails', async () => {
      const { searchPreferredSources } = await import('../../src/ai/webSearch.js');
      const { runLocalJson } = await import('../../src/ai/localLlmRunner.js');
      const { getRuntimeConfig, isLocalLlmEnabled } = await import('../../src/config/runtimeConfig.js');
      const { validateDiscoveryJson } = await import('../../src/ai/json.js');

      // Mock ambiguous results
      vi.mocked(searchPreferredSources).mockResolvedValue({
        items: [
          {
            url: 'https://github.com/fallback/repo',
            title: 'Fallback Repo',
            summary: 'Fallback repository',
            sourceHint: 'github' as const,
            score: 0.5,
          },
        ],
        tavilyAnswer: undefined,
        suggestedIdentifier: undefined,
      });

      // Mock enabled LLM
      const mockConfig = {
        localLlm: {
          enabled: true,
          modelName: 'test-model',
          apiEndpoint: 'http://localhost:12434',
        },
      };

      vi.mocked(getRuntimeConfig).mockReturnValue(mockConfig as any);
      vi.mocked(isLocalLlmEnabled).mockReturnValue(true);

      // Mock LLM failure
      vi.mocked(runLocalJson).mockResolvedValue({
        success: false,
        error: 'LLM failed',
      } as any);

      vi.mocked(validateDiscoveryJson).mockReturnValue(false);

      const result = await discoverWithPipeline('test-package');

      // Should have tried LLM
      expect(runLocalJson).toHaveBeenCalled();

      // Should fall back to Tavily top result
      expect(result).toEqual({
        sourceType: 'github',
        normalizedIdentifier: 'fallback/repo',
        repositoryUrl: 'https://github.com/fallback/repo',
        aiAssisted: false,
        confidence: 'medium',
        searchSummary: 'Fallback repository',
        dependencyType: 'other',
      });
    });

    it('skips DMR when local LLM not enabled', async () => {
      const { searchPreferredSources } = await import('../../src/ai/webSearch.js');
      const { runLocalJson } = await import('../../src/ai/localLlmRunner.js');
      const { getRuntimeConfig, isLocalLlmEnabled } = await import('../../src/config/runtimeConfig.js');

      // Mock ambiguous results
      vi.mocked(searchPreferredSources).mockResolvedValue({
        items: [
          {
            url: 'https://github.com/no-llm/repo',
            title: 'No LLM Repo',
            summary: 'Repository without LLM',
            sourceHint: 'github' as const,
            score: 0.6,
          },
        ],
        tavilyAnswer: undefined,
        suggestedIdentifier: undefined,
      });

      // Mock disabled LLM
      const mockConfig = {
        localLlm: {
          enabled: false,
        },
      };

      vi.mocked(getRuntimeConfig).mockReturnValue(mockConfig as any);
      vi.mocked(isLocalLlmEnabled).mockReturnValue(false);

      const result = await discoverWithPipeline('test-package');

      // Should NOT have called LLM
      expect(runLocalJson).not.toHaveBeenCalled();

      // Should skip to fallback
      expect(result).toEqual({
        sourceType: 'github',
        normalizedIdentifier: 'no-llm/repo',
        repositoryUrl: 'https://github.com/no-llm/repo',
        aiAssisted: false,
        confidence: 'medium',
        searchSummary: 'Repository without LLM',
        dependencyType: 'other',
      });
    });

    it('returns unknown when no Tavily results', async () => {
      const { searchPreferredSources } = await import('../../src/ai/webSearch.js');
      const { runLocalJson } = await import('../../src/ai/localLlmRunner.js');
      const { getRuntimeConfig, isLocalLlmEnabled } = await import('../../src/config/runtimeConfig.js');

      // Mock empty results
      vi.mocked(searchPreferredSources).mockResolvedValue({
        items: [],
        tavilyAnswer: undefined,
        suggestedIdentifier: undefined,
      });

      const mockConfig = {
        localLlm: {
          enabled: true,
          modelName: 'test-model',
          apiEndpoint: 'http://localhost:12434',
        },
      };

      vi.mocked(getRuntimeConfig).mockReturnValue(mockConfig as any);
      vi.mocked(isLocalLlmEnabled).mockReturnValue(true);

      const result = await discoverWithPipeline('unknown-package');

      // Should NOT have called LLM (no results to process)
      expect(runLocalJson).not.toHaveBeenCalled();

      // Should return unknown
      expect(result).toEqual({
        sourceType: 'unknown',
        normalizedIdentifier: 'unknown-package',
        aiAssisted: true,
        confidence: 'low',
        dependencyType: 'other',
      });
    });

    it('uses high-confidence GitHub result without calling DMR', async () => {
      const { searchPreferredSources } = await import('../../src/ai/webSearch.js');
      const { runLocalJson } = await import('../../src/ai/localLlmRunner.js');
      const { getRuntimeConfig, isLocalLlmEnabled } = await import('../../src/config/runtimeConfig.js');

      // Mock high-confidence GitHub result
      vi.mocked(searchPreferredSources).mockResolvedValue({
        items: [
          {
            url: 'https://github.com/high-conf/repo',
            title: 'High Confidence Repo',
            summary: 'Very confident match',
            sourceHint: 'github' as const,
            score: 0.85, // High confidence > 0.75
          },
        ],
        tavilyAnswer: 'This is the repo you want',
        suggestedIdentifier: undefined,
      });

      const mockConfig = {
        localLlm: {
          enabled: true,
          modelName: 'test-model',
          apiEndpoint: 'http://localhost:12434',
        },
      };

      vi.mocked(getRuntimeConfig).mockReturnValue(mockConfig as any);
      vi.mocked(isLocalLlmEnabled).mockReturnValue(true);

      const result = await discoverWithPipeline('test-package');

      // Should NOT have called LLM (high confidence direct path)
      expect(runLocalJson).not.toHaveBeenCalled();

      // Should return direct result
      expect(result).toEqual({
        sourceType: 'github',
        normalizedIdentifier: 'high-conf/repo',
        repositoryUrl: 'https://github.com/high-conf/repo',
        aiAssisted: false,
        confidence: 'high',
        searchSummary: 'This is the repo you want',
        dependencyType: 'other',
      });
    });
  });
});
