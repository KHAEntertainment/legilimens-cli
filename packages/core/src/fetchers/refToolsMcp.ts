/**
 * ref.tools MCP fetcher - Documentation retrieval via Model Context Protocol
 *
 * This is the REAL implementation using ref.tools MCP server.
 * The existing refTools.ts uses a fictional REST API that doesn't exist.
 *
 * @see https://github.com/ref-tools/ref-tools-mcp
 * @see https://api.ref.tools/mcp
 *
 * INSTALLATION REQUIRED:
 * pnpm add @modelcontextprotocol/sdk
 *
 * INTEGRATION PLAN:
 * See /docs/integration/REF_TOOLS_MCP_INTEGRATION.md for complete migration guide
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import type { FetchResult, FetcherConfig } from './types.js';

/**
 * ref.tools MCP server endpoint
 * Supports streamable HTTP protocol (latest MCP spec)
 */
const REF_TOOLS_MCP_ENDPOINT = 'https://api.ref.tools/mcp';

/**
 * MCP client singleton to reuse connections across fetches
 * Initialized on first use and reused for subsequent calls
 */
let mcpClient: Client | null = null;
let currentApiKey: string | null = null;

/**
 * Initialize MCP client with ref.tools server
 * Reuses existing client if API key matches
 */
async function initializeMcpClient(apiKey: string): Promise<Client> {
  // Reuse existing client if API key hasn't changed
  if (mcpClient && currentApiKey === apiKey) {
    return mcpClient;
  }

  // Close existing client if API key changed
  if (mcpClient) {
    await mcpClient.close();
    mcpClient = null;
  }

  // Create new SSE transport with API key in URL
  const transport = new SSEClientTransport(
    new URL(`${REF_TOOLS_MCP_ENDPOINT}?apiKey=${apiKey}`)
  );

  // Create new MCP client
  const client = new Client(
    {
      name: 'legilimens',
      version: '1.0.0'
    },
    {
      capabilities: {
        tools: {} // We only need tools capability
      }
    }
  );

  // Connect to MCP server
  await client.connect(transport);

  mcpClient = client;
  currentApiKey = apiKey;

  return client;
}

/**
 * Fetch documentation from ref.tools using MCP protocol
 *
 * Uses the ref_search_documentation tool which searches curated technical docs
 *
 * @param identifier - Package name, GitHub repo (owner/repo), or search query
 * @param config - Fetcher configuration with API key and retry settings
 * @returns FetchResult with documentation content or error
 */
export async function fetchFromRefToolsMcp(
  identifier: string,
  config: FetcherConfig
): Promise<FetchResult> {
  // Early guard: ref.tools requires API key
  if (!config.apiKey) {
    return {
      success: false,
      error: 'ref.tools API key is required for MCP access'
    };
  }

  const startTime = Date.now();
  const attempts: string[] = [];

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      attempts.push(`ref.tools MCP (attempt ${attempt + 1})`);

      // Initialize MCP client (reuses existing if available)
      const client = await initializeMcpClient(config.apiKey);

      // Call ref_search_documentation tool via MCP
      const result = await client.callTool(
        {
          name: 'ref_search_documentation',
          arguments: {
            query: identifier
          }
        },
        // Use timeout from config
        { timeout: config.timeoutMs }
      );

      // Extract content from MCP response
      if (result.content && Array.isArray(result.content)) {
        // MCP returns content as array of content blocks
        // Typically: [{ type: 'text', text: '...' }]
        const textContent = result.content
          .filter((block: any) => block.type === 'text')
          .map((block: any) => block.text)
          .join('\n\n');

        if (textContent.length > 0) {
          return {
            success: true,
            content: textContent,
            metadata: {
              source: 'ref.tools (MCP)',
              durationMs: Date.now() - startTime,
              attempts,
              timestamp: new Date()
            }
          };
        }
      }

      return {
        success: false,
        error: 'ref.tools MCP returned no documentation content'
      };

    } catch (error) {
      const err = error as Error;

      // Handle timeout errors
      if (err.name === 'TimeoutError' || err.message.includes('timeout')) {
        if (attempt < config.maxRetries) {
          const backoffMs = 100 * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }
      }

      // Handle rate limiting (if MCP server returns this)
      if (err.message.includes('rate limit') || err.message.includes('429')) {
        if (attempt < config.maxRetries) {
          const delayMs = 1000 * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
      }

      // Handle connection errors with retry
      if (
        err.message.includes('ECONNREFUSED') ||
        err.message.includes('ENOTFOUND') ||
        err.message.includes('ETIMEDOUT')
      ) {
        if (attempt < config.maxRetries) {
          const backoffMs = 100 * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }
      }

      // Final attempt failed
      if (attempt === config.maxRetries) {
        return {
          success: false,
          error: `ref.tools MCP fetch failed: ${err.message}`
        };
      }
    }
  }

  return {
    success: false,
    error: 'ref.tools MCP fetch failed after all retry attempts'
  };
}

/**
 * Cleanup function to close MCP client connection
 * Call this when shutting down the application
 */
export async function closeRefToolsMcpClient(): Promise<void> {
  if (mcpClient) {
    await mcpClient.close();
    mcpClient = null;
    currentApiKey = null;
  }
}
