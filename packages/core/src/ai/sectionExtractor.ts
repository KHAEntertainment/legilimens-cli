import { estimateTokens } from './documentChunker.js';
import type { RuntimeConfig } from '../config/runtimeConfig.js';

/**
 * Extract a specific markdown section by heading pattern
 * Returns the section content including the heading
 */
export function extractSection(markdown: string, headingPattern: RegExp): string {
  const lines = markdown.split('\n');
  let inSection = false;
  let sectionLevel = 0;
  const sectionLines: string[] = [];

  for (const line of lines) {
    // Check if this line matches our target heading
    if (headingPattern.test(line)) {
      inSection = true;
      const match = line.match(/^(#{1,6})\s/);
      sectionLevel = match ? match[1].length : 1;
      sectionLines.push(line);
      continue;
    }

    if (inSection) {
      // Check if we've hit another heading of same or higher level
      const headingMatch = line.match(/^(#{1,6})\s/);
      if (headingMatch) {
        const currentLevel = headingMatch[1].length;
        if (currentLevel <= sectionLevel) {
          // We've reached the end of this section
          break;
        }
      }
      sectionLines.push(line);
    }
  }

  return sectionLines.join('\n');
}

/**
 * Extract priority sections from markdown documentation
 * Continues extracting until target token budget is reached
 */
export function extractPrioritySections(
  markdown: string,
  targetTokens: number
): string {
  // Priority sections in order of importance
  const priorityPatterns: Array<{ pattern: RegExp; name: string }> = [
    { pattern: /^#{1,3}\s+(README|About|Introduction)/mi, name: 'README/About' },
    { pattern: /^#{1,3}\s+(Getting Started|Quick Start|Quickstart)/mi, name: 'Getting Started' },
    { pattern: /^#{1,3}\s+Installation/mi, name: 'Installation' },
    { pattern: /^#{1,3}\s+(API Reference|API|Reference)/mi, name: 'API Reference' },
    { pattern: /^#{1,3}\s+(Usage|How to Use|Examples)/mi, name: 'Usage' },
    { pattern: /^#{1,3}\s+(Features|Capabilities)/mi, name: 'Features' },
    { pattern: /^#{1,3}\s+Configuration/mi, name: 'Configuration' },
  ];

  const extractedSections: string[] = [];
  let totalTokens = 0;

  // Extract first paragraph if no structured sections found
  const firstParagraph = markdown.split('\n\n')[0];
  if (firstParagraph && firstParagraph.length > 50) {
    extractedSections.push(firstParagraph);
    totalTokens = estimateTokens(firstParagraph);
  }

  for (const { pattern, name } of priorityPatterns) {
    const section = extractSection(markdown, pattern);

    if (!section || section.length < 50) {
      // Section not found or too small
      continue;
    }

    const sectionTokens = estimateTokens(section);

    if (totalTokens + sectionTokens > targetTokens) {
      // Would exceed budget, stop here
      if (process.env.LEGILIMENS_DEBUG) {
        console.debug(`[sectionExtractor] Stopping at ${name}, would exceed ${targetTokens} token budget`);
      }
      break;
    }

    extractedSections.push(section);
    totalTokens += sectionTokens;

    if (process.env.LEGILIMENS_DEBUG) {
      console.debug(`[sectionExtractor] Extracted ${name}: ${sectionTokens} tokens (total: ${totalTokens})`);
    }
  }

  const result = extractedSections.join('\n\n');

  // If extraction yielded very little content, fall back to prefix
  if (!result || result.length < 1000) {
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug('[sectionExtractor] Insufficient structured content, using document prefix');
    }
    return markdown.slice(0, targetTokens * 4); // 4 chars per token heuristic
  }

  return result;
}

/**
 * Aggressive extraction for extremely large documentation (> 192K tokens)
 * Extracts only the most critical sections with hard limits
 */
export async function aggressiveExtraction(
  documentation: string,
  dependencyName: string,
  dependencyType: string,
  runtimeConfig: RuntimeConfig
): Promise<string> {
  const estimatedTokens = estimateTokens(documentation);

  console.warn(
    `[gateway] Extremely large documentation for ${dependencyName}: ${estimatedTokens.toLocaleString()} tokens.\n` +
    `   Documentation will be truncated to key sections for AI processing.\n` +
    `   Full documentation is preserved in static-backup for reference.`
  );

  // Hard limit for extreme cases (80% of context window)
  const modelMaxTokens = runtimeConfig.localLlm?.tokens ?? 128000;
  const hardLimit = Math.floor(modelMaxTokens * 0.8);

  // Extract only top-priority sections
  const topPriorityPatterns: Array<{ pattern: RegExp; name: string }> = [
    { pattern: /^#{1,3}\s+(README|About)/mi, name: 'README' },
    { pattern: /^#{1,3}\s+(Getting Started|Quick Start)/mi, name: 'Quick Start' },
    { pattern: /^#{1,3}\s+(API Reference|API)/mi, name: 'API' },
  ];

  const extractedSections: string[] = [];
  let totalTokens = 0;

  // Always include first paragraph
  const firstParagraph = documentation.split('\n\n')[0];
  if (firstParagraph && firstParagraph.length > 50) {
    extractedSections.push(firstParagraph);
    totalTokens = estimateTokens(firstParagraph);
  }

  for (const { pattern, name } of topPriorityPatterns) {
    const section = extractSection(documentation, pattern);

    if (!section || section.length < 50) continue;

    const sectionTokens = estimateTokens(section);

    if (totalTokens + sectionTokens > hardLimit) {
      console.warn(`[gateway] Hard limit reached at ${name}, stopping extraction`);
      break;
    }

    extractedSections.push(section);
    totalTokens += sectionTokens;

    if (process.env.LEGILIMENS_DEBUG) {
      console.debug(`[sectionExtractor] Critical section ${name}: ${sectionTokens} tokens`);
    }
  }

  const result = extractedSections.join('\n\n');

  // Last resort: use prefix if structured extraction failed
  if (!result || result.length < 1000) {
    console.warn('[gateway] Structured extraction failed, using document prefix');
    return documentation.slice(0, hardLimit * 4);
  }

  if (process.env.LEGILIMENS_DEBUG) {
    console.debug(
      `[sectionExtractor] Aggressive extraction complete: ${totalTokens} tokens ` +
      `(${Math.round((totalTokens / estimatedTokens) * 100)}% of original)`
    );
  }

  return result;
}
