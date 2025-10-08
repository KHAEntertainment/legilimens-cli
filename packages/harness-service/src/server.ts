import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import {
  assertSupportedNode,
  generateGatewayDoc,
  type GatewayGenerationResult
} from '@legilimens/core';

const HARNESS_VERSION = '0.1.0';
const EXPECTED_TEMPLATE_VERSION = '2.0.0';

export const DEFAULT_PORT = 8787;

interface GenerateRequestBody {
  dependency: {
    type: string;
    identifier: string;
  };
  metadata: {
    deepWikiRepository: string;
    staticBackupPath: string;
    asciiAssetId?: string;
  };
  options?: {
    minimalMode?: boolean;
    lowContrast?: boolean;
    locale?: string;
  };
  templateVersion: string;
}

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
}

const toBadRequest = (message: string): ErrorResponse => ({
  statusCode: 400,
  error: 'Bad Request',
  message
});

export function createServer(): FastifyInstance {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test'
  });

  app.get('/health', async (_request, reply) => {
    return reply.send({ status: 'ok', version: HARNESS_VERSION });
  });

  app.post<{ Body: GenerateRequestBody }>('/legilimens/generate', async (request, reply) => {
    const { body } = request;

    if (!body?.dependency?.identifier || !body?.dependency?.type) {
      return reply.code(400).send(
        toBadRequest('Missing dependency identifier or type.')
      );
    }

    if (!body?.metadata?.deepWikiRepository || !body?.metadata?.staticBackupPath) {
      return reply.code(400).send(
        toBadRequest('DeepWiki repository and static-backup path are required.')
      );
    }

    if (!body?.templateVersion) {
      return reply.code(400).send(toBadRequest('Template version must be provided.'));
    }

    if (body.templateVersion !== EXPECTED_TEMPLATE_VERSION) {
      return reply.code(400).send(
        toBadRequest(
          `Template version mismatch. Expected ${EXPECTED_TEMPLATE_VERSION}, received ${body.templateVersion}.`
        )
      );
    }

    try {
      const runtime = assertSupportedNode(process.env);
      const docsDir = runtime.directories.docsDir;
      const templatePath = resolve(docsDir, 'templates/legilimens-template.md');

      const result: GatewayGenerationResult = await generateGatewayDoc({
        templatePath,
        targetDirectory: docsDir,
        context: {
          variables: {
            dependencyType: body.dependency.type,
            dependencyIdentifier: body.dependency.identifier,
            deepWikiRepository: body.metadata.deepWikiRepository,
            staticBackupPath: body.metadata.staticBackupPath,
            asciiAssetId: body.metadata.asciiAssetId
          },
          minimalMode: Boolean(body.options?.minimalMode)
        }
      });

      const [gatewayContent, staticBackupContent] = await Promise.all([
        readFile(result.metadata.gatewayPath, 'utf8'),
        readFile(result.metadata.staticBackupPath, 'utf8')
      ]);

      return reply.code(200).send({
        gateway: {
          filename: result.metadata.gatewayRelativePath,
          content: gatewayContent,
          deepWikiGuidanceIncluded: result.metadata.deepWikiGuidanceIncluded
        },
        staticBackup: {
          filename: result.metadata.staticBackupRelativePath,
          content: staticBackupContent
        },
        metadata: {
          sessionId: result.metadata.sessionId,
          generationDurationMs: result.metadata.generationDurationMs,
          templateValidated: result.metadata.templateValidated,
          dependencyType: result.metadata.dependencyType,
          dependencyIdentifier: result.metadata.dependencyIdentifier,
          deepWikiRepository: result.metadata.deepWikiRepository,
          minimalMode: result.metadata.minimalMode,
          performanceSummary: result.metadata.performanceSummary,
          performance: result.metadata.performance
        }
      });
    } catch (error) {
      request.log.error(error);
      const err = error instanceof Error ? error : new Error(String(error));
      const isTemplateIssue = err.message.toLowerCase().includes('template');

      return reply.code(isTemplateIssue ? 400 : 500).send({
        statusCode: isTemplateIssue ? 400 : 500,
        error: isTemplateIssue ? 'Bad Request' : 'Internal Server Error',
        message: err.message
      });
    }
  });

  return app;
}

async function start(): Promise<void> {
  const server = createServer();
  const port = Number.parseInt(process.env.PORT ?? `${DEFAULT_PORT}`, 10);
  try {
    await server.listen({ port, host: '0.0.0.0' });
    server.log.info(`Harness service listening on ${port}`);
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
}

const thisFile = fileURLToPath(import.meta.url);
const isExecutedDirectly = process.argv[1] === thisFile;

if (isExecutedDirectly) {
  void start();
}
