import { spawn } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { detectInstalledCliTools, type CliToolName, type CliToolInfo } from './cliDetector.js';

/**
 * Options for CLI tool execution
 */
export interface CliExecutionOptions {
  timeoutMs?: number;
  workingDir?: string;
  env?: Record<string, string>;
  onProgress?: (event: CliProgressEvent) => void;
}

/**
 * Progress event for CLI tool attempts
 */
export interface CliProgressEvent {
  step: 'ai-cli-attempt';
  message: string;
  percentComplete: number;
  toolName?: string;
  attemptNumber?: number;
  totalAttempts?: number;
}

/**
 * Configuration for CLI orchestrator
 */
export interface CliOrchestratorConfig {
  preferredTool?: CliToolName;
  fallbackOrder?: CliToolName[];
  timeoutMs?: number;
  maxRetries?: number;
  commandOverride?: string;
  argOverrides?: Partial<Record<CliToolName, string[]>>;
}

/**
 * Result of CLI tool generation
 */
export interface CliGenerationResult {
  success: boolean;
  content?: string;
  toolUsed?: CliToolName;
  error?: string;
  attempts: string[];
  durationMs: number;
}

/**
 * Tool execution strategy
 */
interface ToolStrategy {
  desc: string;
  args: (tempFile: string) => string[];
  stdinArgs?: string[];
}

/**
 * CLI tool adapter function type
 */
type CliAdapter = (prompt: string, options: CliExecutionOptions & { tool?: CliToolInfo; config?: CliOrchestratorConfig }) => Promise<string>;

/**
 * Strategy definitions for each tool
 *
 * NOTE: Command syntax verified from official documentation:
 * - gemini: Uses -p or --prompt flag for input (command: 'gemini')
 * - codex: Responses API (modern) uses 'api responses.create -m <model> -i <input>' (command: 'codex')
 *   Legacy Completions API uses '-p <file>'
 * - claude: Uses -p or --print flag for headless/print mode (command: 'claude')
 * - qwen: Uses -p or --prompt flag for input (command: 'qwen')
 */
const STRATEGIES: Record<CliToolName, ToolStrategy[]> = {
  'gemini': [
    { desc: 'file-arg-short', args: (f) => ['-p', f] },
    { desc: 'file-arg-long', args: (f) => ['--prompt', f] },
    { desc: 'stdin', args: () => [], stdinArgs: ['-p', '-'] },
  ],
  // Codex CLI has multiple endpoints with different syntax
  // Responses API (recommended) is tried first, with legacy Completions as fallback
  'codex': [
    { desc: 'responses-api-stdin', args: () => [], stdinArgs: ['api', 'responses.create', '-m', 'gpt-4o-mini', '-i', '-'] },
    { desc: 'responses-api-file', args: (f) => ['api', 'responses.create', '-m', 'gpt-4o-mini', '-i', f] },
    { desc: 'legacy-completions', args: (f) => ['-p', f] },
  ],
  // Claude uses -p or --print for headless mode (not --headless --prompt)
  'claude': [
    { desc: 'file-arg-short', args: (f) => ['-p', f] },
    { desc: 'file-arg-long', args: (f) => ['--print', f] },
    { desc: 'stdin', args: () => [], stdinArgs: ['-p', '-'] },
  ],
  'qwen': [
    { desc: 'file-arg', args: (f) => ['-p', f] },
    { desc: 'stdin', args: () => [], stdinArgs: ['-p', '-'] },
  ],
};

/**
 * Registry of CLI tool adapters
 */
const CLI_ADAPTERS: Record<CliToolName, CliAdapter> = {
  'gemini': executeGeminiCli,
  'codex': executeOpenAiCli,
  'claude': executeClaudeCli,
  'qwen': executeQwenCli,
};

/**
 * Execute CLI tool with strategy iteration
 */
async function executeWithStrategies(
  toolName: CliToolName,
  prompt: string,
  options: CliExecutionOptions & { tool?: CliToolInfo; config?: CliOrchestratorConfig }
): Promise<string> {
  const command = options.tool?.path ?? options.tool?.command ?? toolName;

  // Check for arg overrides
  if (options.config?.argOverrides?.[toolName]) {
    const overrideArgs = options.config.argOverrides[toolName];
    // Try with override args
    return await executeWithTempFile(command, (tempFile) => [...overrideArgs, tempFile], prompt, options);
  }

  // Use default strategies for the tool
  const strategies = STRATEGIES[toolName];
  let lastError: Error | undefined;

  for (let i = 0; i < strategies.length; i++) {
    const strategy = strategies[i];
    const attemptNumber = i + 1;
    
    try {
      // Emit progress event for attempt
      options.onProgress?.({
        step: 'ai-cli-attempt',
        message: `Trying ${toolName} (${strategy.desc}, attempt ${attemptNumber}/${strategies.length})...`,
        percentComplete: (attemptNumber / strategies.length) * 50,
        toolName,
        attemptNumber,
        totalAttempts: strategies.length
      });

      if (strategy.stdinArgs) {
        // Stdin strategy
        return await executeWithStdin(command, strategy.stdinArgs, prompt, options);
      } else {
        // File-arg strategy
        return await executeWithTempFile(command, strategy.args, prompt, options);
      }
    } catch (error) {
      lastError = error as Error;

      // Emit progress event for failure
      options.onProgress?.({
        step: 'ai-cli-attempt',
        message: `${toolName} strategy ${strategy.desc} failed: ${lastError.message}`,
        percentComplete: (attemptNumber / strategies.length) * 50,
        toolName,
        attemptNumber,
        totalAttempts: strategies.length
      });

      // Check if error is due to unsupported flags
      const errorMessage = lastError.message.toLowerCase();
      if (errorMessage.includes('unknown option') ||
          errorMessage.includes('unrecognized') ||
          errorMessage.includes('invalid flag') ||
          errorMessage.includes('config profile') ||
          errorMessage.includes('not found')) {
        // Try next strategy
        console.debug(`Strategy ${strategy.desc} failed with flag/config error, trying next strategy`);
        continue;
      }

      // For other errors, throw immediately
      throw lastError;
    }
  }

  // All strategies failed
  throw lastError ?? new Error('All strategies failed');
}

/**
 * Execute Gemini CLI tool
 */
async function executeGeminiCli(prompt: string, options: CliExecutionOptions & { tool?: CliToolInfo; config?: CliOrchestratorConfig }): Promise<string> {
  return executeWithStrategies('gemini', prompt, options);
}

/**
 * Execute OpenAI CLI tool
 */
async function executeOpenAiCli(prompt: string, options: CliExecutionOptions & { tool?: CliToolInfo; config?: CliOrchestratorConfig }): Promise<string> {
  return executeWithStrategies('codex', prompt, options);
}

/**
 * Execute Claude Code CLI tool
 */
async function executeClaudeCli(prompt: string, options: CliExecutionOptions & { tool?: CliToolInfo; config?: CliOrchestratorConfig }): Promise<string> {
  return executeWithStrategies('claude', prompt, options);
}

/**
 * Execute Qwen Code CLI tool
 */
async function executeQwenCli(prompt: string, options: CliExecutionOptions & { tool?: CliToolInfo; config?: CliOrchestratorConfig }): Promise<string> {
  return executeWithStrategies('qwen', prompt, options);
}

/**
 * Execute CLI tool with stdin for prompt
 */
async function executeWithStdin(
  command: string,
  args: string[],
  prompt: string,
  options: CliExecutionOptions
): Promise<string> {
  const timeoutMs = options.timeoutMs || 30000;

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.workingDir || process.cwd(),
      env: { ...process.env, ...options.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      
      // Wait 2 seconds for graceful termination, then force kill
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 2000);
      
      reject(new Error(`CLI tool timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    child.on('close', (code) => {
      clearTimeout(timeout);

      if (timedOut) {
        return; // Already rejected
      }

      if (code !== 0) {
        reject(new Error(`CLI tool exited with code ${code}: ${stderr}`));
        return;
      }

      const cleanOutput = cleanCliOutput(stdout);
      if (!cleanOutput) {
        reject(new Error('CLI tool returned empty output'));
        return;
      }

      resolve(cleanOutput);
    });

    // Write prompt to stdin
    child.stdin?.write(prompt);
    child.stdin?.end();
  });
}

/**
 * Execute CLI tool with timeout (no stdin write)
 */
async function spawnWithTimeout(
  command: string,
  args: string[],
  options: CliExecutionOptions
): Promise<string> {
  const timeoutMs = options.timeoutMs || 30000;

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.workingDir || process.cwd(),
      env: { ...process.env, ...options.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      
      // Wait 2 seconds for graceful termination, then force kill
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 2000);
      
      reject(new Error(`CLI tool timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    child.on('close', (code) => {
      clearTimeout(timeout);

      if (timedOut) {
        return; // Already rejected
      }

      if (code !== 0) {
        reject(new Error(`CLI tool exited with code ${code}: ${stderr}`));
        return;
      }

      const cleanOutput = cleanCliOutput(stdout);
      if (!cleanOutput) {
        reject(new Error('CLI tool returned empty output'));
        return;
      }

      resolve(cleanOutput);
    });
  });
}

/**
 * Execute CLI tool with temp file for prompt
 */
async function executeWithTempFile(
  command: string,
  argsBuilder: (filePath: string) => string[],
  prompt: string,
  options: CliExecutionOptions
): Promise<string> {
  const tempFile = join(tmpdir(), `legilimens-prompt-${Date.now()}.txt`);

  try {
    writeFileSync(tempFile, prompt, 'utf-8');

    const args = argsBuilder(tempFile);
    const result = await spawnWithTimeout(command, args, options);

    return result;
  } finally {
    try {
      unlinkSync(tempFile);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Clean CLI output (remove ANSI codes, trim whitespace)
 */
function cleanCliOutput(output: string): string {
  // Remove ANSI escape codes
  // eslint-disable-next-line no-control-regex
  const cleaned = output.replace(/\u001b\[[0-9;]*m/g, '');

  // Trim whitespace
  return cleaned.trim();
}

/**
 * Generate content using available CLI tools with fallback chain
 */
export async function generateWithCliTool(
  prompt: string,
  config: CliOrchestratorConfig,
  options?: { onProgress?: (event: CliProgressEvent) => void }
): Promise<CliGenerationResult> {
  const startTime = Date.now();
  const attempts: string[] = [];

  // Detect available tools, passing override if configured
  const override = config.preferredTool && config.commandOverride
    ? { preferred: config.preferredTool, path: config.commandOverride }
    : undefined;
  const { availableTools } = detectInstalledCliTools(override);

  if (availableTools.length === 0 && !override) {
    return {
      success: false,
      error: 'No AI CLI tools detected on system',
      attempts,
      durationMs: Date.now() - startTime,
    };
  }

  // Build tool order: preferred -> fallback order -> all available
  const toolOrder = buildToolOrder(config, availableTools);

  // Try each tool in order
  for (let toolIndex = 0; toolIndex < toolOrder.length; toolIndex++) {
    const tool = toolOrder[toolIndex];
    const maxRetries = config.maxRetries || 1;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      attempts.push(`${tool.name}${attempt > 1 ? ` (attempt ${attempt})` : ''}`);

      try {
        const adapter = CLI_ADAPTERS[tool.name];
        if (!adapter) {
          continue;
        }

        // Apply command override if present
        let toolToUse = tool;
        if (config.commandOverride && tool.name === config.preferredTool) {
          toolToUse = {
            ...tool,
            path: config.commandOverride,
            command: config.commandOverride
          };
        }

        const content = await adapter(prompt, {
          timeoutMs: config.timeoutMs || 30000,
          workingDir: process.cwd(),
          tool: toolToUse,
          config,
          onProgress: options?.onProgress
        });

        // Emit success event
        options?.onProgress?.({
          step: 'ai-cli-attempt',
          message: `Successfully generated content using ${tool.name}`,
          percentComplete: 100,
          toolName: tool.name,
          attemptNumber: attempt,
          totalAttempts: maxRetries
        });

        return {
          success: true,
          content,
          toolUsed: tool.name,
          attempts,
          durationMs: Date.now() - startTime,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.debug(`CLI tool ${tool.name} failed (attempt ${attempt}/${maxRetries}): ${errorMessage}`);
        
        // Emit failure event
        options?.onProgress?.({
          step: 'ai-cli-attempt',
          message: `${tool.name} failed (attempt ${attempt}/${maxRetries}): ${errorMessage}`,
          percentComplete: ((toolIndex + 1) / toolOrder.length) * 100,
          toolName: tool.name,
          attemptNumber: attempt,
          totalAttempts: maxRetries
        });
        
        // Don't retry on timeout or command not found errors
        if (errorMessage.includes('timed out') || errorMessage.includes('ENOENT') || errorMessage.includes('command not found')) {
          break;
        }
        
        // If this was the last attempt for this tool, continue to next tool
        if (attempt === maxRetries) {
          break;
        }
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // All tools failed
  return {
    success: false,
    error: `All CLI tools failed. Attempted: ${attempts.join(', ')}`,
    attempts,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Build tool order based on configuration and available tools
 */
function buildToolOrder(
  config: CliOrchestratorConfig,
  availableTools: CliToolInfo[]
): CliToolInfo[] {
  const order: CliToolInfo[] = [];
  const usedTools = new Set<CliToolName>();

  // Add preferred tool with command override first (even if not detected)
  if (config.preferredTool && config.commandOverride) {
    // Create synthetic tool entry for the override
    const overrideTool: CliToolInfo = {
      name: config.preferredTool,
      command: config.commandOverride,
      path: config.commandOverride,
      available: true,
    };
    order.push(overrideTool);
    usedTools.add(config.preferredTool);
  } else if (config.preferredTool) {
    // Add preferred tool from detected tools
    const preferredTool = availableTools.find((t) => t.name === config.preferredTool);
    if (preferredTool) {
      order.push(preferredTool);
      usedTools.add(preferredTool.name);
    }
  }

  // Add fallback tools in order
  if (config.fallbackOrder) {
    for (const toolName of config.fallbackOrder) {
      if (usedTools.has(toolName)) {
        continue;
      }

      const tool = availableTools.find((t) => t.name === toolName);
      if (tool) {
        order.push(tool);
        usedTools.add(toolName);
      }
    }
  }

  // Add remaining available tools
  for (const tool of availableTools) {
    if (!usedTools.has(tool.name)) {
      order.push(tool);
    }
  }

  return order;
}
