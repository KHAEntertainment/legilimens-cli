import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import type {
  FormatProgress,
  GenerateGatewayDoc,
  GatewayGenerationRequest,
  GatewayGenerationResult,
  GatewayProgressEvent,
  TemplateValidationResult,
  ValidateTemplate
} from './types.js';
import {
  createPerformanceTracker,
  summarizePerformance
} from './telemetry/performance.js';

type DependencyType = 'framework' | 'api' | 'library' | 'tool';

const VALID_DEPENDENCY_TYPES: ReadonlySet<DependencyType> = new Set([
  'framework',
  'api',
  'library',
  'tool'
]);

const TYPE_DIRECTORY: Record<DependencyType, string> = {
  framework: 'frameworks',
  api: 'apis',
  library: 'libraries',
  tool: 'tools'
};

const TEMPLATE_PLACEHOLDERS = [
  '{{TITLE}}',
  '{{OVERVIEW}}',
  '{{SHORT_DESCRIPTION}}',
  '{{FEATURE_1}}',
  '{{FEATURE_2}}',
  '{{FEATURE_3}}',
  '{{FEATURE_4}}',
  '{{FEATURE_5}}',
  '{{MCP_GUIDANCE}}',
  '{{STATIC_BACKUP_LINK}}',
  '{{OFFICIAL_SOURCE_LINK}}'
] as const;

const REQUIRED_SECTIONS = [
  '## Overview',
  '## Short Description',
  '## Key Features',
  '## MCP Tool Guidance',
  '## Static Backup Reference',
  '## Official Source'
] as const;

const sanitizeDependencyType = (value: unknown): DependencyType => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (VALID_DEPENDENCY_TYPES.has(normalized as DependencyType)) {
      return normalized as DependencyType;
    }
  }
  return 'library';
};

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'dependency';

const toDisplayName = (value: string): string =>
  value
    .replace(/[-_/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ') || 'Unknown Dependency';

const ensureDirectory = async (path: string): Promise<void> => {
  await mkdir(path, { recursive: true });
};

const readTemplate = async (templatePath: string): Promise<string> =>
  readFile(templatePath, 'utf8');

const replacePlaceholders = (
  template: string,
  replacements: Record<string, string>
): string => {
  return Object.entries(replacements).reduce((acc, [placeholder, value]) => {
    const token = `{{${placeholder}}}`;
    return acc.split(token).join(value);
  }, template);
};

const hasAllPlaceholders = (content: string): boolean =>
  TEMPLATE_PLACEHOLDERS.every((placeholder) => content.includes(placeholder));

const buildMcpGuidance = (args: {
  dependencyName: string;
  deepWikiRepository: string;
  staticBackupLink: string;
}): string =>
  [
    'USE DEEPWIKI MCP TO ACCESS DEPENDENCY KNOWLEDGE!',
    `Primary repository: ${args.deepWikiRepository}`,
    'Example: ask_question("What is the quickest way to integrate this dependency?")',
    '',
    `For planning sessions, review the static backup: ${args.staticBackupLink}`,
    '',
    'DeepWiki for coding. Static files for planning.'
  ].join('\n');

const deriveOfficialSource = (dependencyIdentifier: string, deepWikiRepository: string): string => {
  if (deepWikiRepository) {
    return deepWikiRepository;
  }
  if (dependencyIdentifier.includes('://')) {
    return dependencyIdentifier;
  }
  if (dependencyIdentifier.includes('/')) {
    return `https://github.com/${dependencyIdentifier.replace(/^https?:\/\//, '')}`;
  }
  return `https://www.npmjs.com/package/${dependencyIdentifier}`;
};

export const validateTemplate: ValidateTemplate = async (
  templatePath: string
): Promise<TemplateValidationResult> => {
  const issues: string[] = [];

  try {
    await access(templatePath, fsConstants.R_OK);
  } catch (error) {
    return {
      valid: false,
      issues: [`Template path "${templatePath}" is not readable: ${(error as Error).message}`]
    };
  }

  const content = await readTemplate(templatePath);

  REQUIRED_SECTIONS.forEach((section) => {
    if (!content.includes(section)) {
      issues.push(`Missing required section heading: ${section}`);
    }
  });

  if (!hasAllPlaceholders(content)) {
    TEMPLATE_PLACEHOLDERS.forEach((placeholder) => {
      if (!content.includes(placeholder)) {
        issues.push(`Missing placeholder token ${placeholder}`);
      }
    });
  }

  const featurePlaceholders = content.match(/- \{\{FEATURE_[1-5]\}\}/g) ?? [];
  if (featurePlaceholders.length !== 5) {
    issues.push('Template must contain exactly five feature placeholders.');
  }

  return {
    valid: issues.length === 0,
    issues
  };
};

export const formatProgress: FormatProgress = (event: GatewayProgressEvent): string => {
  const percent = Number.isFinite(event.percentComplete)
    ? Math.max(0, Math.min(100, Math.round(event.percentComplete)))
    : 0;
  const step = event.step.replace(/[-_]+/g, ' ');
  return `${percent.toString().padStart(3, ' ')}% :: ${step} - ${event.message}`;
};

const buildFeatureList = (args: {
  dependencyName: string;
  dependencyType: DependencyType;
  staticBackupLink: string;
  minimalMode: boolean;
}): string[] => {
  const shared = [
    `Curated DeepWiki prompts accelerate work with ${args.dependencyName}.`,
    `Static backup lives at ${args.staticBackupLink} for deep dives.`,
    `Enforces immutable Legilimens template for ${args.dependencyType} dependencies.`,
    'Shared Node.js core keeps CLI and service harness outputs aligned.'
  ];

  const modeFeature = args.minimalMode
    ? 'Minimal mode active to respect ANSI-free or low-width terminals.'
    : 'Supports minimal and low-contrast modes without sacrificing clarity.';

  return [...shared, modeFeature];
};

const buildSummary = (args: {
  dependencyName: string;
  dependencyType: DependencyType;
  gatewayRelativePath: string;
  staticBackupRelativePath: string;
  deepWikiRepository: string;
  performanceSummary: string;
}): string =>
  [
    `Gateway generated for ${args.dependencyName} (${args.dependencyType}).`,
    `Markdown saved to ${args.gatewayRelativePath} with static backup ${args.staticBackupRelativePath}.`,
    `DeepWiki reference: ${args.deepWikiRepository}.`,
    args.performanceSummary
  ].join(' ');

export const generateGatewayDoc: GenerateGatewayDoc = async (
  request: GatewayGenerationRequest
): Promise<GatewayGenerationResult> => {
  const minimalModeRequested = Boolean(request.context?.minimalMode);
  const performanceTracker = createPerformanceTracker({
    minimalModeRequested
  });
  const templateCheck = await validateTemplate(request.templatePath);
  if (!templateCheck.valid) {
    throw new Error(
      `Template validation failed: ${templateCheck.issues.join('; ')}`
    );
  }

  const templateContent = await readTemplate(request.templatePath);
  const variables: Record<string, unknown> = request.context?.variables ?? {};

  const dependencyIdentifier =
    (typeof variables.dependencyIdentifier === 'string' && variables.dependencyIdentifier.trim()) ||
    'unknown-dependency';
  const dependencyType = sanitizeDependencyType(variables.dependencyType);
  const deepWikiRepository =
    (typeof variables.deepWikiRepository === 'string' &&
      variables.deepWikiRepository.trim()) ||
    'https://deepwiki.example.com/legilimens';

  const displayName = toDisplayName(dependencyIdentifier);
  const slug = slugify(dependencyIdentifier);
  const gatewayDirectory = resolve(request.targetDirectory, TYPE_DIRECTORY[dependencyType]);
  const staticDirectory = resolve(gatewayDirectory, 'static-backup');
  await ensureDirectory(gatewayDirectory);
  await ensureDirectory(staticDirectory);

  const gatewayFilename = `${dependencyType}_${slug}.md`;
  const staticBackupFilename = `${dependencyType}_${slug}.md`;
  const gatewayPath = resolve(gatewayDirectory, gatewayFilename);
  const staticBackupPath = resolve(staticDirectory, staticBackupFilename);
  const staticBackupLink = `./static-backup/${staticBackupFilename}`;
  const gatewayRelativePath = `${TYPE_DIRECTORY[dependencyType]}/${gatewayFilename}`;
  const staticBackupRelativePath = `${TYPE_DIRECTORY[dependencyType]}/static-backup/${staticBackupFilename}`;

  const featureList = buildFeatureList({
    dependencyName: displayName,
    dependencyType,
    staticBackupLink,
    minimalMode: minimalModeRequested
  });

  const mcpGuidance = buildMcpGuidance({
    dependencyName: displayName,
    deepWikiRepository,
    staticBackupLink
  });

  const officialSourceUrl = deriveOfficialSource(dependencyIdentifier, deepWikiRepository);
  const officialSourceLink = `[Official ${displayName} reference](${officialSourceUrl})`;

  const replacements = {
    TITLE: `Legilimens Gateway: ${displayName}`,
    OVERVIEW: `Lightweight Legilimens summary for ${displayName} (${dependencyType}).`,
    SHORT_DESCRIPTION: `${displayName} gateway captures the essentials without bloating context windows. DeepWiki remains the live source for coding answers while static backups support deliberate planning.`,
    FEATURE_1: featureList[0],
    FEATURE_2: featureList[1],
    FEATURE_3: featureList[2],
    FEATURE_4: featureList[3],
    FEATURE_5: featureList[4],
    MCP_GUIDANCE: mcpGuidance,
    STATIC_BACKUP_LINK: `[${staticBackupLink}](${staticBackupLink})`,
    OFFICIAL_SOURCE_LINK: officialSourceLink
  };

  const templateFilled = replacePlaceholders(templateContent, {
    TITLE: replacements.TITLE,
    OVERVIEW: replacements.OVERVIEW,
    SHORT_DESCRIPTION: replacements.SHORT_DESCRIPTION,
    FEATURE_1: replacements.FEATURE_1,
    FEATURE_2: replacements.FEATURE_2,
    FEATURE_3: replacements.FEATURE_3,
    FEATURE_4: replacements.FEATURE_4,
    FEATURE_5: replacements.FEATURE_5,
    MCP_GUIDANCE: replacements.MCP_GUIDANCE,
    STATIC_BACKUP_LINK: replacements.STATIC_BACKUP_LINK,
    OFFICIAL_SOURCE_LINK: replacements.OFFICIAL_SOURCE_LINK
  }).trimEnd();

  if (templateFilled.includes('{{')) {
    throw new Error('Template rendering left unresolved placeholders.');
  }

  await ensureDirectory(dirname(gatewayPath));
  await ensureDirectory(dirname(staticBackupPath));

  await writeFile(`${gatewayPath}`, `${templateFilled}\n`, 'utf8');

  const staticContent = [
    `# Static Backup Placeholder: ${displayName}`,
    '',
    'Replace this placeholder with the canonical static-backup markdown when available.',
    '',
    `DeepWiki reference: ${deepWikiRepository}`
  ].join('\n');
  await writeFile(staticBackupPath, `${staticContent}\n`, 'utf8');

  const gatewayDocContent = await readFile(gatewayPath, 'utf8');

  const performanceMetrics = performanceTracker.finish();
  const performanceSummary = summarizePerformance(performanceMetrics);
  const generationDurationMs = performanceMetrics.durationMs;
  const summary = buildSummary({
    dependencyName: displayName,
    dependencyType,
    gatewayRelativePath,
    staticBackupRelativePath,
    deepWikiRepository,
    performanceSummary
  });

  return {
    documentPath: gatewayPath,
    summary,
    artifacts: [gatewayPath, staticBackupPath],
    metadata: {
      sessionId: randomUUID(),
      dependencyType,
      dependencyIdentifier,
      templateValidated: true,
      generationDurationMs,
      deepWikiGuidanceIncluded: gatewayDocContent.includes('DeepWiki'),
      gatewayPath,
      gatewayFilename,
      gatewayRelativePath,
      staticBackupPath,
      staticBackupFilename,
      staticBackupRelativePath,
      minimalMode: minimalModeRequested,
      deepWikiRepository,
      performance: performanceMetrics,
      performanceSummary
    }
  };
};
