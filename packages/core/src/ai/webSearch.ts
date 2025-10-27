import { tavily } from '@tavily/core';
import { getRuntimeConfig } from '../config/runtimeConfig.js';

export interface SearchResultItem {
  title: string;
  url: string;
  score?: number;
  summary?: string;
  sourceHint?: 'github' | 'context7' | 'deepwiki' | 'official' | 'other';
}

export async function searchPreferredSources(query: string, dependencyType: string): Promise<SearchResultItem[]> {
  const rc = getRuntimeConfig();
  if (!rc.tavily?.enabled || !rc.tavily.apiKey) {
    return [];
  }

  const client = tavily({ apiKey: rc.tavily.apiKey });
  const response = await client.search(query, {
    includeAnswer: 'basic',
    maxResults: rc.tavily.maxResults ?? 5,
    timeout: rc.tavily.timeoutMs ?? 15000,
  } as any);

  const items: SearchResultItem[] = (response.results || []).map((r: any) => ({
    title: r.title,
    url: r.url,
    score: r.score,
    summary: r.content,
    sourceHint: classifyUrl(r.url),
  }));

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

  return items.sort((a, b) => (weight(b.sourceHint) + (b.score ?? 0)) - (weight(a.sourceHint) + (a.score ?? 0)));
}

function classifyUrl(url: string): SearchResultItem['sourceHint'] {
  const u = url.toLowerCase();
  if (u.includes('github.com/')) return 'github';
  if (u.includes('context7.com/')) return 'context7';
  if (u.includes('deepwiki')) return 'deepwiki';
  if (u.includes('docs.') || u.includes('/docs') || u.includes('developer') || u.includes('dev.')) return 'official';
  return 'other';
}


