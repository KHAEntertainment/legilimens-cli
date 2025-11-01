import { estimateTokens, condenseDocumentation } from './documentChunker.js';
import { extractPrioritySections, aggressiveExtraction } from './sectionExtractor.js';
import type { RuntimeConfig } from '../config/runtimeConfig.js';

export type RoutingMethod = 'full-context' | 'smart-chunking' | 'aggressive-extraction';

export interface RoutingMetadata {
  originalTokens: number;
  processedTokens: number;
  method: RoutingMethod;
  modelContextWindow: number;
  qualityWarning: boolean;
}

export interface RoutingResult {
  preparedDocs: string;
  metadata: RoutingMetadata;
}

/**
 * Route documentation processing based on size with 3-tier strategy
 *
 * Tier 1 (< 90% of context): Full context pass-through
 * Tier 2 (90%-150% of context): Smart section extraction or chunking
 * Tier 3 (> 150% of context): Aggressive extraction with user warning
 */
export async function routeDocumentation(
  documentation: string,
  dependencyName: string,
  dependencyType: string,
  runtimeConfig: RuntimeConfig
): Promise<RoutingResult> {
  // Get model's context window (default to Granite's 128K)
  const modelContextWindow = runtimeConfig.localLlm?.tokens ?? 128000;

  // Estimate tokens with 20% safety margin for tokenization variance
  const rawTokens = estimateTokens(documentation);
  const safetyMargin = 1.2;
  const estimatedTokens = Math.ceil(rawTokens * safetyMargin);

  // Define routing thresholds
  const fullContextThreshold = Math.floor(modelContextWindow * 0.9); // 115,200 for Granite
  const smartChunkingThreshold = Math.floor(modelContextWindow * 1.5); // 192,000 for Granite

  if (process.env.LEGILIMENS_DEBUG) {
    console.debug(
      `[documentRouter] Analyzing documentation for ${dependencyName}:\n` +
      `  Raw tokens: ${rawTokens.toLocaleString()}\n` +
      `  Estimated with margin: ${estimatedTokens.toLocaleString()}\n` +
      `  Model context window: ${modelContextWindow.toLocaleString()}\n` +
      `  Full context threshold: ${fullContextThreshold.toLocaleString()}\n` +
      `  Smart chunking threshold: ${smartChunkingThreshold.toLocaleString()}`
    );
  }

  // ROUTE 1: Full Context (< 90% of context window)
  // Pass entire documentation to model in single pass
  if (estimatedTokens < fullContextThreshold) {
    const processedTokens = rawTokens;

    if (process.env.LEGILIMENS_DEBUG) {
      console.debug(
        `[documentRouter] ✅ Full context routing: ${processedTokens.toLocaleString()} tokens ` +
        `(${Math.round((processedTokens / modelContextWindow) * 100)}% of context window)`
      );
    }

    return {
      preparedDocs: documentation,
      metadata: {
        originalTokens: rawTokens,
        processedTokens,
        method: 'full-context',
        modelContextWindow,
        qualityWarning: false,
      },
    };
  }

  // ROUTE 2: Smart Chunking (90%-150% of context window)
  // Use intelligent section extraction or multi-pass summarization
  if (estimatedTokens < smartChunkingThreshold) {
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug(
        `[documentRouter] ⚠️  Smart chunking routing: ${estimatedTokens.toLocaleString()} tokens ` +
        `(${Math.round((estimatedTokens / modelContextWindow) * 100)}% of context window)`
      );
    }

    // Try intelligent section extraction first (faster, better quality)
    const targetTokens = Math.floor(modelContextWindow * 0.8); // 80% target for chunked content
    const extractedContent = extractPrioritySections(documentation, targetTokens);
    const extractedTokens = estimateTokens(extractedContent);

    // If extraction yielded good results (> 50% of target), use it
    if (extractedTokens > targetTokens * 0.5) {
      if (process.env.LEGILIMENS_DEBUG) {
        console.debug(
          `[documentRouter] Using section extraction: ${extractedTokens.toLocaleString()} tokens ` +
          `(${Math.round((extractedTokens / rawTokens) * 100)}% of original)`
        );
      }

      return {
        preparedDocs: extractedContent,
        metadata: {
          originalTokens: rawTokens,
          processedTokens: extractedTokens,
          method: 'smart-chunking',
          modelContextWindow,
          qualityWarning: false,
        },
      };
    }

    // Fall back to multi-pass summarization if extraction didn't work well
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug('[documentRouter] Section extraction insufficient, using multi-pass summarization');
    }

    const condensed = await condenseDocumentation(
      documentation,
      dependencyName,
      dependencyType,
      runtimeConfig
    );
    const condensedTokens = estimateTokens(condensed);

    return {
      preparedDocs: condensed,
      metadata: {
        originalTokens: rawTokens,
        processedTokens: condensedTokens,
        method: 'smart-chunking',
        modelContextWindow,
        qualityWarning: false,
      },
    };
  }

  // ROUTE 3: Aggressive Extraction (> 150% of context window)
  // Extract only critical sections and warn user about quality degradation
  if (process.env.LEGILIMENS_DEBUG) {
    console.debug(
      `[documentRouter] 🚨 Aggressive extraction routing: ${estimatedTokens.toLocaleString()} tokens ` +
      `(${Math.round((estimatedTokens / modelContextWindow) * 100)}% of context window)`
    );
  }

  const aggressiveContent = await aggressiveExtraction(
    documentation,
    dependencyName,
    dependencyType,
    runtimeConfig
  );
  const aggressiveTokens = estimateTokens(aggressiveContent);

  return {
    preparedDocs: aggressiveContent,
    metadata: {
      originalTokens: rawTokens,
      processedTokens: aggressiveTokens,
      method: 'aggressive-extraction',
      modelContextWindow,
      qualityWarning: true,
    },
  };
}
