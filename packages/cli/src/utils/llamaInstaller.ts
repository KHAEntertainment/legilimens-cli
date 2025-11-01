import { homedir, platform, arch } from 'os';
import { join } from 'path';
import { existsSync, mkdirSync, chmodSync, createWriteStream, unlinkSync, readdirSync, statSync, copyFileSync, rmSync } from 'fs';
import { pipeline } from 'stream/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import decompress from 'decompress';

export interface InstallResult {
  success: boolean;
  binaryPath?: string;
  modelPath?: string;
  error?: string;
}

const LEGILIMENS_DIR = join(homedir(), '.legilimens');
const BIN_DIR = join(LEGILIMENS_DIR, 'bin');
const MODELS_DIR = join(LEGILIMENS_DIR, 'models');

export interface ExistingInstallation {
  found: boolean;
  binaryPath?: string;
  modelPath?: string;
}

// Fallback version if GitHub API fails
const FALLBACK_LLAMA_VERSION = 'b6895';

// Platform-specific binary names
const PLATFORM_BINARY_NAMES: Record<string, string> = {
  'darwin-arm64': 'llama-{version}-bin-macos-arm64.zip',
  'darwin-x64': 'llama-{version}-bin-macos-x64.zip',
  'linux-x64': 'llama-{version}-bin-ubuntu-x64.zip',
  'win32-x64': 'llama-{version}-bin-win-avx2-x64.zip',
};

/**
 * Fetch the latest llama.cpp release tag from GitHub
 * Falls back to hardcoded version if API fails
 */
async function getLatestLlamaCppVersion(): Promise<string> {
  try {
    const response = await axios.get('https://api.github.com/repos/ggerganov/llama.cpp/releases/latest', {
      timeout: 5000,
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });
    
    const tagName = response.data.tag_name as string;
    if (tagName && tagName.startsWith('b')) {
      if (process.env.LEGILIMENS_DEBUG) {
        console.debug(`[llamaInstaller] Latest llama.cpp version: ${tagName}`);
      }
      return tagName;
    }
  } catch (error) {
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug(`[llamaInstaller] Failed to fetch latest version, using fallback: ${FALLBACK_LLAMA_VERSION}`);
    }
  }
  
  return FALLBACK_LLAMA_VERSION;
}

/**
 * Get download URL for llama.cpp binary based on platform and version
 */
async function getLlamaCppDownloadUrl(platformKey: string): Promise<string | null> {
  const version = await getLatestLlamaCppVersion();
  const binaryName = PLATFORM_BINARY_NAMES[platformKey];
  
  if (!binaryName) {
    return null;
  }
  
  const filename = binaryName.replace('{version}', version);
  return `https://github.com/ggerganov/llama.cpp/releases/download/${version}/${filename}`;
}

// Granite 4.0 Micro GGUF model URL (Q4_K_M recommended, ~2.1GB)
const GRANITE_MODEL_URL = 'https://huggingface.co/ibm-granite/granite-4.0-micro-GGUF/resolve/main/granite-4.0-micro-Q4_K_M.gguf';
const GRANITE_MODEL_FILENAME = 'granite-4.0-micro-Q4_K_M.gguf';
const GRANITE_MODEL_LEGACY_FILENAME = 'phi-4-q4.gguf'; // For backward compatibility

// PHI-4 model constants (for legacy support)
const PHI4_MODEL_URL = 'https://huggingface.co/bartowski/Phi-4-GGUF/resolve/main/Phi-4-Q4_K_M.gguf';
const PHI4_MODEL_FILENAME = 'phi-4-q4.gguf';
const PHI4_MODEL_LEGACY_FILENAME = 'phi-4-Q4_K_M.gguf';

function getPlatformKey(): string | null {
  const p = platform();
  const a = arch();
  const key = `${p}-${a}`;
  if (key in PLATFORM_BINARY_NAMES) return key;
  return null;
}

/**
 * Recursively search a directory for an executable binary
 * Looks for files named 'main', 'main.exe', 'llama-cli', or similar
 */
function findBinaryInDirectory(dir: string, depth = 0, maxDepth = 5): string | null {
  if (depth > maxDepth || !existsSync(dir)) return null;
  
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    const isWindows = platform() === 'win32';
    
    // Prioritized binary names to search for
    const binaryNames = isWindows 
      ? ['main.exe', 'llama-cli.exe', 'llama.exe']
      : ['main', 'llama-cli', 'llama', 'llama-server'];
    
    // First pass: look for exact matches in current directory
    for (const entry of entries) {
      if (entry.isFile()) {
        const lowerName = entry.name.toLowerCase();
        for (const targetName of binaryNames) {
          if (lowerName === targetName.toLowerCase()) {
            const fullPath = join(dir, entry.name);
            // On Unix, verify it's executable or can be made executable
            if (!isWindows) {
              try {
                const stats = statSync(fullPath);
                // Check if it's executable or if we can make it executable
                if (stats.mode & 0o111 || true) { // Always return if found, we'll chmod later
                  return fullPath;
                }
              } catch {
                continue;
              }
            }
            return fullPath;
          }
        }
      }
    }
    
    // Second pass: recursively search subdirectories
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const found = findBinaryInDirectory(join(dir, entry.name), depth + 1, maxDepth);
        if (found) return found;
      }
    }
  } catch (error) {
    // Ignore permission errors or other issues
    return null;
  }
  
  return null;
}

/**
 * Detect existing llama.cpp installation outside ~/.legilimens directory
 */
export async function detectExistingInstallation(): Promise<ExistingInstallation> {
  // Check environment variables first
  const envBin = process.env.LEGILIMENS_LOCAL_LLM_BIN;
  const envModel = process.env.LEGILIMENS_LOCAL_LLM_MODEL;

  if (envBin && envModel && existsSync(envBin) && existsSync(envModel)) {
    // Validate binary from environment variable
    if (await validateLlamaBinary(envBin)) {
      return { found: true, binaryPath: envBin, modelPath: envModel };
    } else if (process.env.LEGILIMENS_DEBUG) {
      console.debug(`[llamaInstaller] Binary from env var failed validation: ${envBin}`);
    }
  }

  // Check common installation paths for llama.cpp binary
  const binaryName = platform() === 'win32' ? 'main.exe' : 'main';
  const commonPaths = [
    join(BIN_DIR, binaryName), // Check our expected location first
    '/usr/local/bin/llama-cli',
    '/usr/local/bin/main',
    '/opt/homebrew/bin/llama-cli',
    '/opt/homebrew/bin/main',
    join(homedir(), 'llama.cpp', binaryName),
    join(homedir(), 'llama.cpp', 'build', 'bin', binaryName),
    ...(platform() === 'win32' ? ['C:\\Program Files\\llama.cpp\\main.exe'] : [])
  ];
  
  // Remove recursive BIN_DIR scan - it was finding broken binaries
  // Now we only check explicit paths and validate each one

  for (const path of commonPaths) {
    if (existsSync(path)) {
      // Validate binary before accepting it
      if (!(await validateLlamaBinary(path))) {
        if (process.env.LEGILIMENS_DEBUG) {
          console.debug(`[llamaInstaller] Found binary at ${path} but validation failed, skipping`);
        }
        continue; // Skip invalid binaries
      }
      
      // Found and validated binary, now look for model
      const binDir = path.substring(0, path.lastIndexOf(platform() === 'win32' ? '\\' : '/'));
      const modelPaths = [
        // Check MODELS_DIR first (standard location for ~/.legilimens installs)
        join(MODELS_DIR, GRANITE_MODEL_FILENAME),
        join(MODELS_DIR, GRANITE_MODEL_LEGACY_FILENAME),
        // Check relative to binary
        join(binDir, GRANITE_MODEL_FILENAME),
        join(binDir, GRANITE_MODEL_LEGACY_FILENAME),
        join(binDir, '..', 'models', GRANITE_MODEL_FILENAME),
        join(binDir, '..', 'models', GRANITE_MODEL_LEGACY_FILENAME),
        // Check HuggingFace cache
        join(homedir(), '.cache', 'huggingface', 'hub', 'models--ibm-granite--granite-4.0-micro-GGUF', GRANITE_MODEL_FILENAME),
        // Check system-wide locations
        `/usr/local/share/llama.cpp/models/${GRANITE_MODEL_FILENAME}`,
        `/usr/local/share/llama.cpp/models/${GRANITE_MODEL_LEGACY_FILENAME}`
      ];

      for (const modelPath of modelPaths) {
        if (existsSync(modelPath)) {
          // Check if file is reasonably sized (Granite should be ~2.1GB, so anything < 1GB is likely partial)
          try {
            const stats = statSync(modelPath);
            const sizeGB = stats.size / (1024 * 1024 * 1024);
            if (sizeGB < 1.0) {
              if (process.env.LEGILIMENS_DEBUG) {
                console.debug(`[llamaInstaller] Skipping ${modelPath} - too small (${sizeGB.toFixed(2)}GB, likely partial download)`);
              }
              continue; // Skip partial downloads
            }
          } catch (error) {
            // If we can't stat the file, skip it
            if (process.env.LEGILIMENS_DEBUG) {
              console.debug(`[llamaInstaller] Cannot stat ${modelPath}, skipping: ${error}`);
            }
            continue;
          }
          return { found: true, binaryPath: path, modelPath };
        }
      }

      // Found and validated binary but not model - return binary only
      return { found: true, binaryPath: path };
    }
  }

  return { found: false };
}

export async function ensureLlamaCppInstalled(onProgress?: (msg: string) => void): Promise<InstallResult> {
  // First, detect existing installation
  const existing = await detectExistingInstallation();
  if (existing.found && existing.binaryPath && existing.modelPath) {
    onProgress?.(`Using existing llama.cpp installation at ${existing.binaryPath}`);
    return { success: true, binaryPath: existing.binaryPath, modelPath: existing.modelPath };
  }

  const platformKey = getPlatformKey();
  if (!platformKey) {
    return { success: false, error: `Unsupported platform: ${platform()}-${arch()}` };
  }

  if (!existsSync(BIN_DIR)) mkdirSync(BIN_DIR, { recursive: true });
  if (!existsSync(MODELS_DIR)) mkdirSync(MODELS_DIR, { recursive: true });

  const binaryName = platform() === 'win32' ? 'main.exe' : 'main';
  const binaryPath = join(BIN_DIR, binaryName);
  const modelPath = join(MODELS_DIR, GRANITE_MODEL_FILENAME);
  const legacyModelPath = join(MODELS_DIR, GRANITE_MODEL_LEGACY_FILENAME);

  // Check if already installed in ~/.legilimens (check both current and legacy model filenames)
  if (existsSync(binaryPath)) {
    // Validate existing binary before using it
    if (!(await validateLlamaBinary(binaryPath))) {
      onProgress?.('Existing binary failed validation, reinstalling...');
      if (process.env.LEGILIMENS_DEBUG) {
        console.debug(`[llamaInstaller] Removing invalid binary at ${binaryPath}`);
      }
      try {
        unlinkSync(binaryPath);
      } catch (error) {
        if (process.env.LEGILIMENS_DEBUG) {
          console.debug(`[llamaInstaller] Failed to remove invalid binary: ${error}`);
        }
      }
    } else if (existsSync(modelPath)) {
      return { success: true, binaryPath, modelPath };
    } else if (existsSync(legacyModelPath)) {
      // Legacy filename exists - use it
      return { success: true, binaryPath, modelPath: legacyModelPath };
    }
  }

  // Use existing binary if found, only download model if truly missing
  if (existing.found && existing.binaryPath) {
    onProgress?.(`Using existing llama.cpp binary at ${existing.binaryPath}`);
    
    // If detection found a model, use it!
    if (existing.modelPath && existsSync(existing.modelPath)) {
      onProgress?.(`Using existing model at ${existing.modelPath}`);
      return { success: true, binaryPath: existing.binaryPath, modelPath: existing.modelPath };
    }
    
    // Check if model exists at expected location (either filename)
    if (existsSync(modelPath)) {
      onProgress?.(`Using existing model at ${modelPath}`);
      return { success: true, binaryPath: existing.binaryPath, modelPath };
    } else if (existsSync(legacyModelPath)) {
      onProgress?.(`Using existing model at ${legacyModelPath}`);
      return { success: true, binaryPath: existing.binaryPath, modelPath: legacyModelPath };
    }
    
    // Only download if model is truly missing
    onProgress?.('Downloading Granite GGUF model (~2.1GB, this may take a while)...');
    try {
      const response = await axios.get(GRANITE_MODEL_URL, {
        responseType: 'stream',
        onDownloadProgress: (progressEvent) => {
          const total = progressEvent.total ?? 0;
          const current = progressEvent.loaded;
          const pct = total > 0 ? Math.round((current / total) * 100) : 0;
          onProgress?.(`Downloading model: ${pct}%`);
        }
      });
      const writer = createWriteStream(modelPath);
      await pipeline(response.data, writer);
      onProgress?.('Model downloaded successfully');
      return { success: true, binaryPath: existing.binaryPath, modelPath };
    } catch (error) {
      return { success: false, error: `Failed to download Granite model: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  // Download llama.cpp binary
  if (!existsSync(binaryPath)) {
    onProgress?.('Downloading llama.cpp binary...');
    try {
      const url = await getLlamaCppDownloadUrl(platformKey);
      if (!url) {
        return { success: false, error: 'Failed to determine llama.cpp download URL' };
      }
      
      const version = await getLatestLlamaCppVersion();
      const zipPath = join(BIN_DIR, 'llama.zip');
      const response = await axios.get(url, { responseType: 'stream' });
      const writer = createWriteStream(zipPath);
      await pipeline(response.data, writer);

      onProgress?.('Extracting llama.cpp...');
      const extractTempDir = join(BIN_DIR, 'extract_temp');
      await decompress(zipPath, extractTempDir);
      unlinkSync(zipPath);
      
      // Find the actual binary in the extracted directory structure
      onProgress?.('Locating binary...');
      const foundBinary = findBinaryInDirectory(extractTempDir);
      
      if (!foundBinary) {
        // Clean up temp directory
        rmSync(extractTempDir, { recursive: true, force: true });
        return { success: false, error: 'Binary not found in downloaded archive. Expected main or llama-cli executable.' };
      }
      
      // Determine the root directory of the llama.cpp installation
      // The binary is typically in something like: extract_temp/llama-b6895-bin-macos-arm64/build/bin/llama-cli
      // We want to preserve the entire structure under a versioned directory
      const versionedDir = join(BIN_DIR, `llama-${version}`);
      
      onProgress?.('Installing binary with dependencies...');
      
      // Find the top-level directory in the extraction (usually something like llama-b6895-bin-macos-arm64)
      const extractedContents = readdirSync(extractTempDir, { withFileTypes: true });
      const topLevelDir = extractedContents.find(entry => entry.isDirectory());
      
      if (!topLevelDir) {
        rmSync(extractTempDir, { recursive: true, force: true });
        return { success: false, error: 'Unexpected archive structure: no top-level directory found.' };
      }
      
      const sourcePath = join(extractTempDir, topLevelDir.name);
      
      // Remove existing versioned directory if it exists
      if (existsSync(versionedDir)) {
        rmSync(versionedDir, { recursive: true, force: true });
      }
      
      // Move the entire directory structure to preserve all dependencies
      mkdirSync(versionedDir, { recursive: true });
      
      // Copy all contents from source to versioned directory
      const copyRecursive = (src: string, dest: string) => {
        const entries = readdirSync(src, { withFileTypes: true });
        for (const entry of entries) {
          const srcPath = join(src, entry.name);
          const destPath = join(dest, entry.name);
          if (entry.isDirectory()) {
            mkdirSync(destPath, { recursive: true });
            copyRecursive(srcPath, destPath);
          } else {
            copyFileSync(srcPath, destPath);
            // Preserve permissions
            if (platform() !== 'win32') {
              const stats = statSync(srcPath);
              chmodSync(destPath, stats.mode);
            }
          }
        }
      };
      
      copyRecursive(sourcePath, versionedDir);
      
      // Clean up temp extraction directory
      rmSync(extractTempDir, { recursive: true, force: true });
      
      // Find the binary in the new versioned directory
      const installedBinary = findBinaryInDirectory(versionedDir);
      
      if (!installedBinary) {
        return { success: false, error: 'Binary not found after installation.' };
      }
      
      // Create a symlink at the expected binaryPath location
      // This maintains backward compatibility with existing config
      if (existsSync(binaryPath)) {
        unlinkSync(binaryPath);
      }
      
      if (platform() === 'win32') {
        // On Windows, copy the binary to the expected location
        copyFileSync(installedBinary, binaryPath);
      } else {
        // On Unix, create a symlink
        const { symlinkSync } = await import('fs');
        symlinkSync(installedBinary, binaryPath);
      }
      
      // Validate the newly installed binary
      if (!(await validateLlamaBinary(binaryPath))) {
        return { success: false, error: 'Downloaded binary failed validation. It may be missing required libraries.' };
      }
      
      onProgress?.(`Binary installed at ${binaryPath}`);
    } catch (error) {
      return { success: false, error: `Failed to download llama.cpp: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  // Download Granite model
  if (!existsSync(modelPath)) {
    onProgress?.('Downloading Granite GGUF model (~2.1GB, this may take a while)...');
    try {
      const response = await axios.get(GRANITE_MODEL_URL, { 
        responseType: 'stream',
        onDownloadProgress: (progressEvent) => {
          const total = progressEvent.total ?? 0;
          const current = progressEvent.loaded;
          const pct = total > 0 ? Math.round((current / total) * 100) : 0;
          onProgress?.(`Downloading model: ${pct}%`);
        }
      });
      const writer = createWriteStream(modelPath);
      await pipeline(response.data, writer);
      onProgress?.('Model downloaded successfully');
    } catch (error) {
      return { success: false, error: `Failed to download Granite model: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  return { success: true, binaryPath, modelPath };
}

export function getLlamaPaths(): { binaryPath: string; modelPath: string } {
  const binaryName = platform() === 'win32' ? 'main.exe' : 'main';
  const modelPath = join(MODELS_DIR, GRANITE_MODEL_FILENAME);
  const legacyModelPath = join(MODELS_DIR, GRANITE_MODEL_LEGACY_FILENAME);
  
  // Return current filename, but check if legacy exists and current doesn't
  return {
    binaryPath: join(BIN_DIR, binaryName),
    modelPath: existsSync(legacyModelPath) && !existsSync(modelPath) ? legacyModelPath : modelPath,
  };
}

const execFileAsync = promisify(execFile);

/**
 * Validate that a binary is a working llama.cpp executable
 * Tests execution with --version flag and 5-second timeout
 */
async function validateLlamaBinary(binaryPath: string): Promise<boolean> {
  if (!existsSync(binaryPath)) {
    return false;
  }

  try {
    const result = await execFileAsync(binaryPath, ['--version'], {
      timeout: 5000,
      env: { ...process.env }
    });
    
    const output = result.stdout + result.stderr;
    const isValid = output.toLowerCase().includes('llama');
    
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug(`[llamaInstaller] Binary validation for ${binaryPath}: ${isValid ? 'PASS' : 'FAIL'}`);
      if (!isValid) {
        console.debug(`[llamaInstaller] Output: ${output.substring(0, 200)}`);
      }
    }
    
    return isValid;
  } catch (error) {
    if (process.env.LEGILIMENS_DEBUG) {
      console.debug(`[llamaInstaller] Binary validation failed for ${binaryPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
    return false;
  }
}