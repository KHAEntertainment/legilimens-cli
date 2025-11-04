import type { z } from 'zod';
import { getRuntimeConfig } from '../config/runtimeConfig.js';
import { extractFirstJson, safeParseJson } from './json.js';
import { validateWithSchema, getSchemaPromptHint } from './schemas.js';

export interface LlmRunOptions<T = unknown> {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  schema?: z.ZodSchema<T>;  // Optional Zod schema for validation
}

export interface LlmRunResult<T = unknown> {
  success: boolean;
  raw: string;
  json?: T;
  error?: string;
  attempts: number;
  durationMs: number;
}

export async function runLocalJson<T = unknown>({ prompt, maxTokens, temperature, timeoutMs, schema }: LlmRunOptions<T>): Promise<LlmRunResult<T>> {
  const start = Date.now();
  const rc = getRuntimeConfig();
  if (!rc.localLlm || rc.localLlm.enabled !== true) {
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug('[localLlm] Local LLM disabled');
    }
    return { success: false, raw: '', error: 'Local LLM disabled', attempts: 0, durationMs: 0 };
  }
  const modelName = rc.localLlm?.modelName as string | undefined;
  const apiEndpoint = rc.localLlm?.apiEndpoint as string | undefined;
  if (process.env.LEGILIMENS_DEBUG) {
    console.debug(`[localLlm] Configuration: enabled=${rc.localLlm?.enabled}, modelName=${modelName}, apiEndpoint=${apiEndpoint}`);
  }
  
  // Better error messages for missing configuration
  if (!modelName) {
    const error = 'DMR model not configured. Run setup wizard to install granite-4.0-micro:latest: pnpm --filter @legilimens/cli start';
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug(`[localLlm] ${error}`);
    }
    return { success: false, raw: '', error, attempts: 0, durationMs: 0 };
  }
  
  if (!apiEndpoint) {
    const error = 'DMR API endpoint not configured. Default: http://localhost:12434. Run setup wizard: pnpm --filter @legilimens/cli start';
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug(`[localLlm] ${error}`);
    }
    return { success: false, raw: '', error, attempts: 0, durationMs: 0 };
  }

  // DMR endpoint
  const DMR_ENDPOINT = `${apiEndpoint}/engines/llama.cpp/v1/chat/completions`;
  
  // Enforce JSON-only output with optional schema hint
  let wrapped = `You MUST respond with ONLY a valid JSON object. No explanations, no prose, no markdown - just pure JSON.\n\n`;
  
  if (schema) {
    wrapped += `The JSON must match this schema:\n${getSchemaPromptHint(schema)}\n\n`;
  }
  
  wrapped += prompt;

  // DMR HTTP client implementation
  const attempt = async (systemMessage?: string): Promise<LlmRunResult<T>> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs ?? (rc.localLlm?.timeoutMs ?? 30000));
    
    try {
      // Build OpenAI-compatible messages
      const messages = [
        { 
          role: 'system', 
          content: systemMessage ?? 'You MUST respond with ONLY valid JSON. No prose, no markdown.' 
        },
        { 
          role: 'user', 
          content: wrapped 
        }
      ];
      
      // Build request body
      const requestBody = {
        model: modelName,
        messages,
        max_tokens: maxTokens ?? (rc.localLlm?.outputTokens ?? 512),
        temperature: temperature ?? (rc.localLlm?.temp ?? 0.2)
      };
      
      if (process.env.LEGILIMENS_DEBUG) {
        console.debug('[localLlm] DMR request:', JSON.stringify(requestBody, null, 2));
      }
      
      // Make HTTP request to DMR
      const response = await fetch(DMR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      if (process.env.LEGILIMENS_DEBUG) {
        console.debug('[localLlm] DMR response status:', response.status);
      }
      
      // Handle HTTP errors
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        const errorMsg = `DMR API error: HTTP ${response.status} - ${response.statusText}. ${errorText}`;
        if (process.env.LEGILIMENS_DEBUG) {
          console.debug(`[localLlm] ${errorMsg}`);
        }
        return {
          success: false,
          raw: errorText,
          error: errorMsg,
          attempts: 1,
          durationMs: Date.now() - start
        };
      }
      
      // Parse response
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content ?? '';
      
      if (process.env.LEGILIMENS_DEBUG) {
        console.debug('[localLlm] DMR content:', content.slice(0, 200));
      }
      
      // Extract and parse JSON
      const jsonText = extractFirstJson(content) ?? '';
      const parsed = jsonText ? safeParseJson<T>(jsonText) : null;
      
      if (parsed) {
        // If schema provided, validate against it
        if (schema) {
          const validation = validateWithSchema(schema, parsed);
          if (validation.success) {
            if (process.env.LEGILIMENS_DEBUG) {
              console.debug(`[localLlm] Successfully extracted, parsed, and validated JSON against schema`);
            }
            return { 
              success: true, 
              raw: content, 
              json: validation.data, 
              attempts: 1, 
              durationMs: Date.now() - start 
            };
          } else {
            if (process.env.LEGILIMENS_DEBUG) {
              console.debug(`[localLlm] JSON parsed but schema validation failed: ${validation.error}`);
            }
            return { 
              success: false, 
              raw: content, 
              error: `Schema validation failed: ${validation.error}`, 
              attempts: 1, 
              durationMs: Date.now() - start 
            };
          }
        } else {
          // No schema, just use parsed JSON
          if (process.env.LEGILIMENS_DEBUG) {
            console.debug(`[localLlm] Successfully extracted and parsed JSON`);
          }
          return { 
            success: true, 
            raw: content, 
            json: parsed, 
            attempts: 1, 
            durationMs: Date.now() - start 
          };
        }
      } else {
        const preview = content.slice(0, 500);
        if (process.env.LEGILIMENS_DEBUG) {
          console.debug(`[localLlm] Invalid JSON response. Preview (first 500 chars): ${preview}`);
        } else {
          console.warn(`[localLlm] Invalid JSON response. Set LEGILIMENS_DEBUG=true for details.`);
        }
        return { 
          success: false, 
          raw: content, 
          error: 'Invalid JSON response from local LLM', 
          attempts: 1, 
          durationMs: Date.now() - start 
        };
      }
    } catch (error) {
      const duration = Date.now() - start;
      
      // Handle specific error types
      if (error instanceof Error) {
        // Abort/Timeout error
        if (error.name === 'AbortError') {
          const errorMsg = `AI generation timed out after ${duration}ms. Ensure Docker Model Runner is running.`;
          if (process.env.LEGILIMENS_DEBUG) {
            console.debug(`[localLlm] ${errorMsg}`);
          }
          return { 
            success: false, 
            raw: '', 
            error: errorMsg, 
            attempts: 1, 
            durationMs: duration 
          };
        }
        
        // Connection refused
        if (error.message.includes('ECONNREFUSED')) {
          const errorMsg = 'Cannot connect to Docker Model Runner. Ensure Docker Desktop is running and DMR is enabled.';
          if (process.env.LEGILIMENS_DEBUG) {
            console.debug(`[localLlm] ${errorMsg}`);
          }
          return { 
            success: false, 
            raw: '', 
            error: errorMsg, 
            attempts: 1, 
            durationMs: duration 
          };
        }
        
        // Network error
        const errorMsg = `Network error connecting to DMR: ${error.message}`;
        if (process.env.LEGILIMENS_DEBUG) {
          console.debug(`[localLlm] ${errorMsg}`);
        }
        return { 
          success: false, 
          raw: '', 
          error: errorMsg, 
          attempts: 1, 
          durationMs: duration 
        };
      }
      
      // Unknown error
      const errorMsg = `DMR API error: ${String(error)}`;
      if (process.env.LEGILIMENS_DEBUG) {
        console.debug(`[localLlm] ${errorMsg}`);
      }
      return { 
        success: false, 
        raw: '', 
        error: errorMsg, 
        attempts: 1, 
        durationMs: duration 
      };
    } finally {
      clearTimeout(timeout);
    }
  };

  // First attempt
  const first = await attempt();
  if (first.success) return first;
  
  if (first.error && first.error.includes('Invalid JSON')) {
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug('[localLlm] Retrying due to invalid JSON response');
    }
    // Second attempt
    const second = await attempt();
    if (second.success) {
      if (process.env.LEGILIMENS_DEBUG) {
        console.debug('[localLlm] Retry successful');
      }
      return { ...second, attempts: first.attempts + second.attempts };
    }
    
    // Check if response contains prose like "I am ready" or "Here is"
    const rawLower = (second.raw || first.raw).toLowerCase();
    const containsProse = /(?:i am|here is|let me|i'll|i will|sure|certainly)/i.test(rawLower);
    
    if (containsProse) {
      if (process.env.LEGILIMENS_DEBUG) {
        console.debug('[localLlm] Detected prose in response, attempting third attempt with stricter prompt');
      }
      
      // Third attempt with stricter system message
      const stricterSystemMessage = `CRITICAL: You are a JSON API. You MUST respond with ONLY valid JSON. NO prose, NO explanations, NO "I am ready", NO "Here is", NO text before or after JSON.

If you output ANYTHING other than pure JSON, the system will fail.

REMINDER: Output ONLY the JSON object. Start with { and end with }. Nothing else.`;
      
      const third = await attempt(stricterSystemMessage);
      
      if (third.success) {
        if (process.env.LEGILIMENS_DEBUG) {
          console.debug('[localLlm] Third attempt successful');
        }
        return { ...third, attempts: first.attempts + second.attempts + third.attempts };
      }
      
      if (process.env.LEGILIMENS_DEBUG) {
        console.debug('[localLlm] All attempts failed, falling back to external CLI tools');
      }
      return { ...third, attempts: first.attempts + second.attempts + third.attempts };
    }
    
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug('[localLlm] All attempts failed, falling back to external CLI tools');
    }
    return { ...second, attempts: first.attempts + second.attempts };
  }
  
  return first;
}
