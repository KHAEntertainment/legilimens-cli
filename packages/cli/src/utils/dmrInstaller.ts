import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import { debugLogger } from './debugLogger.js';

export interface InstallResult {
  success: boolean;
  binaryPath?: string;
  modelPath?: string;
  error?: string;
}

export interface ExistingInstallation {
  found: boolean;
  binaryPath?: string;
  modelPath?: string;
}

// DMR-specific constants
const DMR_MODEL_NAME = 'ai/granite-4.0-micro:latest';

/**
 * Validate Docker installation by running docker --version
 */
async function validateDockerInstallation(): Promise<boolean> {
  try {
    const execFileAsync = promisify(execFile);
    const result = await execFileAsync('docker', ['--version'], { timeout: 15000 });
    
    const isValid = result.stdout.toLowerCase().includes('docker') || 
                   result.stderr.toLowerCase().includes('docker');
    
    debugLogger.log('dmrInstaller', `Docker validation: ${isValid ? 'PASS' : 'FAIL'}`);
    if (isValid) {
      debugLogger.log('dmrInstaller', `Docker version: ${result.stdout.trim()}`);
    }
    
    return isValid;
  } catch (error) {
    debugLogger.error('dmrInstaller', `Docker validation failed: ${error instanceof Error ? error.message : String(error)}`);

    return false;
  }
}

/**
 * Validate Docker Model Runner installation by running docker model version
 */
async function validateDmrInstallation(): Promise<boolean> {
  try {
    const execFileAsync = promisify(execFile);
    await execFileAsync('docker', ['model', 'version'], { timeout: 15000 });
    
    // If no error thrown, command succeeded
    debugLogger.log('dmrInstaller', 'DMR validation: PASS');
    
    return true;
  } catch (error) {
    debugLogger.error('dmrInstaller', `DMR validation failed: ${error instanceof Error ? error.message : String(error)}`);

    return false;
  }
}

/**
 * Check if specific model exists in Docker Model Runner
 */
async function checkModelExists(modelName: string): Promise<boolean> {
  try {
    const execFileAsync = promisify(execFile);
    const result = await execFileAsync('docker', ['model', 'list'], { timeout: 15000 });
    
    const output = result.stdout + result.stderr;
    const lines = output.split('\n');
    
    // Look for model name in the output (handle both "granite-4.0-micro" and full "ai/granite-4.0-micro:latest" formats)
    const modelFound = lines.some(line => {
      const trimmed = line.toLowerCase().trim();
      return trimmed.includes('granite-4.0-micro') || 
             trimmed.includes(modelName.toLowerCase());
    });
    
    debugLogger.log('dmrInstaller', `Model '${modelName}' found: ${modelFound}`);
    if (modelFound) {
      debugLogger.log('dmrInstaller', `Model list output:\n${output}`);
    }
    
    return modelFound;
  } catch (error) {
    debugLogger.error('dmrInstaller', `Model check failed: ${error instanceof Error ? error.message : String(error)}`);

    return false;
  }
}

/**
 * Detect existing Docker Model Runner installation
 */
export async function detectExistingInstallation(): Promise<ExistingInstallation> {
  // Check environment variables first
  const envBin = process.env.LEGILIMENS_LOCAL_LLM_BIN;
  const envModel = process.env.LEGILIMENS_LOCAL_LLM_MODEL;

  // Always validate Docker and DMR even when LEGILIMENS_LOCAL_LLM_BIN==='docker'
  // Validate Docker installation
  const dockerAvailable = await validateDockerInstallation();
  if (!dockerAvailable) {
    return { found: false };
  }

  // Validate DMR availability
  const dmrAvailable = await validateDmrInstallation();
  if (!dmrAvailable) {
    return { found: false }; // DMR not available, don't report as installed
  }

  // Check if model exists (prefer canonical DMR_MODEL_NAME to avoid drift)
  const canonicalModelName = DMR_MODEL_NAME;
  const modelToCheck = envModel && envModel !== canonicalModelName ? canonicalModelName : (envModel || 'granite-4.0-micro');
  const modelExists = await checkModelExists(modelToCheck);

  if (modelExists) {
    return { 
      found: true, 
      binaryPath: 'docker', 
      modelPath: canonicalModelName 
    };
  } else {
    return { found: true, binaryPath: 'docker' }; // DMR available but model missing
  }
}

/**
 * Ensure Docker Model Runner is installed and ready
 */
export async function ensureDmrInstalled(onProgress?: (msg: string) => void): Promise<InstallResult> {
  // First, detect existing installation
  const existing = await detectExistingInstallation();
  
  if (existing.found && existing.binaryPath && existing.modelPath) {
    onProgress?.('Using existing Docker Model Runner installation');
    return { 
      success: true, 
      binaryPath: existing.binaryPath, 
      modelPath: existing.modelPath 
    };
  }

  // Check Docker installation
  const dockerAvailable = await validateDockerInstallation();
  if (!dockerAvailable) {
    return {
      success: false,
      error: 'Docker is not available. Please ensure Docker Desktop is installed and running from https://www.docker.com/products/docker-desktop'
    };
  }

  // Check DMR availability
  const dmrAvailable = await validateDmrInstallation();
  if (!dmrAvailable) {
    return {
      success: false,
      error: 'Docker Model Runner is not enabled. Please enable it in Docker Desktop settings or install the docker-model-plugin.'
    };
  }

  // Check if model already exists
  const modelExists = await checkModelExists('granite-4.0-micro');
  if (modelExists) {
    return { 
      success: true, 
      binaryPath: 'docker', 
      modelPath: DMR_MODEL_NAME 
    };
  }

  // Pull the model
  // Throttle state tracking to prevent spinner flooding
  let lastProgressUpdate = 0;
  const PROGRESS_THROTTLE_MS = 1000;
  
  onProgress?.('Pulling Granite 4.0 Micro model (this may take 2-3 minutes)...');
  
  try {
    return new Promise((resolve) => {
      const pullProcess = spawn('docker', ['model', 'pull', DMR_MODEL_NAME]);

      // Set up timeout for pull process (10 minutes)
      const pullTimeout = setTimeout(() => {
        pullProcess.kill();
        resolve({
          success: false,
          error: 'Model pull timed out after 10 minutes. Please ensure Docker Desktop is running and DMR is enabled, then try again.'
        });
      }, 10 * 60 * 1000); // 10 minutes

      pullProcess.stdout.on('data', (data) => {
        const output = data.toString();
        
        // Debug logging to file (avoids interleaving with spinner)
        debugLogger.log('dmrInstaller', `Pull progress: ${output.trim()}`);
        
        // Throttled progress update
        const now = Date.now();
        if (now - lastProgressUpdate >= PROGRESS_THROTTLE_MS) {
          onProgress?.('Pulling model layers...');
          lastProgressUpdate = now;
        }
      });

      pullProcess.stderr.on('data', (data) => {
        const error = data.toString();
        
        // Debug logging to file only (avoids interleaving with spinner)
        debugLogger.log('dmrInstaller', `Pull stderr: ${error.trim()}`);
        
        // No progress updates - let 'close' event handle errors
      });

      pullProcess.on('close', async (code) => {
        clearTimeout(pullTimeout); // Clear timeout on completion

        if (code === 0) {
          // Post-pull verification: confirm model exists in DMR's list
          onProgress?.('Verifying model installation...');
          const modelExists = await checkModelExists(DMR_MODEL_NAME);
          
          if (modelExists) {
            onProgress?.('Model pull complete');
            resolve({
              success: true,
              binaryPath: 'docker',
              modelPath: DMR_MODEL_NAME
            });
          } else {
            debugLogger.error('dmrInstaller', `Pull exited successfully (code 0) but model not found in 'docker model list'`);
            resolve({
              success: false,
              error: `Model pull reported success but verification failed. The model may not be properly installed. Please try running 'docker model pull ${DMR_MODEL_NAME}' manually.`
            });
          }
        } else {
          resolve({
            success: false,
            error: `Failed to pull model (exit code: ${code}). Please ensure Docker Desktop is running and DMR is enabled, then try again.`
          });
        }
      });

      pullProcess.on('error', (error) => {
        clearTimeout(pullTimeout); // Clear timeout on error
        debugLogger.error('dmrInstaller', `Pull process error: ${error}`);
        resolve({
          success: false,
          error: `Failed to start model pull: ${error.message}. Please ensure Docker Desktop is running and DMR is enabled.`
        });
      });
    });
  } catch (error) {
    return { 
      success: false, 
      error: `Model pull failed: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Get DMR paths (semantic placeholders for backward compatibility)
 */
export function getDmrPaths(): { binaryPath: string; modelPath: string } {
  return {
    binaryPath: 'docker',
    modelPath: DMR_MODEL_NAME,
  };
}

// Legacy function name for backward compatibility during transition
export const getLlamaPaths = getDmrPaths;

// Legacy function name for backward compatibility during transition
export const ensureLlamaCppInstalled = ensureDmrInstalled;

// Export alias for detectExistingDmr
export const detectExistingDmr = detectExistingInstallation;