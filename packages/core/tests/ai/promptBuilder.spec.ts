import { describe, it, expect } from 'vitest';
import {
  buildGatewayGenerationPrompt,
  parseAiResponse,
  generateFallbackContent,
  type PromptParams
} from '../../src/ai/promptBuilder.js';

describe('promptBuilder', () => {
  describe('buildGatewayGenerationPrompt', () => {
    it('should build a valid prompt with all required parameters', () => {
      const params: PromptParams = {
        dependencyName: 'React',
        dependencyType: 'framework',
        fetchedDocumentation: 'React is a JavaScript library for building user interfaces.',
        deepWikiUrl: 'https://github.com/facebook/react',
        officialSourceUrl: 'https://react.dev'
      };

      const result = buildGatewayGenerationPrompt(params);

      expect(result.prompt).toContain('React');
      expect(result.prompt).toContain('framework');
      expect(result.prompt).toContain('React is a JavaScript library');
      expect(result.prompt).toContain('OUTPUT FORMAT (JSON)');
      expect(result.metadata.estimatedTokens).toBeGreaterThan(0);
      expect(result.metadata.truncated).toBe(false);
    });

    it('should request JSON output format', () => {
      const params: PromptParams = {
        dependencyName: 'Test',
        dependencyType: 'library',
        fetchedDocumentation: 'Test documentation'
      };

      const result = buildGatewayGenerationPrompt(params);

      expect(result.prompt).toContain('"shortDescription"');
      expect(result.prompt).toContain('"features"');
      expect(result.prompt).toContain('JSON');
    });

    it('should truncate large documentation and set flag', () => {
      const params: PromptParams = {
        dependencyName: 'Large Doc',
        dependencyType: 'library',
        fetchedDocumentation: 'x'.repeat(150000) // 150KB
      };

      const result = buildGatewayGenerationPrompt(params);

      expect(result.metadata.truncated).toBe(true);
      expect(result.prompt).toContain('[Documentation truncated for length...]');
    });

    it('should handle empty documentation', () => {
      const params: PromptParams = {
        dependencyName: 'Empty',
        dependencyType: 'library',
        fetchedDocumentation: ''
      };

      const result = buildGatewayGenerationPrompt(params);

      expect(result.prompt).toContain('Empty');
      expect(result.metadata.estimatedTokens).toBeGreaterThan(0);
    });

    it('should estimate tokens correctly', () => {
      const params: PromptParams = {
        dependencyName: 'Test',
        dependencyType: 'library',
        fetchedDocumentation: 'a'.repeat(1000) // 1KB
      };

      const result = buildGatewayGenerationPrompt(params);

      // Rough estimate: 4 chars ≈ 1 token
      expect(result.metadata.estimatedTokens).toBeGreaterThan(200);
      expect(result.metadata.estimatedTokens).toBeLessThan(500);
    });
  });

  describe('parseAiResponse', () => {
    it('should parse valid JSON response', () => {
      const response = JSON.stringify({
        shortDescription: 'This is a test library',
        features: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4', 'Feature 5']
      });

      const result = parseAiResponse(response);

      expect(result.shortDescription).toBe('This is a test library');
      expect(result.features).toHaveLength(5);
      expect(result.features[0]).toBe('Feature 1');
    });

    it('should parse JSON wrapped in markdown code blocks', () => {
      const response = `\`\`\`json
{
  "shortDescription": "Test description",
  "features": ["f1", "f2", "f3", "f4", "f5"]
}
\`\`\``;

      const result = parseAiResponse(response);

      expect(result.shortDescription).toBe('Test description');
      expect(result.features).toHaveLength(5);
    });

    it('should parse JSON wrapped in code blocks without language', () => {
      const response = `\`\`\`
{
  "shortDescription": "Test description",
  "features": ["f1", "f2", "f3", "f4", "f5"]
}
\`\`\``;

      const result = parseAiResponse(response);

      expect(result.shortDescription).toBe('Test description');
      expect(result.features).toHaveLength(5);
    });

    it('should throw error for malformed JSON', () => {
      const response = 'This is not JSON';

      expect(() => parseAiResponse(response)).toThrow('Failed to parse AI response as JSON');
    });

    it('should throw error for missing shortDescription', () => {
      const response = JSON.stringify({
        features: ['f1', 'f2', 'f3', 'f4', 'f5']
      });

      expect(() => parseAiResponse(response)).toThrow('missing or invalid shortDescription');
    });

    it('should throw error for missing features', () => {
      const response = JSON.stringify({
        shortDescription: 'Test'
      });

      expect(() => parseAiResponse(response)).toThrow('must include 1-10 features');
    });

    it('should throw error for incorrect number of features', () => {
      const response = JSON.stringify({
        shortDescription: 'Test',
        features: ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11'] // 11 features
      });

      expect(() => parseAiResponse(response)).toThrow('must include 1-10 features');
    });

    it('should throw error for non-string features', () => {
      const response = JSON.stringify({
        shortDescription: 'Test',
        features: ['f1', 'f2', 3, 'f4', 'f5']
      });

      expect(() => parseAiResponse(response)).toThrow('must be a string');
    });
  });

  describe('generateFallbackContent', () => {
    it('should generate valid fallback content for npm packages', () => {
      const params: PromptParams = {
        dependencyName: 'lodash',
        dependencyType: 'package',
        fetchedDocumentation: 'Test docs'
      };

      const result = generateFallbackContent(params);

      expect(result.shortDescription).toContain('lodash');
      expect(result.shortDescription).toContain('package');
      expect(result.features).toHaveLength(5);
      expect(result.features[0]).toContain('API reference');
    });

    it('should generate valid fallback content for GitHub repositories', () => {
      const params: PromptParams = {
        dependencyName: 'React',
        dependencyType: 'github',
        fetchedDocumentation: 'Test docs'
      };

      const result = generateFallbackContent(params);

      expect(result.shortDescription).toContain('React');
      expect(result.shortDescription).toContain('github');
      expect(result.features).toHaveLength(5);
      expect(result.features[0]).toContain('Repository overview');
    });

    it('should generate default fallback content for unknown types', () => {
      const params: PromptParams = {
        dependencyName: 'Unknown',
        dependencyType: 'other',
        fetchedDocumentation: 'Test docs'
      };

      const result = generateFallbackContent(params);

      expect(result.shortDescription).toContain('Unknown');
      expect(result.features).toHaveLength(5);
      expect(result.features[0]).toContain('Comprehensive documentation');
    });

    it('should always return exactly 5 features', () => {
      const params: PromptParams = {
        dependencyName: 'Test',
        dependencyType: 'library',
        fetchedDocumentation: 'Test docs'
      };

      const result = generateFallbackContent(params);

      expect(result.features).toHaveLength(5);
      result.features.forEach((feature) => {
        expect(typeof feature).toBe('string');
        expect(feature.length).toBeGreaterThan(0);
      });
    });
  });
});
