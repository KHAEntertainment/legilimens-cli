import { intro, outro, text, spinner, note, confirm, cancel, select } from '@clack/prompts';
import {
  generateGatewayDoc,
  detectSourceTypeWithAI,
  getRuntimeConfig,
  isLocalLlmEnabled
} from '@legilimens/core';
import type { GatewayGenerationRequest } from '@legilimens/core';
import { loadUserConfig, isSetupRequired } from '../config/userConfig.js';
import { debugLogger } from '../utils/debugLogger.js';

export interface ClackFlowResult {
  success: boolean;
  artifacts?: string[];
  error?: string;
}

export async function runClackGenerationFlow(templatePath: string, targetDirectory: string): Promise<ClackFlowResult> {
  
  debugLogger.log('GenerationFlow', 'Flow started', { templatePath, targetDirectory });

  if (process.env.LEGILIMENS_DEBUG) {
    console.log('[DEBUG] Generation flow started');
    console.log('[DEBUG] Template path:', templatePath);
    console.log('[DEBUG] Target directory:', targetDirectory);
  }

  if (process.env.LEGILIMENS_DEBUG) {
  }
  
  intro('🪄 Reading the minds of repositories');

  try {
    debugLogger.log('GenerationFlow', 'Loading user config');
    const userConfig = loadUserConfig();
    debugLogger.log('GenerationFlow', 'User config loaded', { 
      hasLocalLlm: !!userConfig.localLlm,
      hasTavilyKey: !!userConfig.apiKeys.tavily 
    });
    
    debugLogger.log('GenerationFlow', 'Getting runtime config');
    const runtimeConfig = getRuntimeConfig();
    debugLogger.log('GenerationFlow', 'Runtime config loaded');
    
    debugLogger.log('GenerationFlow', 'Checking setup status');
    const setupRequired = await isSetupRequired();
    debugLogger.log('GenerationFlow', 'Setup required', { setupRequired });

    // Pre-flight check: Enforce at least one AI provider before proceeding
    const tavilyPresent = Boolean(process.env.TAVILY_API_KEY || userConfig.apiKeys.tavily);
    const localLlmPresent = isLocalLlmEnabled(runtimeConfig);

    if (!localLlmPresent && !tavilyPresent) {
      outro('❌ Setup required');
      return { 
        success: false, 
        error: 'No AI provider configured. At least one of (Tavily API key OR Local LLM) is required. Run setup wizard first.' 
      };
    }

    if (!isLocalLlmEnabled(runtimeConfig) && tavilyPresent) {
      note('Local LLM not configured and will be skipped.\n\nRun \'legilimens setup\' to configure', 'Configuration Warning');
    }

    // Step 1: Dependency identifier (natural language or canonical)
    debugLogger.log('GenerationFlow', 'Prompting for dependency identifier');
    const identifier = await text({
      message: 'What do you need documentation on?',
      placeholder: 'e.g., "AG-UI", "React", "vercel/ai", "https://github.com/org/repo"',
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Dependency identifier cannot be empty';
        }
      },
    });

    debugLogger.log('GenerationFlow', 'Identifier received', { identifier, type: typeof identifier });

    if (typeof identifier === 'symbol') {
      debugLogger.log('GenerationFlow', 'User cancelled at identifier prompt');
      outro('Cancelled');
      return { success: false, error: 'Operation cancelled by user' };
    }

    // Step 2: Detect source type and dependency type with AI assistance
    const s = spinner();
    s.start('Detecting dependency source and type with AI');

    let detection: Awaited<ReturnType<typeof detectSourceTypeWithAI>>;
    let sourceHint;
    let dependencyType;
    let repositoryUrl;
    let userDeclinedContext7 = false;
    let alreadySelectedFromContext7 = false;
    try {
      debugLogger.log('GenerationFlow', 'Starting AI detection', { identifier: String(identifier) });
      detection = await detectSourceTypeWithAI(String(identifier), { enableSelection: true });
      debugLogger.log('GenerationFlow', 'AI detection complete', { detection });
      sourceHint = detection.aiAssisted ? ' (AI-assisted)' : '';
      dependencyType = detection.dependencyType || 'other';
      // Extract repositoryUrl if available from PipelineResult
      repositoryUrl = detection.repositoryUrl;
      s.stop(`Source detected: ${detection.sourceType}, Type: ${dependencyType}${sourceHint}`);
    } catch (error) {
      debugLogger.error('GenerationFlow', error instanceof Error ? error : new Error(String(error)), { identifier: String(identifier) });
      s.stop('Detection failed');
      throw error;
    }

    // Check for multiple Context7 results and show selection prompt
    if (detection.context7Results && 
        detection.context7Results.length > 1 && 
        !alreadySelectedFromContext7) {
      
      // Mark that we've shown selection (prevent infinite loop)
      alreadySelectedFromContext7 = true;
      
      debugLogger.log('GenerationFlow', 'Multiple Context7 results found', { count: detection.context7Results.length });
      debugLogger.log('GenerationFlow', 'Showing package selection prompt');

      // Build options array with package results + "None of these"
      const options = [
        ...detection.context7Results.map((result: { name: string; score: number; url: string }) => ({
          value: result.name,
          label: `${result.name} (score: ${result.score.toFixed(2)}) - ${result.url}`
        })),
        {
          value: null,
          label: 'None of these - search with Tavily instead'
        }
      ];

      // Show selection prompt
      const selectedPackage = await select({
        message: 'Multiple packages found. Select the correct one:',
        options
      });

      debugLogger.log('GenerationFlow', 'User selection', { selectedPackage: String(selectedPackage) });

      // Handle user cancellation
      if (typeof selectedPackage === 'symbol') {
        debugLogger.log('GenerationFlow', 'User cancelled at Context7 selection prompt');
        outro('Cancelled');
        return { success: false, error: 'Operation cancelled by user' };
      }

      // Handle "None of these" selection
      if (selectedPackage === null) {
        debugLogger.log('GenerationFlow', 'User declined Context7 suggestions, triggering Tavily fallback');
        userDeclinedContext7 = true;
        
        // Actively trigger Tavily discovery by temporarily disabling selection mode
        const s5 = spinner();
        s5.start('Searching with Tavily');
        
        try {
          debugLogger.log('GenerationFlow', 'Calling detectSourceTypeWithAI with selection disabled', { identifier: String(identifier) });
          // Call with enableSelection: false to force Tavily path
          detection = await detectSourceTypeWithAI(String(identifier), { enableSelection: false });
          debugLogger.log('GenerationFlow', 'Tavily detection complete', { detection });
          
          // Update dependent variables
          sourceHint = detection.aiAssisted ? ' (AI-assisted)' : '';
          dependencyType = detection.dependencyType || 'other';
          repositoryUrl = detection.repositoryUrl;
          
          s5.stop(`Tavily search complete: ${detection.sourceType}, Type: ${dependencyType}${sourceHint}`);
        } catch (error) {
          debugLogger.error('GenerationFlow', error instanceof Error ? error : new Error(String(error)), { identifier: String(identifier) });
          s5.stop('Tavily search failed');
          throw error;
        }
      } else {
        // User selected a specific package - use it directly without re-running selection
        debugLogger.log('GenerationFlow', 'Using selected package directly', { packageName: String(selectedPackage) });

        const s4 = spinner();
        s4.start('Detecting source for selected package');

        try {
          // Call with enableSelection: false to get deterministic result for the chosen package
          detection = await detectSourceTypeWithAI(String(selectedPackage), { enableSelection: false });
          debugLogger.log('GenerationFlow', 'Detection complete for selected package', { detection });

          // Update dependent variables
          sourceHint = detection.aiAssisted ? ' (AI-assisted)' : '';
          dependencyType = detection.dependencyType || 'other';
          repositoryUrl = detection.repositoryUrl;

          s4.stop(`Source detected: ${detection.sourceType}, Type: ${dependencyType}${sourceHint}`);
        } catch (error) {
          debugLogger.error('GenerationFlow', error instanceof Error ? error : new Error(String(error)), { selectedPackage: String(selectedPackage) });
          s4.stop('Detection failed');
          throw error;
        }
      }
    }

    // Secondary fallback: if re-detection still yields multiple results after user selection
    // Skip this block if user declined Context7 suggestions
    if (detection.context7Results && 
        detection.context7Results.length > 1 && 
        alreadySelectedFromContext7 &&
        !userDeclinedContext7) {
      
      debugLogger.log('GenerationFlow', 'Re-detection returned multiple results after user selection', { 
        count: detection.context7Results.length 
      });
      
      // Auto-select the top-scoring candidate
      const topCandidate = detection.context7Results[0];
      debugLogger.log('GenerationFlow', 'Auto-selecting top-scoring candidate', { 
        name: topCandidate.name, 
        score: topCandidate.score 
      });
      
      // Update detection to use top candidate
      detection = {
        sourceType: 'npm',
        normalizedIdentifier: topCandidate.name,
        confidence: 'medium',
        aiAssisted: false,
        dependencyType: 'library'
      };
      
      // Update dependent variables
      sourceHint = '';
      dependencyType = 'library';
      repositoryUrl = undefined;
      
      debugLogger.log('GenerationFlow', 'Secondary fallback: auto-selected top candidate', { detection });
    }

    // Manual URL fallback when detection returns unknown
    if (detection.sourceType === 'unknown') {
      note('Could not auto-detect source. Please provide the documentation URL or GitHub identifier.\n\nExamples: https://docs.example.com or https://github.com/owner/repo or owner/repo', 'Detection Failed');

      const manualUrl = await text({
        message: 'Documentation URL or GitHub identifier:',
        placeholder: 'e.g., https://docs.strapi.io or https://github.com/strapi/strapi or strapi/strapi',
        validate: (value) => {
          if (!value || !value.trim()) {
            return 'URL or GitHub identifier is required';
          }
          // Check if it's a URL (contains ://) or GitHub URL (contains github.com/) or owner/repo format
          const trimmed = value.trim();
          const isUrl = trimmed.includes('://');
          const isGithubUrl = trimmed.includes('github.com/');
          const isOwnerRepo = /^[^\/\s]+\/[^\/\s]+$/.test(trimmed);

          if (!isUrl && !isGithubUrl && !isOwnerRepo) {
            return 'Please provide a valid URL (https://...), GitHub URL containing github.com/, or owner/repo identifier';
          }
        },
      });

      if (typeof manualUrl === 'symbol') {
        debugLogger.log('GenerationFlow', 'User cancelled at manual URL prompt');
        outro('Cancelled');
        return { success: false, error: 'Operation cancelled by user' };
      }

      debugLogger.log('GenerationFlow', 'User provided manual URL', { manualUrl: String(manualUrl) });

      // Re-run detection with manual URL
      const s4 = spinner();
      s4.start('Re-detecting source with provided URL');
      
      try {
        detection = await detectSourceTypeWithAI(String(manualUrl), { enableSelection: true });
        debugLogger.log('GenerationFlow', 'Re-detection complete', { detection });
        sourceHint = detection.aiAssisted ? ' (AI-assisted)' : '';
        dependencyType = detection.dependencyType || 'other';
        repositoryUrl = detection.repositoryUrl;
        s4.stop(`Source detected: ${detection.sourceType}, Type: ${dependencyType}${sourceHint}`);
      } catch (error) {
        debugLogger.error('GenerationFlow', error instanceof Error ? error : new Error(String(error)), { manualUrl: String(manualUrl) });
        s4.stop('Re-detection failed');
        throw error;
      }
      
      // If detection still returns unknown after manual input, continue anyway
      // The orchestrator will attempt Context7/Firecrawl as fallback
    }

    // Step 3: Minimal mode
    const minimalMode = await confirm({
      message: 'Enable minimal mode (low-contrast, ANSI-free)?',
      initialValue: false,
    });

    if (typeof minimalMode === 'symbol') {
      outro('Cancelled');
      return { success: false, error: 'Operation cancelled by user' };
    }

    // Step 4: Generate (multi-stage progress)
    const s1 = spinner();
    s1.start('Validating template');
    
    const request: GatewayGenerationRequest = {
      templatePath,
      targetDirectory,
      context: {
        variables: {
          dependencyType: String(dependencyType),
          dependencyIdentifier: detection.normalizedIdentifier || String(identifier),
          sourceType: detection.sourceType,
          repositoryUrl: repositoryUrl,
        },
        minimalMode: Boolean(minimalMode),
      },
    };

    debugLogger.log('GenerationFlow', 'Generation request created', { request });

    s1.stop('Template validated');

    const s2 = spinner();
    s2.start('Fetching documentation');
    
    debugLogger.log('GenerationFlow', 'Calling generateGatewayDoc');
    const result = await generateGatewayDoc(request);
    debugLogger.log('GenerationFlow', 'Generation complete', { 
      success: true,
      metadata: result.metadata 
    });

    s2.stop('Documentation fetched');

    const s3 = spinner();
    s3.start('Writing gateway files');
    s3.stop('Gateway files written');

    // Step 5: Summary
    const summaryLines = [
      `Gateway doc: ${result.metadata.gatewayRelativePath}`,
      `Static backup: ${result.metadata.staticBackupRelativePath}`,
      result.metadata.deepWikiRepository ? `DeepWiki: ${result.metadata.deepWikiRepository}` : '',
      `Duration: ${result.metadata.generationDurationMs}ms`,
    ];

    // Add fetch metadata for diagnosis
    if (result.metadata.documentationFetched) {
      if (result.metadata.fetchSource) {
        summaryLines.push(`Fetch source: ${result.metadata.fetchSource} (${result.metadata.fetchDurationMs}ms)`);
      }
      if (result.metadata.fetchAttempts && result.metadata.fetchAttempts.length > 0) {
        summaryLines.push(`Fetch attempts: ${result.metadata.fetchAttempts.join(', ')}`);
      }
    } else {
      // Documentation fetch failed - provide actionable guidance
      summaryLines.push('⚠️  Documentation fetch failed');
      if (detection.normalizedIdentifier) {
        summaryLines.push(`AI detected: ${detection.normalizedIdentifier}`);
      }
      if (result.metadata.fetchAttempts && result.metadata.fetchAttempts.length > 0) {
        summaryLines.push(`Attempted: ${result.metadata.fetchAttempts.join(', ')}`);
      }
      summaryLines.push('Tip: Try formats like owner/repo, package-name, or https://docs.url');
    }

    note(summaryLines.filter(Boolean).join('\n'), 'Generation Summary');

    // Step 6: Continue or quit
    const continueFlow = await confirm({
      message: 'Process another dependency?',
      initialValue: true,
    });

    if (continueFlow === true) {
      return runClackGenerationFlow(templatePath, targetDirectory);
    }

    outro('Session complete');
    return { success: true, artifacts: result.artifacts };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    
    debugLogger.error('GenerationFlow', error instanceof Error ? error : new Error(msg), {
      templatePath,
      targetDirectory,
      phase: 'generation'
    });
    
    if (process.env.LEGILIMENS_DEBUG) {
      console.log('[DEBUG] Error caught in generation flow:');
      console.log('[DEBUG] Error type:', error instanceof Error ? 'Error' : typeof error);
      console.log('[DEBUG] Error message:', msg);
      if (error instanceof Error && error.stack) {
        console.log('[DEBUG] Stack trace:');
        console.log(error.stack);
      }
    }
    
    outro('❌ Generation failed');
    return { success: false, error: msg };
  }
}