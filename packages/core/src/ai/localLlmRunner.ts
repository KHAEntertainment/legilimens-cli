import { spawn } from 'child_process';
import type { z } from 'zod';
import { getRuntimeConfig, isDmrMode, isLlamaCppMode } from '../config/runtimeConfig.js';
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

/**
 * Run local LLM using llama.cpp native binary (non-DMR mode)
 */
async function runLlamaCppBinary<T = unknown>(options: LlmRunOptions<T>): Promise<LlmRunResult<T>> {
  const start = Date.now();
  const rc = getRuntimeConfig();

  const binaryPath = rc.localLlm?.binaryPath;
  const modelPath = rc.localLlm?.modelPath;
  const timeoutMs = options.timeoutMs ?? rc.localLlm?.timeoutMs ?? 60000;
  const maxTokens = options.maxTokens ?? rc.localLlm?.outputTokens ?? 512;
  const temperature = options.temperature ?? rc.localLlm?.temp ?? 0.2;
  const threads = rc.localLlm?.threads ?? 8;

  if (!binaryPath || !modelPath) {
    return {
      success: false,
      raw: '',
      error: 'llama.cpp binary or model path not configured',
      attempts: 0,
      durationMs: 0
    };
  }

  if (process.env.LEGILIMENS_DEBUG) {
    console.debug(`[localLlm] llama.cpp mode: binary=${binaryPath}, model=${modelPath}`);
  }

  // Build the prompt - wrap with JSON requirement
  let wrappedPrompt = options.prompt;
  if (options.schema) {
    wrappedPrompt = `You MUST respond with ONLY valid JSON matching this schema:\n${getSchemaPromptHint(options.schema)}\n\n${options.prompt}`;
  } else {
    wrappedPrompt = `You MUST respond with ONLY valid JSON. No explanations, no prose, no markdown - just pure JSON.\n\n${options.prompt}`;
  }

  // Build llama.cpp arguments (prompt passed via stdin, not command line)
  const args = [
    '-m', modelPath,
    '-n', String(maxTokens),
    '--temp', String(temperature),
    '-t', String(threads),
    '--log-disable',  // Disable logging to stderr
    '-y'  // Always output JSON/YAML without prompting
  ];

  if (process.env.LEGILIMENS_DEBUG) {
    console.debug('[localLlm] llama.cpp args:', args);
    console.debug('[localLlm] Prompt delivery: stdin (not command line)');
  }

  try {
    // Use spawn to have control over stdin for passing the prompt
    const content = await new Promise<string>((resolve, reject) => {
      const child = spawn(binaryPath, args, {
        env: { ...process.env }
      });

      let stdout = '';
      let stderr = '';
      let killed = false;

      // Set timeout
      const timer = setTimeout(() => {
        killed = true;
        child.kill();
        reject(new Error('ETIMEDOUT'));
      }, timeoutMs);

      // Collect stdout
      child.stdout.on('data', (data) => {
        stdout += data.toString();
        // Check buffer size
        if (stdout.length + stderr.length > 10 * 1024 * 1024) {
          killed = true;
          child.kill();
          reject(new Error('maxBuffer exceeded'));
        }
      });

      // Collect stderr
      child.stderr.on('data', (data) => {
        stderr += data.toString();
        // Check buffer size
        if (stdout.length + stderr.length > 10 * 1024 * 1024) {
          killed = true;
          child.kill();
          reject(new Error('maxBuffer exceeded'));
        }
      });

      // Handle process exit
      child.on('close', () => {
        clearTimeout(timer);
        if (!killed) {
          resolve((stdout + stderr).trim());
        }
      });

      // Handle errors
      child.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });

      // Write prompt to stdin and close it
      child.stdin.write(wrappedPrompt);
      child.stdin.end();
    });

    if (process.env.LEGILIMENS_DEBUG) {
      console.debug('[localLlm] llama.cpp raw output:', content.slice(0, 500));
    }

    // Parse JSON from output
    const jsonText = extractFirstJson(content) ?? '';
    const parsed = jsonText ? safeParseJson<T>(jsonText) : null;

    if (parsed) {
      if (options.schema) {
        const validation = validateWithSchema(options.schema, parsed);
        if (validation.success) {
          return {
            success: true,
            raw: content,
            json: validation.data,
            attempts: 1,
            durationMs: Date.now() - start
          };
        } else {
          return {
            success: false,
            raw: content,
            error: `Schema validation failed: ${validation.error}`,
            attempts: 1,
            durationMs: Date.now() - start
          };
        }
      }

      return {
        success: true,
        raw: content,
        json: parsed,
        attempts: 1,
        durationMs: Date.now() - start
      };
    }

    // No JSON found in output
    return {
      success: false,
      raw: content,
      error: 'No valid JSON found in llama.cpp output',
      attempts: 1,
      durationMs: Date.now() - start
    };
  } catch (error) {
    const duration = Date.now() - start;

    if (error instanceof Error) {
      // Timeout error
      if (error.message.includes('ETIMEDOUT')) {
        return {
          success: false,
          raw: '',
          error: `llama.cpp execution timed out after ${duration}ms`,
          attempts: 1,
          durationMs: duration
        };
      }

      // Binary not found
      if (error.message.includes('ENOENT')) {
        return {
          success: false,
          raw: '',
          error: `llama.cpp binary not found at ${binaryPath}. Run setup wizard to configure.`,
          attempts: 1,
          durationMs: duration
        };
      }

      return {
        success: false,
        raw: '',
        error: `llama.cpp error: ${error.message}`,
        attempts: 1,
        durationMs: duration
      };
    }

    return {
      success: false,
      raw: '',
      error: `Unknown error: ${String(error)}`,
      attempts: 1,
      durationMs: duration
    };
  }
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

  // Check which mode to use
  const useLlamaCpp = isLlamaCppMode(rc);
  const useDmr = isDmrMode(rc);

  if (process.env.LEGILIMENS_DEBUG) {
    console.debug(`[localLlm] Mode detection: llama.cpp=${useLlamaCpp}, DMR=${useDmr}`);
  }

  // Route to appropriate runner
  if (useLlamaCpp) {
    return runLlamaCppBinary({ prompt, maxTokens, temperature, timeoutMs, schema });
  }

  // Fall through to DMR mode if not llama.cpp mode
  if (!useDmr) {
    // Neither mode is properly configured
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug('[localLlm] No valid local LLM configuration found');
    }
    return {
      success: false,
      raw: '',
      error: 'Local LLM not configured. Run setup wizard: pnpm --filter @legilimens/cli start',
      attempts: 0,
      durationMs: 0
    };
  }

  // DMR mode (original HTTP implementation)
  const modelName = rc.localLlm?.modelName as string | undefined;
  const apiEndpoint = rc.localLlm?.apiEndpoint as string | undefined;
  const enginePath = rc.localLlm?.enginePath as string | undefined;
  if (process.env.LEGILIMENS_DEBUG) {
    console.debug(`[localLlm] Configuration: enabled=${rc.localLlm?.enabled}, modelName=${modelName}, apiEndpoint=${apiEndpoint}, enginePath=${enginePath}`);
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

  // DMR endpoint - use configurable engine path with default fallback
  const DMR_ENDPOINT = `${apiEndpoint}/${enginePath || 'engines/llama.cpp/v1/chat/completions'}`;

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