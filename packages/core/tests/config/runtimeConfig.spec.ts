import { describe, it, expect } from 'vitest';
import { getRuntimeConfig, isLocalLlmEnabled } from '../../src/config/runtimeConfig.js';

describe('runtimeConfig', () => {
  describe('getRuntimeConfig', () => {
    it('does not default apiEndpoint when only enabled and modelName are set', () => {
      const env = {
        LEGILIMENS_LOCAL_LLM_ENABLED: 'true',
        LEGILIMENS_LOCAL_LLM_MODEL_NAME: 'ai/granite-4.0-micro:latest',
        // Explicitly NOT setting LEGILIMENS_LOCAL_LLM_API_ENDPOINT
      };

      const config = getRuntimeConfig(env);

      expect(config.localLlm?.enabled).toBe(true);
      expect(config.localLlm?.modelName).toBe('ai/granite-4.0-micro:latest');
      expect(config.localLlm?.apiEndpoint).toBeUndefined();
    });

    it('sets apiEndpoint when explicitly provided', () => {
      const env = {
        LEGILIMENS_LOCAL_LLM_ENABLED: 'true',
        LEGILIMENS_LOCAL_LLM_MODEL_NAME: 'ai/granite-4.0-micro:latest',
        LEGILIMENS_LOCAL_LLM_API_ENDPOINT: 'http://localhost:12434',
      };

      const config = getRuntimeConfig(env);

      expect(config.localLlm?.enabled).toBe(true);
      expect(config.localLlm?.modelName).toBe('ai/granite-4.0-micro:latest');
      expect(config.localLlm?.apiEndpoint).toBe('http://localhost:12434');
    });

    it('sets apiEndpoint to custom port when provided', () => {
      const env = {
        LEGILIMENS_LOCAL_LLM_ENABLED: 'true',
        LEGILIMENS_LOCAL_LLM_MODEL_NAME: 'ai/granite-4.0-micro:latest',
        LEGILIMENS_LOCAL_LLM_API_ENDPOINT: 'http://localhost:9999',
      };

      const config = getRuntimeConfig(env);

      expect(config.localLlm?.apiEndpoint).toBe('http://localhost:9999');
    });

    it('does not default apiEndpoint when enabled is false', () => {
      const env = {
        LEGILIMENS_LOCAL_LLM_ENABLED: 'false',
        LEGILIMENS_LOCAL_LLM_MODEL_NAME: 'ai/granite-4.0-micro:latest',
        // Explicitly NOT setting LEGILIMENS_LOCAL_LLM_API_ENDPOINT
      };

      const config = getRuntimeConfig(env);

      expect(config.localLlm?.enabled).toBe(false);
      expect(config.localLlm?.apiEndpoint).toBeUndefined();
    });

    it('supports LEGILIMENS_LOCAL_LLM_MODEL_NAME env var', () => {
      const env = {
        LEGILIMENS_LOCAL_LLM_ENABLED: 'true',
        LEGILIMENS_LOCAL_LLM_MODEL_NAME: 'granite-4.0-micro:latest',
        LEGILIMENS_LOCAL_LLM_API_ENDPOINT: 'http://localhost:12434',
      };

      const config = getRuntimeConfig(env);

      expect(config.localLlm?.modelName).toBe('granite-4.0-micro:latest');
    });
  });

  describe('isLocalLlmEnabled', () => {
    it('returns false when only enabled and modelName are set', () => {
      const env = {
        LEGILIMENS_LOCAL_LLM_ENABLED: 'true',
        LEGILIMENS_LOCAL_LLM_MODEL_NAME: 'ai/granite-4.0-micro:latest',
        // apiEndpoint NOT set - should gate correctly
      };

      const config = getRuntimeConfig(env);
      const enabled = isLocalLlmEnabled(config);

      expect(enabled).toBe(false);
    });

    it('returns true when all three fields are set', () => {
      const env = {
        LEGILIMENS_LOCAL_LLM_ENABLED: 'true',
        LEGILIMENS_LOCAL_LLM_MODEL_NAME: 'ai/granite-4.0-micro:latest',
        LEGILIMENS_LOCAL_LLM_API_ENDPOINT: 'http://localhost:12434',
      };

      const config = getRuntimeConfig(env);
      const enabled = isLocalLlmEnabled(config);

      expect(enabled).toBe(true);
    });

    it('returns false when enabled is false even with modelName and apiEndpoint', () => {
      const env = {
        LEGILIMENS_LOCAL_LLM_ENABLED: 'false',
        LEGILIMENS_LOCAL_LLM_MODEL_NAME: 'ai/granite-4.0-micro:latest',
        LEGILIMENS_LOCAL_LLM_API_ENDPOINT: 'http://localhost:12434',
      };

      const config = getRuntimeConfig(env);
      const enabled = isLocalLlmEnabled(config);

      expect(enabled).toBe(false);
    });

    it('returns false when enabled and apiEndpoint are set but modelName is missing', () => {
      const env = {
        LEGILIMENS_LOCAL_LLM_ENABLED: 'true',
        LEGILIMENS_LOCAL_LLM_API_ENDPOINT: 'http://localhost:12434',
        // modelName NOT set
      };

      const config = getRuntimeConfig(env);
      const enabled = isLocalLlmEnabled(config);

      expect(enabled).toBe(false);
    });

    it('returns false when enabled and modelName are set but apiEndpoint is missing', () => {
      const env = {
        LEGILIMENS_LOCAL_LLM_ENABLED: 'true',
        LEGILIMENS_LOCAL_LLM_MODEL_NAME: 'ai/granite-4.0-micro:latest',
        // apiEndpoint NOT set - this is the key test case
      };

      const config = getRuntimeConfig(env);
      const enabled = isLocalLlmEnabled(config);

      expect(enabled).toBe(false);
    });

    it('returns true with custom endpoint port', () => {
      const env = {
        LEGILIMENS_LOCAL_LLM_ENABLED: 'true',
        LEGILIMENS_LOCAL_LLM_MODEL_NAME: 'ai/granite-4.0-micro:latest',
        LEGILIMENS_LOCAL_LLM_API_ENDPOINT: 'http://localhost:9999',
      };

      const config = getRuntimeConfig(env);
      const enabled = isLocalLlmEnabled(config);

      expect(enabled).toBe(true);
    });
  });
});
