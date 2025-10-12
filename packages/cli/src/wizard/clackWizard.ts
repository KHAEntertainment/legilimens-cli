import { intro, outro, text, confirm, select, spinner, note, cancel } from '@clack/prompts';
import { saveUserConfig, loadUserConfig, type UserConfig } from '../config/userConfig.js';
import { ensureLlamaCppInstalled, getLlamaPaths } from '../utils/llamaInstaller.js';
import { existsSync } from 'fs';

export interface WizardResult {
  success: boolean;
  error?: string;
}

export async function runClackWizard(): Promise<WizardResult> {
  intro('Legilimens Setup');

  try {
    const current = loadUserConfig();

    note('Legilimens will automatically install llama.cpp and phi-4 GGUF model.\nConfiguration will be saved to ~/.legilimens/config.json\nAPI keys stored securely in system keychain.', 'Welcome');

    // Auto-install llama.cpp and phi-4
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

    const paths = getLlamaPaths();
    const llamaBin = paths.binaryPath;
    const modelPath = paths.modelPath;

    const tavilyKey = await text({
      message: 'Tavily API key (for web search)',
      initialValue: process.env.TAVILY_API_KEY ?? '',
      placeholder: 'tvly-...',
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Tavily API key is required for natural language dependency resolution';
        }
      },
    });

    if (typeof tavilyKey === 'symbol') {
      cancel('Setup cancelled');
      return { success: false };
    }

    const firecrawlKey = await text({ 
      message: 'Firecrawl API key (optional, for web documentation)', 
      initialValue: '', 
      placeholder: 'fc-...' 
    });

    if (typeof firecrawlKey === 'symbol') {
      cancel('Setup cancelled');
      return { success: false };
    }

    const context7Key = await text({ 
      message: 'Context7 API key (optional, for NPM docs)', 
      initialValue: '', 
      placeholder: '' 
    });

    if (typeof context7Key === 'symbol') {
      cancel('Setup cancelled');
      return { success: false };
    }

    const refToolsKey = await text({ 
      message: 'RefTools API key (optional)', 
      initialValue: '', 
      placeholder: '' 
    });

    if (typeof refToolsKey === 'symbol') {
      cancel('Setup cancelled');
      return { success: false };
    }

    const cfg: UserConfig = {
      ...current,
      apiKeys: {
        ...(current.apiKeys ?? {}),
        tavily: String(tavilyKey || ''),
        firecrawl: String(firecrawlKey || ''),
        context7: String(context7Key || ''),
        refTools: String(refToolsKey || '')
      },
      setupCompleted: true,
      configVersion: current.configVersion || '1.0.0'
    };

    const saveSpinner = spinner();
    saveSpinner.start('Saving configuration');
    const res = await saveUserConfig(cfg);
    saveSpinner.stop('Configuration saved to ~/.legilimens/config.json');
    
    if (!res.success) {
      outro(`Failed: ${res.error}`);
      return { success: false, error: res.error };
    }

    // Export relevant env for this session
    process.env.LEGILIMENS_LOCAL_LLM_ENABLED = 'true';
    process.env.LEGILIMENS_LOCAL_LLM_BIN = String(llamaBin || '');
    process.env.LEGILIMENS_LOCAL_LLM_MODEL = String(modelPath || '').replace('~', require('os').homedir());
    process.env.TAVILY_ENABLED = 'true';
    process.env.TAVILY_API_KEY = String(tavilyKey || '');

    outro('Setup complete. You can now generate gateway docs.');
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    cancel(`Setup failed: ${msg}`);
    return { success: false, error: msg };
  }
}


