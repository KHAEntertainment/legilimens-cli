/**
 * Parameters for building AI generation prompts
 */
export interface PromptParams {
  dependencyName: string;
  dependencyType: string;
  fetchedDocumentation: string;
  deepWikiUrl?: string;
  officialSourceUrl?: string;
  sourceType?: string;
}

/**
 * AI-generated content structure
 */
export interface AiGeneratedContent {
  shortDescription: string;
  features: string[];
}

/**
 * Result of prompt building
 */
export interface PromptBuildResult {
  prompt: string;
  metadata: {
    estimatedTokens: number;
    truncated: boolean;
  };
}

const MAX_DOCUMENTATION_LENGTH = 100000; // 100KB
const TRUNCATION_MESSAGE = '\n\n[Documentation truncated for length...]';

/**
 * Build AI generation prompt for gateway documentation
 */
export function buildGatewayGenerationPrompt(params: PromptParams): PromptBuildResult {
  // Validate inputs
  if (!params.fetchedDocumentation || params.fetchedDocumentation.trim().length === 0) {
    console.warn('Empty documentation provided to prompt builder');
  }

  // Truncate documentation if too large
  let documentation = params.fetchedDocumentation;
  let truncated = false;

  if (documentation.length > MAX_DOCUMENTATION_LENGTH) {
    documentation = documentation.substring(0, MAX_DOCUMENTATION_LENGTH) + TRUNCATION_MESSAGE;
    truncated = true;
    console.warn(`Documentation truncated from ${params.fetchedDocumentation.length} to ${MAX_DOCUMENTATION_LENGTH} bytes`);
  }

  // Build structured prompt
  const prompt = `You are a technical documentation specialist. Generate concise gateway documentation content.

DEPENDENCY: ${params.dependencyName}
TYPE: ${params.dependencyType}

TASK: Generate ONLY the following content (do not include markdown headers):
1. SHORT_DESCRIPTION: 2-3 sentence description of what this dependency does and why it's useful
2. FEATURE_1: First key capability (one line)
3. FEATURE_2: Second key capability (one line)
4. FEATURE_3: Third key capability (one line)
5. FEATURE_4: Fourth key capability (one line)
6. FEATURE_5: Fifth key capability (one line)

CRITICAL: You MUST respond with ONLY valid JSON. Do not include any explanatory text, markdown formatting, or conversational responses.

OUTPUT FORMAT (JSON):
{
  "shortDescription": "...",
  "features": ["...", "...", "...", "...", "..."]
}

SOURCE DOCUMENTATION:
${documentation}

Remember: Respond with ONLY the JSON object above. No other text.`;

  // Rough token estimate (4 chars ≈ 1 token)
  const estimatedTokens = Math.ceil(prompt.length / 4);

  return {
    prompt,
    metadata: {
      estimatedTokens,
      truncated,
    },
  };
}

/**
 * Parse AI response and extract structured content
 */
export function parseAiResponse(response: string): AiGeneratedContent {
  // Try to extract JSON from response (handle markdown code blocks)
  let jsonContent = response.trim();

  // Remove markdown code block if present
  const codeBlockMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    jsonContent = codeBlockMatch[1].trim();
  }

  // Parse JSON
  let parsed: any;
  try {
    parsed = JSON.parse(jsonContent);
  } catch (error) {
    throw new Error(`Failed to parse AI response as JSON: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Validate structure
  if (!parsed.shortDescription || typeof parsed.shortDescription !== 'string') {
    throw new Error('AI response missing or invalid shortDescription field');
  }

  if (!Array.isArray(parsed.features) || parsed.features.length < 1 || parsed.features.length > 10) {
    throw new Error(`AI response must include 1-10 features, got ${parsed.features?.length || 0}`);
  }

  // Validate all features are strings
  for (let i = 0; i < parsed.features.length; i++) {
    if (typeof parsed.features[i] !== 'string') {
      throw new Error(`Feature ${i + 1} must be a string`);
    }
  }

  return {
    shortDescription: parsed.shortDescription,
    features: parsed.features,
  };
}

/**
 * Generate fallback content when AI generation fails
 */
export function generateFallbackContent(params: PromptParams): AiGeneratedContent {
  // Build short description
  const shortDescription = `${params.dependencyName} is a ${params.dependencyType} that provides essential functionality for modern development. This gateway provides comprehensive documentation and integration guidance.`;

  // Build feature list based on dependency type
  const features: string[] = [];

  switch (params.dependencyType.toLowerCase()) {
    case 'npm':
    case 'package':
      features.push(
        'Complete API reference and usage examples',
        'Installation and configuration guidance',
        'Integration patterns and best practices',
        'Troubleshooting and common issues',
        'Version compatibility information'
      );
      break;

    case 'github':
    case 'repository':
      features.push(
        'Repository overview and project structure',
        'Setup and installation instructions',
        'API documentation and code examples',
        'Contributing guidelines and development workflow',
        'Issue tracking and community resources'
      );
      break;

    default:
      features.push(
        'Comprehensive documentation and guides',
        'Quick start and getting started resources',
        'API reference and code examples',
        'Best practices and usage patterns',
        'Community support and resources'
      );
  }

  // Ensure exactly 5 features
  while (features.length < 5) {
    features.push('Additional documentation and resources');
  }

  return {
    shortDescription,
    features: features.slice(0, 5),
  };
}
