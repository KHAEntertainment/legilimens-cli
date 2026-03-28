import { describe, it, expect } from 'vitest';
import {
  classifyDependency,
  classifyBatch,
} from '../../packages/cli/src/utils/dependencyClassifier.js';
import type { BatchDependency } from '../../packages/cli/src/utils/batchInputParser.js';

describe('classifyDependency', () => {
  it('classifies a plain npm name as other with low confidence (source type unknown)', () => {
    const result = classifyDependency('lodash');
    expect(result.classified.sourceType).toBe('unknown');
    expect(result.classified.dependencyType).toBe('other');
    expect(result.classified.confidence).toBe('low');
  });

  it('classifies a GitHub owner/repo as library with medium confidence', () => {
    const result = classifyDependency('vercel/next.js');
    expect(result.classified.sourceType).toBe('github');
    expect(result.classified.confidence).toBe('medium');
  });

  it('classifies a URL as other with low confidence', () => {
    const result = classifyDependency('https://stripe.com/docs');
    expect(result.classified.sourceType).toBe('url');
    expect(result.classified.confidence).toBe('low');
    expect(result.warnings.length).toBeGreaterThanOrEqual(1);
  });

  it('classifies a URL with /api/ as api with medium confidence', () => {
    const result = classifyDependency('https://example.com/api/docs');
    expect(result.classified.dependencyType).toBe('api');
    expect(result.classified.confidence).toBe('medium');
  });

  it('uses explicit type with high confidence when provided', () => {
    const result = classifyDependency('stripe', 'api');
    expect(result.classified.dependencyType).toBe('api');
    expect(result.classified.confidence).toBe('high');
    expect(result.warnings).toHaveLength(0);
  });

  it('uses explicit deepWiki override when provided', () => {
    const result = classifyDependency('custom-lib', undefined, 'https://custom.wiki/lib');
    expect(result.classified.deepWikiUrl).toBe('https://custom.wiki/lib');
  });

  it('derives deepWikiUrl for GitHub repos', () => {
    const result = classifyDependency('vercel/ai');
    expect(result.classified.deepWikiUrl).toContain('deepwiki');
    expect(result.classified.deepWikiUrl).toContain('vercel');
  });

  it('produces warning for low-confidence classification', () => {
    const result = classifyDependency('https://random-site.com');
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('Low confidence');
  });

  it('normalizes identifiers', () => {
    const result = classifyDependency('  lodash  ');
    expect(result.classified.normalizedIdentifier).toBe('lodash');
  });
});

describe('classifyBatch', () => {
  it('classifies multiple dependencies', () => {
    const deps: BatchDependency[] = [
      { identifier: 'lodash' },
      { identifier: 'express' },
      { identifier: 'eslint' },
    ];
    const result = classifyBatch(deps);
    expect(result.classified).toHaveLength(3);
  });

  it('sorts by dependency type order (framework > api > library > tool > other)', () => {
    const deps: BatchDependency[] = [
      { identifier: 'eslint' },
      { identifier: 'https://api.example.com' },
      { identifier: 'react-framework/next' },
    ];
    const result = classifyBatch(deps);
    const types = result.classified.map(c => c.dependencyType);
    // Framework should come first
    expect(types[0]).toBe('framework');
  });

  it('collects warnings from all dependencies', () => {
    const deps: BatchDependency[] = [
      { identifier: 'https://random.com' },
      { identifier: 'https://another-random.com' },
    ];
    const result = classifyBatch(deps);
    expect(result.warnings.length).toBeGreaterThanOrEqual(2);
  });

  it('handles empty batch', () => {
    const result = classifyBatch([]);
    expect(result.classified).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('preserves explicit types from JSON input', () => {
    const deps: BatchDependency[] = [
      { identifier: 'react', type: 'framework' },
      { identifier: 'stripe', type: 'api' },
    ];
    const result = classifyBatch(deps);
    const reactClassified = result.classified.find(c => c.identifier === 'react');
    const stripeClassified = result.classified.find(c => c.identifier === 'stripe');
    expect(reactClassified?.dependencyType).toBe('framework');
    expect(stripeClassified?.dependencyType).toBe('api');
  });
});