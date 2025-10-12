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
    return { success: false, raw: '', error: 'Local LLM disabled', attempts: 0, durationMs: 0 };
  }
  const bin = rc.localLlm?.binaryPath as string | undefined;
  const model = rc.localLlm?.modelPath as string | undefined;
  if (!bin || !model) {
    return { success: false, raw: '', error: 'Missing llama.cpp binary or model path', attempts: 0, durationMs: 0 };
  }

  const file = join(tmpdir(), `llama-prompt-${Date.now()}.txt`);
  // enforce JSON-only output via wrapper
  const wrapped = `Respond ONLY with a single JSON object. No prose.\n${prompt}`;
  writeFileSync(file, wrapped, 'utf8');

  const args: string[] = [
    '-m', model,
    '-f', file,
    '-n', String(maxTokens ?? (rc.localLlm?.tokens ?? 512)),
    '--temp', String(temperature ?? (rc.localLlm?.temp ?? 0.2)),
  ];
  if (rc.localLlm?.threads) args.push('-t', String(rc.localLlm.threads));

  let stdout = '';
  let stderr = '';
  let killed = false;

  const attempt = async (): Promise<LlmRunResult<T>> => new Promise((resolve) => {
    const child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const to = setTimeout(() => {
      killed = true;
      child.kill('SIGKILL');
    }, timeoutMs ?? (rc.localLlm?.timeoutMs ?? 30000));

    child.stdout.on('data', (d) => { stdout += String(d); });
    child.stderr.on('data', (d) => { stderr += String(d); });
    child.on('close', () => {
      clearTimeout(to);
      unlinkSync(file);
      if (killed) {
        resolve({ success: false, raw: stdout, error: 'Timeout', attempts: 1, durationMs: Date.now() - start });
        return;
      }
      const jsonText = extractFirstJson(stdout) ?? extractFirstJson(stderr) ?? '';
      const parsed = jsonText ? safeParseJson<T>(jsonText) : null;
      if (parsed) {
        resolve({ success: true, raw: stdout, json: parsed, attempts: 1, durationMs: Date.now() - start });
      } else {
        resolve({ success: false, raw: stdout || stderr, error: 'Invalid JSON', attempts: 1, durationMs: Date.now() - start });
      }
    });
  });

  // single retry on invalid JSON
  const first = await attempt();
  if (first.success) return first;
  if (first.error === 'Invalid JSON') {
    // retry once
    const second = await attempt();
    if (second.success) return second;
    return { ...second, attempts: first.attempts + second.attempts };
  }
  return first;
}


