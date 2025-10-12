import { ENV_MODE, FLAG_LOW_CONTRAST, FLAG_MINIMAL } from '../config/env.js';
import { availableThemeProfiles } from '../theme/profiles.js';
import { formatModeLabel } from '../theme/brandTheme.js';

const indent = (count: number): string => ' '.repeat(count);

const buildThemeSection = (): string => {
  const profiles = availableThemeProfiles();
  const lines: string[] = ['Modes:'];

  profiles.forEach((profile) => {
    const line = `${indent(2)}- ${profile.label} (${profile.id}) — ${profile.description}`;
    lines.push(line);
  });

  return lines.join('\n');
};

export const renderHelp = (): string => {
  const themeSection = buildThemeSection();

  return [
    'Legilimens CLI',
    '',
    'Usage:',
    `${indent(2)}legilimens [options]`,
    '',
    'Setup:',
    `${indent(2)}legilimens --setup       Re-run the configuration wizard`,
    `${indent(2)}legilimens --reset       Reset configuration to defaults`,
    '',
    themeSection,
    '',
    'Flags:',
    `${indent(2)}${FLAG_MINIMAL}       Force minimal mode (plain text, ASCII suppressed)`,
    `${indent(2)}${FLAG_LOW_CONTRAST}  Use low-contrast palette with compact ASCII banner`,
    `${indent(2)}--help, -h            Show this help message`,
    `${indent(2)}--version, -v         Show version information`,
    '',
    'AI CLI Tools (auto-detected or configured via wizard):',
    `${indent(2)}gemini        Google Gemini CLI (command: gemini -p)`,
    `${indent(2)}codex         OpenAI Codex CLI (command: codex api responses.create -i)`,
    `${indent(2)}claude        Anthropic Claude Code (command: claude -p)`,
    `${indent(2)}qwen          Qwen Code CLI (command: qwen -p)`,
    '',
    'Environment variables:',
    `${indent(2)}${ENV_MODE}=minimal        Match --minimal flag`,
    `${indent(2)}${ENV_MODE}=low-contrast   Match --low-contrast flag`,
    `${indent(2)}${ENV_MODE}=default        Restore modern mode (default)`,
    `${indent(2)}LEGILIMENS_SKIP_SETUP=true Skip setup wizard (for CI)`,
    '',
    'Configuration priority (highest to lowest):',
    `${indent(2)}1. Environment variables`,
    `${indent(2)}2. User config file (~/.legilimens/config.json)`,
    `${indent(2)}3. Defaults`,
    '',
    'Examples:',
    `${indent(2)}legilimens --setup`,
    `${indent(2)}legilimens --minimal`,
    `${indent(2)}LEGILIMENS_MODE=low-contrast legilimens`,
    '',
    'The CLI auto-detects ANSI color support and falls back to plain text when needed.',
    `Current default: ${formatModeLabel('default')}`
  ].join('\n');
};
