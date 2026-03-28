import { tavily, type TavilySearchOptions } from '@tavily/core';
import { getRuntimeConfig } from '../config/runtimeConfig.js';
import { extractFirstJson, safeParseJson } from './json.js';

interface TavilyResultItem {
  title: string;
  url: string;
  score?: number;
  content?: string;
}

export interface SearchResultItem {
  title: string;
  url: string;
  score?: number;
  summary?: string;
  sourceHint?: 'github' | 'context7' | 'deepwiki' | 'official' | 'discussion' | 'other';
}

export interface SearchResult {
  items: SearchResultItem[];
  tavilyAnswer?: string;
  suggestedIdentifier?: string;
  sourceRecommendation?: {
    sourceType: 'context7' | 'github' | 'official' | 'unknown';
    primaryUrl?: string;
    confidence: 'high' | 'medium' | 'low';
  };
}

/**
 * Search for documentation sources using Tavily (GitHub and official docs only).
 * Context7 is searched separately in Phase 5, so Tavily focuses on sources Context7 doesn't index.
 */
export async function searchPreferredSources(identifierOrName: string): Promise<SearchResult> {
  const rc = getRuntimeConfig();
  if (!rc.tavily?.enabled || !rc.tavily.apiKey) {
    return { items: [] };
  }

  const client = tavily({ apiKey: rc.tavily.apiKey });
  
  // Strategy: Leverage Tavily's LLM to find GitHub repos and official docs.
  // Context7 has already been searched (Phase 5), so Tavily focuses on sources Context7 doesn't index.
  // This allows discovery of GitHub repositories and official documentation websites.
  const searchQuery = `Find the official GitHub repository or documentation website for "${identifierOrName}". Focus on GitHub for open-source projects and official documentation websites for proprietary tools. Return the primary documentation URL and source type (github or official).`;
  
  const searchOptions: TavilySearchOptions = {
    includeAnswer: true,  // Tavily's LLM will provide structured answer
    excludeDomains: ['context7.com', 'context7.ai'],
    maxResults: rc.tavily.maxResults ?? 10,  // Increase to get more candidates for LLM evaluation
    timeout: rc.tavily.timeoutMs ?? 15000,
  };

  // Log Tavily query initiation
  if (process.env.LEGILIMENS_DEBUG) {
    console.debug(`[webSearch] Tavily query: "${searchQuery}"`);
    console.debug(`[webSearch] Search options: maxResults=${searchOptions.maxResults}, timeout=${searchOptions.timeout}ms, excludeDomains=${JSON.stringify(searchOptions.excludeDomains)}`);
  }

  let response;
  try {
    response = await client.search(searchQuery, searchOptions);
  } catch (error) {
    // Log error and return empty result to allow pipeline fallback
    if (process.env.LEGILIMENS_DEBUG) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.debug(`[webSearch] Tavily API error: ${errorMessage}`);
    }
    return { items: [] };
  }

  // Log Tavily response
  if (process.env.LEGILIMENS_DEBUG) {
    console.debug(`[webSearch] Tavily response received: ${response.results?.length || 0} results`);
    console.debug(`[webSearch] Tavily answer: ${response.answer?.slice(0, 150) || 'none'}...`);
    if (response.results && response.results.length > 0) {
      const topRaw = response.results.slice(0, 3).map((r: TavilyResultItem) => `${r.title} (${r.score?.toFixed(2)})`).join(', ');
      console.debug(`[webSearch] Top 3 raw results: ${topRaw}`);
    }
  }

  const items: SearchResultItem[] = (response.results || []).map((r: TavilyResultItem) => ({
    title: r.title,
    url: r.url,
    score: r.score,
    summary: r.content,
    sourceHint: classifyUrl(r.url),
  }));

  // Log result classification
  if (process.env.LEGILIMENS_DEBUG) {
    const githubCount = items.filter(i => i.sourceHint === 'github').length;
    const officialCount = items.filter(i => i.sourceHint === 'official').length;
    const otherCount = items.filter(i => i.sourceHint === 'other').length;
    console.debug(`[webSearch] Classification: ${githubCount} GitHub, ${officialCount} official, ${otherCount} other`);
    if (items.length > 0) {
      const topClassified = items.slice(0, 3).map(i => `${i.title} [${i.sourceHint}] (${i.score?.toFixed(2)})`).join(', ');
      console.debug(`[webSearch] Top 3 classified: ${topClassified}`);
    }
  }

  // Extract GitHub owner/repo from Tavily's answer if available
  const suggestedIdentifier = extractGitHubIdentifier(response.answer);
  const sourceRecommendation = parseSourceRecommendation(response.answer);

  // Log source recommendation extraction
  if (process.env.LEGILIMENS_DEBUG) {
    console.debug(`[webSearch] Source recommendation: ${sourceRecommendation.sourceType} (${sourceRecommendation.confidence})`);
    console.debug(`[webSearch] Recommended URL: ${sourceRecommendation.primaryUrl || 'none'}`);
  }

  // Rank preference based on documentation quality and coverage:
  // Context7 is excluded from Tavily and searched earlier in the pipeline (Phase 5)
  // 1. GitHub: Primary source for open-source projects
  // 2. Official: Authoritative but may be incomplete or outdated
  // 3. DeepWiki: Good for GitHub repos
  // 4. Discussion: Community content, less authoritative than official sources
  // Weight values are small floats (0.0-0.15) to act as a soft bias rather than overwhelming Tavily scores (0-1)
  const weight = (s?: SearchResultItem['sourceHint']) => {
    switch (s) {
      case 'github': return 0.15;     // Highest priority - open-source projects
      case 'official': return 0.10;   // Second priority - official documentation
      case 'deepwiki': return 0.08;   // Third priority - DeepWiki indexes
      case 'discussion': return 0.02; // Fourth priority - community/forum discussions
      default: return 0.0;            // Lowest priority - other sources
    }
  };

  const sortedItems = items.sort((a, b) => (weight(b.sourceHint) + (b.score ?? 0)) - (weight(a.sourceHint) + (a.score ?? 0)));

  // Log ranking and sorting decisions
  if (process.env.LEGILIMENS_DEBUG) {
    console.debug(`[webSearch] Ranking applied: GitHub(+0.15) > Official(+0.10) > DeepWiki(+0.08) > Discussion(+0.02) > Other(+0.0)`);
    if (sortedItems.length > 0) {
      const topSorted = sortedItems.slice(0, 3).map(i =>
        `${i.title} [${i.sourceHint}] (weighted: ${(weight(i.sourceHint) + (i.score ?? 0)).toFixed(2)})`
      ).join(', ');
      console.debug(`[webSearch] Top 3 sorted: ${topSorted}`);
    }
    console.debug(`[webSearch] Suggested identifier: ${suggestedIdentifier || 'none'}`);
  }

  return {
    items: sortedItems,
    tavilyAnswer: response.answer,
    suggestedIdentifier,
    sourceRecommendation
  };
}

/**
 * Extract GitHub owner/repo identifier from text
 */
function extractGitHubIdentifier(text?: string): string | undefined {
  if (!text) return undefined;
  
  // Match github.com/owner/repo patterns
  const match = text.match(/github\.com\/([a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+)/i);
  if (match) {
    // Clean up the identifier (remove trailing slashes, .git, etc.)
    return match[1].replace(/\.git$/, '').replace(/\/$/, '');
  }
  
  return undefined;
}

/**
 * Parse Tavily's LLM answer for source recommendation
 * Attempts JSON extraction first, falls back to regex heuristics
 */
function parseSourceRecommendation(answer?: string): {
  sourceType: 'context7' | 'github' | 'official' | 'unknown';
  primaryUrl?: string;
  confidence: 'high' | 'medium' | 'low';
} {
  if (!answer) return { sourceType: 'unknown', confidence: 'low' };
  
  // Strategy 1: Try to extract JSON object from answer
  const jsonText = extractFirstJson(answer);
  if (jsonText) {
    const parsed = safeParseJson<any>(jsonText);
    if (parsed && parsed.primaryUrl && parsed.sourceType) {
      // Validate sourceType
      const validSourceTypes = ['context7', 'github', 'official', 'unknown'];
      const sourceType = validSourceTypes.includes(parsed.sourceType) 
        ? parsed.sourceType 
        : 'unknown';
      
      // Validate confidence
      const validConfidences = ['high', 'medium', 'low'];
      const confidence = validConfidences.includes(parsed.confidence)
        ? parsed.confidence
        : 'medium';
      
      if (process.env.LEGILIMENS_DEBUG) {
        console.debug(`[webSearch] Parsed JSON recommendation: ${sourceType} (${confidence}), URL: ${parsed.primaryUrl || 'none'}`);
      }
      
      return {
        sourceType,
        primaryUrl: parsed.primaryUrl,
        confidence
      };
    }
  }
  
  // Strategy 2: Fallback to regex-based heuristics
  if (process.env.LEGILIMENS_DEBUG) {
    console.debug(`[webSearch] JSON parsing failed, using regex heuristics for source recommendation`);
  }
  
  const lowerAnswer = answer.toLowerCase();
  
  // Check for Context7 recommendation
  if (lowerAnswer.includes('context7') && (lowerAnswer.includes('most authoritative') || lowerAnswer.includes('best source') || lowerAnswer.includes('primary source'))) {
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug(`[webSearch] Regex detected Context7 recommendation in answer`);
    }
    const context7Match = answer.match(/context7\.com\/([^\s]+)/);
    return {
      sourceType: 'context7',
      primaryUrl: context7Match ? `https://context7.com/${context7Match[1]}` : undefined,
      confidence: 'high'
    };
  }
  
  // Check for GitHub recommendation
  if (lowerAnswer.includes('github') && (lowerAnswer.includes('primary source') || lowerAnswer.includes('official repository'))) {
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug(`[webSearch] Regex detected GitHub recommendation in answer`);
    }
    const githubMatch = answer.match(/github\.com\/([a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+)/);
    return {
      sourceType: 'github',
      primaryUrl: githubMatch ? `https://github.com/${githubMatch[1]}` : undefined,
      confidence: 'high'
    };
  }
  
  // Check for official website recommendation
  if (lowerAnswer.includes('official') && (lowerAnswer.includes('website') || lowerAnswer.includes('documentation'))) {
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug(`[webSearch] Regex detected official website recommendation in answer`);
    }
    const urlMatch = answer.match(/https?:\/\/[^\s]+/);
    return {
      sourceType: 'official',
      primaryUrl: urlMatch ? urlMatch[0] : undefined,
      confidence: 'medium'
    };
  }
  
  // Fallback: extract any URL from answer
  const urlMatch = answer.match(/https?:\/\/[^\s]+/);
  if (urlMatch) {
    return {
      sourceType: 'unknown',
      primaryUrl: urlMatch[0],
      confidence: 'low'
    };
  }
  
  if (process.env.LEGILIMENS_DEBUG) {
    console.debug(`[webSearch] No source recommendation found in Tavily answer`);
  }
  
  return { sourceType: 'unknown', confidence: 'low' };
}

function classifyUrl(url: string): SearchResultItem['sourceHint'] {
  const u = url.toLowerCase();
  if (u.includes('github.com/')) return 'github';
  if (u.includes('context7.com/')) return 'context7';
  if (u.includes('deepwiki')) return 'deepwiki';
  
  // Check for discussion/community sites (lower priority)
  if (
    u.includes('stackoverflow.com') ||
    u.includes('reddit.com') ||
    u.includes('medium.com') ||
    u.includes('dev.to') ||
    u.includes('hashnode.') ||
    u.includes('discourse.')
  ) {
    return 'discussion';
  }
  
  // Enhanced official docs detection
  if (
    u.includes('docs.') || 
    u.includes('/docs') || 
    u.includes('/documentation') ||
    u.includes('developer.') ||
    u.includes('dev.') ||
    u.endsWith('.dev') ||
    u.endsWith('.io') ||
    u.includes('guide.') ||
    u.includes('api.') ||
    u.includes('reference.')
  ) {
    return 'official';
  }
  
  return 'other';
}