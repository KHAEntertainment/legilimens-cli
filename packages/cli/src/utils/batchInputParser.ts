import { readFile } from 'fs/promises';
import { type DependencyType } from '@legilimens/core';

const ALLOWED_DEPENDENCY_TYPES: DependencyType[] = ['framework', 'api', 'library', 'tool', 'other'];

/**
 * Batch dependency specification
 */
export interface BatchDependency {
  identifier: string;
  type?: DependencyType;
  deepWiki?: string; // Optional: Override auto-detected DeepWiki URL (advanced use case only)
}

/**
 * Parsed batch input result
 */
export interface ParsedBatchInput {
  dependencies: BatchDependency[];
  source: 'inline' | 'txt-file' | 'json-file';
  sourcePath?: string;
}

/**
 * Parse batch input from various sources (inline, .txt file, .json file)
 */
export async function parseBatchInput(input: string): Promise<ParsedBatchInput> {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    throw new Error('Batch input cannot be empty');
  }

  // Check if input is a file path (starts with @)
  if (trimmedInput.startsWith('@')) {
    const filePath = trimmedInput.slice(1).trim();

    if (!filePath) {
      throw new Error('File path cannot be empty after @ prefix');
    }

    // Determine file type based on extension
    if (filePath.endsWith('.txt')) {
      const identifiers = await parseTextFile(filePath);
      return {
        dependencies: identifiers.map(id => ({ identifier: id })),
        source: 'txt-file',
        sourcePath: filePath
      };
    } else if (filePath.endsWith('.json')) {
      const dependencies = await parseJsonFile(filePath);
      return {
        dependencies,
        source: 'json-file',
        sourcePath: filePath
      };
    } else {
      throw new Error(`Unsupported file extension. Use .txt or .json files. Got: ${filePath}`);
    }
  }

  // Parse inline text (comma-separated or newline-separated)
  const dependencies = parseInlineText(trimmedInput);
  return {
    dependencies,
    source: 'inline',
  };
}

/**
 * Parse inline text input (comma or newline separated)
 */
function parseInlineText(input: string): BatchDependency[] {
  // Split by both commas and newlines
  const rawIdentifiers = input
    .split(/[,\n]/)
    .map(id => id.trim())
    .filter(id => id.length > 0);

  if (rawIdentifiers.length === 0) {
    throw new Error('No valid identifiers found in inline input');
  }

  return rawIdentifiers.map(identifier => ({ identifier }));
}

/**
 * Parse .txt file (one identifier per line)
 */
export async function parseTextFile(filePath: string): Promise<string[]> {
  try {
    const content = await readFile(filePath, 'utf-8');

    const identifiers = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#')); // Filter empty lines and comments

    if (identifiers.length === 0) {
      throw new Error(`No valid identifiers found in ${filePath}`);
    }

    return identifiers;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    }
    throw error;
  }
}

/**
 * Parse .json file (array of dependency objects)
 */
export async function parseJsonFile(filePath: string): Promise<BatchDependency[]> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content);

    if (!Array.isArray(parsed)) {
      throw new Error(`JSON file must contain an array. Got: ${typeof parsed}`);
    }

    const dependencies: BatchDependency[] = [];

    parsed.forEach((item, index) => {
      if (typeof item !== 'object' || item === null) {
        throw new Error(`Each item in JSON array must be an object. Got: ${typeof item}`);
      }

      if (!item.identifier || typeof item.identifier !== 'string') {
        throw new Error('Each object must have a string "identifier" field');
      }

      const dependency: BatchDependency = {
        identifier: item.identifier.trim(),
      };

      if (item.type && typeof item.type === 'string') {
        const normalizedType = item.type.trim().toLowerCase();

        if (!ALLOWED_DEPENDENCY_TYPES.includes(normalizedType as DependencyType)) {
          const identifier = dependency.identifier || `index ${index}`;
          throw new Error(
            `Invalid dependency type "${item.type}" for entry "${identifier}". ` +
            `Allowed types: ${ALLOWED_DEPENDENCY_TYPES.join(', ')}`
          );
        }

        dependency.type = normalizedType as DependencyType;
      }

      if (item.deepWiki && typeof item.deepWiki === 'string') {
        dependency.deepWiki = item.deepWiki.trim();
      }

      dependencies.push(dependency);
    });

    if (dependencies.length === 0) {
      throw new Error(`No valid dependencies found in ${filePath}`);
    }

    return dependencies;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON format in ${filePath}: ${error.message}`);
    }
    throw error;
  }
}
