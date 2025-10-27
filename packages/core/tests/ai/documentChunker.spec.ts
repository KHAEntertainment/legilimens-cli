import { describe, it, expect } from 'vitest';
import { estimateTokens, chunkText, condenseDocumentation } from '../../src/ai/documentChunker.js';

describe('documentChunker', () => {
  describe('estimateTokens', () => {
    it('estimates tokens correctly', () => {
      const text = 'a'.repeat(1000);
      const tokens = estimateTokens(text);
      expect(tokens).toBe(250); // 1000 chars / 4 ≈ 250 tokens
    });

    it('handles empty text', () => {
      const tokens = estimateTokens('');
      expect(tokens).toBe(0);
    });
  });

  describe('chunkText', () => {
    it('chunks large text', () => {
      const text = 'a'.repeat(20000);
      const chunks = chunkText(text, 2000, 200);
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].length).toBeLessThanOrEqual(2000 * 4);
    });

    it('handles text smaller than chunk size', () => {
      const text = 'short';
      const chunks = chunkText(text);
      expect(chunks).toEqual(['short']);
    });

    it('handles empty text', () => {
      const chunks = chunkText('');
      expect(chunks).toEqual([]);
    });
  });

  describe('condenseDocumentation', () => {
    it('returns original for small docs', async () => {
      const doc = 'small doc';
      const result = await condenseDocumentation(doc, 'Test', 'library');
      expect(result).toBe(doc);
    });

    it('handles empty documentation', async () => {
      const result = await condenseDocumentation('', 'Test', 'library');
      expect(result).toBe('');
    });
  });
});

