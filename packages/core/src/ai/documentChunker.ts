import { getRuntimeConfig } from '../config/runtimeConfig.js';
import { runLocalJson } from './localLlmRunner.js';

export function estimateTokens(text: string): number {
  // Rough heuristic: ~4 characters per token
  return Math.ceil((text?.length ?? 0) / 4);
}

export function chunkText(text: string, targetTokens = 2000, overlapTokens = 200): string[] {
  if (!text) return [];
  const approxCharsPerToken = 4;
  const chunkSize = targetTokens * approxCharsPerToken;
  const overlapSize = overlapTokens * approxCharsPerToken;

  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(text.length, start + chunkSize);
    chunks.push(text.slice(start, end));
    if (end >= text.length) break;
    start = end - overlapSize;
    if (start < 0) start = 0;
  }
  return chunks;
}

export async function condenseDocumentation(
  documentation: string,
  dependencyName: string,
  dependencyType: string,
  runtimeEnv = getRuntimeConfig()
): Promise<string> {
  if (!documentation) return '';

  const totalTokens = estimateTokens(documentation);
  const llmEnabled = Boolean(runtimeEnv.localLlm?.enabled);
  
  // Token budget aligned with model's context window (Granite = 128K, phi-4 = 16K)
  // Use 90% of capacity to leave headroom for prompt overhead and safety margin
  const modelMaxTokens = runtimeEnv.localLlm?.tokens ?? 8192;
  const tokenBudget = Math.floor(modelMaxTokens * 0.9);

  if (!llmEnabled || totalTokens <= tokenBudget) {
    return documentation;
  }

  // Cap chunk size based on model capacity (25% of context window)
  const targetTokensPerChunk = Math.min(2000, Math.floor(modelMaxTokens * 0.25));
  const chunks = chunkText(documentation, targetTokensPerChunk, 200);
  const summaries: string[] = [];

  for (const chunk of chunks) {
    const prompt = [
      'Summarize the following documentation chunk for later aggregation.',
      'Respond with a single JSON object: { "summary": string }',
      `Dependency: ${dependencyName} (${dependencyType})`,
      '',
      chunk,
    ].join('\n');

    const res = await runLocalJson<{ summary: string }>({ prompt, maxTokens: 512, temperature: 0.2 });
    if (res.success && res.json?.summary) {
      summaries.push(res.json.summary);
    } else {
      // Fallback: take first ~500 tokens worth of text
      const approx = chunk.slice(0, 500 * 4);
      summaries.push(approx);
    }
  }

  // Final aggregation (without another LLM pass to keep tests offline-friendly)
  const aggregated = summaries.join('\n\n');

  // Ensure aggregated stays within the token budget
  const approxChars = tokenBudget * 4;
  return aggregated.length > approxChars ? aggregated.slice(0, approxChars) : aggregated;
}