// Simple test to verify migration logic
import { loadUserConfig } from './packages/cli/src/config/userConfig.js';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// Create a test config with legacy fields
const testConfigDir = join(homedir(), '.legilimens-test');
const testConfigPath = join(testConfigDir, 'config.json');

try {
  // Ensure test directory exists
  mkdirSync(testConfigDir, { recursive: true });

  // Write legacy config
  const legacyConfig = {
    apiKeys: {},
    localLlm: {
      enabled: true,
      binaryPath: 'docker',
      modelPath: 'granite-4.0-micro:latest',
      tokens: 128000
    },
    setupCompleted: true,
    configVersion: '1.0.0'
  };

  writeFileSync(testConfigPath, JSON.stringify(legacyConfig, null, 2));
  console.log('✓ Created legacy test config');

  // Test migration by temporarily overriding the config path
  const originalGetConfigPath = require('./packages/cli/src/config/userConfig.js').getConfigPath;
  require('./packages/cli/src/config/userConfig.js').getConfigPath = () => testConfigPath;

  // Load and check migration
  const migratedConfig = loadUserConfig();
  
  console.log('Original config:', JSON.stringify(legacyConfig, null, 2));
  console.log('Migrated config:', JSON.stringify(migratedConfig, null, 2));

  // Verify migration
  if (migratedConfig.localLlm.modelName === 'granite-4.0-micro:latest' &&
      migratedConfig.localLlm.apiEndpoint === 'http://localhost:12434' &&
      !migratedConfig.localLlm.binaryPath &&
      !migratedConfig.localLlm.modelPath) {
    console.log('✅ Migration successful!');
  } else {
    console.log('❌ Migration failed!');
    process.exit(1);
  }

  // Cleanup
  require('fs').unlinkSync(testConfigPath);
  console.log('✓ Cleaned up test config');

} catch (error) {
  console.error('❌ Test failed:', error);
  process.exit(1);
}