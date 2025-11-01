import { tavily, type TavilySearchOptions } from '@tavily/core';
import { getRuntimeConfig } from '../config/runtimeConfig.js';

export interface SearchResultItem {
  title: string;
  url: string;
  score?: number;
  summary?: string;
  sourceHint?: 'github' | 'context7' | 'deepwiki' | 'official' | 'other';
}

export interface SearchResult {
  items: SearchResultItem[];
  tavilyAnswer?: string;
  suggestedIdentifier?: string;
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
  
  // Strategy: Developer-focused prompt + domain filtering
  // Based on testing: this gives highest relevance scores and best GitHub detection
  const searchQuery = `${dependencyName} official GitHub repository and developer documentation`;
  
  const searchOptions: TavilySearchOptions = {
    includeAnswer: true,  // Boolean, not string - Tavily extracts GitHub URLs for us!
    includeDomains: ['github.com', 'context7.com'],  // Correct camelCase key
    maxResults: rc.tavily.maxResults ?? 5,
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

  // rank preference: github → context7 → deepwiki → official docs → other
  const weight = (s?: SearchResultItem['sourceHint']) => {
    switch (s) {
      case 'github': return 100;
      case 'context7': return 90;
      case 'deepwiki': return 85;
      case 'official': return 80;
      default: return 50;
    }
  };

  const sortedItems = items.sort((a, b) => (weight(b.sourceHint) + (b.score ?? 0)) - (weight(a.sourceHint) + (a.score ?? 0)));

  return {
    items: sortedItems,
    tavilyAnswer: response.answer,
    suggestedIdentifier
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

function classifyUrl(url: string): SearchResultItem['sourceHint'] {
  const u = url.toLowerCase();
  if (u.includes('github.com/')) return 'github';
  if (u.includes('context7.com/')) return 'context7';
  if (u.includes('deepwiki')) return 'deepwiki';
  if (u.includes('docs.') || u.includes('/docs') || u.includes('developer') || u.includes('dev.')) return 'official';
  return 'other';
}