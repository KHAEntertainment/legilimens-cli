import type { DetectionResult } from '../detection/sourceDetector.js';
import { runLocalJson } from './localLlmRunner.js';
import { searchPreferredSources } from './webSearch.js';
import { extractFirstJson, safeParseJson, validateDiscoveryJson, validateToolCallJson } from './json.js';
import { discoverySchema, validateWithSchema } from './schemas.js';
import { callTool } from './toolsRegistry.js';

export interface PipelineResult extends DetectionResult {
  repositoryUrl?: string;
  aiAssisted: boolean;
  confidence: 'high' | 'medium' | 'low';
  searchSummary?: string;
  dependencyType: 'framework' | 'api' | 'library' | 'tool' | 'other';
}

/**
 * Repository discovery pipeline with Tavily-first approach
 * 
 * Strategy:
 * 1. Search with Tavily using domain filtering
 * 2. If high-confidence GitHub result found, use it directly (skip LLM)
 * 3. Otherwise, use LLM to interpret ambiguous results
 * 4. Fallback to Tavily's top result if LLM fails
 */
export async function discoverWithPipeline(natural: string): Promise<PipelineResult> {
  if (process.env.LEGILIMENS_DEBUG) {
    console.debug(`[pipeline] Discovering repository for: "${natural}"`);
  }

  // Step 1: Search with Tavily (uses domain filtering + developer-focused query)
  const searchResult = await searchPreferredSources('', natural);  // buildQuery removed, now handled in webSearch
  const { items, tavilyAnswer, suggestedIdentifier, sourceRecommendation } = searchResult;

  if (process.env.LEGILIMENS_DEBUG) {
    console.debug(`[pipeline] Tavily found ${items.length} results`);
    console.debug(`[pipeline] Tavily suggested: ${suggestedIdentifier || 'none'}`);
    console.debug(`[pipeline] Tavily answer: ${tavilyAnswer?.slice(0, 100) || 'none'}...`);
    if (sourceRecommendation) {
      console.debug(`[pipeline] Tavily recommends: ${sourceRecommendation.sourceType} (${sourceRecommendation.confidence})`);
      console.debug(`[pipeline] Primary URL: ${sourceRecommendation.primaryUrl || 'none'}`);
    }
  }

  // Step 1A: Tavily's LLM recommendation - If Tavily explicitly recommends a source, use it
  if (sourceRecommendation && sourceRecommendation.confidence === 'high' && sourceRecommendation.primaryUrl) {
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug(`[pipeline] Using Tavily's high-confidence recommendation: ${sourceRecommendation.sourceType}`);
    }
    
    // Map Tavily's source type to our source type
    const mappedSourceType = sourceRecommendation.sourceType === 'context7' ? 'npm' :
                             sourceRecommendation.sourceType === 'github' ? 'github' :
                             sourceRecommendation.sourceType === 'official' ? 'url' : 'unknown';
    
    // Extract identifier from URL if possible
    let identifier = natural;
    if (sourceRecommendation.sourceType === 'github') {
      const match = sourceRecommendation.primaryUrl.match(/github\.com\/([^\/]+\/[^\/?\#]+)/);
      if (match) {
        identifier = match[1].replace(/\.git$/, '').replace(/\/$/, '');
      }
    } else if (sourceRecommendation.sourceType === 'context7') {
      // Parse normalized identifier from Context7 URL
      // Expected format: https://context7.com/package-name or https://context7.com/@scope/package-name
      const context7Match = sourceRecommendation.primaryUrl.match(/context7\.com\/(.+?)(?:[?#]|$)/);
      if (context7Match) {
        identifier = context7Match[1].replace(/\/$/, '');
        if (process.env.LEGILIMENS_DEBUG) {
          console.debug(`[pipeline] Extracted Context7 identifier from URL: ${identifier}`);
        }
      }
    }
    
    return {
      sourceType: mappedSourceType,
      normalizedIdentifier: identifier,
      repositoryUrl: sourceRecommendation.primaryUrl,
      aiAssisted: true,  // Tavily's LLM made the recommendation
      confidence: 'high',
      searchSummary: tavilyAnswer || `Tavily recommends ${sourceRecommendation.sourceType} as the most authoritative source`,
      dependencyType: inferDependencyType(items[0]?.title || natural, items[0]?.summary)
    };
  }

  // Step 2: Direct Tavily path - If we have high-confidence GitHub result, use it immediately
  // (This is a fallback if Step 1A didn't trigger)
  if (items.length > 0 && items[0].sourceHint === 'github' && (items[0].score ?? 0) > 0.75) {
    const topResult = items[0];
    const match = topResult.url.match(/github\.com\/([^\/]+\/[^\/?\#]+)/);
    
    if (match) {
      const identifier = match[1].replace(/\.git$/, '').replace(/\/$/, '');
      
      if (process.env.LEGILIMENS_DEBUG) {
        console.debug(`[pipeline] High-confidence GitHub result found, skipping LLM`);
        console.debug(`[pipeline] Identifier: ${identifier}, Score: ${topResult.score}`);
      }
      
      return {
        sourceType: 'github',
        normalizedIdentifier: identifier,
        repositoryUrl: topResult.url,
        aiAssisted: false,  // Tavily provided the answer directly
        confidence: 'high',
        searchSummary: tavilyAnswer || topResult.summary,
        dependencyType: inferDependencyType(topResult.title, topResult.summary)
      };
    }
  }

  // Step 3: Use Tavily's suggested identifier if available
  if (suggestedIdentifier && items.length > 0) {
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug(`[pipeline] Using Tavily's suggested identifier: ${suggestedIdentifier}`);
    }
    
    return {
      sourceType: 'github',
      normalizedIdentifier: suggestedIdentifier,
      repositoryUrl: items[0].url,
      aiAssisted: false,
      confidence: 'high',
      searchSummary: tavilyAnswer || items[0].summary,
      dependencyType: inferDependencyType(items[0].title, items[0].summary)
    };
  }

  // Step 4: Ambiguous case - use LLM to interpret Tavily results
  if (items.length > 0) {
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug(`[pipeline] Ambiguous results, consulting LLM`);
    }
    
    const llmPrompt = [
      'Given these candidate sources, choose the canonical identifier, primary URL, source type, confidence, and dependency type.',
      sourceRecommendation ? `Tavily's LLM recommends: ${sourceRecommendation.sourceType} (${sourceRecommendation.confidence} confidence) at ${sourceRecommendation.primaryUrl || 'unknown URL'}` : '',
      'Respond with a single JSON object with fields:',
      '{ "canonicalIdentifier": string|null, "repositoryUrl": string|null, "sourceType": "github|npm|url|unknown", "confidence": "high|medium|low", "dependencyType": "framework|api|library|tool|other", "searchSummary": string }',
      `Natural: ${natural}`,
      `Candidates: ${JSON.stringify(items, null, 2)}`,
    ].filter(Boolean).join('\n');  // Filter out empty strings

    const decision = await runLocalJson<any>({ prompt: llmPrompt, schema: discoverySchema });
    
    if (decision.success && decision.json && validateDiscoveryJson(decision.json)) {
      const choice = decision.json;
      const normalizedIdentifier = String(choice.canonicalIdentifier ?? natural);

      if (process.env.LEGILIMENS_DEBUG) {
        console.debug(`[pipeline] LLM decision: ${normalizedIdentifier} (${choice.sourceType}, ${choice.confidence})`);
      }

      return {
        sourceType: choice.sourceType,
        normalizedIdentifier,
        repositoryUrl: choice.repositoryUrl ?? undefined,
        aiAssisted: true,
        confidence: choice.confidence,
        searchSummary: choice.searchSummary,
        dependencyType: choice.dependencyType ?? 'other',
      };
    }

    // Step 5: LLM failed - fallback to Tavily's recommendation or top result
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug(`[pipeline] LLM failed, falling back to ${sourceRecommendation ? 'Tavily recommendation' : 'top result'}`);
    }
    
    // Prefer Tavily's recommendation if available and confidence is not low
    if (sourceRecommendation && sourceRecommendation.primaryUrl && sourceRecommendation.confidence !== 'low') {
      const mappedSourceType = sourceRecommendation.sourceType === 'context7' ? 'npm' :
                               sourceRecommendation.sourceType === 'github' ? 'github' :
                               sourceRecommendation.sourceType === 'official' ? 'url' : 'unknown';
      
      let identifier = natural;
      if (sourceRecommendation.sourceType === 'github') {
        const match = sourceRecommendation.primaryUrl.match(/github\.com\/([^\/]+\/[^\/?\#]+)/);
        if (match) {
          identifier = match[1].replace(/\.git$/, '').replace(/\/$/, '');
        }
      } else if (sourceRecommendation.sourceType === 'context7') {
        const context7Match = sourceRecommendation.primaryUrl.match(/context7\.com\/(.+?)(?:[?#]|$)/);
        if (context7Match) {
          identifier = context7Match[1].replace(/\/$/, '');
        }
      }
      
      return {
        sourceType: mappedSourceType,
        normalizedIdentifier: identifier,
        repositoryUrl: sourceRecommendation.primaryUrl,
        aiAssisted: true,
        confidence: sourceRecommendation.confidence,
        searchSummary: tavilyAnswer || `Tavily recommends ${sourceRecommendation.sourceType}`,
        dependencyType: inferDependencyType(items[0]?.title || natural, items[0]?.summary)
      };
    }
    
    // Fallback to top result if no recommendation or confidence is low
    const topResult = items[0];
    const sourceType = topResult.sourceHint === 'context7' ? 'npm' :  // Map context7 to npm
                      topResult.sourceHint === 'github' ? 'github' : 
                      topResult.sourceHint === 'official' ? 'url' : 'unknown';
    
    const match = topResult.url.match(/github\.com\/([^\/]+\/[^\/?\#]+)/);
    const identifier = match ? match[1].replace(/\.git$/, '').replace(/\/$/, '') : natural;
    
    return {
      sourceType,
      normalizedIdentifier: identifier,
      repositoryUrl: topResult.url,
      aiAssisted: false,
      confidence: 'medium',
      searchSummary: topResult.summary,
      dependencyType: inferDependencyType(topResult.title, topResult.summary)
    };
  }

  // Step 6: No results from Tavily
  if (process.env.LEGILIMENS_DEBUG) {
    console.debug(`[pipeline] No results from Tavily, returning unknown`);
  }
  
  return { 
    sourceType: 'unknown', 
    normalizedIdentifier: natural, 
    aiAssisted: true, 
    confidence: 'low', 
    dependencyType: 'other' 
  };
}

/**
 * Infer dependency type from title and summary using simple heuristics
 */
function inferDependencyType(title: string, summary?: string): 'framework' | 'api' | 'library' | 'tool' | 'other' {
  const text = (title + ' ' + (summary || '')).toLowerCase();
  
  if (text.match(/framework|nextjs|react|vue|angular|svelte/)) return 'framework';
  if (text.match(/\bapi\b|sdk|client/)) return 'api';
  if (text.match(/library|package|module/)) return 'library';
  if (text.match(/\btool\b|cli|utility/)) return 'tool';
  
  return 'other';
}