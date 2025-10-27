/**
 * Zod Schemas for AI Response Validation
 * 
 * Provides type-safe schemas for validating AI-generated JSON responses
 * from local LLM and external AI services.
 */

import { z } from 'zod';

/**
 * Schema for repository discovery results
 */
export const discoverySchema = z.object({
  canonicalIdentifier: z.string().nullable(),
  repositoryUrl: z.string().url().nullable().or(z.literal(null)),
  sourceType: z.enum(['github', 'npm', 'url', 'unknown']),
  confidence: z.enum(['high', 'medium', 'low']),
  dependencyType: z.enum(['framework', 'api', 'library', 'tool', 'other']).optional(),
  searchSummary: z.string().optional()
});

export type DiscoveryResult = z.infer<typeof discoverySchema>;

/**
 * Schema for tool call JSON
 */
export const toolCallSchema = z.object({
  tool: z.enum(['firecrawl', 'context7', 'ref']),
  args: z.record(z.string(), z.unknown())
});

export type ToolCall = z.infer<typeof toolCallSchema>;

/**
 * Helper to validate and parse JSON against a schema
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { success: false, error: `Schema validation failed: ${issues}` };
    }
    return { success: false, error: String(error) };
  }
}

/**
 * Helper to get human-readable schema description for prompts
 */
export function getSchemaPromptHint(schema: z.ZodSchema): string {
  if (schema === discoverySchema) {
    return `{
  "canonicalIdentifier": string|null,  // e.g., "owner/repo" or "package-name"
  "repositoryUrl": string|null,        // full URL to repository
  "sourceType": "github|npm|url|unknown",
  "confidence": "high|medium|low",
  "dependencyType": "framework|api|library|tool|other",
  "searchSummary": string              // brief summary
}`;
  }
  
  if (schema === toolCallSchema) {
    return `{
  "tool": "firecrawl|context7|ref",
  "args": { "url": string, "owner"?: string, "repo"?: string }
}`;
  }
  
  return 'Valid JSON object matching schema';
}
