import { spawn } from 'child_process';
import { tmpdir } from 'os';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { getRuntimeConfig } from '../config/runtimeConfig.js';
import { extractFirstJson, safeParseJson } from './json.js';

export interface LlmRunOptions {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

export interface LlmRunResult<T = unknown> {
  success: boolean;
  raw: string;
  json?: T;
  error?: string;
  attempts: number;
  durationMs: number;
}

export async function runLocalJson<T = unknown>({ prompt, maxTokens, temperature, timeoutMs }: LlmRunOptions): Promise<LlmRunResult<T>> {
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

  const file = join(tmpdir(), `llama-prompt-${Date.now()}.txt`);
  // Enforce JSON-only output via stronger wrapper
  const wrapped = `You MUST respond with ONLY a valid JSON object. No explanations, no prose, no markdown - just pure JSON.\n\n${prompt}`;

  const args: string[] = [
    '-m', model,
    '-f', file,
    '-n', String(maxTokens ?? (rc.localLlm?.tokens ?? 512)),
    '--temp', String(temperature ?? (rc.localLlm?.temp ?? 0.2)),
  ];
  if (rc.localLlm?.threads) args.push('-t', String(rc.localLlm.threads));

  const attempt = async (): Promise<LlmRunResult<T>> => new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let settled = false;
    let didCleanup = false;

    const writePromptFile = () => {
      writeFileSync(file, wrapped, 'utf8');
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
      clearTimeout(to);
      cleanup();
      resolve(result);
    };

    writePromptFile();
    const child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const to = setTimeout(() => {
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
        if (process.env.LEGILIMENS_DEBUG) {
          console.debug(`[localLlm] Successfully extracted and parsed JSON`);
        }
        settle({ success: true, raw: stdout, json: parsed, attempts: 1, durationMs: Date.now() - start });
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

  // Single retry on invalid JSON
  const first = await attempt();
  if (first.success) return first;
  
  if (first.error && first.error.includes('Invalid JSON')) {
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug('[localLlm] Retrying due to invalid JSON response');
    }
    // Retry once
    const second = await attempt();
    if (second.success) {
      if (process.env.LEGILIMENS_DEBUG) {
        console.debug('[localLlm] Retry successful');
      }
      return second;
    }
    
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug('[localLlm] Retry also failed, falling back to external CLI tools');
    }
    return { ...second, attempts: first.attempts + second.attempts };
  }
  
  return first;
}
