import { intro, outro, text, confirm, select, spinner, note, cancel } from '@clack/prompts';
import { saveUserConfig, loadUserConfig, type UserConfig } from '../config/userConfig.js';
import { ensureDmrInstalled, getDmrPaths, detectExistingInstallation } from '../utils/dmrInstaller.js';
import { getApiKey, getAllApiKeys, getStorageMethod } from '../config/secrets.js';
import { existsSync } from 'fs';
import { homedir } from 'os';

export interface WizardResult {
  success: boolean;
  error?: string;
}

export async function runClackWizard(): Promise<WizardResult> {
  intro('Legilimens Setup');

  try {
    const current = loadUserConfig();

    // Check existing configuration
    const existingKeys = await getAllApiKeys(['tavily', 'firecrawl', 'context7', 'refTools']);
    const existingInstallation = await detectExistingInstallation();
    const paths = getDmrPaths();
    const dmrInstalled = existingInstallation.found && existingInstallation.binaryPath === 'docker';

    // Build configuration status
    const configStatus = {
      dmrInstalled: existingInstallation.found && existingInstallation.binaryPath === 'docker',
      modelInstalled: existingInstallation.found && Boolean(existingInstallation.modelPath),
      tavilyKeyExists: Boolean(existingKeys.tavily || process.env.TAVILY_API_KEY),
      firecrawlKeyExists: Boolean(existingKeys.firecrawl || process.env.FIRECRAWL_API_KEY),
      context7KeyExists: Boolean(existingKeys.context7 || process.env.CONTEXT7_API_KEY),
      refToolsKeyExists: Boolean(existingKeys.refTools || process.env.REFTOOLS_API_KEY),
    };

    // Show current configuration status
    const statusLines = [
      configStatus.dmrInstalled
        ? '✓ Docker Model Runner: Available (Docker + DMR enabled)'
        : '✗ Docker Model Runner: Not available (install Docker Desktop)',
      configStatus.modelInstalled
        ? `✓ Granite model: ${existingInstallation.modelPath || paths.modelPath} (pulled)`
        : '✗ Granite model: Not pulled (will download from Docker Hub)',
      configStatus.tavilyKeyExists
        ? '✓ Tavily API key: Configured'
        : '✗ Tavily API key: Not configured',
      configStatus.firecrawlKeyExists
        ? '✓ Firecrawl API key: Configured'
        : '✗ Firecrawl API key: Not configured (optional)',
      configStatus.context7KeyExists
        ? '✓ Context7 API key: Configured'
        : '✗ Context7 API key: Not configured (optional)',
      configStatus.refToolsKeyExists
        ? '✓ RefTools API key: Configured'
        : '✗ RefTools API key: Not configured (optional)'
    ].join('\n');

    note(statusLines, 'Current Configuration');

    // If everything is configured, ask if user wants to update
    const allConfigured = configStatus.dmrInstalled && configStatus.modelInstalled && configStatus.tavilyKeyExists;
    if (allConfigured) {
      const updateSettings = await confirm({
        message: 'Configuration complete. Update settings?',
        initialValue: false,
      });

      if (updateSettings === false) {
        outro('Configuration is already complete.');
        return { success: true };
      }

      if (typeof updateSettings === 'symbol') {
        cancel('Setup cancelled');
        return { success: false };
      }
    }

    note(`Legilimens will automatically pull Granite 4.0 Micro model via Docker Model Runner.\nRequires: Docker Desktop installed and running.\nConfiguration will be saved to ~/.legilimens/config.json\nAPI keys stored securely in ${await getStorageMethod()}.`, 'Welcome');

    // Handle DMR installation
    let dmrRuntime: string | undefined;
    let modelPath: string | undefined;

    if (existingInstallation.found && existingInstallation.binaryPath === 'docker') {
      // Use existing installation
      note('Using existing Docker Model Runner installation', 'Existing Installation Detected');
      dmrRuntime = existingInstallation.binaryPath;
      modelPath = existingInstallation.modelPath;

      // If model is missing, pull it
      if (!modelPath) {
        const installSpinner = spinner();
        installSpinner.start('Pulling Granite model from Docker Hub');
        const installResult = await ensureDmrInstalled((msg) => {
          installSpinner.message(msg);
        });
        installSpinner.stop('Granite model pulled successfully');
        modelPath = installResult.modelPath;
      }
    } else {
      // No existing DMR installation detected - pull model
      const installSpinner = spinner();
      installSpinner.start('Setting up Docker Model Runner and pulling Granite model');

      const installResult = await ensureDmrInstalled((msg) => {
        installSpinner.message(msg);
      });

      if (!installResult.success) {
        installSpinner.stop('DMR setup failed');
        cancel(`Failed to setup Docker Model Runner: ${installResult.error}`);
        return { success: false, error: installResult.error };
      }

      installSpinner.stop('Docker Model Runner ready with Granite model');
      dmrRuntime = installResult.binaryPath;
      modelPath = installResult.modelPath;
    }

    // Validate that we have valid configuration before continuing
    if (!dmrRuntime || !modelPath) {
      cancel('Installation completed but configuration was not set correctly. Please report this issue.');
      return { success: false, error: 'Invalid installation state: missing DMR runtime or model name' };
    }

    // Debug logging
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug(`[wizard] Installation validated - runtime: ${dmrRuntime}, model: ${modelPath}`);
      console.debug(`[wizard] Will save localLlm: ${dmrRuntime && modelPath ? 'YES' : 'NO'}`);
    }

    // API Key prompts with pre-filled values
    const tavilyKey = await text({
      message: `Tavily API key (for web search)${existingKeys.tavily ? ' [current key will be kept if empty]' : ''}`,
      initialValue: process.env.TAVILY_API_KEY ?? existingKeys.tavily ?? '',
      placeholder: 'tvly-...',
      validate: (value) => {
        // Allow empty if key already exists
        if (!value || value.trim().length === 0) {
          if (!existingKeys.tavily && !process.env.TAVILY_API_KEY) {
            return 'Tavily API key is required for natural language dependency resolution';
          }
        }
      },
    });

    if (typeof tavilyKey === 'symbol') {
      cancel('Setup cancelled');
      return { success: false };
    }

    // Ask if user wants to configure optional keys
    const configureOptional = await confirm({
      message: 'Configure optional API keys (Firecrawl, Context7, RefTools)?',
      initialValue: !allConfigured,  // Default to true only if this is initial setup
    });

    let firecrawlKey: string | symbol = '';
    let context7Key: string | symbol = '';
    let refToolsKey: string | symbol = '';

    if (configureOptional === true) {
      firecrawlKey = await text({
        message: `Firecrawl API key (optional, for web documentation)${existingKeys.firecrawl ? ' [current key will be kept if empty]' : ''}`,
        initialValue: process.env.FIRECRAWL_API_KEY ?? existingKeys.firecrawl ?? '',
        placeholder: 'fc-...'
      });

      if (typeof firecrawlKey === 'symbol') {
        cancel('Setup cancelled');
        return { success: false };
      }

      context7Key = await text({
        message: `Context7 API key (optional, for NPM docs)${existingKeys.context7 ? ' [current key will be kept if empty]' : ''}`,
        initialValue: process.env.CONTEXT7_API_KEY ?? existingKeys.context7 ?? '',
        placeholder: ''
      });

      if (typeof context7Key === 'symbol') {
        cancel('Setup cancelled');
        return { success: false };
      }

      refToolsKey = await text({
        message: `RefTools API key (optional)${existingKeys.refTools ? ' [current key will be kept if empty]' : ''}`,
        initialValue: process.env.REFTOOLS_API_KEY ?? existingKeys.refTools ?? '',
        placeholder: ''
      });

      if (typeof refToolsKey === 'symbol') {
        cancel('Setup cancelled');
        return { success: false };
      }
    } else if (typeof configureOptional === 'symbol') {
      cancel('Setup cancelled');
      return { success: false };
    }

    // Only update keys that changed (keep existing if prompt was empty)
    const cfg: UserConfig = {
      ...current,
      apiKeys: {
        ...(current.apiKeys ?? {}),
        tavily: tavilyKey ? String(tavilyKey) : (existingKeys.tavily || ''),
        firecrawl: firecrawlKey ? String(firecrawlKey) : (existingKeys.firecrawl || ''),
        context7: context7Key ? String(context7Key) : (existingKeys.context7 || ''),
        refTools: refToolsKey ? String(refToolsKey) : (existingKeys.refTools || '')
      },
      localLlm: dmrRuntime && modelPath ? {
        enabled: true,
        modelName: 'granite-4.0-micro:latest',
        apiEndpoint: 'http://localhost:12434',
        tokens: 8192,  // Granite 4.0 Micro context window
        threads: 8,      // Reasonable default for most systems
        temp: 0.7,       // Balance between creativity and consistency
        timeoutMs: 60000, // 60 seconds for generation tasks
        resetBetweenTasks: true  // Clean state between generations
      } : current.localLlm,
      setupCompleted: true,
      configVersion: current.configVersion || '1.0.0'
    };

    // Debug logging
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug(`[wizard] Saving config with localLlm: ${JSON.stringify(cfg.localLlm, null, 2)}`);
    }

    const saveSpinner = spinner();
    saveSpinner.start('Saving configuration');
    const res = await saveUserConfig(cfg);
    
    if (!res.success) {
      saveSpinner.stop('Configuration save failed');
      note(res.error || 'Unknown error occurred', 'Error Details');
      
      // Offer retry option
      const retry = await confirm({
        message: 'Retry saving configuration?',
        initialValue: true,
      });
      
      if (retry === true) {
        return runClackWizard();
      }
      
      outro(`Setup failed: ${res.error}`);
      return { success: false, error: res.error };
    }
    
    saveSpinner.stop(`Configuration saved to ~/.legilimens/config.json\nAPI keys stored securely in ${await getStorageMethod()}`);

    // Export relevant env for this session (only if non-empty values were entered)
    if (dmrRuntime && modelPath) {
      process.env.LEGILIMENS_LOCAL_LLM_ENABLED = 'true';
      process.env.LEGILIMENS_LOCAL_LLM_MODEL_NAME = 'granite-4.0-micro:latest';
      process.env.LEGILIMENS_LOCAL_LLM_API_ENDPOINT = 'http://localhost:12434';
    }
    // Tavily is auto-enabled in runtimeConfig when API key exists
    if (tavilyKey && String(tavilyKey).trim()) {
      process.env.TAVILY_API_KEY = String(tavilyKey).trim();
    }
    if (firecrawlKey && String(firecrawlKey).trim()) {
      process.env.FIRECRAWL_API_KEY = String(firecrawlKey).trim();
    }
    if (context7Key && String(context7Key).trim()) {
      process.env.CONTEXT7_API_KEY = String(context7Key).trim();
    }
    if (refToolsKey && String(refToolsKey).trim()) {
      process.env.REFTOOLS_API_KEY = String(refToolsKey).trim();
    }

    const missingVars: string[] = [];
    
    // Check if at least one AI source is configured (Local LLM OR Tavily)
    const hasLocalLlm = process.env.LEGILIMENS_LOCAL_LLM_ENABLED === 'true' &&
                        process.env.LEGILIMENS_LOCAL_LLM_MODEL_NAME &&
                        process.env.LEGILIMENS_LOCAL_LLM_API_ENDPOINT;
    
    const hasTavily = Boolean(process.env.TAVILY_API_KEY);
    
    if (!hasLocalLlm && !hasTavily) {
      // Neither is configured - check what's missing
      if (process.env.LEGILIMENS_LOCAL_LLM_ENABLED !== 'true') {
        missingVars.push('LEGILIMENS_LOCAL_LLM_ENABLED');
      }
      const resolvedModelName = process.env.LEGILIMENS_LOCAL_LLM_MODEL_NAME;
      if (!resolvedModelName) {
        missingVars.push('LEGILIMENS_LOCAL_LLM_MODEL_NAME');
      }
      const resolvedEndpoint = process.env.LEGILIMENS_LOCAL_LLM_API_ENDPOINT;
      if (!resolvedEndpoint) {
        missingVars.push('LEGILIMENS_LOCAL_LLM_API_ENDPOINT');
      }
      if (!process.env.TAVILY_API_KEY) {
        missingVars.push('TAVILY_API_KEY');
      }
    } else if (hasLocalLlm && !hasTavily) {
      // Local LLM configured but not Tavily - this is OK, but validate Local LLM
      const resolvedModelName = process.env.LEGILIMENS_LOCAL_LLM_MODEL_NAME;
      if (!resolvedModelName) {
        missingVars.push('LEGILIMENS_LOCAL_LLM_MODEL_NAME');
      }
      const resolvedEndpoint = process.env.LEGILIMENS_LOCAL_LLM_API_ENDPOINT;
      if (!resolvedEndpoint) {
        missingVars.push('LEGILIMENS_LOCAL_LLM_API_ENDPOINT');
      }
    }

    if (missingVars.length > 0) {
      note(
        `Docker Model Runner configuration incomplete:\n- ${missingVars.join('\n- ')}\nRun setup again to re-attempt automatic fixes.`,
        'Configuration Warning'
      );
      const retry = await confirm({
        message: 'Retry setup to resolve missing configuration?',
        initialValue: true,
      });

      if (retry === true) {
        return runClackWizard();
      }

      if (typeof retry === 'symbol') {
        cancel('Setup cancelled');
        return { success: false, error: `Missing configuration: ${missingVars.join(', ')}` };
      }

      outro('Setup incomplete. Docker Model Runner will remain disabled until configuration is corrected.');
      return { success: false, error: `Missing configuration: ${missingVars.join(', ')}` };
    }

    outro('Setup complete. You can now generate gateway docs.');
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    cancel(`Setup failed: ${msg}`);
    return { success: false, error: msg };
  }
}