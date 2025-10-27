import { describe, it, expect } from 'vitest';
import { extractFirstJson, safeParseJson, validateDiscoveryJson, validateToolCallJson } from '../../src/ai/json.js';

describe('json utilities', () => {
  describe('extractFirstJson', () => {
    it('extracts JSON from clean input', () => {
      const result = extractFirstJson('{"foo": "bar"}');
      expect(result).toBe('{"foo": "bar"}');
    });

    it('extracts JSON from text with prefix', () => {
      const result = extractFirstJson('Here is some text {"foo": "bar"} and more');
      expect(result).toBe('{"foo": "bar"}');
    });

    it('handles nested objects', () => {
      const result = extractFirstJson('{"outer": {"inner": "value"}}');
      expect(result).toBe('{"outer": {"inner": "value"}}');
    });

    it('returns null for no JSON', () => {
      const result = extractFirstJson('no json here');
      expect(result).toBeNull();
    });

    it('returns null for empty string', () => {
      const result = extractFirstJson('');
      expect(result).toBeNull();
    });
  });

  describe('safeParseJson', () => {
    it('parses valid JSON', () => {
      const result = safeParseJson('{"foo": "bar"}');
      expect(result).toEqual({ foo: 'bar' });
    });

    it('returns null for invalid JSON', () => {
      const result = safeParseJson('not json');
      expect(result).toBeNull();
    });
  });

  describe('validateDiscoveryJson', () => {
    it('validates correct discovery JSON', () => {
      const obj = {
        canonicalIdentifier: 'react',
        repositoryUrl: 'https://github.com/facebook/react',
        sourceType: 'github',
        confidence: 'high',
      };
      expect(validateDiscoveryJson(obj)).toBe(true);
    });

    it('rejects invalid sourceType', () => {
      const obj = {
        canonicalIdentifier: 'react',
        repositoryUrl: 'https://github.com/facebook/react',
        sourceType: 'invalid',
        confidence: 'high',
      };
      expect(validateDiscoveryJson(obj)).toBe(false);
    });

    it('rejects invalid confidence', () => {
      const obj = {
        canonicalIdentifier: 'react',
        repositoryUrl: 'https://github.com/facebook/react',
        sourceType: 'github',
        confidence: 'invalid',
      };
      expect(validateDiscoveryJson(obj)).toBe(false);
    });
  });

  describe('validateToolCallJson', () => {
    it('validates correct tool call', () => {
      const obj = {
        tool: 'firecrawl',
        args: { url: 'https://example.com' },
      };
      expect(validateToolCallJson(obj)).toBe(true);
    });

    it('rejects invalid tool name', () => {
      const obj = {
        tool: 'invalid',
        args: {},
      };
      expect(validateToolCallJson(obj)).toBe(false);
    });

    it('rejects missing args', () => {
      const obj = {
        tool: 'firecrawl',
      };
      expect(validateToolCallJson(obj)).toBe(false);
    });
  });
});

