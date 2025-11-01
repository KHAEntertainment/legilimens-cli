import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import type {
  DependencyType,
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
import { getRuntimeConfig, isAiGenerationEnabled, isLocalLlmEnabled } from './config/runtimeConfig.js';
import { fetchDocumentation, fetchDocumentationWithSource } from './fetchers/orchestrator.js';
import { isFetchSuccess } from './fetchers/types.js';
import { generateWithCliTool } from './ai/cliOrchestrator.js';
import {
  buildGatewayGenerationPrompt,
  generateFallbackContent,
  type AiGeneratedContent
} from './ai/promptBuilder.js';
import { condenseDocumentation } from './ai/documentChunker.js';
import { routeDocumentation } from './ai/documentRouter.js';
import { type CliToolName } from './ai/cliDetector.js';
import { deriveDeepWikiUrl, type SourceType } from './detection/sourceDetector.js';
import { normalizeIdentifier, type NormalizedIdentifier } from './detection/normalizeIdentifier.js';
import { runLocalJson } from './ai/localLlmRunner.js';
import { aiGeneratedContentSchema, validateWithSchema } from './ai/schemas.js';
import { extractFirstJson, safeParseJson } from './ai/json.js';

const VALID_DEPENDENCY_TYPES: ReadonlySet<DependencyType> = new Set([
  'framework',
  'api',
  'library',
  'tool',
  'other'
]);

const TYPE_DIRECTORY: Record<DependencyType, string> = {
  framework: 'frameworks',
  api: 'apis',
  library: 'libraries',
  tool: 'tools',
  other: 'other'
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

const getSourceToolName = (sourceType: SourceType): string => {
  switch (sourceType) {
    case 'github': return 'DeepWiki';
    case 'npm': return 'Context7';
    case 'url': return 'Firecrawl';
    case 'unknown': return 'Static backup';
    default: return 'MCP tools';
  }
};

const getSourceTypeName = (sourceType: SourceType): string => {
  switch (sourceType) {
    case 'github': return 'GitHub';
    case 'npm': return 'NPM';
    case 'url': return 'URLs';
    case 'unknown': return 'unknown sources';
    default: return 'dependencies';
  }
};

const buildMcpGuidance = (args: {
  dependencyName: string;
  deepWikiRepository: string | undefined;
  staticBackupLink: string;
  sourceType: SourceType;
}): string => {
  switch (args.sourceType) {
    case 'github':
      return [
        'USE DEEPWIKI MCP TO ACCESS DEPENDENCY KNOWLEDGE!',
        ...(args.deepWikiRepository ? [`Primary repository: ${args.deepWikiRepository}`] : []),
        'Example: ask_question("What is the quickest way to integrate this dependency?")',
        '',
        `For planning sessions, review the static backup: ${args.staticBackupLink}`,
        '',
        'DeepWiki for coding. Static files for planning.'
      ].join('\n');
    
    case 'npm':
      return [
        'USE CONTEXT7 MCP TO ACCESS PACKAGE DOCUMENTATION!',
        'Context7 provides cached NPM package documentation optimized for quick queries.',
        'Use Context7 MCP to query package APIs, usage patterns, and examples.',
        '',
        `For deep research, review the static backup: ${args.staticBackupLink}`,
        '',
        'Context7 for package docs. Static files for deep research.'
      ].join('\n');
    
    case 'url':
      return [
        'USE FIRECRAWL OR WEB-BASED TOOLS TO ACCESS DOCUMENTATION!',
        'Documentation is available at the provided URL.',
        'Use Firecrawl MCP or browser-based access for specific sections.',
        '',
        `For offline reference, review the static backup: ${args.staticBackupLink}`,
        '',
        'Web tools for live docs. Static files for offline reference.'
      ].join('\n');
    
    case 'unknown':
    default:
      return [
        'REFER TO STATIC BACKUP FOR DOCUMENTATION!',
        'The source type could not be determined for this dependency.',
        'The static backup serves as the primary reference.',
        'Consider manually verifying the dependency source.',
        '',
        `Primary reference: ${args.staticBackupLink}`,
        '',
        'Static backup is your primary reference for this dependency.'
      ].join('\n');
  }
};

const deriveOfficialSource = (
  identifier: NormalizedIdentifier, 
  deepWikiRepository: string | undefined,
  repositoryUrl?: string
): string => {
  const raw = identifier.raw.trim();
  const normalized = identifier.normalized;

  if (identifier.sourceType === 'github') {
    // Prefer repositoryUrl from AI detection if available
    if (repositoryUrl) {
      return repositoryUrl;
    }

    const githubMatch = raw.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([^\s?#]+)(?:[?#].*)?$/i);
    if (githubMatch?.[1]) {
      return `https://github.com/${githubMatch[1].replace(/\.git$/, '')}`;
    }

    if (/^(?:www\.)?github\.com\//i.test(raw)) {
      const cleaned = raw.replace(/^www\./i, '');
      return cleaned.startsWith('http') ? cleaned : `https://${cleaned}`;
    }

    if (normalized.includes('/')) {
      return `https://github.com/${normalized.replace(/\.git$/, '')}`;
    }

    return deepWikiRepository || (raw ? `https://github.com/${raw}` : `https://github.com/${normalized}`);
  }

  if (identifier.sourceType === 'npm') {
    return `https://www.npmjs.com/package/${normalized}`;
  }

  // For URL source type, prefer repositoryUrl
  if (repositoryUrl && repositoryUrl.includes('://')) {
    return repositoryUrl;
  }

  if (raw.includes('://')) {
    return raw;
  }

  if (normalized.includes('://')) {
    return normalized;
  }

  return deepWikiRepository || repositoryUrl || raw || normalized;
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
  sourceType?: SourceType;
}): string[] => {
  const sourceAppropriateMcp = args.sourceType 
    ? `Curated MCP prompts accelerate work with ${args.dependencyName} (${getSourceToolName(args.sourceType)} for ${getSourceTypeName(args.sourceType)}).`
    : `Curated MCP prompts accelerate work with ${args.dependencyName} (DeepWiki for GitHub, Context7 for NPM).`;
    
  const shared = [
    sourceAppropriateMcp,
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
  deepWikiRepository: string | undefined;
  performanceSummary: string;
  sourceType: SourceType;
}): string => {
  const mcpReference = args.sourceType === 'github' && args.deepWikiRepository
    ? `DeepWiki reference: ${args.deepWikiRepository}.`
    : `MCP tool guidance: ${getSourceToolName(args.sourceType)}.`;
    
  return [
    `Gateway generated for ${args.dependencyName} (${args.dependencyType}).`,
    `Markdown saved to ${args.gatewayRelativePath} with static backup ${args.staticBackupRelativePath}.`,
    mcpReference,
    args.performanceSummary
  ].join(' ');
};

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
  
  // Use precomputed sourceType from CLI detection if available, otherwise detect
  const providedSourceType = typeof variables.sourceType === 'string' ? variables.sourceType as SourceType : undefined;
  const providedRepositoryUrl = typeof variables.repositoryUrl === 'string' ? variables.repositoryUrl : undefined;
  
  const normalizedIdentifier = normalizeIdentifier(dependencyIdentifier);
  const sourceType = providedSourceType || normalizedIdentifier.sourceType;
  const displayName = normalizedIdentifier.displayName;
  const slug = slugify(normalizedIdentifier.normalized);
  
  // Automatically derive deepWikiRepository when not provided
  const providedDeepWiki = typeof variables.deepWikiRepository === 'string' && variables.deepWikiRepository.trim();
  const isPlaceholder = providedDeepWiki === 'https://deepwiki.example.com/legilimens';
  const derivedDeepWiki = deriveDeepWikiUrl(dependencyIdentifier);
  const deepWikiRepository = (providedDeepWiki && !isPlaceholder) 
    ? providedDeepWiki 
    : (derivedDeepWiki || undefined);

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

  // Fetch real documentation first
  const runtimeConfig = getRuntimeConfig();
  const localLlmConfigured = isLocalLlmEnabled(runtimeConfig);
  const fetchStartTime = Date.now();
  
  // Use fetchDocumentationWithSource if sourceType is precomputed, otherwise fallback to fetchDocumentation
  const fetchResult = providedSourceType
    ? await fetchDocumentationWithSource(dependencyIdentifier, providedSourceType, runtimeConfig, providedRepositoryUrl)
    : await fetchDocumentation(dependencyIdentifier, runtimeConfig);
  
  const fetchDurationMs = Date.now() - fetchStartTime;

  let staticContent: string;
  let documentationFetched = false;
  let fetchSource: string | undefined;
  let fetchAttempts: string[] | undefined;

  if (isFetchSuccess(fetchResult)) {
    // Use fetched content
    staticContent = fetchResult.content;
    documentationFetched = true;
    fetchSource = fetchResult.metadata.source;
    fetchAttempts = fetchResult.metadata.attempts;
  } else {
    // Fall back to placeholder
    console.warn(`Documentation fetch failed for ${dependencyIdentifier}: ${fetchResult.error}`);
    
    const fallbackLines = [
      `# Static Backup Placeholder: ${displayName}`,
      '',
      'Replace this placeholder with the canonical static-backup markdown when available.',
      ''
    ];
    
    // Only include DeepWiki reference for GitHub sources
    if (sourceType === 'github' && deepWikiRepository && deepWikiRepository !== 'https://deepwiki.example.com/legilimens') {
      fallbackLines.push(`DeepWiki reference: ${deepWikiRepository}`, '');
    }
    
    fallbackLines.push(`Note: Automatic fetch failed - ${fetchResult.error}`);
    staticContent = fallbackLines.join('\n');
  }

  // AI generation tracking
  let aiGenerationEnabled = false;
  let aiToolUsed: string | undefined;
  let aiGenerationDurationMs: number | undefined;
  let aiGenerationAttempts: string[] | undefined;
  let aiGenerationFailed = false;
  let aiGenerationError: string | undefined;
  let aiGenerationMethod: 'local-llm' | 'external-cli' | undefined;
  let aiEnginesUnavailable = false;
  let aiEnginesUnavailableReason: string | undefined;
  let localLlmSucceeded = false;
  let localLlmAvailabilityError: string | undefined;

  // Try AI generation if enabled
  let shortDescription = '';
  let featureList: string[] = [];

  if (isAiGenerationEnabled(runtimeConfig)) {
    aiGenerationEnabled = true;
    const aiStartTime = Date.now();

    try {
      // Route documentation processing based on size (3-tier strategy)
      const { preparedDocs, metadata } = await routeDocumentation(
        staticContent,
        displayName,
        dependencyType,
        runtimeConfig
      );

      if (process.env.LEGILIMENS_DEBUG) {
        console.debug(
          `[gateway] Routing decision: ${metadata.method}\n` +
          `  Original tokens: ${metadata.originalTokens.toLocaleString()}\n` +
          `  Processed tokens: ${metadata.processedTokens.toLocaleString()}\n` +
          `  Model context: ${metadata.modelContextWindow.toLocaleString()}`
        );
      }

      // Warn user if documentation was aggressively truncated
      if (metadata.qualityWarning) {
        console.warn(
          `\n⚠️  Large documentation detected for ${displayName}\n` +
          `   Original size: ${metadata.originalTokens.toLocaleString()} tokens\n` +
          `   Processed size: ${metadata.processedTokens.toLocaleString()} tokens\n` +
          `   Documentation truncated to key sections for AI processing.\n` +
          `   Full documentation preserved in static-backup for reference.\n`
        );
      }

      // Build AI prompt
      const { prompt } = buildGatewayGenerationPrompt({
        dependencyName: displayName,
        dependencyType,
        fetchedDocumentation: preparedDocs,
        deepWikiUrl: deepWikiRepository,
        officialSourceUrl: deriveOfficialSource(normalizedIdentifier, deepWikiRepository, providedRepositoryUrl)
      });

      const generationAttempts: string[] = [];

      if (localLlmConfigured) {
        if (process.env.LEGILIMENS_DEBUG) {
          console.debug('[gateway] Attempting AI generation with local LLM');
        }
        const localResult = await runLocalJson<AiGeneratedContent>({ 
          prompt, 
          schema: aiGeneratedContentSchema 
        });

        if (localResult.attempts > 0) {
          for (let i = 0; i < localResult.attempts; i += 1) {
            generationAttempts.push('local-llm');
          }
        }

        if (localResult.success && localResult.json) {
          const localContent = localResult.json as Partial<AiGeneratedContent>;
          if (
            typeof localContent?.shortDescription === 'string' &&
            Array.isArray(localContent.features)
          ) {
            localLlmSucceeded = true;
            aiGenerationMethod = 'local-llm';
            aiGenerationDurationMs = Date.now() - aiStartTime;
            aiGenerationAttempts = generationAttempts.length ? [...generationAttempts] : undefined;
            shortDescription = localContent.shortDescription;
            featureList = buildFeatureList({
              dependencyName: displayName,
              dependencyType,
              staticBackupLink,
              minimalMode: minimalModeRequested,
              sourceType
            });
            if (process.env.LEGILIMENS_DEBUG) {
              console.debug(`[gateway] Local LLM success in ${aiGenerationDurationMs}ms after ${generationAttempts.length} attempts`);
            }
          } else {
            localLlmAvailabilityError = 'Invalid JSON from local LLM';
            console.warn('[gateway] Local LLM returned invalid content structure; falling back to external CLI tools.');
          }
        } else {
          localLlmAvailabilityError = localResult.error ?? 'Local LLM generation failed';
          if (localResult.error) {
            console.warn(`[gateway] Local LLM generation failed: ${localResult.error}`);
          }
        }
      } else {
        localLlmAvailabilityError = 'Local LLM disabled';
        if (process.env.LEGILIMENS_DEBUG) {
          console.debug('[gateway] Local LLM not configured, skipping to external CLI tools');
        }
      }

      if (!localLlmSucceeded) {
        if (process.env.LEGILIMENS_DEBUG) {
          console.debug('[gateway] Falling back to external CLI tools');
        }
        
        const preferred = (['gemini','codex','claude','qwen'] as const)
          .includes(runtimeConfig.aiCliConfig.preferredTool as any)
          ? (runtimeConfig.aiCliConfig.preferredTool as CliToolName)
          : undefined;

        aiGenerationMethod = 'external-cli';
        const aiResult = await generateWithCliTool(prompt, {
          preferredTool: preferred,
          timeoutMs: runtimeConfig.aiCliConfig.timeoutMs,
          commandOverride: runtimeConfig.aiCliConfig.commandOverride
        });

        aiGenerationDurationMs = Date.now() - aiStartTime;
        const combinedAttempts = [
          ...generationAttempts,
          ...(aiResult.attempts ?? [])
        ];
        aiGenerationAttempts = combinedAttempts.length ? combinedAttempts : undefined;

        if (aiResult.success && aiResult.content) {
          if (process.env.LEGILIMENS_DEBUG) {
            console.debug(`[gateway] External CLI tool success: ${aiResult.toolUsed} in ${aiGenerationDurationMs}ms`);
          }
          
          // Extract JSON and validate with schema
          const jsonText = extractFirstJson(aiResult.content);
          const parsed = jsonText ? safeParseJson(jsonText) : null;
          
          if (parsed) {
            const validation = validateWithSchema(aiGeneratedContentSchema, parsed);
            
            if (validation.success) {
              if (process.env.LEGILIMENS_DEBUG) {
                console.debug(`[gateway] External CLI response validated with schema`);
              }
              shortDescription = validation.data.shortDescription;
              // Use buildFeatureList for consistent Legilimens-specific features
              featureList = buildFeatureList({
                dependencyName: displayName,
                dependencyType,
                staticBackupLink,
                minimalMode: minimalModeRequested,
                sourceType
              });
              aiToolUsed = aiResult.toolUsed;
            } else {
              // Schema validation failed, fall back immediately
              if (process.env.LEGILIMENS_DEBUG) {
                console.debug(`[gateway] Schema validation failed: ${validation.error}, using fallback`);
              }
              aiGenerationFailed = true;
              aiGenerationError = `Schema validation failed: ${validation.error}`;
              const fallbackContent = generateFallbackContent({
                dependencyName: displayName,
                dependencyType,
                fetchedDocumentation: staticContent
              });
              shortDescription = fallbackContent.shortDescription;
              featureList = buildFeatureList({
                dependencyName: displayName,
                dependencyType,
                staticBackupLink,
                minimalMode: minimalModeRequested,
                sourceType
              });
              aiToolUsed = aiResult.toolUsed;
            }
          } else {
            // No valid JSON found, fall back immediately
            if (process.env.LEGILIMENS_DEBUG) {
              console.debug(`[gateway] No valid JSON in external CLI response, using fallback`);
            }
            aiGenerationFailed = true;
            aiGenerationError = 'No valid JSON in external CLI response';
            const fallbackContent = generateFallbackContent({
              dependencyName: displayName,
              dependencyType,
              fetchedDocumentation: staticContent
            });
            shortDescription = fallbackContent.shortDescription;
            featureList = buildFeatureList({
              dependencyName: displayName,
              dependencyType,
              staticBackupLink,
              minimalMode: minimalModeRequested,
              sourceType
            });
            aiToolUsed = aiResult.toolUsed;
          }
        } else {
          if (process.env.LEGILIMENS_DEBUG) {
            console.debug(`[gateway] External CLI tools failed, using fallback content`);
          }
          aiGenerationFailed = true;
          aiGenerationError = aiResult.error;
          const fallbackContent = generateFallbackContent({
            dependencyName: displayName,
            dependencyType,
            fetchedDocumentation: staticContent
          });
          shortDescription = fallbackContent.shortDescription;
          featureList = buildFeatureList({
            dependencyName: displayName,
            dependencyType,
            staticBackupLink,
            minimalMode: minimalModeRequested,
            sourceType
          });
          aiToolUsed = aiResult.toolUsed;

          const lowerError = aiResult.error?.toLowerCase() ?? '';
          const toolUnavailable = lowerError.includes('no ai cli tools detected') ||
            lowerError.includes('command not found') ||
            lowerError.includes('enoent');
          if (toolUnavailable && !localLlmSucceeded) {
            aiEnginesUnavailable = true;
            const localReason = localLlmConfigured
              ? `Local LLM unavailable${localLlmAvailabilityError ? ` (${localLlmAvailabilityError})` : ''}`
              : 'Local LLM disabled';
            aiEnginesUnavailableReason = `${localReason}; ${aiResult.error ?? 'AI CLI tool not available'}`;
            console.warn(`[gateway] All AI engines unavailable: ${aiEnginesUnavailableReason}`);
          }
        }
      }
    } catch (error) {
      // AI generation error, use fallback
      aiGenerationFailed = true;
      aiGenerationError = error instanceof Error ? error.message : String(error);
      console.warn(`AI generation failed: ${aiGenerationError}`);

      const fallbackContent = generateFallbackContent({
        dependencyName: displayName,
        dependencyType,
        fetchedDocumentation: staticContent
      });
      shortDescription = fallbackContent.shortDescription;
      featureList = buildFeatureList({
        dependencyName: displayName,
        dependencyType,
        staticBackupLink,
        minimalMode: minimalModeRequested,
        sourceType
      });
    }
  } else {
    // AI generation disabled, use fallback
    const fallbackContent = generateFallbackContent({
      dependencyName: displayName,
      dependencyType,
      fetchedDocumentation: staticContent
    });
    shortDescription = fallbackContent.shortDescription;
    featureList = buildFeatureList({
      dependencyName: displayName,
      dependencyType,
      staticBackupLink,
      minimalMode: minimalModeRequested,
      sourceType
    });
  }

  // buildFeatureList ensures exactly 5 features

  const mcpGuidance = buildMcpGuidance({
    dependencyName: displayName,
    deepWikiRepository,
    staticBackupLink,
    sourceType
  });

  const officialSourceUrl = deriveOfficialSource(normalizedIdentifier, deepWikiRepository, providedRepositoryUrl);
  const officialSourceLink = `[Official ${displayName} reference](${officialSourceUrl})`;

  const replacements = {
    TITLE: `Legilimens Gateway: ${displayName}`,
    OVERVIEW: `Lightweight Legilimens summary for ${displayName} (${dependencyType}).`,
    SHORT_DESCRIPTION: shortDescription,
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

  // Write static backup (already fetched earlier)
  await writeFile(staticBackupPath, `${staticContent}\n`, 'utf8');

  const performanceMetrics = performanceTracker.finish();
  const performanceSummary = summarizePerformance(performanceMetrics);
  const generationDurationMs = performanceMetrics.durationMs;

  // Update summary to reflect fetch result and AI generation
  const fetchStatusMsg = documentationFetched
    ? `Documentation fetched from ${fetchSource} in ${fetchDurationMs}ms.`
    : 'Documentation fetch failed; placeholder created.';

  const durationSuffix = aiGenerationDurationMs ? ` in ${aiGenerationDurationMs}ms.` : '.';
  const aiStatusMsg = aiGenerationEnabled
    ? aiGenerationFailed
      ? 'AI generation failed; used fallback content.'
      : aiGenerationMethod === 'local-llm'
        ? `AI generation succeeded with local LLM${durationSuffix}`
        : aiGenerationMethod === 'external-cli' && aiToolUsed
          ? `AI generation succeeded with ${aiToolUsed} (external CLI)${durationSuffix}`
          : 'AI generation succeeded.'
    : '';

  const aiUnavailableSuffix = aiEnginesUnavailable
    ? ` AI engines unavailable (${aiEnginesUnavailableReason ?? 'local LLM disabled and no external CLI tools detected'}).`
    : '';

  const summary = buildSummary({
    dependencyName: displayName,
    dependencyType,
    gatewayRelativePath,
    staticBackupRelativePath,
    deepWikiRepository,
    performanceSummary,
    sourceType
  }) + ` ${fetchStatusMsg}` + (aiStatusMsg ? ` ${aiStatusMsg}` : '') + aiUnavailableSuffix;

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
      mcpGuidanceSourceType: sourceType,
      mcpGuidanceFlags: {
        deepWiki: sourceType === 'github',
        context7: sourceType === 'npm',
        firecrawl: sourceType === 'url',
        staticOnly: sourceType === 'unknown'
      },
      gatewayPath,
      gatewayFilename,
      gatewayRelativePath,
      staticBackupPath,
      staticBackupFilename,
      staticBackupRelativePath,
      minimalMode: minimalModeRequested,
      deepWikiRepository,
      performance: performanceMetrics,
      performanceSummary,
      documentationFetched,
      fetchSource,
      fetchDurationMs,
      fetchAttempts,
      aiGenerationEnabled,
      aiToolUsed,
      aiGenerationMethod,
      aiGenerationDurationMs,
      aiGenerationAttempts,
      aiGenerationFailed,
      aiGenerationError,
      aiEnginesUnavailable,
      aiEnginesUnavailableReason,
      localLlmAvailabilityError,
      localLlmConfigured
    }
  };
};