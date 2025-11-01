import { spawn } from 'child_process';
import { homedir } from 'os';
import { writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
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
  const bin = rc.localLlm?.binaryPath as string | undefined;
  const model = rc.localLlm?.modelPath as string | undefined;
  if (process.env.LEGILIMENS_DEBUG) {
    console.debug(`[localLlm] Configuration: enabled=${rc.localLlm?.enabled}, bin=${bin}, model=${model}`);
  }
  
  // Better error messages for missing configuration
  if (!bin) {
    const error = 'Local LLM binary not found. Run setup wizard to configure: pnpm --filter @legilimens/cli start';
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug(`[localLlm] ${error}`);
    }
    return { success: false, raw: '', error, attempts: 0, durationMs: 0 };
  }
  
  if (!model) {
    const error = 'phi-4 model file not found (~8.5GB). Run setup wizard to download: pnpm --filter @legilimens/cli start';
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug(`[localLlm] ${error}`);
    }
    return { success: false, raw: '', error, attempts: 0, durationMs: 0 };
  }

  // Use ~/.legilimens/temp/ instead of system tmpdir to avoid permission issues
  const tempDir = join(homedir(), '.legilimens', 'temp');
  const unique = `${Date.now()}-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
  const file = join(tempDir, `llama-prompt-${unique}.txt`);
  
  // Enforce JSON-only output with optional schema hint
  let wrapped = `You MUST respond with ONLY a valid JSON object. No explanations, no prose, no markdown - just pure JSON.\n\n`;
  
  if (schema) {
    wrapped += `The JSON must match this schema:\n${getSchemaPromptHint(schema)}\n\n`;
  }
  
  wrapped += prompt;

  const args: string[] = [
    '-m', model,
    '-f', file,
    '-n', String(maxTokens ?? (rc.localLlm?.tokens ?? 512)),
    '--temp', String(temperature ?? (rc.localLlm?.temp ?? 0.2)),
    '--log-disable',  // Suppress llama.cpp build info and logs
  ];
  if (rc.localLlm?.threads) args.push('-t', String(rc.localLlm.threads));

  const attempt = async (): Promise<LlmRunResult<T>> => new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let settled = false;
    let didCleanup = false;
    let to: NodeJS.Timeout | undefined;

    const writePromptFile = (): boolean => {
      try {
        // Ensure temp directory exists before writing
        mkdirSync(tempDir, { recursive: true });
        writeFileSync(file, wrapped, 'utf8');
        return true;
      } catch (error) {
        settle({ success: false, raw: '', error: 'Failed to write temporary LLM prompt file: ' + (error instanceof Error ? error.message : String(error)), attempts: 1, durationMs: Date.now() - start });
        return false;
      }
    };

    const cleanup = () => {
      if (didCleanup) return;
      didCleanup = true;
      try {
        unlinkSync(file);
      } catch (error) {
        console.debug('Failed to remove temporary LLM prompt file:', error);
      }
    };

    const settle = (result: LlmRunResult<T>) => {
      if (settled) return;
      settled = true;
      if (to) clearTimeout(to);
      cleanup();
      resolve(result);
    };

    const writeSuccess = writePromptFile();
    if (!writeSuccess || settled) return;

    // Debug output for troubleshooting
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug(`[localLlm] Prompt file: ${file}`);
      console.debug(`[localLlm] Command: ${bin} ${args.join(' ')}`);
      console.debug(`[localLlm] Prompt content:\n${wrapped}`);
    }

    const child = spawn(bin, args, { 
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        LLAMA_LOG_LEVEL: '40',
        LLAMA_LOG_COLORS: '0'
      }
    });
    to = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs ?? (rc.localLlm?.timeoutMs ?? 30000));

    child.stdout.on('data', (d) => { stdout += String(d); });
    child.stderr.on('data', (d) => { stderr += String(d); });

    child.on('error', (error) => {
      const message = error instanceof Error ? error.message : String(error);
      let errorMsg = `Local LLM process error: ${message}`;
      
      // Provide actionable suggestions based on error type
      if (message.includes('ENOENT')) {
        errorMsg += '. Local LLM binary not found. Run setup wizard to reconfigure.';
      }
      
      if (process.env.LEGILIMENS_DEBUG) {
        console.debug(`[localLlm] Process error: ${message}`);
      }
      
      settle({
        success: false,
        raw: stdout || stderr,
        error: errorMsg,
        attempts: 1,
        durationMs: Date.now() - start
      });
    });

    child.on('close', () => {
      if (settled) {
        cleanup();
        return;
      }

      if (timedOut) {
        const duration = Date.now() - start;
        const errorMsg = `AI generation timed out after ${duration}ms. Try using minimal mode: export LEGILIMENS_DISABLE_TUI=true`;
        if (process.env.LEGILIMENS_DEBUG) {
          console.debug(`[localLlm] Timeout after ${duration}ms`);
        }
        settle({ success: false, raw: stdout, error: errorMsg, attempts: 1, durationMs: duration });
        return;
      }

      const jsonText = extractFirstJson(stdout) ?? extractFirstJson(stderr) ?? '';
      const parsed = jsonText ? safeParseJson<T>(jsonText) : null;
      
      if (parsed) {
        // If schema provided, validate against it
        if (schema) {
          const validation = validateWithSchema(schema, parsed);
          if (validation.success) {
            if (process.env.LEGILIMENS_DEBUG) {
              console.debug(`[localLlm] Successfully extracted, parsed, and validated JSON against schema`);
            }
            settle({ success: true, raw: stdout, json: validation.data, attempts: 1, durationMs: Date.now() - start });
          } else {
            if (process.env.LEGILIMENS_DEBUG) {
              console.debug(`[localLlm] JSON parsed but schema validation failed: ${validation.error}`);
            }
            settle({ success: false, raw: stdout, error: `Schema validation failed: ${validation.error}`, attempts: 1, durationMs: Date.now() - start });
          }
        } else {
          // No schema, just use parsed JSON
          if (process.env.LEGILIMENS_DEBUG) {
            console.debug(`[localLlm] Successfully extracted and parsed JSON`);
          }
          settle({ success: true, raw: stdout, json: parsed, attempts: 1, durationMs: Date.now() - start });
        }
      } else {
        const preview = (stdout || stderr).slice(0, 500);
        if (process.env.LEGILIMENS_DEBUG) {
          console.debug(`[localLlm] Invalid JSON response. Preview (first 500 chars): ${preview}`);
        } else {
          console.warn(`[localLlm] Invalid JSON response. Set LEGILIMENS_DEBUG=true for details.`);
        }
        settle({ success: false, raw: stdout || stderr, error: 'Invalid JSON response from local LLM', attempts: 1, durationMs: Date.now() - start });
      }
    });
  });

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
      return second;
    }
    
    // Check if response contains prose like "I am ready" or "Here is"
    const rawLower = (second.raw || first.raw).toLowerCase();
    const containsProse = /(?:i am|here is|let me|i'll|i will|sure|certainly)/i.test(rawLower);
    
    if (containsProse) {
      if (process.env.LEGILIMENS_DEBUG) {
        console.debug('[localLlm] Detected prose in response, attempting third attempt with stricter prompt');
      }
      
      // Third attempt with stricter system-level ban on prose
      const stricterWrapped = `CRITICAL: You are a JSON API. You MUST respond with ONLY valid JSON. NO prose, NO explanations, NO "I am ready", NO "Here is", NO text before or after JSON.

If you output ANYTHING other than pure JSON, the system will fail.

REQUIRED OUTPUT FORMAT (JSON only, nothing else):
${schema ? `\nThe JSON must match this schema:\n${getSchemaPromptHint(schema)}\n` : ''}

${prompt}

REMINDER: Output ONLY the JSON object. Start with { and end with }. Nothing else.`;

      // Write the stricter prompt
      try {
        mkdirSync(tempDir, { recursive: true });
        const strictFile = join(tempDir, `llama-prompt-strict-${unique}.txt`);
        writeFileSync(strictFile, stricterWrapped, 'utf8');
        
        const args: string[] = [
          '-m', model,
          '-f', strictFile,
          '-n', String(maxTokens ?? (rc.localLlm?.tokens ?? 512)),
          '--temp', String(temperature ?? (rc.localLlm?.temp ?? 0.2)),
        ];
        if (rc.localLlm?.threads) args.push('-t', String(rc.localLlm.threads));
        
        const thirdAttemptResult = await new Promise<LlmRunResult<T>>((resolve) => {
          let stdout = '';
          let stderr = '';
          let timedOut = false;
          let settled = false;
          let to: NodeJS.Timeout | undefined;
          
          const settle = (result: LlmRunResult<T>) => {
            if (settled) return;
            settled = true;
            if (to) clearTimeout(to);
            try { unlinkSync(strictFile); } catch {}
            resolve(result);
          };
          
          const child = spawn(bin, args, { 
            stdio: ['ignore', 'pipe', 'pipe'],
            env: {
              ...process.env,
              LLAMA_LOG_LEVEL: '40',
              LLAMA_LOG_COLORS: '0'
            }
          });
          to = setTimeout(() => {
            timedOut = true;
            child.kill('SIGKILL');
          }, timeoutMs ?? (rc.localLlm?.timeoutMs ?? 30000));
          
          child.stdout.on('data', (d) => { stdout += String(d); });
          child.stderr.on('data', (d) => { stderr += String(d); });
          
          child.on('error', (error) => {
            settle({
              success: false,
              raw: stdout || stderr,
              error: `Local LLM process error: ${error instanceof Error ? error.message : String(error)}`,
              attempts: 1,
              durationMs: Date.now() - start
            });
          });
          
          child.on('close', () => {
            if (settled) return;
            
            if (timedOut) {
              settle({ success: false, raw: stdout, error: `Timed out after ${Date.now() - start}ms`, attempts: 1, durationMs: Date.now() - start });
              return;
            }
            
            const jsonText = extractFirstJson(stdout) ?? extractFirstJson(stderr) ?? '';
            const parsed = jsonText ? safeParseJson<T>(jsonText) : null;
            
            if (parsed) {
              if (schema) {
                const validation = validateWithSchema(schema, parsed);
                if (validation.success) {
                  settle({ success: true, raw: stdout, json: validation.data, attempts: 1, durationMs: Date.now() - start });
                } else {
                  settle({ success: false, raw: stdout, error: `Schema validation failed: ${validation.error}`, attempts: 1, durationMs: Date.now() - start });
                }
              } else {
                settle({ success: true, raw: stdout, json: parsed, attempts: 1, durationMs: Date.now() - start });
              }
            } else {
              settle({ success: false, raw: stdout || stderr, error: 'Invalid JSON response from local LLM', attempts: 1, durationMs: Date.now() - start });
            }
          });
        });
        
        if (thirdAttemptResult.success) {
          if (process.env.LEGILIMENS_DEBUG) {
            console.debug('[localLlm] Third attempt successful');
          }
          return { ...thirdAttemptResult, attempts: first.attempts + second.attempts + thirdAttemptResult.attempts };
        }
      } catch (error) {
        if (process.env.LEGILIMENS_DEBUG) {
          console.debug('[localLlm] Third attempt failed:', error);
        }
      }
    }
    
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug('[localLlm] All attempts failed, falling back to external CLI tools');
    }
    return { ...second, attempts: first.attempts + second.attempts };
  }
  
  return first;
}
