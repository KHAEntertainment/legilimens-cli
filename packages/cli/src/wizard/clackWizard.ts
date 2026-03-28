import { intro, outro, text, confirm, select, spinner, note, cancel } from '@clack/prompts';
import { saveUserConfig, loadUserConfig, type UserConfig } from '../config/userConfig.js';
import { ensureDmrInstalled, getDmrPaths } from '../utils/dmrInstaller.js';
import { detectExistingInstallation, ensureLlamaCppInstalled, getLlamaPaths } from '../utils/llamaInstaller.js';
import { getApiKey, getAllApiKeys, getStorageMethod } from '../config/secrets.js';
import { existsSync } from 'fs';
import { homedir } from 'os';

/**
 * Mask an API key for display - shows only first 4 and last 4 characters
 * Example: "tvly-1234567890abcdef" -> "tvly-****efgh"
 */
function maskApiKey(key: string): string {
  if (key.length <= 12) {
    return key.slice(0, 2) + '****' + key.slice(-2);
  }
  return key.slice(0, 8) + '****' + key.slice(-4);
}

export interface WizardResult {
  success: boolean;
  error?: string;
}

/**
 * Detect which local LLM backend is available
 */
async function detectLocalLlmBackend(): Promise<{ type: 'llama.cpp' | 'dmr' | 'both' | 'none'; llamaPath?: string; dmrAvailable?: boolean }> {
  // Check for llama.cpp first (user preference)
  const llamaInstall = await detectExistingInstallation();

  // Check for DMR
  const dmrInstall = await ensureDmrInstalled(() => {});

  const hasLlama = llamaInstall.found && llamaInstall.binaryPath && llamaInstall.binaryPath !== 'docker' && llamaInstall.modelPath;
  const hasDmr = dmrInstall.success && dmrInstall.binaryPath === 'docker';

  if (hasLlama && hasDmr) {
    return { type: 'both', llamaPath: llamaInstall.binaryPath };
  } else if (hasLlama) {
    return { type: 'llama.cpp', llamaPath: llamaInstall.binaryPath };
  } else if (hasDmr) {
    return { type: 'dmr', dmrAvailable: true };
  }

  return { type: 'none' };
}

export async function runClackWizard(): Promise<WizardResult> {
  intro('Legilimens Setup');

  try {
    const current = loadUserConfig();

    // Check existing configuration
    const existingKeys = await getAllApiKeys(['tavily', 'firecrawl', 'context7', 'refTools']);
    const backend = await detectLocalLlmBackend();

    // Build configuration status based on detected backends
    const configStatus = {
      llamaInstalled: backend.type === 'llama.cpp' || backend.type === 'both',
      dmrInstalled: backend.type === 'dmr' || backend.type === 'both',
      dmrAvailable: backend.dmrAvailable ?? false,
      tavilyKeyExists: Boolean(existingKeys.tavily || process.env.TAVILY_API_KEY),
      firecrawlKeyExists: Boolean(existingKeys.firecrawl || process.env.FIRECRAWL_API_KEY),
      context7KeyExists: Boolean(existingKeys.context7 || process.env.CONTEXT7_API_KEY),
      refToolsKeyExists: Boolean(existingKeys.refTools || process.env.REFTOOLS_API_KEY),
    };

    // Show current configuration status
    const statusLines = [
      configStatus.llamaInstalled
        ? `✓ llama.cpp: Available (${backend.llamaPath})`
        : configStatus.dmrInstalled
          ? '✓ Docker Model Runner: Available (Docker + DMR enabled)'
          : '✗ Local LLM: Not available (llama.cpp or DMR)',
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
    const allConfigured = (configStatus.llamaInstalled || configStatus.dmrInstalled) && configStatus.tavilyKeyExists;
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

    // Determine which backend to use (llama.cpp is preferred)
    let useLlamaCpp = false;
    let llamaBinaryPath: string | undefined;
    let llamaModelPath: string | undefined;

    if (backend.type === 'both') {
      // Both available - ask user which they prefer
      const choice = await select({
        message: 'Which local LLM backend do you prefer?',
        options: [
          { label: 'llama.cpp (native binary, recommended)', value: 'llama' },
          { label: 'Docker Model Runner (via Docker)', value: 'dmr' }
        ],
        initialValue: 'llama'
      });

      if (typeof choice === 'symbol') {
        cancel('Setup cancelled');
        return { success: false };
      }

      useLlamaCpp = choice === 'llama';
    } else if (backend.type === 'llama.cpp') {
      // Only llama.cpp available
      note('llama.cpp detected. Using llama.cpp as local LLM backend.', 'Backend Detected');
      useLlamaCpp = true;
    } else if (backend.type === 'dmr') {
      // Only DMR available
      note('Docker Model Runner detected. Using DMR as local LLM backend.', 'Backend Detected');
      useLlamaCpp = false;
    } else {
      // Neither available - offer to install llama.cpp (user preference)
      const installChoice = await select({
        message: 'No local LLM backend detected. Which would you like to install?',
        options: [
          { label: 'llama.cpp (recommended - native binary, no Docker)', value: 'llama' },
          { label: 'Docker Model Runner (requires Docker Desktop)', value: 'dmr' }
        ],
        initialValue: 'llama'
      });

      if (typeof installChoice === 'symbol') {
        cancel('Setup cancelled');
        return { success: false };
      }

      useLlamaCpp = installChoice === 'llama';
    }

    // Handle backend installation/setup
    if (useLlamaCpp) {
      // Install/setup llama.cpp
      const llamaSpinner = spinner();

      if (backend.type === 'llama.cpp' || backend.type === 'both') {
        llamaSpinner.start('Setting up llama.cpp with Granite model...');
      } else {
        llamaSpinner.start('Installing llama.cpp and downloading Granite model (~2.1GB)...');
      }

      const llamaResult = await ensureLlamaCppInstalled((msg) => {
        llamaSpinner.message(msg);
      });

      if (!llamaResult.success) {
        llamaSpinner.stop('llama.cpp setup failed');
        cancel(`Failed to setup llama.cpp: ${llamaResult.error}`);
        return { success: false, error: llamaResult.error };
      }

      llamaSpinner.stop('llama.cpp ready with Granite model');
      llamaBinaryPath = llamaResult.binaryPath;
      llamaModelPath = llamaResult.modelPath;
    } else {
      // Install/setup DMR
      const dmrSpinner = spinner();

      if (backend.type === 'dmr' || backend.type === 'both') {
        dmrSpinner.start('Setting up Docker Model Runner...');
      } else {
        dmrSpinner.start('Setting up Docker Model Runner and pulling Granite model...');
      }

      const dmrResult = await ensureDmrInstalled((msg) => {
        dmrSpinner.message(msg);
      });

      if (!dmrResult.success) {
        dmrSpinner.stop('DMR setup failed');
        cancel(`Failed to setup Docker Model Runner: ${dmrResult.error}`);
        return { success: false, error: dmrResult.error };
      }

      dmrSpinner.stop('Docker Model Runner ready with Granite model');
    }

    // API Key prompts with pre-filled values (masked for security)
    const existingTavily = process.env.TAVILY_API_KEY ?? existingKeys.tavily ?? '';
    const tavilyKey = await text({
      message: `Tavily API key (for web search)${existingTavily ? ` [current: ${maskApiKey(existingTavily)} - keep empty to reuse]` : ''}`,
      initialValue: '',  // Don't pre-fill for security - user enters manually
      placeholder: existingTavily ? '(key configured)' : 'tvly-...',
      validate: (value) => {
        // Allow empty if key already exists
        if (!value || value.trim().length === 0) {
          if (!existingTavily) {
            return 'Tavily API key is required for natural language dependency resolution';
          }
        }
      },
    });

    if (typeof tavilyKey === 'symbol') {
      cancel('Setup cancelled');
      return { success: false };
    }

    // Use new key if provided, otherwise keep existing
    const finalTavilyKey = tavilyKey && String(tavilyKey).trim() 
      ? String(tavilyKey) 
      : existingTavily;

    // Ask if user wants to configure optional keys
    const configureOptional = await confirm({
      message: 'Configure optional API keys (Firecrawl, Context7, RefTools)?',
      initialValue: !allConfigured,  // Default to true only if this is initial setup
    });

    let firecrawlKey: string | symbol = '';
    let context7Key: string | symbol = '';
    let refToolsKey: string | symbol = '';

    // Track existing keys for masking
    const existingFirecrawl = process.env.FIRECRAWL_API_KEY ?? existingKeys.firecrawl ?? '';
    const existingContext7 = process.env.CONTEXT7_API_KEY ?? existingKeys.context7 ?? '';
    const existingRefTools = process.env.REFTOOLS_API_KEY ?? existingKeys.refTools ?? '';

    if (configureOptional === true) {
      firecrawlKey = await text({
        message: `Firecrawl API key (optional)${existingFirecrawl ? ` [current: ${maskApiKey(existingFirecrawl)}]` : ''}`,
        initialValue: '',
        placeholder: existingFirecrawl ? '(key configured)' : 'fc-...'
      });

      if (typeof firecrawlKey === 'symbol') {
        cancel('Setup cancelled');
        return { success: false };
      }

      context7Key = await text({
        message: `Context7 API key (optional)${existingContext7 ? ` [current: ${maskApiKey(existingContext7)}]` : ''}`,
        initialValue: '',
        placeholder: existingContext7 ? '(key configured)' : ''
      });

      if (typeof context7Key === 'symbol') {
        cancel('Setup cancelled');
        return { success: false };
      }

      refToolsKey = await text({
        message: `RefTools API key (optional)${existingRefTools ? ` [current: ${maskApiKey(existingRefTools)}]` : ''}`,
        initialValue: '',
        placeholder: existingRefTools ? '(key configured)' : ''
      });

      if (typeof refToolsKey === 'symbol') {
        cancel('Setup cancelled');
        return { success: false };
      }
    } else if (typeof configureOptional === 'symbol') {
      cancel('Setup cancelled');
      return { success: false };
    }

    // Build local LLM config based on chosen backend
    let localLlmConfig: UserConfig['localLlm'];

    if (useLlamaCpp && llamaBinaryPath && llamaModelPath) {
      // Configure llama.cpp mode (native binary)
      localLlmConfig = {
        enabled: true,
        binaryPath: llamaBinaryPath,
        modelPath: llamaModelPath,
        threads: 8,
        temp: 0.7,
        timeoutMs: 60000,
        resetBetweenTasks: true
      };
    } else {
      // Configure DMR mode (HTTP API)
      const dmrPaths = getDmrPaths();
      let modelName = 'granite-4.0-micro:latest';
      let apiEndpoint = 'http://localhost:12434';

      const useDefaults = await confirm({
        message: 'Use default DMR settings (model: granite-4.0-micro:latest, endpoint: http://localhost:12434)?',
        initialValue: true,
      });

      if (useDefaults === false) {
        // Get user custom values
        const existingModelName = current.localLlm?.modelName || 'granite-4.0-micro:latest';
        const existingApiEndpoint = current.localLlm?.apiEndpoint || 'http://localhost:12434';

        const modelNameInput = await text({
          message: 'Enter DMR model name',
          initialValue: existingModelName,
          placeholder: 'e.g., granite-4.0-micro:latest'
        });

        if (typeof modelNameInput === 'symbol') {
          cancel('Setup cancelled');
          return { success: false };
        }

        const trimmedModelName = modelNameInput.trim();
        if (!trimmedModelName) {
          cancel('Model name cannot be empty');
          return { success: false };
        }
        modelName = trimmedModelName;

        const apiEndpointInput = await text({
          message: 'Enter DMR API endpoint',
          initialValue: existingApiEndpoint,
          placeholder: 'e.g., http://localhost:12434'
        });

        if (typeof apiEndpointInput === 'symbol') {
          cancel('Setup cancelled');
          return { success: false };
        }

        let trimmedEndpoint = apiEndpointInput.trim();
        if (!trimmedEndpoint) {
          cancel('API endpoint cannot be empty');
          return { success: false };
        }

        if (!trimmedEndpoint.includes('://')) {
          trimmedEndpoint = `http://${trimmedEndpoint}`;
        }

        try {
          new URL(trimmedEndpoint);
          apiEndpoint = trimmedEndpoint;
        } catch {
          cancel('Invalid API endpoint URL format');
          return { success: false };
        }
      } else if (typeof useDefaults === 'symbol') {
        cancel('Setup cancelled');
        return { success: false };
      }

      localLlmConfig = {
        enabled: true,
        modelName: modelName,
        apiEndpoint: apiEndpoint,
        tokens: 8192,
        threads: 8,
        temp: 0.7,
        timeoutMs: 60000,
        resetBetweenTasks: true
      };
    }

    // Save configuration
    const cfg: UserConfig = {
      ...current,
      apiKeys: {
        ...(current.apiKeys ?? {}),
        tavily: finalTavilyKey,
        firecrawl: firecrawlKey && String(firecrawlKey).trim() ? String(firecrawlKey) : existingFirecrawl,
        context7: context7Key && String(context7Key).trim() ? String(context7Key) : existingContext7,
        refTools: refToolsKey && String(refToolsKey).trim() ? String(refToolsKey) : existingRefTools
      },
      localLlm: localLlmConfig,
      setupCompleted: true,
      configVersion: current.configVersion || '1.0.0'
    };

    if (process.env.LEGILIMENS_DEBUG) {
      console.debug(`[wizard] Saving config with localLlm: ${JSON.stringify(cfg.localLlm, null, 2)}`);
    }

    const saveSpinner = spinner();
    saveSpinner.start('Saving configuration');
    const res = await saveUserConfig(cfg);

    if (!res.success) {
      saveSpinner.stop('Configuration save failed');
      note(res.error || 'Unknown error occurred', 'Error Details');

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

    // Export relevant env for this session
    if (useLlamaCpp && llamaBinaryPath && llamaModelPath) {
      // Set env vars for llama.cpp mode
      process.env.LEGILIMENS_LOCAL_LLM_ENABLED = 'true';
      process.env.LEGILIMENS_LOCAL_LLM_BIN = llamaBinaryPath;
      process.env.LEGILIMENS_LOCAL_LLM_MODEL = llamaModelPath;
      // Clear DMR vars if set
      delete process.env.LEGILIMENS_LOCAL_LLM_MODEL_NAME;
      delete process.env.LEGILIMENS_LOCAL_LLM_API_ENDPOINT;
    } else if (cfg.localLlm?.modelName && cfg.localLlm?.apiEndpoint) {
      // Set env vars for DMR mode
      process.env.LEGILIMENS_LOCAL_LLM_ENABLED = 'true';
      process.env.LEGILIMENS_LOCAL_LLM_MODEL_NAME = cfg.localLlm.modelName;
      process.env.LEGILIMENS_LOCAL_LLM_API_ENDPOINT = cfg.localLlm.apiEndpoint;
      // Clear llama.cpp vars if set
      delete process.env.LEGILIMENS_LOCAL_LLM_BIN;
      delete process.env.LEGILIMENS_LOCAL_LLM_MODEL;
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

    // Validate configuration
    const hasLocalLlm = Boolean(cfg.localLlm?.enabled);
    const hasTavily = Boolean(process.env.TAVILY_API_KEY);

    if (!hasLocalLlm && !hasTavily) {
      note(
        `Configuration incomplete: no local LLM and no Tavily API key configured.`,
        'Configuration Warning'
      );
    }

    outro('Setup complete. You can now generate dependency docs.');
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    cancel(`Setup failed: ${msg}`);
    return { success: false, error: msg };
  }
}
