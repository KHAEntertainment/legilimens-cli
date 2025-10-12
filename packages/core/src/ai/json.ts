/**
 * JSON helpers: robust extraction and validation for AI outputs
 */

export interface DiscoveryJson {
  canonicalIdentifier: string | null;
  repositoryUrl: string | null;
  sourceType: 'github' | 'npm' | 'url' | 'unknown';
  confidence: 'high' | 'medium' | 'low';
  searchSummary?: string;
}

export interface ToolCallJson {
  tool: 'firecrawl' | 'context7' | 'ref';
  args: Record<string, unknown>;
}

/**
 * Extract the first JSON object from a free-form string.
 */
export function extractFirstJson(text: string): string | null {
  if (!text) return null;
  const start = text.indexOf('{');
  if (start === -1) return null;

  // naive balanced braces scan
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }
  return null;
}

export function safeParseJson<T = unknown>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function validateDiscoveryJson(obj: any): obj is DiscoveryJson {
  if (!obj || typeof obj !== 'object') return false;
  const okSource = ['github', 'npm', 'url', 'unknown'].includes(obj.sourceType);
  const okConf = ['high', 'medium', 'low'].includes(obj.confidence);
  return okSource && okConf && 'canonicalIdentifier' in obj && 'repositoryUrl' in obj;
}

export function validateToolCallJson(obj: any): obj is ToolCallJson {
  if (!obj || typeof obj !== 'object') return false;
  if (!obj.tool || !['firecrawl', 'context7', 'ref'].includes(obj.tool)) return false;
  if (!obj.args || typeof obj.args !== 'object') return false;
  return true;
}


