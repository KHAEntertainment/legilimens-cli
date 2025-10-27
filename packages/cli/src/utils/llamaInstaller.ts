import { homedir, platform, arch } from 'os';
import { join } from 'path';
import { existsSync, mkdirSync, chmodSync, createWriteStream, unlinkSync, readdirSync, statSync, copyFileSync, rmSync } from 'fs';
import { pipeline } from 'stream/promises';
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

// llama.cpp release URLs (adjust to actual releases)
const LLAMA_CPP_RELEASES: Record<string, string> = {
  'darwin-arm64': 'https://github.com/ggerganov/llama.cpp/releases/download/b4359/llama-b4359-bin-macos-arm64.zip',
  'darwin-x64': 'https://github.com/ggerganov/llama.cpp/releases/download/b4359/llama-b4359-bin-macos-x64.zip',
  'linux-x64': 'https://github.com/ggerganov/llama.cpp/releases/download/b4359/llama-b4359-bin-ubuntu-x64.zip',
  'win32-x64': 'https://github.com/ggerganov/llama.cpp/releases/download/b4359/llama-b4359-bin-win-avx2-x64.zip',
};

// phi-4 GGUF model URL (Q4_K_M recommended, ~8.5GB)
const PHI4_MODEL_URL = 'https://huggingface.co/QuantFactory/phi-4-GGUF/resolve/main/phi-4.Q4_K_M.gguf';
const PHI4_MODEL_FILENAME = 'phi-4.Q4_K_M.gguf';
const PHI4_MODEL_LEGACY_FILENAME = 'phi-4-q4.gguf'; // For backward compatibility

function getPlatformKey(): string | null {
  const p = platform();
  const a = arch();
  const key = `${p}-${a}`;
  if (key in LLAMA_CPP_RELEASES) return key;
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
    return { found: true, binaryPath: envBin, modelPath: envModel };
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
  
  // Also scan BIN_DIR recursively if it exists
  if (existsSync(BIN_DIR)) {
    const foundInBinDir = findBinaryInDirectory(BIN_DIR);
    if (foundInBinDir && !commonPaths.includes(foundInBinDir)) {
      commonPaths.unshift(foundInBinDir);
    }
  }

  for (const path of commonPaths) {
    if (existsSync(path)) {
      // Found binary, now look for model in same directory or common model paths
      const binDir = path.substring(0, path.lastIndexOf(platform() === 'win32' ? '\\' : '/'));
      const modelPaths = [
        // Check MODELS_DIR first (standard location for ~/.legilimens installs)
        join(MODELS_DIR, PHI4_MODEL_FILENAME),
        join(MODELS_DIR, PHI4_MODEL_LEGACY_FILENAME),
        // Check relative to binary
        join(binDir, PHI4_MODEL_FILENAME),
        join(binDir, PHI4_MODEL_LEGACY_FILENAME),
        join(binDir, '..', 'models', PHI4_MODEL_FILENAME),
        join(binDir, '..', 'models', PHI4_MODEL_LEGACY_FILENAME),
        // Check HuggingFace cache
        join(homedir(), '.cache', 'huggingface', 'hub', 'models--QuantFactory--phi-4-GGUF', PHI4_MODEL_FILENAME),
        // Check system-wide locations
        `/usr/local/share/llama.cpp/models/${PHI4_MODEL_FILENAME}`,
        `/usr/local/share/llama.cpp/models/${PHI4_MODEL_LEGACY_FILENAME}`
      ];

      for (const modelPath of modelPaths) {
        if (existsSync(modelPath)) {
          // Check if file is reasonably sized (phi-4 should be ~8.5GB, so anything < 1GB is likely partial)
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

      // Found binary but not model - return binary only
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
  const modelPath = join(MODELS_DIR, PHI4_MODEL_FILENAME);
  const legacyModelPath = join(MODELS_DIR, PHI4_MODEL_LEGACY_FILENAME);

  // Check if already installed in ~/.legilimens (check both current and legacy model filenames)
  if (existsSync(binaryPath)) {
    if (existsSync(modelPath)) {
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
    onProgress?.('Downloading phi-4 GGUF model (~8.5GB, this may take a while)...');
    try {
      const response = await axios.get(PHI4_MODEL_URL, {
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
      return { success: false, error: `Failed to download phi-4 model: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  // Download llama.cpp binary
  if (!existsSync(binaryPath)) {
    onProgress?.('Downloading llama.cpp binary...');
    try {
      const url = LLAMA_CPP_RELEASES[platformKey];
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
      
      // Copy binary to expected location
      copyFileSync(foundBinary, binaryPath);
      
      // Clean up temp extraction directory
      rmSync(extractTempDir, { recursive: true, force: true });
      
      // Make executable on Unix
      if (platform() !== 'win32' && existsSync(binaryPath)) {
        chmodSync(binaryPath, 0o755);
      }
      
      onProgress?.(`Binary installed at ${binaryPath}`);
    } catch (error) {
      return { success: false, error: `Failed to download llama.cpp: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  // Download phi-4 model
  if (!existsSync(modelPath)) {
    onProgress?.('Downloading phi-4 GGUF model (~8.5GB, this may take a while)...');
    try {
      const response = await axios.get(PHI4_MODEL_URL, { 
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
      return { success: false, error: `Failed to download phi-4 model: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  return { success: true, binaryPath, modelPath };
}

export function getLlamaPaths(): { binaryPath: string; modelPath: string } {
  const binaryName = platform() === 'win32' ? 'main.exe' : 'main';
  const modelPath = join(MODELS_DIR, PHI4_MODEL_FILENAME);
  const legacyModelPath = join(MODELS_DIR, PHI4_MODEL_LEGACY_FILENAME);
  
  // Return current filename, but check if legacy exists and current doesn't
  return {
    binaryPath: join(BIN_DIR, binaryName),
    modelPath: existsSync(legacyModelPath) && !existsSync(modelPath) ? legacyModelPath : modelPath,
  };
}

