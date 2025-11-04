import { tavily, type TavilySearchOptions } from '@tavily/core';
import { getRuntimeConfig } from '../config/runtimeConfig.js';
import { extractFirstJson, safeParseJson } from './json.js';

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
 * Search for documentation sources using Tavily
 * Uses domain filtering and developer-focused language for best results
 */
export async function searchPreferredSources(query: string, dependencyName: string): Promise<SearchResult> {
  const rc = getRuntimeConfig();
  if (!rc.tavily?.enabled || !rc.tavily.apiKey) {
    return { items: [] };
  }

  const client = tavily({ apiKey: rc.tavily.apiKey });
  
  // Strategy: Leverage Tavily's LLM to intelligently evaluate source authority
  // Tavily will analyze all available sources and rank by documentation quality
  // This allows discovery of official docs, Context7 indexes, and GitHub repos
  const searchQuery = `Find the most definitive source of documentation for "${dependencyName}" on Context7, GitHub, or its own dedicated website, ranked in order of authority. Prioritize Context7 for popular packages, GitHub for open-source projects, and official websites for proprietary tools. Return the primary documentation URL and source type.`;
  
  const searchOptions: TavilySearchOptions = {
    includeAnswer: true,  // Tavily's LLM will provide structured answer
    maxResults: rc.tavily.maxResults ?? 10,  // Increase to get more candidates for LLM evaluation
    timeout: rc.tavily.timeoutMs ?? 15000,
  };

  const response = await client.search(searchQuery, searchOptions);

  const items: SearchResultItem[] = (response.results || []).map((r: any) => ({
    title: r.title,
    url: r.url,
    score: r.score,
    summary: r.content,
    sourceHint: classifyUrl(r.url),
  }));

  // Extract GitHub owner/repo from Tavily's answer if available
  const suggestedIdentifier = extractGitHubIdentifier(response.answer);
  const sourceRecommendation = parseSourceRecommendation(response.answer);

  // Rank preference based on documentation quality and coverage:
  // 1. Context7: Indexes all popular packages with high-quality docs
  // 2. GitHub: Primary source for open-source projects
  // 3. Official: Authoritative but may be incomplete or outdated
  // 4. DeepWiki: Good for GitHub repos but less comprehensive than Context7
  // 5. Discussion: Community content, less authoritative than official sources
  const weight = (s?: SearchResultItem['sourceHint']) => {
    switch (s) {
      case 'context7': return 100;  // Highest priority - indexes all popular packages
      case 'github': return 95;     // Second priority - open-source projects
      case 'official': return 90;   // Third priority - official documentation
      case 'deepwiki': return 85;   // Fourth priority - DeepWiki indexes
      case 'discussion': return 60; // Fifth priority - community/forum discussions
      default: return 50;           // Lowest priority - other sources
    }
  };

  const sortedItems = items.sort((a, b) => (weight(b.sourceHint) + (b.score ?? 0)) - (weight(a.sourceHint) + (a.score ?? 0)));

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
        console.debug(`[webSearch] Parsed JSON recommendation: ${sourceType} (${confidence})`);
      }
      
      return {
        sourceType,
        primaryUrl: parsed.primaryUrl,
        confidence
      };
    }
  }
  
  // Strategy 2: Fallback to regex-based heuristics
  const lowerAnswer = answer.toLowerCase();
  
  // Check for Context7 recommendation
  if (lowerAnswer.includes('context7') && (lowerAnswer.includes('most authoritative') || lowerAnswer.includes('best source') || lowerAnswer.includes('primary source'))) {
    const context7Match = answer.match(/context7\.com\/([^\s]+)/);
    return {
      sourceType: 'context7',
      primaryUrl: context7Match ? `https://context7.com/${context7Match[1]}` : undefined,
      confidence: 'high'
    };
  }
  
  // Check for GitHub recommendation
  if (lowerAnswer.includes('github') && (lowerAnswer.includes('primary source') || lowerAnswer.includes('official repository'))) {
    const githubMatch = answer.match(/github\.com\/([a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+)/);
    return {
      sourceType: 'github',
      primaryUrl: githubMatch ? `https://github.com/${githubMatch[1]}` : undefined,
      confidence: 'high'
    };
  }
  
  // Check for official website recommendation
  if (lowerAnswer.includes('official') && (lowerAnswer.includes('website') || lowerAnswer.includes('documentation'))) {
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