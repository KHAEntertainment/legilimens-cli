import { describe, it, expect, beforeEach } from 'vitest';
import { resolveMode, FLAG_MINIMAL, FLAG_LOW_CONTRAST, ENV_MODE } from '../../packages/cli/src/config/env.js';

describe('resolveMode', () => {
  let cleanEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    cleanEnv = {};
  });

  it('returns default when no flags or env set', () => {
    expect(resolveMode([], cleanEnv)).toBe('default');
  });

  it('returns minimal for --minimal flag', () => {
    expect(resolveMode([FLAG_MINIMAL], cleanEnv)).toBe('minimal');
  });

  it('returns minimal when --minimal appears among other args', () => {
    expect(resolveMode(['some-arg', FLAG_MINIMAL, 'other'], cleanEnv)).toBe('minimal');
  });

  it('returns low-contrast for --low-contrast flag', () => {
    expect(resolveMode([FLAG_LOW_CONTRAST], cleanEnv)).toBe('low-contrast');
  });

  it('prioritizes --low-contrast over --minimal when both present', () => {
    expect(resolveMode([FLAG_MINIMAL, FLAG_LOW_CONTRAST], cleanEnv)).toBe('low-contrast');
  });

  it('returns minimal from LEGILIMENS_MODE=minimal env var', () => {
    cleanEnv[ENV_MODE] = 'minimal';
    expect(resolveMode([], cleanEnv)).toBe('minimal');
  });

  it('returns minimal from LEGILIMENS_MODE=MINIMAL (case-insensitive)', () => {
    cleanEnv[ENV_MODE] = 'MINIMAL';
    expect(resolveMode([], cleanEnv)).toBe('minimal');
  });

  it('returns low-contrast from LEGILIMENS_MODE=low-contrast env var', () => {
    cleanEnv[ENV_MODE] = 'low-contrast';
    expect(resolveMode([], cleanEnv)).toBe('low-contrast');
  });

  it('returns low-contrast from LEGILIMENS_MODE=low_contrast (underscore variant)', () => {
    cleanEnv[ENV_MODE] = 'low_contrast';
    expect(resolveMode([], cleanEnv)).toBe('low-contrast');
  });

  it('returns default for unrecognized LEGILIMENS_MODE value', () => {
    cleanEnv[ENV_MODE] = 'fancy';
    expect(resolveMode([], cleanEnv)).toBe('default');
  });

  it('flag takes precedence over env var', () => {
    cleanEnv[ENV_MODE] = 'low-contrast';
    expect(resolveMode([FLAG_MINIMAL], cleanEnv)).toBe('minimal');
  });
});
