import { describe, it, expect } from 'vitest';
import { detectSourceType, deriveDeepWikiUrl, isGitHubIdentifier, detectSourceTypeWithAI } from '../src/detection/sourceDetector.js';
import * as discoveryPipeline from '../src/ai/repositoryDiscoveryPipeline.js';

describe('detectSourceType', () => {
  describe('GitHub detection', () => {
    describe('standard formats', () => {
      it('detects github.com/owner/repo as GitHub source', () => {
        const result = detectSourceType('github.com/vercel/ai');
        expect(result.sourceType).toBe('github');
        expect(result.normalizedIdentifier).toBe('vercel/ai');
        expect(result.confidence).toBe('high');
      });

      it('detects https://github.com/owner/repo as GitHub source', () => {
        const result = detectSourceType('https://github.com/vercel/ai');
        expect(result.sourceType).toBe('github');
        expect(result.normalizedIdentifier).toBe('vercel/ai');
        expect(result.confidence).toBe('high');
      });

      it('detects owner/repo as GitHub source', () => {
        const result = detectSourceType('vercel/ai');
        expect(result.sourceType).toBe('github');
        expect(result.normalizedIdentifier).toBe('vercel/ai');
        expect(result.confidence).toBe('high');
      });

      it('detects https://www.github.com/owner/repo as GitHub source', () => {
        const result = detectSourceType('https://www.github.com/vercel/ai');
        expect(result.sourceType).toBe('github');
        expect(result.normalizedIdentifier).toBe('vercel/ai');
        expect(result.confidence).toBe('high');
      });
    });

    describe('with .git suffix', () => {
      it('normalizes GitHub URLs by removing .git suffix', () => {
        const result = detectSourceType('https://github.com/vercel/ai.git');
        expect(result.sourceType).toBe('github');
        expect(result.normalizedIdentifier).toBe('vercel/ai');
        expect(result.confidence).toBe('high');
      });

      it('removes .git from owner/repo format', () => {
        const result = detectSourceType('vercel/ai.git');
        expect(result.sourceType).toBe('github');
        expect(result.normalizedIdentifier).toBe('vercel/ai');
        expect(result.confidence).toBe('high');
      });
    });

    describe('with trailing slashes', () => {
      it('removes trailing slash from github.com URLs', () => {
        const result = detectSourceType('github.com/vercel/ai/');
        expect(result.sourceType).toBe('github');
        expect(result.normalizedIdentifier).toBe('vercel/ai');
        expect(result.confidence).toBe('high');
      });

      it('removes trailing slash from https github URLs', () => {
        const result = detectSourceType('https://github.com/vercel/ai/');
        expect(result.sourceType).toBe('github');
        expect(result.normalizedIdentifier).toBe('vercel/ai');
        expect(result.confidence).toBe('high');
      });

      it('removes trailing slash from owner/repo format', () => {
        const result = detectSourceType('vercel/ai/');
        expect(result.sourceType).toBe('github');
        expect(result.normalizedIdentifier).toBe('vercel/ai');
        expect(result.confidence).toBe('high');
      });
    });

    describe('case variations', () => {
      it('preserves original case in normalized identifier', () => {
        const result = detectSourceType('GitHub.com/Vercel/AI');
        expect(result.sourceType).toBe('github');
        expect(result.normalizedIdentifier).toBe('Vercel/AI');
        expect(result.confidence).toBe('high');
      });

      it('preserves case for owner/repo format', () => {
        const result = detectSourceType('VERCEL/AI');
        expect(result.sourceType).toBe('github');
        expect(result.normalizedIdentifier).toBe('VERCEL/AI');
        expect(result.confidence).toBe('high');
      });
    });

    describe('with paths beyond repo', () => {
      it('extracts owner/repo from URLs with tree paths', () => {
        const result = detectSourceType('github.com/vercel/ai/tree/main');
        expect(result.sourceType).toBe('github');
        expect(result.normalizedIdentifier).toBe('vercel/ai');
        expect(result.confidence).toBe('high');
      });

      it('extracts owner/repo from URLs with blob paths', () => {
        const result = detectSourceType('https://github.com/vercel/ai/blob/main/README.md');
        expect(result.sourceType).toBe('github');
        expect(result.normalizedIdentifier).toBe('vercel/ai');
        expect(result.confidence).toBe('high');
      });
    });
  });

  describe('NPM detection', () => {
    describe('scoped packages', () => {
      it('detects @scope/package as NPM source', () => {
        const result = detectSourceType('@vercel/ai');
        expect(result.sourceType).toBe('npm');
        expect(result.normalizedIdentifier).toBe('@vercel/ai');
        expect(result.confidence).toBe('high');
      });

      it('detects @supabase/supabase-js as NPM source', () => {
        const result = detectSourceType('@supabase/supabase-js');
        expect(result.sourceType).toBe('npm');
        expect(result.normalizedIdentifier).toBe('@supabase/supabase-js');
        expect(result.confidence).toBe('high');
      });
    });

    describe('simple packages', () => {
      it('detects lodash as NPM source', () => {
        const result = detectSourceType('lodash');
        expect(result.sourceType).toBe('npm');
        expect(result.normalizedIdentifier).toBe('lodash');
        expect(result.confidence).toBe('medium');
      });

      it('detects react as NPM source', () => {
        const result = detectSourceType('react');
        expect(result.sourceType).toBe('npm');
        expect(result.normalizedIdentifier).toBe('react');
        expect(result.confidence).toBe('medium');
      });

      it('detects express as NPM source', () => {
        const result = detectSourceType('express');
        expect(result.sourceType).toBe('npm');
        expect(result.normalizedIdentifier).toBe('express');
        expect(result.confidence).toBe('medium');
      });
    });

    describe('with hyphens', () => {
      it('detects hyphenated package names as NPM source', () => {
        const result = detectSourceType('ink-text-input');
        expect(result.sourceType).toBe('npm');
        expect(result.normalizedIdentifier).toBe('ink-text-input');
        expect(result.confidence).toBe('medium');
      });
    });
  });

  describe('URL detection', () => {
    describe('HTTPS URLs', () => {
      it('detects https://docs.stripe.com as URL source', () => {
        const result = detectSourceType('https://docs.stripe.com');
        expect(result.sourceType).toBe('url');
        expect(result.normalizedIdentifier).toBe('https://docs.stripe.com');
        expect(result.confidence).toBe('high');
      });

      it('detects https URLs with paths as URL source', () => {
        const result = detectSourceType('https://api.example.com/docs');
        expect(result.sourceType).toBe('url');
        expect(result.normalizedIdentifier).toBe('https://api.example.com/docs');
        expect(result.confidence).toBe('high');
      });
    });

    describe('HTTP URLs', () => {
      it('detects http://docs.example.com as URL source', () => {
        const result = detectSourceType('http://docs.example.com');
        expect(result.sourceType).toBe('url');
        expect(result.normalizedIdentifier).toBe('http://docs.example.com');
        expect(result.confidence).toBe('high');
      });
    });

    describe('GitHub URL exclusion', () => {
      it('does not classify GitHub URLs as generic URLs', () => {
        const result = detectSourceType('https://github.com/vercel/ai');
        expect(result.sourceType).toBe('github');
        expect(result.sourceType).not.toBe('url');
      });
    });
  });

  describe('Edge cases', () => {
    describe('empty/whitespace', () => {
      it('returns unknown for empty string', () => {
        const result = detectSourceType('');
        expect(result.sourceType).toBe('unknown');
        expect(result.confidence).toBe('low');
      });

      it('returns unknown for whitespace-only string', () => {
        const result = detectSourceType('   ');
        expect(result.sourceType).toBe('unknown');
        expect(result.confidence).toBe('low');
      });
    });

    describe('ambiguous patterns', () => {
      it('detects single segment with hyphen as NPM', () => {
        const result = detectSourceType('react-native');
        expect(result.sourceType).toBe('npm');
        expect(result.normalizedIdentifier).toBe('react-native');
      });

      it('detects two segments with slash as GitHub', () => {
        const result = detectSourceType('my-org/my-repo');
        expect(result.sourceType).toBe('github');
        expect(result.normalizedIdentifier).toBe('my-org/my-repo');
      });
    });

    describe('invalid formats', () => {
      it('returns unknown for invalid input', () => {
        const result = detectSourceType('not a valid anything');
        expect(result.sourceType).toBe('unknown');
        expect(result.confidence).toBe('low');
      });

      it('returns unknown for slash-only input', () => {
        const result = detectSourceType('////');
        expect(result.sourceType).toBe('unknown');
        expect(result.confidence).toBe('low');
      });
    });
  });

  describe('Natural language processing', () => {
    beforeAll(() => {
      // Mock AI-assisted pipeline so tests are deterministic and offline
      vi.spyOn(discoveryPipeline, 'discoverWithPipeline').mockImplementation(async (input: string) => {
        const normalized = input.toLowerCase();
        if (normalized.includes('jumpcloud')) {
          return { sourceType: 'url', normalizedIdentifier: 'https://docs.jumpcloud.com/api/2.0', confidence: 'medium', aiAssisted: true } as any;
        }
        if (normalized.includes('stripe')) {
          return { sourceType: 'url', normalizedIdentifier: 'https://stripe.com/docs/api', confidence: 'medium', aiAssisted: true } as any;
        }
        if (normalized.includes('github api')) {
          return { sourceType: 'url', normalizedIdentifier: 'https://docs.github.com/en/rest', confidence: 'medium', aiAssisted: true } as any;
        }
        if (normalized.includes('next.js') || normalized.includes('nextjs')) {
          return { sourceType: 'github', normalizedIdentifier: 'nextjs/next', confidence: 'medium', aiAssisted: true } as any;
        }
        if (normalized === 'react' || normalized.includes('react framework')) {
          return { sourceType: 'npm', normalizedIdentifier: 'react', confidence: 'medium', aiAssisted: true } as any;
        }
        if (normalized === 'eslint') {
          return { sourceType: 'npm', normalizedIdentifier: 'eslint', confidence: 'medium', aiAssisted: true } as any;
        }
        if (normalized === 'typescript') {
          return { sourceType: 'github', normalizedIdentifier: 'microsoft/typescript', confidence: 'medium', aiAssisted: true } as any;
        }
        if (normalized === 'prettier') {
          return { sourceType: 'github', normalizedIdentifier: 'prettier/prettier', confidence: 'medium', aiAssisted: true } as any;
        }
        return { sourceType: 'unknown', normalizedIdentifier: input, confidence: 'low', aiAssisted: true } as any;
      });
    });
    describe('API mappings', () => {
      it('maps "Jumpcloud API 2.0" to Jumpcloud API URL', async () => {
        const result = await detectSourceTypeWithAI('Jumpcloud API 2.0');
        expect(result.sourceType).toBe('url');
        expect(result.normalizedIdentifier).toBe('https://docs.jumpcloud.com/api/2.0');
        expect(result.confidence).toBe('medium');
      });

      it('maps "Stripe API" to Stripe API URL', async () => {
        const result = await detectSourceTypeWithAI('Stripe API');
        expect(result.sourceType).toBe('url');
        expect(result.normalizedIdentifier).toBe('https://stripe.com/docs/api');
        expect(result.confidence).toBe('medium');
      });

      it('maps "GitHub API" to GitHub API URL', async () => {
        const result = await detectSourceTypeWithAI('GitHub API');
        expect(result.sourceType).toBe('url');
        expect(result.normalizedIdentifier).toBe('https://docs.github.com/en/rest');
        expect(result.confidence).toBe('medium');
      });
    });

    describe('Framework mappings', () => {
      it('maps "React" to react package', () => {
        const result = detectSourceType('React');
        expect(result.sourceType).toBe('npm');
        expect(result.normalizedIdentifier).toBe('react');
        expect(result.confidence).toBe('medium');
      });

      it('maps "Next.js" to nextjs/next GitHub repo', async () => {
        const result = await detectSourceTypeWithAI('Next.js');
        expect(result.sourceType).toBe('github');
        expect(result.normalizedIdentifier).toBe('nextjs/next');
        expect(result.confidence).toBe('medium');
      });

      it('maps "Vue" to vue package', () => {
        const result = detectSourceType('Vue');
        expect(result.sourceType).toBe('npm');
        expect(result.normalizedIdentifier).toBe('vue');
        expect(result.confidence).toBe('medium');
      });
    });

    describe('Tool mappings', () => {
      it('maps "ESLint" to eslint package', async () => {
        const result = await detectSourceTypeWithAI('ESLint');
        expect(result.sourceType).toBe('npm');
        expect(result.normalizedIdentifier).toBe('eslint');
        expect(result.confidence).toBe('medium');
      });

      it('maps "TypeScript" to microsoft/typescript GitHub repo', async () => {
        const result = await detectSourceTypeWithAI('TypeScript');
        expect(result.sourceType).toBe('github');
        expect(result.normalizedIdentifier).toBe('microsoft/typescript');
        expect(result.confidence).toBe('medium');
      });

      it('maps "Prettier" to prettier/prettier GitHub repo', async () => {
        const result = await detectSourceTypeWithAI('Prettier');
        expect(result.sourceType).toBe('github');
        expect(result.normalizedIdentifier).toBe('prettier/prettier');
        expect(result.confidence).toBe('medium');
      });
    });

    describe('Partial matches', () => {
      it('maps "Jumpcloud" to Jumpcloud API URL', async () => {
        const result = await detectSourceTypeWithAI('Jumpcloud');
        expect(result.sourceType).toBe('url');
        expect(result.normalizedIdentifier).toBe('https://docs.jumpcloud.com/api/2.0');
        expect(result.confidence).toBe('medium');
      });

      it('maps "React framework" to react package', async () => {
        const result = await detectSourceTypeWithAI('React framework');
        expect(result.sourceType).toBe('npm');
        expect(result.normalizedIdentifier).toBe('react');
        expect(result.confidence).toBe('medium');
      });
    });

    describe('No mapping found', () => {
      it('returns unknown for unmapped natural language', () => {
        const result = detectSourceType('Some Random Tool');
        expect(result.sourceType).toBe('unknown');
        expect(result.normalizedIdentifier).toBe('Some Random Tool');
        expect(result.confidence).toBe('low');
      });
    });
  });
});

describe('deriveDeepWikiUrl', () => {
  describe('successful derivation (GitHub sources)', () => {
    describe('standard GitHub formats', () => {
      it('derives DeepWiki URL from github.com/owner/repo', () => {
        const url = deriveDeepWikiUrl('github.com/vercel/ai');
        expect(url).toBe('https://deepwiki.com/vercel/ai');
      });

      it('derives DeepWiki URL from https://github.com/owner/repo', () => {
        const url = deriveDeepWikiUrl('https://github.com/vercel/ai');
        expect(url).toBe('https://deepwiki.com/vercel/ai');
      });

      it('derives DeepWiki URL from owner/repo', () => {
        const url = deriveDeepWikiUrl('vercel/ai');
        expect(url).toBe('https://deepwiki.com/vercel/ai');
      });
    });

    describe('with .git suffix', () => {
      it('derives DeepWiki URL removing .git suffix', () => {
        const url = deriveDeepWikiUrl('https://github.com/vercel/ai.git');
        expect(url).toBe('https://deepwiki.com/vercel/ai');
      });
    });

    describe('case preservation', () => {
      it('preserves case in DeepWiki URL', () => {
        const url = deriveDeepWikiUrl('Vercel/AI');
        expect(url).toBe('https://deepwiki.com/Vercel/AI');
      });
    });
  });

  describe('null returns (non-GitHub sources)', () => {
    describe('NPM packages', () => {
      it('returns null for scoped NPM packages', () => {
        const url = deriveDeepWikiUrl('@vercel/ai');
        expect(url).toBeNull();
      });

      it('returns null for simple NPM packages', () => {
        const url = deriveDeepWikiUrl('lodash');
        expect(url).toBeNull();
      });
    });

    describe('URLs', () => {
      it('returns null for generic URLs', () => {
        const url = deriveDeepWikiUrl('https://docs.stripe.com');
        expect(url).toBeNull();
      });
    });

    describe('unknown', () => {
      it('returns null for invalid input', () => {
        const url = deriveDeepWikiUrl('invalid input');
        expect(url).toBeNull();
      });

      it('returns null for empty string', () => {
        const url = deriveDeepWikiUrl('');
        expect(url).toBeNull();
      });
    });
  });
});

describe('isGitHubIdentifier', () => {
  describe('returns true for GitHub patterns', () => {
    it('returns true for github.com/owner/repo', () => {
      expect(isGitHubIdentifier('github.com/vercel/ai')).toBe(true);
    });

    it('returns true for owner/repo', () => {
      expect(isGitHubIdentifier('vercel/ai')).toBe(true);
    });

    it('returns true for https://github.com/owner/repo', () => {
      expect(isGitHubIdentifier('https://github.com/vercel/ai')).toBe(true);
    });

    it('returns true for owner/repo with trailing slash', () => {
      expect(isGitHubIdentifier('vercel/ai/')).toBe(true);
    });
  });

  describe('returns false for non-GitHub', () => {
    it('returns false for scoped NPM packages', () => {
      expect(isGitHubIdentifier('@vercel/ai')).toBe(false);
    });

    it('returns false for simple NPM packages', () => {
      expect(isGitHubIdentifier('lodash')).toBe(false);
    });

    it('returns false for URLs', () => {
      expect(isGitHubIdentifier('https://docs.stripe.com')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isGitHubIdentifier('')).toBe(false);
    });
  });
});
