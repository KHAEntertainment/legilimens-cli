import { execSync } from 'child_process';
import { existsSync } from 'fs';

/**
 * Supported AI CLI tool names
 */
export type CliToolName = 'gemini' | 'codex' | 'claude' | 'qwen';

/**
 * Information about a detected CLI tool
 */
export interface CliToolInfo {
  name: CliToolName;
  command: string;
  path: string | null;
  available: boolean;
}

/**
 * Result of CLI tool detection
 */
export interface DetectionResult {
  tools: CliToolInfo[];
  availableTools: CliToolInfo[];
}

/**
 * CLI tool detection patterns
 * Note: First command in array is the primary command used for execution
 */
const CLI_TOOL_PATTERNS: Record<CliToolName, string[]> = {
  'gemini': ['gemini'],
  'codex': ['codex'],
  'claude': ['claude'],
  'qwen': ['qwen'],
};

/**
 * Detect if a specific CLI tool is available on the system
 */
export function isCliToolAvailable(toolName: CliToolName): boolean {
  const path = resolveCliToolPath(toolName);
  return path !== null;
}

/**
 * Resolve the full path to a CLI tool executable
 */
export function resolveCliToolPath(toolName: CliToolName): string | null {
  const commands = CLI_TOOL_PATTERNS[toolName];
  if (!commands) {
    return null;
  }

  const isWindows = process.platform === 'win32';
  const whichCommand = isWindows ? 'where' : 'which';

  for (const command of commands) {
    try {
      const result = execSync(`${whichCommand} ${command}`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      }).trim();

      if (result) {
        // On Windows, 'where' might return multiple paths; take the first one
        const path = result.split('\n')[0].trim();
        if (existsSync(path)) {
          return path;
        }
      }
    } catch (error) {
      // Command not found, continue to next pattern
      continue;
    }
  }

  return null;
}

/**
 * Override configuration for tool detection
 */
export interface CliToolOverride {
  preferred?: CliToolName;
  path: string;
}

/**
 * Detect all installed AI CLI tools on the system
 */
export function detectInstalledCliTools(override?: CliToolOverride): DetectionResult {
  const toolNames: CliToolName[] = ['gemini', 'codex', 'claude', 'qwen'];
  const tools: CliToolInfo[] = [];

  for (const name of toolNames) {
    const path = resolveCliToolPath(name);
    const available = path !== null;
    const command = CLI_TOOL_PATTERNS[name][0]; // Use primary command name

    tools.push({
      name,
      command,
      path,
      available,
    });
  }

  // If override is provided and the preferred tool exists at the override path, add it
  if (override?.preferred && override.path) {
    const { existsSync } = require('fs');
    if (existsSync(override.path)) {
      // Check if this tool already exists in tools
      const existingToolIndex = tools.findIndex((t) => t.name === override.preferred);
      if (existingToolIndex >= 0) {
        // Update existing tool with override path
        tools[existingToolIndex] = {
          name: override.preferred,
          command: override.path,
          path: override.path,
          available: true,
        };
      } else {
        // Add new tool entry
        tools.push({
          name: override.preferred,
          command: override.path,
          path: override.path,
          available: true,
        });
      }
    }
  }

  const availableTools = tools.filter((tool) => tool.available);

  return {
    tools,
    availableTools,
  };
}