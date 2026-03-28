import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

// Import directly from source (vitest resolves via alias)
import { parseBatchInput } from '../../packages/cli/src/utils/batchInputParser.js';

describe('parseBatchInput', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `legilimens-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('inline parsing', () => {
    it('parses comma-separated identifiers', async () => {
      const result = await parseBatchInput('react, express, lodash');
      expect(result.source).toBe('inline');
      expect(result.dependencies).toHaveLength(3);
      expect(result.dependencies[0].identifier).toBe('react');
      expect(result.dependencies[1].identifier).toBe('express');
      expect(result.dependencies[2].identifier).toBe('lodash');
    });

    it('parses newline-separated identifiers', async () => {
      const result = await parseBatchInput('react\nexpress\nlodash');
      expect(result.source).toBe('inline');
      expect(result.dependencies).toHaveLength(3);
    });

    it('handles mixed comma and newline separators', async () => {
      const result = await parseBatchInput('react, express\nlodash');
      expect(result.dependencies).toHaveLength(3);
    });

    it('trims whitespace around identifiers', async () => {
      const result = await parseBatchInput('  react  ,  express  ');
      expect(result.dependencies[0].identifier).toBe('react');
      expect(result.dependencies[1].identifier).toBe('express');
    });

    it('filters empty segments', async () => {
      const result = await parseBatchInput('react,,express,');
      expect(result.dependencies).toHaveLength(2);
    });

    it('throws on empty input', async () => {
      await expect(parseBatchInput('')).rejects.toThrow('Batch input cannot be empty');
    });

    it('throws on whitespace-only input', async () => {
      await expect(parseBatchInput('   ')).rejects.toThrow('Batch input cannot be empty');
    });
  });

  describe('txt file parsing', () => {
    it('parses a .txt file with one identifier per line', async () => {
      const filePath = join(tempDir, 'deps.txt');
      await writeFile(filePath, 'react\nexpress\nlodash\n');
      const result = await parseBatchInput(`@${filePath}`);
      expect(result.source).toBe('txt-file');
      expect(result.sourcePath).toBe(filePath);
      expect(result.dependencies).toHaveLength(3);
      expect(result.dependencies[0].identifier).toBe('react');
    });

    it('skips comment lines starting with #', async () => {
      const filePath = join(tempDir, 'deps.txt');
      await writeFile(filePath, '# comment\nreact\n# another comment\nexpress\n');
      const result = await parseBatchInput(`@${filePath}`);
      expect(result.dependencies).toHaveLength(2);
    });

    it('skips blank lines', async () => {
      const filePath = join(tempDir, 'deps.txt');
      await writeFile(filePath, 'react\n\nexpress\n\n');
      const result = await parseBatchInput(`@${filePath}`);
      expect(result.dependencies).toHaveLength(2);
    });

    it('throws on missing file', async () => {
      await expect(parseBatchInput(`@${join(tempDir, 'nope.txt')}`))
        .rejects.toThrow('File not found');
    });

    it('throws on empty txt file', async () => {
      const filePath = join(tempDir, 'empty.txt');
      await writeFile(filePath, '# only comments\n');
      await expect(parseBatchInput(`@${filePath}`))
        .rejects.toThrow('No valid identifiers found');
    });
  });

  describe('json file parsing', () => {
    it('parses a .json file with identifier objects', async () => {
      const filePath = join(tempDir, 'deps.json');
      await writeFile(filePath, JSON.stringify([
        { identifier: 'react' },
        { identifier: 'express' },
      ]));
      const result = await parseBatchInput(`@${filePath}`);
      expect(result.source).toBe('json-file');
      expect(result.sourcePath).toBe(filePath);
      expect(result.dependencies).toHaveLength(2);
    });

    it('preserves explicit type when provided', async () => {
      const filePath = join(tempDir, 'deps.json');
      await writeFile(filePath, JSON.stringify([
        { identifier: 'react', type: 'library' },
      ]));
      const result = await parseBatchInput(`@${filePath}`);
      expect(result.dependencies[0].type).toBe('library');
    });

    it('preserves deepWiki override when provided', async () => {
      const filePath = join(tempDir, 'deps.json');
      await writeFile(filePath, JSON.stringify([
        { identifier: 'nuxt/nuxt', deepWiki: 'https://custom.wiki/nuxt' },
      ]));
      const result = await parseBatchInput(`@${filePath}`);
      expect(result.dependencies[0].deepWiki).toBe('https://custom.wiki/nuxt');
    });

    it('rejects invalid dependency type', async () => {
      const filePath = join(tempDir, 'deps.json');
      await writeFile(filePath, JSON.stringify([
        { identifier: 'react', type: 'invalid-type' },
      ]));
      await expect(parseBatchInput(`@${filePath}`))
        .rejects.toThrow('Invalid dependency type');
    });

    it('rejects missing identifier field', async () => {
      const filePath = join(tempDir, 'deps.json');
      await writeFile(filePath, JSON.stringify([
        { name: 'react' },
      ]));
      await expect(parseBatchInput(`@${filePath}`))
        .rejects.toThrow('"identifier" field');
    });

    it('rejects non-array JSON', async () => {
      const filePath = join(tempDir, 'deps.json');
      await writeFile(filePath, JSON.stringify({ not: 'array' }));
      await expect(parseBatchInput(`@${filePath}`))
        .rejects.toThrow('must contain an array');
    });

    it('rejects invalid JSON', async () => {
      const filePath = join(tempDir, 'deps.json');
      await writeFile(filePath, '{broken json');
      await expect(parseBatchInput(`@${filePath}`))
        .rejects.toThrow('Invalid JSON format');
    });
  });

  describe('edge cases', () => {
    it('rejects unsupported file extensions', async () => {
      await expect(parseBatchInput('@deps.yaml'))
        .rejects.toThrow('Unsupported file extension');
    });

    it('rejects @ with no path', async () => {
      await expect(parseBatchInput('@'))
        .rejects.toThrow('File path cannot be empty');
    });

    it('rejects @ with only whitespace path', async () => {
      await expect(parseBatchInput('@   '))
        .rejects.toThrow('File path cannot be empty');
    });
  });
});
