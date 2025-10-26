/**
 * JSON helpers: robust extraction and validation for AI outputs
 */

export interface DiscoveryJson {
  canonicalIdentifier: string | null;
  repositoryUrl: string | null;
  sourceType: 'github' | 'npm' | 'url' | 'unknown';
  confidence: 'high' | 'medium' | 'low';
  dependencyType?: 'framework' | 'api' | 'library' | 'tool' | 'other';
  searchSummary?: string;
}

export interface ToolCallJson {
  tool: 'firecrawl' | 'context7' | 'ref';
  args: Record<string, unknown>;
}

/**
 * Extract the first JSON object from a free-form string using multi-strategy approach.
 * Handles:
 * - JSON wrapped in markdown code blocks (```json or ```)
 * - JSON embedded in prose
 * - Pure JSON responses
 * - Multiple JSON objects (returns first valid one)
 */
export function extractFirstJson(text: string): string | null {
  if (!text) return null;
  
  // Strategy 1: Look for JSON in markdown code blocks (```json or ```)
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    const extracted = codeBlockMatch[1].trim();
    const parsed = safeParseJson(extracted);
    if (parsed) {
      if (process.env.LEGILIMENS_DEBUG) {
        console.debug('[json] Extracted JSON from code block');
      }
      return extracted;
    }
  }
  
  // Strategy 2: Look for object boundaries in text
  const start = text.indexOf('{');
  if (start === -1) return null;

  // Balanced braces scan to find complete JSON object
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) {
        const candidate = text.slice(start, i + 1);
        const parsed = safeParseJson(candidate);
        if (parsed) {
          if (process.env.LEGILIMENS_DEBUG) {
            console.debug('[json] Extracted JSON from object boundaries');
          }
          return candidate;
        }
      }
    }
  }
  
  // Strategy 3: Try entire text as JSON (for pure JSON responses)
  const trimmed = text.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    const parsed = safeParseJson(trimmed);
    if (parsed) {
      if (process.env.LEGILIMENS_DEBUG) {
        console.debug('[json] Extracted JSON from entire text');
      }
      return trimmed;
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
  const okDepType = !obj.dependencyType || ['framework', 'api', 'library', 'tool', 'other'].includes(obj.dependencyType);
  return okSource && okConf && okDepType && 'canonicalIdentifier' in obj && 'repositoryUrl' in obj;
}

export function validateToolCallJson(obj: any): obj is ToolCallJson {
  if (!obj || typeof obj !== 'object') return false;
  if (!obj.tool || !['firecrawl', 'context7', 'ref'].includes(obj.tool)) return false;
  if (!obj.args || typeof obj.args !== 'object') return false;
  return true;
}


