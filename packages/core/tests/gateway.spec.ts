import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp, rm, mkdir, copyFile, writeFile, readFile } from 'node:fs/promises';
import {
  generateGatewayDoc,
  validateTemplate,
  formatProgress
} from '../src/index.js';
import * as orchestrator from '../src/fetchers/orchestrator.js';
import * as cliOrchestrator from '../src/ai/cliOrchestrator.js';
import * as runtimeConfig from '../src/config/runtimeConfig.js';
import { type SourceType } from '../src/detection/sourceDetector.js';

const assertMcpGuidanceForSourceType = (content: string, expectedSourceType: SourceType): void => {
  switch (expectedSourceType) {
    case 'github':
      expect(content).toContain('USE DEEPWIKI MCP');
      expect(content).toContain('ask_question');
      expect(content).toContain('DeepWiki for coding. Static files for planning.');
      expect(content).not.toContain('USE CONTEXT7 MCP');
      expect(content).not.toContain('USE FIRECRAWL OR WEB-BASED TOOLS');
      expect(content).not.toContain('REFER TO STATIC BACKUP');
      break;
    
    case 'npm':
      expect(content).toContain('USE CONTEXT7 MCP');
      expect(content).toContain('Context7 provides cached NPM package documentation');
      expect(content).toContain('Context7 for package docs. Static files for deep research.');
      expect(content).not.toContain('USE DEEPWIKI MCP');
      expect(content).not.toContain('ask_question');
      expect(content).not.toContain('USE FIRECRAWL OR WEB-BASED TOOLS');
      break;
    
    case 'url':
      expect(content).toContain('USE FIRECRAWL OR WEB-BASED TOOLS');
      expect(content).toContain('Web tools for live docs. Static files for offline reference.');
      expect(content).not.toContain('USE DEEPWIKI MCP');
      expect(content).not.toContain('USE CONTEXT7 MCP');
      expect(content).not.toContain('ask_question');
      break;
    
    case 'unknown':
      expect(content).toContain('REFER TO STATIC BACKUP');
      expect(content).toContain('Static backup is your primary reference for this dependency.');
      expect(content).not.toContain('USE DEEPWIKI MCP');
      expect(content).not.toContain('USE CONTEXT7 MCP');
      expect(content).not.toContain('USE FIRECRAWL OR WEB-BASED TOOLS');
      break;
  }
};

vi.mock('../src/fetchers/orchestrator.js');
vi.mock('../src/ai/cliOrchestrator.js');
vi.mock('../src/config/runtimeConfig.js');

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url)); // repository root
const canonicalTemplatePath = join(repoRoot, 'docs/templates/legilimens-template.md');

describe('Legilimens core gateway module', () => {
  let tempRoot: string;
  let templateDir: string;
  let templatePath: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(join(tmpdir(), 'legilimens-core-'));
    templateDir = join(tempRoot, 'templates');
    await mkdir(templateDir, { recursive: true });
    templatePath = join(templateDir, 'legilimens-template.md');
    await copyFile(canonicalTemplatePath, templatePath);

    // Mock fetchDocumentation to return placeholder by default
    vi.mocked(orchestrator.fetchDocumentation).mockResolvedValue({
      success: false,
      error: 'Default mock failure'
    });

    // Mock runtime config to enable AI generation by default
    vi.mocked(runtimeConfig.getRuntimeConfig).mockReturnValue({
      nodeVersion: 'v20.0.0',
      supportsRequiredNode: true,
      directories: {
        rootDir: tempRoot,
        constitutionDir: join(tempRoot, '.specify/memory'),
        docsDir: join(tempRoot, 'docs'),
        staticBackupDir: join(tempRoot, 'docs/static-backup')
      },
      apiKeys: {},
      fetcherConfig: {
        timeoutMs: 60000,
        maxRetries: 2
      },
      aiCliConfig: {
        enabled: true,
        preferredTool: 'gemini',
        timeoutMs: 30000,
        commandOverride: undefined
      }
    });

    vi.mocked(runtimeConfig.isAiGenerationEnabled).mockReturnValue(true);
  });

  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });

  it('validates the canonical template successfully', async () => {
    const result = await validateTemplate(templatePath);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('flags invalid templates missing placeholders', async () => {
    const invalidTemplate = join(templateDir, 'invalid.md');
    await writeFile(
      invalidTemplate,
      ['# Missing Content', '## Overview', '{{OVERVIEW}}'].join('\n'),
      'utf8'
    );

    const result = await validateTemplate(invalidTemplate);
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it('generates gateway documentation and metadata', async () => {
    const request = {
      templatePath,
      targetDirectory: tempRoot,
      context: {
        variables: {
          dependencyType: 'library',
          dependencyIdentifier: 'lodash',
          deepWikiRepository: 'https://deepwiki.example.com/lodash',
          staticBackupPath: 'static-backup/library_lodash.md'
        },
        minimalMode: false
      }
    };

    const result = await generateGatewayDoc(request);

    expect(result.summary).toContain('Lodash');
    expect(result.metadata.dependencyType).toBe('library');
    expect(result.metadata.gatewayRelativePath).toBe('libraries/library_lodash.md');
    expect(result.metadata.staticBackupRelativePath).toBe('libraries/static-backup/library_lodash.md');
    expect(result.metadata.mcpGuidanceSourceType).toBe('npm');
      expect(result.metadata.mcpGuidanceFlags.context7).toBe(true);
      expect(result.metadata.mcpGuidanceFlags.deepWiki).toBe(false);

    const gatewayContent = await readFile(join(tempRoot, result.metadata.gatewayRelativePath), 'utf8');
    expect(gatewayContent).toContain('Legilimens Gateway: Lodash');
    expect(gatewayContent).toContain('Context7 for package docs. Static files for deep research.');

    const staticContent = await readFile(
      join(tempRoot, result.metadata.staticBackupRelativePath),
      'utf8'
    );
    expect(staticContent).toContain('# Static Backup Placeholder');
  });

  it('formats progress messages consistently', () => {
    const formatted = formatProgress({
      step: 'generate-docs',
      message: 'Building gateway output',
      percentComplete: 42.4
    });
    expect(formatted).toBe(' 42% :: generate docs - Building gateway output');
  });

  describe('documentation fetching integration', () => {
    it('uses fetched content when fetch succeeds', async () => {
      const mockFetchResult = {
        success: true,
        content: '# Real Documentation\n\nThis is real fetched content.',
        metadata: {
          source: 'ref.tools',
          durationMs: 250,
          attempts: ['ref.tools (attempt 1)'],
          timestamp: new Date()
        }
      };

      vi.mocked(orchestrator.fetchDocumentation).mockResolvedValue(mockFetchResult);

      const request = {
        templatePath,
        targetDirectory: tempRoot,
        context: {
          variables: {
            dependencyType: 'library',
            dependencyIdentifier: 'axios',
            deepWikiRepository: 'https://deepwiki.example.com/axios'
          }
        }
      };

      const result = await generateGatewayDoc(request);

      expect(result.metadata.documentationFetched).toBe(true);
      expect(result.metadata.fetchSource).toBe('ref.tools');
      expect(result.metadata.fetchDurationMs).toBeGreaterThanOrEqual(0);
      expect(result.metadata.fetchAttempts).toContain('ref.tools (attempt 1)');
      expect(result.summary).toContain('Documentation fetched from ref.tools');

      const staticContent = await readFile(
        join(tempRoot, result.metadata.staticBackupRelativePath),
        'utf8'
      );
      expect(staticContent).toBe('# Real Documentation\n\nThis is real fetched content.\n');
      expect(staticContent).not.toContain('Placeholder');
    });

    it('falls back to placeholder when fetch fails', async () => {
      const mockFetchResult = {
        success: false,
        error: 'Network timeout after 3 attempts'
      };

      vi.mocked(orchestrator.fetchDocumentation).mockResolvedValue(mockFetchResult);

      const request = {
        templatePath,
        targetDirectory: tempRoot,
        context: {
          variables: {
            dependencyType: 'library',
            dependencyIdentifier: 'unknown-package',
            deepWikiRepository: 'https://deepwiki.example.com/unknown'
          }
        }
      };

      const result = await generateGatewayDoc(request);

      expect(result.metadata.documentationFetched).toBe(false);
      expect(result.metadata.fetchSource).toBeUndefined();
      expect(result.summary).toContain('placeholder created');

      const staticContent = await readFile(
        join(tempRoot, result.metadata.staticBackupRelativePath),
        'utf8'
      );
      expect(staticContent).toContain('# Static Backup Placeholder');
      expect(staticContent).toContain('Automatic fetch failed');
      expect(staticContent).toContain('Network timeout after 3 attempts');
    });

    it('includes fetch metadata in generation result', async () => {
      const mockFetchResult = {
        success: true,
        content: '# Documentation',
        metadata: {
          source: 'Context7',
          durationMs: 150,
          attempts: ['Context7 (attempt 1)'],
          timestamp: new Date()
        }
      };

      vi.mocked(orchestrator.fetchDocumentation).mockResolvedValue(mockFetchResult);

      const request = {
        templatePath,
        targetDirectory: tempRoot,
        context: {
          variables: {
            dependencyType: 'library',
            dependencyIdentifier: 'react'
          }
        }
      };

      const result = await generateGatewayDoc(request);

      expect(result.metadata).toMatchObject({
        documentationFetched: true,
        fetchSource: 'Context7',
        fetchAttempts: ['Context7 (attempt 1)']
      });
      expect(result.metadata.fetchDurationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('AI generation integration', () => {
    beforeEach(() => {
      // Reset AI mocks before each AI test
      vi.clearAllMocks();
    });

    it('uses AI-generated content when AI generation succeeds', async () => {
      const mockAiResult = {
        success: true,
        content: JSON.stringify({
          shortDescription: 'AI-generated description for React',
          features: [
            'Component-based architecture',
            'Virtual DOM for performance',
            'Rich ecosystem and community',
            'Hooks for state management',
            'Server-side rendering support'
          ]
        }),
        toolUsed: 'gemini',
        attempts: ['gemini'],
        durationMs: 2500
      };

      vi.mocked(cliOrchestrator.generateWithCliTool).mockResolvedValue(mockAiResult);

      const request = {
        templatePath,
        targetDirectory: tempRoot,
        context: {
          variables: {
            dependencyType: 'library',
            dependencyIdentifier: 'react',
            deepWikiRepository: 'https://deepwiki.example.com/react'
          }
        }
      };

      const result = await generateGatewayDoc(request);

      expect(result.metadata.aiGenerationEnabled).toBe(true);
      expect(result.metadata.aiToolUsed).toBe('gemini');
      expect(result.metadata.aiGenerationDurationMs).toBeGreaterThanOrEqual(0);
      expect(result.metadata.aiGenerationAttempts).toContain('gemini');
      expect(result.metadata.aiGenerationFailed).toBe(false);
      expect(result.summary).toContain('AI generation succeeded with gemini');

      const gatewayContent = await readFile(join(tempRoot, result.metadata.gatewayRelativePath), 'utf8');
      expect(gatewayContent).toContain('AI-generated description for React');
      expect(gatewayContent).toContain('Curated MCP prompts accelerate work with React (Context7 for NPM).');
    });

    it('falls back to fallback content when AI generation fails', async () => {
      const mockAiResult = {
        success: false,
        error: 'AI tool timeout after 30 seconds',
        attempts: ['gemini', 'codex'],
        durationMs: 60000
      };

      vi.mocked(cliOrchestrator.generateWithCliTool).mockResolvedValue(mockAiResult);

      const request = {
        templatePath,
        targetDirectory: tempRoot,
        context: {
          variables: {
            dependencyType: 'library',
            dependencyIdentifier: 'vue',
            deepWikiRepository: 'https://deepwiki.example.com/vue'
          }
        }
      };

      const result = await generateGatewayDoc(request);

      expect(result.metadata.aiGenerationEnabled).toBe(true);
      expect(result.metadata.aiToolUsed).toBeUndefined();
      expect(result.metadata.aiGenerationFailed).toBe(true);
      expect(result.metadata.aiGenerationError).toBe('AI tool timeout after 30 seconds');
      expect(result.summary).toContain('AI generation failed; used fallback content');

      const gatewayContent = await readFile(join(tempRoot, result.metadata.gatewayRelativePath), 'utf8');
      expect(gatewayContent).toContain('Lightweight Legilimens summary for Vue');
      // Should contain standardized features, not AI-generated ones
      expect(gatewayContent).toContain('Curated MCP prompts accelerate work with Vue (Context7 for NPM).');
    });

    it('skips AI generation when disabled via environment', async () => {
      // Mock AI generation disabled
      vi.mocked(runtimeConfig.isAiGenerationEnabled).mockReturnValue(false);

      const request = {
        templatePath,
        targetDirectory: tempRoot,
        context: {
          variables: {
            dependencyType: 'library',
            dependencyIdentifier: 'angular'
          }
        }
      };

      const result = await generateGatewayDoc(request);

      expect(result.metadata.aiGenerationEnabled).toBe(false);
      expect(result.metadata.aiToolUsed).toBeUndefined();
      expect(cliOrchestrator.generateWithCliTool).not.toHaveBeenCalled();

      const gatewayContent = await readFile(join(tempRoot, result.metadata.gatewayRelativePath), 'utf8');
      expect(gatewayContent).toContain('Lightweight Legilimens summary for Angular');
    });

    it('handles AI generation exceptions gracefully', async () => {
      vi.mocked(cliOrchestrator.generateWithCliTool).mockRejectedValue(new Error('Network error'));

      const request = {
        templatePath,
        targetDirectory: tempRoot,
        context: {
          variables: {
            dependencyType: 'library',
            dependencyIdentifier: 'svelte'
          }
        }
      };

      const result = await generateGatewayDoc(request);

      expect(result.metadata.aiGenerationEnabled).toBe(true);
      expect(result.metadata.aiGenerationFailed).toBe(true);
      expect(result.metadata.aiGenerationError).toBe('Network error');
      expect(result.summary).not.toContain('AI generation succeeded');

      const gatewayContent = await readFile(join(tempRoot, result.metadata.gatewayRelativePath), 'utf8');
      expect(gatewayContent).toContain('Lightweight Legilimens summary for Svelte');
    });

    it('includes AI metadata in generation result', async () => {
      const mockAiResult = {
        success: true,
        content: JSON.stringify({
          shortDescription: 'Test description',
          features: ['f1', 'f2', 'f3', 'f4', 'f5']
        }),
        toolUsed: 'claude',
        attempts: ['claude'],
        durationMs: 1800
      };

      vi.mocked(cliOrchestrator.generateWithCliTool).mockResolvedValue(mockAiResult);

      const request = {
        templatePath,
        targetDirectory: tempRoot,
        context: {
          variables: {
            dependencyType: 'framework',
            dependencyIdentifier: 'nextjs'
          }
        }
      };

      const result = await generateGatewayDoc(request);

      expect(result.metadata).toMatchObject({
        aiGenerationEnabled: true,
        aiToolUsed: 'claude',
        aiGenerationAttempts: ['claude'],
        aiGenerationFailed: false
      });
      expect(result.metadata.aiGenerationDurationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('automatic deepWikiRepository derivation', () => {
    it('derives DeepWiki URL for GitHub repositories when not provided', async () => {
      const request = {
        templatePath,
        targetDirectory: tempRoot,
        context: {
          variables: {
            dependencyType: 'framework',
            dependencyIdentifier: 'vercel/ai'
            // No deepWikiRepository provided
          }
        }
      };

      const result = await generateGatewayDoc(request);

      // Should derive DeepWiki URL automatically
      expect(result.metadata.deepWikiRepository).toBe('https://deepwiki.com/vercel/ai');
      expect(result.summary).toContain('DeepWiki reference: https://deepwiki.com/vercel/ai');
      
      const gatewayContent = await readFile(join(tempRoot, result.metadata.gatewayRelativePath), 'utf8');
      expect(gatewayContent).toContain('https://deepwiki.com/vercel/ai');
    });

    it('uses provided DeepWiki URL when explicitly given', async () => {
      const request = {
        templatePath,
        targetDirectory: tempRoot,
        context: {
          variables: {
            dependencyType: 'framework',
            dependencyIdentifier: 'vercel/ai',
            deepWikiRepository: 'https://custom-deepwiki.com/vercel/ai'
          }
        }
      };

      const result = await generateGatewayDoc(request);

      // Should use provided URL, not derive
      expect(result.metadata.deepWikiRepository).toBe('https://custom-deepwiki.com/vercel/ai');
      expect(result.summary).toContain('DeepWiki reference: https://custom-deepwiki.com/vercel/ai');
    });

    it('derives DeepWiki URL for NPM packages when not provided', async () => {
      const request = {
        templatePath,
        targetDirectory: tempRoot,
        context: {
          variables: {
            dependencyType: 'library',
            dependencyIdentifier: 'lodash'
            // No deepWikiRepository provided
          }
        }
      };

      const result = await generateGatewayDoc(request);

      // Should not derive DeepWiki URL for NPM packages (undefined)
      expect(result.metadata.deepWikiRepository).toBeUndefined();
      expect(result.summary).toContain('MCP tool guidance: Context7');
    });

    it('ignores placeholder DeepWiki URL and derives automatically', async () => {
      const request = {
        templatePath,
        targetDirectory: tempRoot,
        context: {
          variables: {
            dependencyType: 'framework',
            dependencyIdentifier: 'nuxt/nuxt',
            deepWikiRepository: 'https://deepwiki.example.com/legilimens' // Placeholder
          }
        }
      };

      const result = await generateGatewayDoc(request);

      // Should derive real URL, not use placeholder
      expect(result.metadata.deepWikiRepository).toBe('https://deepwiki.com/nuxt/nuxt');
      expect(result.summary).toContain('DeepWiki reference: https://deepwiki.com/nuxt/nuxt');
    });

    it('handles empty string DeepWiki URL by deriving automatically', async () => {
      const request = {
        templatePath,
        targetDirectory: tempRoot,
        context: {
          variables: {
            dependencyType: 'framework',
            dependencyIdentifier: 'nextjs/next',
            deepWikiRepository: '' // Empty string
          }
        }
      };

      const result = await generateGatewayDoc(request);

      // Should derive real URL, not use empty string
      expect(result.metadata.deepWikiRepository).toBe('https://deepwiki.com/nextjs/next');
      expect(result.summary).toContain('DeepWiki reference: https://deepwiki.com/nextjs/next');
    });

    it('handles whitespace-only DeepWiki URL by deriving automatically', async () => {
      const request = {
        templatePath,
        targetDirectory: tempRoot,
        context: {
          variables: {
            dependencyType: 'framework',
            dependencyIdentifier: 'remix/remix',
            deepWikiRepository: '   ' // Whitespace only
          }
        }
      };

      const result = await generateGatewayDoc(request);

      // Should derive real URL, not use whitespace
      expect(result.metadata.deepWikiRepository).toBe('https://deepwiki.com/remix/remix');
      expect(result.summary).toContain('DeepWiki reference: https://deepwiki.com/remix/remix');
    });
  });

  describe('MCP guidance variations by source type', () => {
    it('GitHub source generates DeepWiki MCP guidance', async () => {
      const request = {
        templatePath,
        targetDirectory: tempRoot,
        context: {
          variables: {
            dependencyType: 'library',
            dependencyIdentifier: 'vercel/ai',
            deepWikiRepository: 'https://deepwiki.example.com/vercel/ai'
          }
        }
      };

      const result = await generateGatewayDoc(request);
      const gatewayContent = await readFile(join(tempRoot, result.metadata.gatewayRelativePath), 'utf8');

      assertMcpGuidanceForSourceType(gatewayContent, 'github');
      
      // Verify metadata for GitHub source
      expect(result.metadata.mcpGuidanceSourceType).toBe('github');
      expect(result.metadata.mcpGuidanceFlags.deepWiki).toBe(true);
      expect(result.metadata.mcpGuidanceFlags.context7).toBe(false);
      expect(result.metadata.mcpGuidanceFlags.firecrawl).toBe(false);
      expect(result.metadata.mcpGuidanceFlags.staticOnly).toBe(false);
    });

    it('NPM package generates Context7 MCP guidance', async () => {
      const request = {
        templatePath,
        targetDirectory: tempRoot,
        context: {
          variables: {
            dependencyType: 'library',
            dependencyIdentifier: 'lodash',
            deepWikiRepository: 'https://deepwiki.example.com/lodash'
          }
        }
      };

      const result = await generateGatewayDoc(request);
      const gatewayContent = await readFile(join(tempRoot, result.metadata.gatewayRelativePath), 'utf8');

      assertMcpGuidanceForSourceType(gatewayContent, 'npm');
      
      // Verify metadata for NPM source
      expect(result.metadata.mcpGuidanceSourceType).toBe('npm');
      expect(result.metadata.mcpGuidanceFlags.context7).toBe(true);
      expect(result.metadata.mcpGuidanceFlags.deepWiki).toBe(false);
      expect(result.metadata.mcpGuidanceFlags.firecrawl).toBe(false);
      expect(result.metadata.mcpGuidanceFlags.staticOnly).toBe(false);
    });

    it('Scoped NPM package generates Context7 MCP guidance', async () => {
      const request = {
        templatePath,
        targetDirectory: tempRoot,
        context: {
          variables: {
            dependencyType: 'library',
            dependencyIdentifier: '@supabase/supabase-js',
            deepWikiRepository: 'https://deepwiki.example.com/supabase/supabase-js'
          }
        }
      };

      const result = await generateGatewayDoc(request);
      const gatewayContent = await readFile(join(tempRoot, result.metadata.gatewayRelativePath), 'utf8');

      assertMcpGuidanceForSourceType(gatewayContent, 'npm');
      
      // Verify metadata for scoped NPM source
      expect(result.metadata.mcpGuidanceSourceType).toBe('npm');
      expect(result.metadata.mcpGuidanceFlags.context7).toBe(true);
      expect(result.metadata.mcpGuidanceFlags.deepWiki).toBe(false);
      expect(result.metadata.mcpGuidanceFlags.firecrawl).toBe(false);
      expect(result.metadata.mcpGuidanceFlags.staticOnly).toBe(false);
    });

    it('URL source generates Firecrawl/web-based guidance', async () => {
      const request = {
        templatePath,
        targetDirectory: tempRoot,
        context: {
          variables: {
            dependencyType: 'api',
            dependencyIdentifier: 'https://docs.stripe.com',
            deepWikiRepository: 'https://deepwiki.example.com/stripe'
          }
        }
      };

      const result = await generateGatewayDoc(request);
      const gatewayContent = await readFile(join(tempRoot, result.metadata.gatewayRelativePath), 'utf8');

      assertMcpGuidanceForSourceType(gatewayContent, 'url');
      
      // Verify metadata for URL source
      expect(result.metadata.mcpGuidanceSourceType).toBe('url');
      expect(result.metadata.mcpGuidanceFlags.firecrawl).toBe(true);
      expect(result.metadata.mcpGuidanceFlags.deepWiki).toBe(false);
      expect(result.metadata.mcpGuidanceFlags.context7).toBe(false);
      expect(result.metadata.mcpGuidanceFlags.staticOnly).toBe(false);
    });

    it('Unknown source generates static backup guidance', async () => {
      const request = {
        templatePath,
        targetDirectory: tempRoot,
        context: {
          variables: {
            dependencyType: 'library',
            dependencyIdentifier: 'unknown-format-123',
            deepWikiRepository: 'https://deepwiki.example.com/unknown'
          }
        }
      };

      const result = await generateGatewayDoc(request);
      const gatewayContent = await readFile(join(tempRoot, result.metadata.gatewayRelativePath), 'utf8');

      assertMcpGuidanceForSourceType(gatewayContent, 'unknown');
      
      // Verify metadata for unknown source
      expect(result.metadata.mcpGuidanceSourceType).toBe('unknown');
      expect(result.metadata.mcpGuidanceFlags.staticOnly).toBe(true);
      expect(result.metadata.mcpGuidanceFlags.deepWiki).toBe(false);
      expect(result.metadata.mcpGuidanceFlags.context7).toBe(false);
      expect(result.metadata.mcpGuidanceFlags.firecrawl).toBe(false);
    });

    it('GitHub source generates correct metadata', async () => {
      const request = {
        templatePath,
        targetDirectory: tempRoot,
        context: {
          variables: {
            dependencyType: 'library',
            dependencyIdentifier: 'vercel/ai',
            deepWikiRepository: 'https://deepwiki.example.com/vercel/ai'
          }
        }
      };

      const result = await generateGatewayDoc(request);

      // Verify metadata for GitHub source
      expect(result.metadata.mcpGuidanceSourceType).toBe('github');
      expect(result.metadata.mcpGuidanceFlags.deepWiki).toBe(true);
      expect(result.metadata.mcpGuidanceFlags.context7).toBe(false);
      expect(result.metadata.mcpGuidanceFlags.firecrawl).toBe(false);
      expect(result.metadata.mcpGuidanceFlags.staticOnly).toBe(false);
    });

    it('URL source generates correct metadata', async () => {
      const request = {
        templatePath,
        targetDirectory: tempRoot,
        context: {
          variables: {
            dependencyType: 'api',
            dependencyIdentifier: 'https://docs.stripe.com',
            deepWikiRepository: 'https://deepwiki.example.com/stripe'
          }
        }
      };

      const result = await generateGatewayDoc(request);

      // Verify metadata for URL source
      expect(result.metadata.mcpGuidanceSourceType).toBe('url');
      expect(result.metadata.mcpGuidanceFlags.firecrawl).toBe(true);
      expect(result.metadata.mcpGuidanceFlags.deepWiki).toBe(false);
      expect(result.metadata.mcpGuidanceFlags.context7).toBe(false);
      expect(result.metadata.mcpGuidanceFlags.staticOnly).toBe(false);
    });
  });
});
