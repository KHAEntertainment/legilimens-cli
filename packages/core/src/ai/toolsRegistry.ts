import type { FetchResult, FetcherConfig } from '../fetchers/types.js';
import { fetchFromFirecrawl } from '../fetchers/firecrawl.js';
import { fetchFromContext7 } from '../fetchers/context7.js';
import { fetchFromRefTools } from '../fetchers/refTools.js';
import { getRuntimeConfig } from '../config/runtimeConfig.js';

export type ToolName = 'firecrawl' | 'context7' | 'ref';

export async function callTool(tool: ToolName, args: Record<string, unknown>): Promise<FetchResult> {
  const rc = getRuntimeConfig();
  const baseCfg: { timeoutMs: number; maxRetries: number } = {
    timeoutMs: rc.fetcherConfig.timeoutMs,
    maxRetries: rc.fetcherConfig.maxRetries,
  };
  switch (tool) {
    case 'firecrawl':
      return await fetchFromFirecrawl(String((args as any).url || ''), { timeoutMs: baseCfg.timeoutMs, maxRetries: baseCfg.maxRetries, apiKey: rc.apiKeys.firecrawl });
    case 'context7':
      return await fetchFromContext7(String((args as any).packageName || ''), { timeoutMs: baseCfg.timeoutMs, maxRetries: baseCfg.maxRetries, apiKey: rc.apiKeys.context7 });
    case 'ref':
      return await fetchFromRefTools(String((args as any).identifier || ''), { timeoutMs: baseCfg.timeoutMs, maxRetries: baseCfg.maxRetries, apiKey: rc.apiKeys.refTools });
    default:
      return { success: false, error: `Unknown tool: ${tool}` } as FetchResult;
  }
}


