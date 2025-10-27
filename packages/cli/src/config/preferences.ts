import type { CliMode, CliEnvironment } from './env.js';
import { loadCliEnvironment } from './env.js';
import { resolveThemeProfile, type ResolvedThemeProfile } from '../theme/profiles.js';
import { supportsBrandColor } from '../theme/brandTheme.js';

export interface PreferenceOptions {
  /**
   * Optional command-line arguments passed to the CLI.
   */
  args?: string[];
  /**
   * Optional environment variables to evaluate.
   */
  env?: NodeJS.ProcessEnv;
  /**
   * Allows callers (including tests) to reuse an environment that was already loaded.
   */
  environment?: CliEnvironment;
  /**
   * Optional stdout stream used to detect ANSI color support.
   */
  stdout?: NodeJS.WriteStream;
}

export interface CliPreferences {
  environment: CliEnvironment;
  mode: CliMode;
  minimal: boolean;
  lowContrast: boolean;
  ansiEnabled: boolean;
  theme: ResolvedThemeProfile;
}

export const loadCliPreferences = async (options: PreferenceOptions = {}): Promise<CliPreferences> => {
  const environment =
    options.environment ?? await loadCliEnvironment(options.args ?? undefined, options.env);

  const ansiEnabled = supportsBrandColor(
    options.stdout ? { stream: options.stdout } : undefined
  );

  const theme = resolveThemeProfile({
    mode: environment.mode,
    ansiEnabled
  });

  return {
    environment,
    mode: environment.mode,
    minimal: environment.mode === 'minimal',
    lowContrast: environment.mode === 'low-contrast',
    ansiEnabled,
    theme
  };
};
