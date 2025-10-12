import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@legilimens/core': resolve(rootDir, 'packages/core/src/index.ts'),
      '@legilimens/harness-service': resolve(rootDir, 'packages/harness-service/src')
    }
  },
  test: {
    include: ['tests/**/*.spec.ts'],
    environment: 'node',
    globals: true,
    reporters: 'default'
  }
});
