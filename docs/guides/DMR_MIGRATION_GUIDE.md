# Docker Model Runner Migration Guide

This guide helps existing Legilimens users migrate from the old llama.cpp implementation to the new Docker Model Runner (DMR) architecture.

## Overview

Legilimens has migrated from llama.cpp to Docker Model Runner (DMR) for local AI generation. This change improves reliability, simplifies installation, and resolves compatibility issues with IBM Granite 4 Micro's hybrid mamba/transformer architecture.

### Key Changes

- **Local LLM now runs via Docker Model Runner (HTTP API)**
- **Model management handled by Docker (no manual GGUF downloads)**
- **Simplified installation (no platform-specific binaries)**
- **Improved error handling and debugging**

## Prerequisites

### Required

- **Docker Desktop** installed and running
- **Docker Model Runner** enabled (included in Docker Desktop)

### Installation

1. Download Docker Desktop: https://www.docker.com/products/docker-desktop
2. Install and start Docker Desktop
3. Verify installation:
   ```bash
   docker --version
   docker model version
   ```

## Migration Steps

### Step 1: Backup Existing Configuration (Optional)

If you want to preserve your current settings:

```bash
cp ~/.legilimens/config.json ~/.legilimens/config.json.backup
```

**Note:** Your API keys (Tavily, Firecrawl, Context7) are stored separately in the system keychain and will not be affected.

### Step 2: Remove Old Configuration

The config structure has changed. Remove the old config file:

```bash
rm ~/.legilimens/config.json
```

### Step 3: Clean Up Old llama.cpp Files (Optional)

Remove old llama.cpp binaries and GGUF models to free disk space:

```bash
rm -rf ~/.legilimens/bin/
rm -rf ~/.legilimens/models/
```

**Disk Space Saved:** ~2-3 GB (GGUF models are no longer needed)

### Step 4: Run Setup Wizard

Run the setup wizard to configure DMR:

```bash
pnpm --filter @legilimens/cli start
```

The wizard will:
1. Detect Docker Desktop and Docker Model Runner
2. Pull the Granite 4.0 Micro model from Docker Hub
3. Configure local LLM settings
4. Validate the installation

**Expected Output:**

```
✓ Docker Model Runner: Available (Docker + DMR enabled)
✓ Granite model: granite-4.0-micro:latest (pulled)
✓ Tavily API: Configured
```

### Step 5: Verify Configuration

Check that the new config was created:

```bash
cat ~/.legilimens/config.json
```

Verify it contains:

```json
{
  "localLlm": {
    "enabled": true,
    "modelName": "granite-4.0-micro:latest",
    "apiEndpoint": "http://localhost:12434",
    "tokens": 8192,
    "temp": 0.2,
    "timeoutMs": 30000
  },
  "setupCompleted": true
}
```

### Step 6: Test AI Generation

Generate a test gateway doc to verify DMR is working:

```bash
pnpm --filter @legilimens/cli start
```

Select "Generate gateway doc" and input a simple dependency (e.g., "lodash").

**Expected Behavior:**
- AI generation should complete in 2-5 seconds
- Output should show: "AI generation succeeded with local LLM"
- Generated doc should contain AI-generated content

## Configuration Changes

### Old Configuration (llama.cpp)

```json
{
  "localLlm": {
    "enabled": true,
    "binaryPath": "/Users/username/.legilimens/bin/main",
    "modelPath": "/Users/username/.legilimens/models/granite-4.0-micro-Q4_K_M.gguf",
    "tokens": 8192
  }
}
```

### New Configuration (DMR)

```json
{
  "localLlm": {
    "enabled": true,
    "modelName": "granite-4.0-micro:latest",
    "apiEndpoint": "http://localhost:12434",
    "tokens": 8192
  }
}
```

### Key Differences

- `binaryPath` → removed (Docker manages runtime)
- `modelPath` → `modelName` (Docker Hub identifier)
- `apiEndpoint` → new (DMR HTTP endpoint)

## Environment Variable Changes

### Old Environment Variables (Deprecated)

```bash
export LEGILIMENS_LOCAL_LLM_BIN=/path/to/llama.cpp/main
export LEGILIMENS_LOCAL_LLM_MODEL=/path/to/model.gguf
```

### New Environment Variables

```bash
export LEGILIMENS_LOCAL_LLM_MODEL_NAME=granite-4.0-micro:latest
export LEGILIMENS_LOCAL_LLM_API_ENDPOINT=http://localhost:12434
```

**CI/CD Impact:** Update deployment scripts and environment variable names.

## Troubleshooting

### Issue: "Docker Model Runner not available"

**Symptoms:**
- Setup wizard shows: "✗ Docker Model Runner: Not available"
- Error: "Docker is not installed"

**Solutions:**
1. Install Docker Desktop from https://www.docker.com/products/docker-desktop
2. Start Docker Desktop
3. Verify: `docker --version` and `docker model version`
4. Re-run setup wizard

### Issue: "Cannot connect to Docker Model Runner"

**Symptoms:**
- AI generation fails with connection error
- Error: "ECONNREFUSED"

**Solutions:**
1. Ensure Docker Desktop is running
2. Check Docker daemon status: `docker ps`
3. Restart Docker Desktop if needed
4. Verify DMR endpoint: `curl http://localhost:12434/health` (if available)

### Issue: "Model not pulled"

**Symptoms:**
- Setup wizard shows: "✗ Granite model: Not pulled"
- Error: "DMR model not configured"

**Solutions:**
1. Pull model manually: `docker model pull ai/granite-4.0-micro:latest`
2. Verify: `docker model list | grep granite`
3. Re-run setup wizard

### Issue: "AI generation slower than before"

**Symptoms:**
- First request takes 10-15 seconds (cold start)
- Subsequent requests are faster (2-5 seconds)

**Explanation:**
DMR has a cold start delay when loading the model for the first time after Docker restart. This is normal behavior.

**Solutions:**
1. Keep Docker Desktop running to avoid cold starts
2. Increase Docker resource allocation (CPU/Memory) in Docker Desktop settings
3. Consider using external CLI tools (Gemini, Claude) for faster initial responses

### Issue: "Old GGUF files taking up disk space"

**Symptoms:**
- `~/.legilimens/models/` directory contains large GGUF files
- Disk space usage high

**Solutions:**
1. Remove old GGUF files: `rm -rf ~/.legilimens/models/`
2. Remove old llama.cpp binaries: `rm -rf ~/.legilimens/bin/`
3. Docker manages models internally (no manual cleanup needed)

## Rollback Instructions

If you need to rollback to llama.cpp (not recommended):

1. Checkout previous git commit before DMR refactor
2. Restore backup config: `cp ~/.legilimens/config.json.backup ~/.legilimens/config.json`
3. Re-download llama.cpp binaries and GGUF models
4. Run setup wizard from old version

**Note:** Rollback is not officially supported. Contact maintainers if you encounter issues with DMR.

## Benefits of DMR Migration

### Reliability
- No more llama.cpp installation issues
- No platform-specific binary compatibility problems
- Consistent behavior across macOS, Linux, Windows

### Simplicity
- Docker manages model downloads and updates
- No manual GGUF file management
- Automatic model versioning

### Performance
- HTTP-based API is more stable than process spawning
- Better error handling and retry logic
- Improved timeout management

### Compatibility
- Resolves IBM Granite 4 Micro hybrid architecture issues
- Supports future model upgrades seamlessly
- OpenAI-compatible API for easier integration

## FAQ

### Q: Do I need to keep Docker Desktop running?

**A:** Yes, Docker Desktop must be running for local LLM to work. If Docker is stopped, Legilimens will fall back to external CLI tools (Gemini, Claude, etc.).

### Q: Can I use a different model?

**A:** Currently, Legilimens is configured for Granite 4.0 Micro. Support for other models may be added in future releases.

### Q: What happens to my API keys?

**A:** API keys (Tavily, Firecrawl, Context7) are stored separately in the system keychain and are not affected by the DMR migration.

### Q: Can I use DMR and external CLI tools together?

**A:** Yes, Legilimens will try DMR first, then fall back to external CLI tools if DMR fails. This provides redundancy.

### Q: How much disk space does DMR use?

**A:** The Granite 4.0 Micro model is ~2.1 GB. Docker manages storage internally, so you don't need to manually allocate space.

### Q: Is DMR faster than llama.cpp?

**A:** Performance is comparable. DMR has a cold start delay (~10s) but subsequent requests are fast (~2-5s). llama.cpp had similar performance characteristics.

### Q: Can I run DMR on a server without Docker Desktop?

**A:** Yes, you can use Docker Engine (CLI-only) on Linux servers. Docker Model Runner is compatible with both Docker Desktop and Docker Engine.

## Support

If you encounter issues during migration:

1. Enable debug mode: `export LEGILIMENS_DEBUG=true`
2. Run gateway generation and capture output
3. Check logs for DMR-specific errors
4. Consult troubleshooting section above
5. Open GitHub issue with debug output if problem persists

## Changelog

### Version X.X.X (DMR Migration)

**Breaking Changes:**
- Migrated from llama.cpp to Docker Model Runner
- Updated config structure: `modelName` and `apiEndpoint`
- Updated environment variables: `LEGILIMENS_LOCAL_LLM_MODEL_NAME`, `LEGILIMENS_LOCAL_LLM_API_ENDPOINT`
- Docker Desktop now required for local LLM
- GGUF files no longer used (can be deleted)

**Improvements:**
- Improved error handling for Docker/DMR issues
- Added cold start detection and warnings
- Removed GGUF file management
- Simplified installation process

**Migration Required:**
- Config file structure changed (requires re-running setup wizard)
- Environment variable names changed (update CI/CD scripts)

## Next Steps

After successful migration:

1. Update any automation scripts to use new environment variables
2. Remove old llama.cpp files to free disk space
3. Configure Docker Desktop resource allocation for optimal performance
4. Test gateway generation with various dependencies
5. Monitor DMR performance and report any issues

---

**Welcome to the new Docker Model Runner architecture! 🚀**
