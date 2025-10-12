import ora from 'ora';
import { resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { env as processEnv } from 'node:process';
import type { CliEnvironment } from '../config/env.js';
import {
  runGeneration,
  type GenerationInput,
  type GenerationRunResult
} from './runGeneration.js';

// Get bundled template path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BUNDLED_TEMPLATE_PATH = resolvePath(__dirname, '../assets/templates/legilimens-template.md');

export interface NonInteractiveOptions {
  environment: CliEnvironment;
  overrides?: Partial<GenerationInput>;
}

const dependencyTypes = new Set(['framework', 'api', 'library', 'tool', 'other']);

const normalizeDependencyType = (value: string | undefined): string =>
  value && dependencyTypes.has(value) ? value : 'library';

const resolveGenerationInput = (
  environment: CliEnvironment,
  overrides: Partial<GenerationInput> = {}
): GenerationInput => {
  const docsDir = environment.directories.docsDir;

  const envDependency = processEnv.LEGILIMENS_DEPENDENCY?.trim();
  const envTemplatePath = processEnv.LEGILIMENS_TEMPLATE?.trim();
  const envType = normalizeDependencyType(processEnv.LEGILIMENS_TYPE?.trim());

  return {
    dependencyType: overrides.dependencyType ?? envType,
    dependencyIdentifier:
      overrides.dependencyIdentifier ?? envDependency ?? 'example-dependency',
    templatePath:
      overrides.templatePath ??
      envTemplatePath ??
      BUNDLED_TEMPLATE_PATH,
    targetDirectory: overrides.targetDirectory ?? docsDir,
    minimalMode: overrides.minimalMode ?? environment.minimalMode
  };
};

export const runNonInteractive = async (
  options: NonInteractiveOptions
): Promise<GenerationRunResult> => {
  const spinner = ora('Initializing Legilimens generation').start();

  const input = resolveGenerationInput(options.environment, options.overrides ?? {});
  spinner.text = 'Validating template path';

  const result = await runGeneration(input, {
    onProgress: (event) => {
      spinner.text = event.detail ?? `${event.label} (${event.status})`;
    }
  });

  if (result.success) {
    spinner.succeed('Legilimens generation completed');
    console.log(`Gateway document saved at: ${result.result.documentPath}`);
    console.log(`Summary: ${result.result.summary}`);
  } else {
    spinner.warn('Shared module stub prevented full generation; see details below.');
    console.log(result.error.message);
  }

  console.log(
    'Reminder: MCP tools automatically selected based on dependency type. Re-run once the shared module ships.'
  );

  return result;
};
