import * as keytar from 'keytar';
import { writeFileSync, readFileSync, existsSync, mkdirSync, chmodSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const SERVICE_NAME = 'legilimens-cli';
const KEYCHAIN_AVAILABLE = (() => {
  try {
    // Test if keytar is available and working
    return typeof keytar.setPassword === 'function';
  } catch {
    return false;
  }
})();

/**
 * Save an API key to the system keychain or fallback to file storage
 */
export const saveApiKey = async (service: string, key: string): Promise<{ success: boolean; error?: string }> => {
  try {
    if (KEYCHAIN_AVAILABLE) {
      await keytar.setPassword(SERVICE_NAME, service, key);
      return { success: true };
    } else {
      // Fallback to file storage with restrictive permissions
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
      
      return { success: true };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
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
    if (KEYCHAIN_AVAILABLE) {
      return await keytar.getPassword(SERVICE_NAME, service);
    } else {
      // Fallback to file storage
      const secretsFile = join(homedir(), '.legilimens', 'secrets.json');
      
      if (!existsSync(secretsFile)) {
        return null;
      }
      
      try {
        const content = readFileSync(secretsFile, 'utf-8');
        const secrets: Record<string, string> = JSON.parse(content) as Record<string, string>;
        return secrets[service] || null;
      } catch {
        return null;
      }
    }
  } catch (error) {
    console.warn(`Failed to retrieve API key for ${service}:`, error);
    return null;
  }
};

/**
 * Delete an API key from the system keychain or fallback file storage
 */
export const deleteApiKey = async (service: string): Promise<{ success: boolean; error?: string }> => {
  try {
    if (KEYCHAIN_AVAILABLE) {
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
