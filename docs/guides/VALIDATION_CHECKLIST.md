# DMR Integration Validation Checklist

This document guides engineers through systematic validation of the Docker Model Runner (DMR) refactor. Complete all sections to ensure the integration is working correctly across all components.

## 1. Pre-Validation Setup

Before starting validation, ensure your environment is properly configured:

- [ ] Verify Docker Desktop is installed and running: `docker --version`
- [ ] Verify Docker Model Runner is enabled: `docker model version`
- [ ] Verify Granite model is pulled: `docker model list | grep granite-4.0-micro`
- [ ] If model missing, pull it: `docker model pull ai/granite-4.0-micro:latest`
- [ ] Set debug mode: `export LEGILIMENS_DEBUG=true`
- [ ] Clean existing config (optional, for fresh start): `rm -rf ~/.legilimens/config.json`

## 2. Configuration Persistence Validation

Verify that the DMR configuration is correctly saved and loaded:

- [ ] Run setup wizard: `pnpm --filter @legilimens/cli start`
- [ ] Verify wizard detects Docker/DMR: Check for "✓ Docker Model Runner: Available" message
- [ ] Complete wizard setup with DMR enabled
- [ ] Verify config file created: `cat ~/.legilimens/config.json`
- [ ] Verify config contains:
  - `localLlm.enabled: true`
  - `localLlm.modelName: "granite-4.0-micro:latest"`
  - `localLlm.apiEndpoint: "http://localhost:12434"`
- [ ] Verify environment variables populated:
  - `echo $LEGILIMENS_LOCAL_LLM_MODEL_NAME` → should output model name
  - `echo $LEGILIMENS_LOCAL_LLM_API_ENDPOINT` → should output endpoint

## 3. AI Generation Integration Validation

### Test 1: Gateway AI Generation

- [ ] Generate a gateway doc: `pnpm --filter @legilimens/cli start` → select "Generate gateway doc"
- [ ] Input: dependency identifier (e.g., "lodash"), type ("library")
- [ ] Monitor debug output for DMR requests:
  - `[localLlm] DMR Configuration: enabled=true, modelName=granite-4.0-micro:latest`
  - `[localLlm] DMR request: {"model":"granite-4.0-micro:latest",...}`
  - `[localLlm] DMR response status: 200`
- [ ] Verify AI generation succeeds: Check for "AI generation succeeded with local LLM" in output
- [ ] Verify generated gateway doc contains AI-generated content (not fallback)
- [ ] Check metadata in result: `aiGenerationMethod: 'local-llm'`, `aiGenerationFailed: false`

### Test 2: Document Chunker

- [ ] Generate gateway doc for large dependency (e.g., "react")
- [ ] Monitor debug output for chunking:
  - `[gateway] Routing decision: condense` (if docs > 8K tokens)
  - `[localLlm] DMR request` (multiple times for chunk summarization)
- [ ] Verify chunking completes without errors
- [ ] Verify final gateway doc is generated successfully

### Test 3: Repository Discovery Pipeline

- [ ] Generate gateway doc with ambiguous identifier (e.g., "CoPilotKit")
- [ ] Monitor debug output for discovery:
  - `[pipeline] Discovering repository for: "CoPilotKit"`
  - `[pipeline] Tavily found X results`
  - `[pipeline] Ambiguous results, consulting LLM` (if needed)
  - `[localLlm] DMR request` (for LLM interpretation)
- [ ] Verify discovery completes and correct repository is identified
- [ ] Verify gateway doc is generated with correct source type

## 4. Error Handling Validation

### Test 4: DMR Not Running

- [ ] Stop Docker Desktop
- [ ] Attempt to generate gateway doc
- [ ] Verify error message: "Cannot connect to Docker Model Runner. Ensure Docker Desktop is running and DMR is enabled."
- [ ] Verify fallback to external CLI tools (if configured)
- [ ] Verify graceful degradation (no crashes)

### Test 5: Model Not Loaded

- [ ] Remove Granite model: `docker model rm ai/granite-4.0-micro:latest`
- [ ] Attempt to generate gateway doc
- [ ] Verify error message indicates model not found
- [ ] Verify fallback to external CLI tools
- [ ] Re-pull model: `docker model pull ai/granite-4.0-micro:latest`

### Test 6: Timeout Handling

- [ ] Set aggressive timeout: `export LEGILIMENS_LOCAL_LLM_TIMEOUT=1000` (1 second)
- [ ] Attempt to generate gateway doc
- [ ] Verify timeout error: "AI generation timed out after 1000ms"
- [ ] Verify fallback to external CLI tools
- [ ] Reset timeout: `unset LEGILIMENS_LOCAL_LLM_TIMEOUT`

## 5. Test Suite Validation

### Unit Tests

- [ ] Run core tests: `pnpm --filter @legilimens/core test`
- [ ] Verify all tests pass, especially:
  - `gateway.spec.ts` → AI generation integration tests
  - `documentChunker.spec.ts` → Chunking tests
  - `json.spec.ts` → JSON extraction tests
- [ ] Check for any test failures or warnings
- [ ] Review test output for DMR-related errors

### Integration Tests

- [ ] Run integration tests: `pnpm test:integration`
- [ ] Verify parity tests pass: `parity.spec.ts`
- [ ] Check that CLI and harness service produce identical results
- [ ] Verify automatic derivation tests pass
- [ ] Review test output for any DMR-specific issues

### Full Test Suite

- [ ] Run all tests: `pnpm test`
- [ ] Verify no regressions introduced by DMR refactor
- [ ] Check test coverage remains consistent
- [ ] Review any new warnings or deprecations

## 6. Performance Validation

### Benchmark 1: AI Generation Speed

- [ ] Generate 5 gateway docs with DMR enabled
- [ ] Record AI generation duration from metadata: `aiGenerationDurationMs`
- [ ] Calculate average: Should be < 5 seconds for typical dependencies
- [ ] Compare to external CLI tools (if available)
- [ ] Verify performance is acceptable for user experience

### Benchmark 2: Cold Start vs Warm Start

- [ ] First request after Docker restart (cold start): Record duration
- [ ] Subsequent requests (warm start): Record duration
- [ ] Verify warm start is significantly faster (model already loaded)
- [ ] Document cold start delay for user expectations

### Benchmark 3: Large Document Processing

- [ ] Generate gateway doc for large dependency (e.g., "@vercel/ai")
- [ ] Monitor chunking performance: Time for each chunk summarization
- [ ] Verify total duration is reasonable (< 30 seconds)
- [ ] Check for any performance warnings in output

## 7. Configuration Migration Validation

### Test 7: Fresh Installation

- [ ] Remove existing config: `rm -rf ~/.legilimens/`
- [ ] Run setup wizard from scratch
- [ ] Verify DMR detection and installation flow
- [ ] Verify config is created with correct structure
- [ ] Verify first gateway doc generation succeeds

### Test 8: Environment Variable Override

- [ ] Set environment variables manually:
  - `export LEGILIMENS_LOCAL_LLM_ENABLED=true`
  - `export LEGILIMENS_LOCAL_LLM_MODEL_NAME=granite-4.0-micro:latest`
  - `export LEGILIMENS_LOCAL_LLM_API_ENDPOINT=http://localhost:12434`
- [ ] Run gateway generation without wizard setup
- [ ] Verify environment variables take precedence over config file
- [ ] Verify generation succeeds with env var config

## 8. Breaking Changes Documentation

Document any breaking changes discovered during validation:

### Known Breaking Changes

1. **Config Structure**: `binaryPath`/`modelPath` replaced with `modelName`/`apiEndpoint`
   - **Impact**: Existing users with llama.cpp config need to re-run setup wizard
   - **Migration**: Delete `~/.legilimens/config.json` and run wizard

2. **Environment Variables**: Old vars deprecated, new vars required
   - **Old**: `LEGILIMENS_LOCAL_LLM_BIN`, `LEGILIMENS_LOCAL_LLM_MODEL`
   - **New**: `LEGILIMENS_LOCAL_LLM_MODEL_NAME`, `LEGILIMENS_LOCAL_LLM_API_ENDPOINT`
   - **Impact**: CI/CD pipelines need environment variable updates
   - **Migration**: Update environment variable names in deployment scripts

3. **Docker Dependency**: Docker Desktop now required for local LLM
   - **Impact**: Users without Docker cannot use local LLM feature
   - **Migration**: Install Docker Desktop or use external CLI tools only

4. **Model Format**: GGUF files no longer used, Docker Hub models required
   - **Impact**: Existing GGUF model files in `~/.legilimens/models/` are unused
   - **Migration**: Remove old GGUF files, pull Docker models instead

### Backward Compatibility

- ✅ External CLI tools (Gemini, Claude, etc.) remain unchanged
- ✅ Gateway generation flow unchanged (same interface)
- ✅ Template format unchanged
- ✅ Static backup structure unchanged
- ✅ MCP guidance logic unchanged

## 9. Sign-Off Checklist

Before marking Phase 6 complete, verify:

- [ ] All pre-validation setup steps completed
- [ ] Configuration persistence validated (config file + env vars)
- [ ] All three AI generation consumers validated (gateway, chunker, discovery)
- [ ] All error handling scenarios tested (Docker down, model missing, timeout)
- [ ] Unit test suite passes (`pnpm test`)
- [ ] Integration test suite passes (`pnpm test:integration`)
- [ ] Performance benchmarks recorded and acceptable
- [ ] Configuration migration paths documented
- [ ] Breaking changes documented with migration steps
- [ ] No regressions in existing functionality
- [ ] Debug logging provides adequate troubleshooting info
- [ ] User-facing error messages are clear and actionable

## 10. Troubleshooting Guide

### Common Issues and Resolutions

#### Issue: "Cannot connect to Docker Model Runner"

**Solution**: Start Docker Desktop, verify `docker model version` works

#### Issue: "DMR model not configured"

**Solution**: Run setup wizard, ensure model is pulled

#### Issue: "AI generation timed out"

**Solution**: Increase timeout via `LEGILIMENS_LOCAL_LLM_TIMEOUT`, check Docker resources

#### Issue: "Invalid JSON response from local LLM"

**Solution**: Check DMR logs, verify model is loaded, try regenerating

#### Issue: Tests fail with "ECONNREFUSED"

**Solution**: Start Docker Desktop before running tests, or mock DMR in tests

#### Issue: Performance degradation

**Solution**: Check Docker resource allocation, verify model is warm (not cold start)

## Next Steps After Validation

Once all checklist items are complete:

- [ ] Update `CHANGELOG.md` with DMR refactor details
- [ ] Update `README.md` with Docker Desktop requirement
- [ ] Update `docs/quickstart.md` with DMR setup instructions
- [ ] Create migration guide for existing users
- [ ] Tag release with version bump (breaking change = major version)

---

**Validation Status**: ⏳ In Progress

**Last Updated**: [Date]

**Validated By**: [Engineer Name]
