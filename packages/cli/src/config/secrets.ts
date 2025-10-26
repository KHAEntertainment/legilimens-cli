import { writeFileSync, readFileSync, existsSync, mkdirSync, chmodSync } from 'fs';
import { join } from 'path';
import { homedir, platform } from 'os';

const SERVICE_NAME = 'legilimens-cli';

// Dynamic import for keytar to handle missing installation gracefully
let keytar: any = null;
let KEYCHAIN_AVAILABLE = false;
let KEYCHAIN_ERROR: string | null = null;

(async () => {
  try {
    keytar = await import('keytar');
    KEYCHAIN_AVAILABLE = Boolean(keytar?.setPassword);
    if (KEYCHAIN_AVAILABLE && process.env.LEGILIMENS_DEBUG) {
      console.debug(`[secrets] Keychain available on ${platform()}`);
    }
  } catch (error) {
    KEYCHAIN_AVAILABLE = false;
    KEYCHAIN_ERROR = error instanceof Error ? error.message : String(error);
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug(`[secrets] Keychain unavailable on ${platform()}: ${KEYCHAIN_ERROR}`);
    }
  }
})();

/**
 * Save an API key to the system keychain or fallback to file storage
 */
export const saveApiKey = async (service: string, key: string): Promise<{ success: boolean; error?: string; method?: string }> => {
  try {
    if (KEYCHAIN_AVAILABLE && keytar) {
      if (process.env.LEGILIMENS_DEBUG) {
        console.debug(`[secrets] Attempting to save '${service}' to keychain`);
      }
      await keytar.setPassword(SERVICE_NAME, service, key);
      if (process.env.LEGILIMENS_DEBUG) {
        console.debug(`[secrets] Successfully saved '${service}' to keychain`);
      }
      return { success: true, method: 'keychain' };
    } else {
      // Fallback to file storage with restrictive permissions
      if (process.env.LEGILIMENS_DEBUG) {
        console.debug(`[secrets] Keychain unavailable, falling back to file storage for '${service}'`);
        if (KEYCHAIN_ERROR) {
          console.debug(`[secrets] Keychain error: ${KEYCHAIN_ERROR}`);
        }
      }
      
      const configDir = join(homedir(), '.legilimens');
      const secretsFile = join(configDir, 'secrets.json');
      
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true, mode: 0o700 });
      }
      
      let secrets: Record<string, string> = {};
      if (existsSync(secretsFile)) {
        try {
          const content = readFileSync(secretsFile, 'utf-8');
          secrets = JSON.parse(content) as Record<string, string>;
        } catch {
          // If file is corrupted, start fresh
          secrets = {};
        }
      }
      
      secrets[service] = key;
      writeFileSync(secretsFile, JSON.stringify(secrets, null, 2), { mode: 0o600 });
      
      // Set restrictive permissions (Unix-like systems)
      if (process.platform !== 'win32') {
        try {
          chmodSync(secretsFile, 0o600);
        } catch {
          // Ignore chmod errors on platforms that don't support it
        }
      }
      
      if (process.env.LEGILIMENS_DEBUG) {
        console.debug(`[secrets] Successfully saved '${service}' to ${secretsFile}`);
      }
      
      return { success: true, method: 'file' };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug(`[secrets] Failed to save '${service}': ${errorMessage}`);
    }
    return {
      success: false,
      error: `Failed to save API key: ${errorMessage}`
    };
  }
};

/**
 * Retrieve an API key from the system keychain or fallback file storage
 */
export const getApiKey = async (service: string): Promise<string | null> => {
  try {
    if (KEYCHAIN_AVAILABLE && keytar) {
      return await keytar.getPassword(SERVICE_NAME, service);
    } else {
      // Fallback to file storage
      const secretsFile = join(homedir(), '.legilimens', 'secrets.json');

      if (!existsSync(secretsFile)) {
        if (process.env.LEGILIMENS_DEBUG) {
          console.debug(`Secrets file not found: ${secretsFile}`);
        }
        return null;
      }

      try {
        const content = readFileSync(secretsFile, 'utf-8');
        const secrets: Record<string, string> = JSON.parse(content) as Record<string, string>;
        return secrets[service] || null;
      } catch (error) {
        if (process.env.LEGILIMENS_DEBUG) {
          console.debug(`Failed to read secrets.json: ${error instanceof Error ? error.message : String(error)}`);
        }
        return null;
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug(`Failed to retrieve API key for '${service}': ${errorMessage}`);
    }
    return null;
  }
};

/**
 * Delete an API key from the system keychain or fallback file storage
 */
export const deleteApiKey = async (service: string): Promise<{ success: boolean; error?: string }> => {
  try {
    if (KEYCHAIN_AVAILABLE && keytar) {
      const deleted = await keytar.deletePassword(SERVICE_NAME, service);
      return { success: deleted };
    } else {
      // Fallback to file storage
      const secretsFile = join(homedir(), '.legilimens', 'secrets.json');
      
      if (!existsSync(secretsFile)) {
        return { success: true };
      }
      
      try {
        const content = readFileSync(secretsFile, 'utf-8');
        const secrets: Record<string, string> = JSON.parse(content) as Record<string, string>;
        
        if (service in secrets) {
          delete secrets[service];
          writeFileSync(secretsFile, JSON.stringify(secrets, null, 2), { mode: 0o600 });
        }
        
        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          success: false,
          error: `Failed to delete API key: ${errorMessage}`
        };
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to delete API key: ${errorMessage}`
    };
  }
};

/**
 * Check if keychain storage is available
 */
export const isKeychainAvailable = (): boolean => {
  return KEYCHAIN_AVAILABLE;
};

/**
 * Get storage method description for user display
 */
export const getStorageMethod = (): string => {
  return KEYCHAIN_AVAILABLE ? 'System Keychain' : 'config file';
};

/**
 * Check if all required API keys are configured without retrieving them
 */
export const areKeysConfigured = async (requiredKeys: string[]): Promise<Record<string, boolean>> => {
  const status: Record<string, boolean> = {};
  for (const key of requiredKeys) {
    const value = await getApiKey(key);
    status[key] = Boolean(value && value.trim().length > 0);
  }
  return status;
};

/**
 * Get all configured API keys for pre-filling prompts
 */
export const getAllApiKeys = async (keyNames: string[]): Promise<Record<string, string | null>> => {
  const keys: Record<string, string | null> = {};
  for (const keyName of keyNames) {
    keys[keyName] = await getApiKey(keyName);
  }
  return keys;
};

/**
 * Validate that saved keys are retrievable (round-trip validation)
 */
export const validateStoredKeys = async (services: string[]): Promise<{ success: boolean; failed: string[] }> => {
  if (process.env.LEGILIMENS_DEBUG) {
    console.debug(`[secrets] Validating ${services.length} stored keys`);
  }
  
  const failed: string[] = [];
  
  for (const service of services) {
    const retrieved = await getApiKey(service);
    if (!retrieved || retrieved.length === 0) {
      failed.push(service);
      if (process.env.LEGILIMENS_DEBUG) {
        console.debug(`[secrets] Validation failed for '${service}': key not retrievable`);
      }
    } else if (process.env.LEGILIMENS_DEBUG) {
      console.debug(`[secrets] Validation passed for '${service}': key length ${retrieved.length}`);
    }
  }
  
  const success = failed.length === 0;
  if (process.env.LEGILIMENS_DEBUG) {
    console.debug(`[secrets] Validation complete: ${success ? 'all keys valid' : `${failed.length} keys failed`}`);
  }
  
  return { success, failed };
};

/**
 * Get diagnostic information about keychain availability
 */
export const getKeychainDiagnostics = (): {
  platform: string;
  available: boolean;
  error: string | null;
  serviceName: string;
} => {
  return {
    platform: platform(),
    available: KEYCHAIN_AVAILABLE,
    error: KEYCHAIN_ERROR,
    serviceName: SERVICE_NAME
  };
};

/**
 * Create user-friendly error message with diagnostic context
 */
export const createStorageErrorMessage = (error: string, service: string): string => {
  const diag = getKeychainDiagnostics();
  const platformName = {
    darwin: 'macOS Keychain',
    win32: 'Windows Credential Manager',
    linux: 'Linux Secret Service'
  }[diag.platform] || 'system keychain';
  
  let message = `Failed to store '${service}' API key.\n`;
  message += `Platform: ${diag.platform} (${platformName})\n`;
  
  if (diag.available) {
    message += `Keychain: Available\n`;
    message += `Error: ${error}\n`;
    message += `\nSuggestion: Check ${platformName} permissions and try again.`;
  } else {
    message += `Keychain: Unavailable\n`;
    if (diag.error) {
      message += `Reason: ${diag.error}\n`;
    }
    message += `Fallback: Configuration will be saved to encrypted file (~/.legilimens/secrets.json)\n`;
    message += `\nSuggestion: This is normal. File storage is secure and will work fine.`;
  }
  
  return message;
};
