import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, mkdir, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { FastifyInstance } from 'fastify';
import {
  generateGatewayDoc,
  normalizeModuleResult,
  normalizeHarnessResponse,
  type HarnessGatewayResponse
} from '@legilimens/core';
import { createServer } from '@legilimens/harness-service/server.js';

interface ScenarioInput {
  name: string;
  dependencyType: 'framework' | 'api' | 'library' | 'tool';
  identifier: string;
  deepWikiRepository: string;
  staticBackupPath?: string; // Optional since core ignores this field
  minimalMode: boolean;
}

const TEMPLATE_VERSION = '2.0.0';

describe('Legilimens parity harness', () => {
  let server: FastifyInstance;
  let tempRoot: string;
  let originalRoot: string | undefined;
  let originalDocsDir: string | undefined;

  const templateSource = resolve(
    process.cwd(),
    'docs/templates/legilimens-template.md'
  );

  const scenarios: ScenarioInput[] = [
    {
      name: 'library-lodash',
      dependencyType: 'library',
      identifier: 'lodash',
      deepWikiRepository: '', // Will be derived automatically
      staticBackupPath: 'static-backup/library_lodash.md',
      minimalMode: false
    },
    {
      name: 'framework-nuxt',
      dependencyType: 'framework',
      identifier: 'nuxt/nuxt',
      deepWikiRepository: 'https://deepwiki.example.com/nuxt',
      staticBackupPath: 'static-backup/framework_nuxt.md',
      minimalMode: true
    },
    {
      name: 'tool-eslint',
      dependencyType: 'tool',
      identifier: 'eslint',
      deepWikiRepository: '', // Will be derived automatically
      staticBackupPath: 'static-backup/tool_eslint.md',
      minimalMode: false
    }
  ];

  const automaticDerivationScenarios: ScenarioInput[] = [
    {
      name: 'library-lodash-auto',
      dependencyType: 'library',
      identifier: 'lodash',
      deepWikiRepository: '', // Will be derived automatically
      staticBackupPath: 'static-backup/library_lodash.md',
      minimalMode: false
    },
    {
      name: 'framework-vercel-ai-auto',
      dependencyType: 'framework',
      identifier: 'vercel/ai',
      deepWikiRepository: '', // Will be derived automatically
      staticBackupPath: 'static-backup/framework_vercel_ai.md',
      minimalMode: false
    },
    {
      name: 'api-stripe-auto',
      dependencyType: 'api',
      identifier: 'https://stripe.com/docs',
      deepWikiRepository: '', // Will be derived automatically
      staticBackupPath: 'static-backup/api_stripe.md',
      minimalMode: true
    },
    {
      name: 'tool-eslint-auto',
      dependencyType: 'tool',
      identifier: 'eslint',
      deepWikiRepository: '', // Will be derived automatically
      staticBackupPath: 'static-backup/tool_eslint.md',
      minimalMode: false
    }
  ];

  beforeAll(async () => {
    tempRoot = await mkdtemp(join(tmpdir(), 'legilimens-parity-'));
    const templateDir = join(tempRoot, 'templates');
    await mkdir(templateDir, { recursive: true });
    await copyFile(templateSource, join(templateDir, 'legilimens-template.md'));

    originalRoot = process.env.LEGILIMENS_ROOT;
    originalDocsDir = process.env.LEGILIMENS_DOCS_DIR;
    process.env.LEGILIMENS_ROOT = tempRoot;
    process.env.LEGILIMENS_DOCS_DIR = '.';

    server = createServer();
  });

  afterAll(async () => {
    if (server) {
      await server.close();
    }

    if (originalRoot === undefined) {
      delete process.env.LEGILIMENS_ROOT;
    } else {
      process.env.LEGILIMENS_ROOT = originalRoot;
    }

    if (originalDocsDir === undefined) {
      delete process.env.LEGILIMENS_DOCS_DIR;
    } else {
      process.env.LEGILIMENS_DOCS_DIR = originalDocsDir;
    }

    await rm(tempRoot, { recursive: true, force: true });
  });

  scenarios.forEach((scenario) => {
    it(`produces matching artifacts for ${scenario.name}`, async () => {
      const templatePath = join(tempRoot, 'templates/legilimens-template.md');

      // Test core module
      const request = {
        templatePath,
        targetDirectory: tempRoot,
        context: {
          variables: {
            dependencyType: scenario.dependencyType,
            dependencyIdentifier: scenario.identifier,
            ...(scenario.deepWikiRepository && { deepWikiRepository: scenario.deepWikiRepository }),
            ...(scenario.staticBackupPath && { staticBackupPath: scenario.staticBackupPath })
          },
          minimalMode: scenario.minimalMode
        }
      };

      const moduleResult = await generateGatewayDoc(request);
      const moduleNormalized = await normalizeModuleResult(moduleResult);

      // Verify automatic derivation worked when deepWikiRepository is empty
      if (!scenario.deepWikiRepository) {
        // For GitHub sources, should derive DeepWiki URL
        if (scenario.identifier.includes('/')) {
          expect(moduleResult.metadata.deepWikiRepository).toBeDefined();
          expect(moduleResult.metadata.deepWikiRepository).not.toBe('');
        } else {
          // For non-GitHub sources, should be undefined
          expect(moduleResult.metadata.deepWikiRepository).toBeUndefined();
        }
      }

      // Test harness service
      const response = await server.inject({
        method: 'POST',
        url: '/legilimens/generate',
        payload: {
          dependency: {
            type: scenario.dependencyType,
            identifier: scenario.identifier
          },
          metadata: {
            ...(scenario.deepWikiRepository && { deepWikiRepository: scenario.deepWikiRepository }),
            ...(scenario.staticBackupPath && { staticBackupPath: scenario.staticBackupPath })
          },
          options: {
            minimalMode: scenario.minimalMode
          },
          templateVersion: TEMPLATE_VERSION
        }
      });

      expect(response.statusCode).toBe(200);
      const payload = response.json() as HarnessGatewayResponse;
      const harnessNormalized = normalizeHarnessResponse(payload);

      // Verify harness also derived automatically when deepWikiRepository is empty
      if (!scenario.deepWikiRepository) {
        // For GitHub sources, should derive DeepWiki URL
        if (scenario.identifier.includes('/')) {
          expect(payload.metadata.deepWikiRepository).toBeDefined();
          expect(payload.metadata.deepWikiRepository).not.toBe('');
        } else {
          // For non-GitHub sources, should be undefined
          expect(payload.metadata.deepWikiRepository).toBeUndefined();
        }
      }

      expect(harnessNormalized).toStrictEqual(moduleNormalized);
    });
  });

  automaticDerivationScenarios.forEach((scenario) => {
    it(`produces matching artifacts for ${scenario.name} with automatic derivation`, async () => {
      const templatePath = join(tempRoot, 'templates/legilimens-template.md');

      // Test core module without deepWikiRepository
      const request = {
        templatePath,
        targetDirectory: tempRoot,
        context: {
          variables: {
            dependencyType: scenario.dependencyType,
            dependencyIdentifier: scenario.identifier,
            ...(scenario.staticBackupPath && { staticBackupPath: scenario.staticBackupPath })
            // No deepWikiRepository provided - should be derived automatically
          },
          minimalMode: scenario.minimalMode
        }
      };

      const moduleResult = await generateGatewayDoc(request);
      const moduleNormalized = await normalizeModuleResult(moduleResult);

      // Verify automatic derivation worked
      expect(moduleResult.metadata.deepWikiRepository).toBeDefined();
      expect(moduleResult.metadata.deepWikiRepository).not.toBe('');

      // Test harness service without deepWikiRepository
      const response = await server.inject({
        method: 'POST',
        url: '/legilimens/generate',
        payload: {
          dependency: {
            type: scenario.dependencyType,
            identifier: scenario.identifier
          },
          metadata: {
            ...(scenario.staticBackupPath && { staticBackupPath: scenario.staticBackupPath })
            // No deepWikiRepository provided - should be derived automatically
          },
          options: {
            minimalMode: scenario.minimalMode
          },
          templateVersion: TEMPLATE_VERSION
        }
      });

      expect(response.statusCode).toBe(200);
      const payload = response.json() as HarnessGatewayResponse;
      const harnessNormalized = normalizeHarnessResponse(payload);

      // Verify harness also derived automatically
      expect(payload.metadata.deepWikiRepository).toBeDefined();
      expect(payload.metadata.deepWikiRepository).not.toBe('');

      // Both should produce the same normalized result
      expect(harnessNormalized).toStrictEqual(moduleNormalized);
    });
  });

  // Special test for Tool-type automatic derivation
  it('produces matching artifacts for tool-eslint-auto with NPM source detection', async () => {
    const templatePath = join(tempRoot, 'templates/legilimens-template.md');

    // Test core module without deepWikiRepository
    const request = {
      templatePath,
      targetDirectory: tempRoot,
      context: {
        variables: {
            dependencyType: 'tool',
            dependencyIdentifier: 'eslint'
            // No deepWikiRepository or staticBackupPath provided - should be derived automatically
        },
        minimalMode: false
      }
    };

    const moduleResult = await generateGatewayDoc(request);
    const moduleNormalized = await normalizeModuleResult(moduleResult);

    // Verify automatic derivation worked and detected NPM source
    expect(moduleResult.metadata.deepWikiRepository).toBeUndefined();
    expect(moduleResult.metadata.mcpGuidanceSourceType).toBe('npm');
    expect(moduleResult.metadata.mcpGuidanceFlags.context7).toBe(true);
    expect(moduleResult.metadata.mcpGuidanceFlags.deepWiki).toBe(false);

    // Test harness service without deepWikiRepository
    const response = await server.inject({
      method: 'POST',
      url: '/legilimens/generate',
      payload: {
        dependency: {
          type: 'tool',
          identifier: 'eslint'
        },
        metadata: {
          // No deepWikiRepository or staticBackupPath provided - should be derived automatically
        },
        options: {
          minimalMode: false
        },
        templateVersion: TEMPLATE_VERSION
      }
    });

    expect(response.statusCode).toBe(200);
    const payload = response.json() as HarnessGatewayResponse;
    const harnessNormalized = normalizeHarnessResponse(payload);

    // Verify harness also derived automatically and detected NPM source
    expect(payload.metadata.deepWikiRepository).toBeUndefined();
    expect(payload.gateway.mcpGuidanceSourceType).toBe('npm');
    expect(payload.gateway.mcpGuidanceFlags.context7).toBe(true);
    expect(payload.gateway.mcpGuidanceFlags.deepWiki).toBe(false);

    // Both should produce the same normalized result
    expect(harnessNormalized).toStrictEqual(moduleNormalized);
  });
});
