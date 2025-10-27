import { intro, outro, text, confirm, select, spinner, note, cancel } from '@clack/prompts';
import { saveUserConfig, loadUserConfig, type UserConfig } from '../config/userConfig.js';
import { ensureLlamaCppInstalled, getLlamaPaths, detectExistingInstallation } from '../utils/llamaInstaller.js';
import { getApiKey, getAllApiKeys, getStorageMethod } from '../config/secrets.js';
import { existsSync } from 'fs';
import { homedir } from 'os';

export interface WizardResult {
  success: boolean;
  error?: string;
}

const expandTilde = (value: string): string => {
  if (typeof value !== 'string' || value.length === 0) {
    return '';
  }

  return value.replace(/^~(?=\/|$)/, homedir());
};

export async function runClackWizard(): Promise<WizardResult> {
  intro('Legilimens Setup');

  try {
    const current = loadUserConfig();

    // Check existing configuration
    const existingKeys = await getAllApiKeys(['tavily', 'firecrawl', 'context7', 'refTools']);
    const existingInstallation = await detectExistingInstallation();
    const paths = getLlamaPaths();
    const llamaCppInstalled = existsSync(paths.binaryPath) && existsSync(paths.modelPath);

    // Build configuration status
    const configStatus = {
      llamaCppInstalled: existingInstallation.found || llamaCppInstalled,
      modelInstalled: existingInstallation.modelPath ? existsSync(existingInstallation.modelPath) : existsSync(paths.modelPath),
      tavilyKeyExists: Boolean(existingKeys.tavily || process.env.TAVILY_API_KEY),
      firecrawlKeyExists: Boolean(existingKeys.firecrawl || process.env.FIRECRAWL_API_KEY),
      context7KeyExists: Boolean(existingKeys.context7 || process.env.CONTEXT7_API_KEY),
      refToolsKeyExists: Boolean(existingKeys.refTools || process.env.REFTOOLS_API_KEY),
    };

    // Show current configuration status
    const statusLines = [
      configStatus.llamaCppInstalled
        ? `✓ llama.cpp: Installed at ${existingInstallation.binaryPath || paths.binaryPath}`
        : '✗ llama.cpp: Not installed',
      configStatus.modelInstalled
        ? `✓ phi-4 model: Installed at ${existingInstallation.modelPath || paths.modelPath}`
        : '✗ phi-4 model: Not installed',
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
    const allConfigured = configStatus.llamaCppInstalled && configStatus.modelInstalled && configStatus.tavilyKeyExists;
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

    note(`Legilimens will automatically install llama.cpp and phi-4 GGUF model.\nConfiguration will be saved to ~/.legilimens/config.json\nAPI keys stored securely in ${getStorageMethod()}.`, 'Welcome');

    // Handle llama.cpp installation
    let llamaBin: string | undefined;
    let modelPath: string | undefined;

    if (existingInstallation.found && existingInstallation.binaryPath) {
      // Use existing installation
      note(`Using existing llama.cpp installation at ${existingInstallation.binaryPath}`, 'Existing Installation Detected');
      llamaBin = existingInstallation.binaryPath;
      modelPath = existingInstallation.modelPath;

      // If model is missing, download it
      if (!modelPath || !existsSync(modelPath)) {
        const installSpinner = spinner();
        installSpinner.start('Downloading phi-4 model');

        const installResult = await ensureLlamaCppInstalled((msg) => {
          installSpinner.message(msg);
        });

        if (!installResult.success) {
          installSpinner.stop('Model download failed');
          cancel(`Failed to download model: ${installResult.error}`);
          return { success: false, error: installResult.error };
        }

        installSpinner.stop('phi-4 model ready');
        modelPath = installResult.modelPath;
      }
    } else {
      // No existing installation detected - install llama.cpp and model
      const installSpinner = spinner();
      installSpinner.start('Installing llama.cpp and phi-4 model');

      const installResult = await ensureLlamaCppInstalled((msg) => {
        installSpinner.message(msg);
      });

      if (!installResult.success) {
        installSpinner.stop('Installation failed');
        cancel(`Failed to install llama.cpp: ${installResult.error}`);
        return { success: false, error: installResult.error };
      }

      installSpinner.stop('llama.cpp and phi-4 model ready');
      llamaBin = installResult.binaryPath;
      modelPath = installResult.modelPath;
    }

    // Validate that we have valid paths before continuing
    if (!llamaBin || !modelPath) {
      cancel('Installation completed but paths were not set correctly. Please report this issue.');
      return { success: false, error: 'Invalid installation state: missing binary or model path' };
    }

    if (!existsSync(llamaBin)) {
      cancel(`Binary path does not exist: ${llamaBin}`);
      return { success: false, error: `Binary not found at expected location: ${llamaBin}` };
    }

    if (!existsSync(modelPath)) {
      cancel(`Model path does not exist: ${modelPath}`);
      return { success: false, error: `Model not found at expected location: ${modelPath}` };
    }

    // Debug logging
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug(`[wizard] Installation validated - binary: ${llamaBin}, model: ${modelPath}`);
      console.debug(`[wizard] Binary exists: ${existsSync(llamaBin || '')}`);
      console.debug(`[wizard] Model exists: ${existsSync(modelPath || '')}`);
      console.debug(`[wizard] Will save localLlm: ${llamaBin && modelPath ? 'YES' : 'NO'}`);
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
      localLlm: llamaBin && modelPath ? {
        enabled: true,
        binaryPath: llamaBin,
        modelPath: modelPath
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
    
    saveSpinner.stop(`Configuration saved to ~/.legilimens/config.json\nAPI keys stored securely in ${getStorageMethod()}`);

    // Export relevant env for this session (only if non-empty values were entered)
    if (llamaBin && modelPath) {
      process.env.LEGILIMENS_LOCAL_LLM_ENABLED = 'true';
      process.env.LEGILIMENS_LOCAL_LLM_BIN = String(llamaBin);
      process.env.LEGILIMENS_LOCAL_LLM_MODEL = expandTilde(String(modelPath));
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
                        process.env.LEGILIMENS_LOCAL_LLM_BIN &&
                        process.env.LEGILIMENS_LOCAL_LLM_MODEL &&
                        existsSync(process.env.LEGILIMENS_LOCAL_LLM_BIN) &&
                        existsSync(process.env.LEGILIMENS_LOCAL_LLM_MODEL);
    
    const hasTavily = Boolean(process.env.TAVILY_API_KEY);
    
    if (!hasLocalLlm && !hasTavily) {
      // Neither is configured - check what's missing
      if (process.env.LEGILIMENS_LOCAL_LLM_ENABLED !== 'true') {
        missingVars.push('LEGILIMENS_LOCAL_LLM_ENABLED');
      }
      const resolvedBin = process.env.LEGILIMENS_LOCAL_LLM_BIN;
      if (!resolvedBin || !existsSync(resolvedBin)) {
        missingVars.push('LEGILIMENS_LOCAL_LLM_BIN');
      }
      const resolvedModel = process.env.LEGILIMENS_LOCAL_LLM_MODEL;
      if (!resolvedModel || !existsSync(resolvedModel)) {
        missingVars.push('LEGILIMENS_LOCAL_LLM_MODEL');
      }
      if (!process.env.TAVILY_API_KEY) {
        missingVars.push('TAVILY_API_KEY');
      }
    } else if (hasLocalLlm && !hasTavily) {
      // Local LLM configured but not Tavily - this is OK, but validate Local LLM
      const resolvedBin = process.env.LEGILIMENS_LOCAL_LLM_BIN;
      if (!resolvedBin || !existsSync(resolvedBin)) {
        missingVars.push('LEGILIMENS_LOCAL_LLM_BIN');
      }
      const resolvedModel = process.env.LEGILIMENS_LOCAL_LLM_MODEL;
      if (!resolvedModel || !existsSync(resolvedModel)) {
        missingVars.push('LEGILIMENS_LOCAL_LLM_MODEL');
      }
    }

    if (missingVars.length > 0) {
      note(
        `Local LLM configuration incomplete:\n- ${missingVars.join('\n- ')}\nRun setup again to re-attempt automatic fixes.`,
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

      outro('Setup incomplete. Local LLM will remain disabled until configuration is corrected.');
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
