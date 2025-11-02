#!/usr/bin/env node

// Simple test to isolate the crash
import { runClackApp } from './packages/cli/src/clackApp.js';

console.log('Starting debug test...');

try {
  await runClackApp();
  console.log('App completed successfully');
} catch (error) {
  console.error('App crashed with error:', error);
  console.error('Stack:', error.stack);
}