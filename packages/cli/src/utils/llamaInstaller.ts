import { homedir, platform, arch } from 'os';
import { join } from 'path';
import { existsSync, mkdirSync, chmodSync, createWriteStream, unlinkSync } from 'fs';
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

function getPlatformKey(): string | null {
  const p = platform();
  const a = arch();
  const key = `${p}-${a}`;
  if (key in LLAMA_CPP_RELEASES) return key;
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
    '/usr/local/bin/llama-cli',
    '/usr/local/bin/main',
    '/opt/homebrew/bin/llama-cli',
    '/opt/homebrew/bin/main',
    join(homedir(), 'llama.cpp', binaryName),
    join(homedir(), 'llama.cpp', 'build', 'bin', binaryName),
    ...(platform() === 'win32' ? ['C:\\Program Files\\llama.cpp\\main.exe'] : [])
  ];

  for (const path of commonPaths) {
    if (existsSync(path)) {
      // Found binary, now look for model in same directory or common model paths
      const binDir = path.substring(0, path.lastIndexOf(platform() === 'win32' ? '\\' : '/'));
      const modelPaths = [
        join(binDir, 'phi-4-q4.gguf'),
        join(binDir, 'phi-4.Q4_K_M.gguf'),
        join(binDir, '..', 'models', 'phi-4-q4.gguf'),
        join(homedir(), '.cache', 'huggingface', 'hub', 'models--QuantFactory--phi-4-GGUF', 'phi-4.Q4_K_M.gguf'),
        '/usr/local/share/llama.cpp/models/phi-4-q4.gguf',
        '/usr/local/share/llama.cpp/models/phi-4.Q4_K_M.gguf'
      ];

      for (const modelPath of modelPaths) {
        if (existsSync(modelPath)) {
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
  const modelPath = join(MODELS_DIR, 'phi-4-q4.gguf');

  // Check if already installed in ~/.legilimens
  if (existsSync(binaryPath) && existsSync(modelPath)) {
    return { success: true, binaryPath, modelPath };
  }

  // Use existing binary if found, only download model
  if (existing.found && existing.binaryPath && !existing.modelPath) {
    onProgress?.(`Using existing llama.cpp binary at ${existing.binaryPath}`);
    // Download only the model
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
        return { success: true, binaryPath: existing.binaryPath, modelPath };
      } catch (error) {
        return { success: false, error: `Failed to download phi-4 model: ${error instanceof Error ? error.message : String(error)}` };
      }
    }
    return { success: true, binaryPath: existing.binaryPath, modelPath };
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
      await decompress(zipPath, BIN_DIR);
      unlinkSync(zipPath);
      
      if (platform() !== 'win32' && existsSync(binaryPath)) {
        chmodSync(binaryPath, 0o755);
      }
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
  return {
    binaryPath: join(BIN_DIR, binaryName),
    modelPath: join(MODELS_DIR, 'phi-4-q4.gguf'),
  };
}

