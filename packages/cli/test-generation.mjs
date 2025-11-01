import { runClackGenerationFlow } from './src/flows/clackGenerationFlow.js';
import { join } from 'path';

console.log('Testing generation flow directly...\n');

const templatePath = join(process.cwd(), '../..', 'docs', 'templates', 'legilimens-template.md');
const targetDirectory = join(process.cwd(), '../..', 'docs');

console.log('Template path:', templatePath);
console.log('Target directory:', targetDirectory);
console.log('\nCalling runClackGenerationFlow...\n');

try {
  const result = await runClackGenerationFlow(templatePath, targetDirectory);
  console.log('\n✅ Result:', JSON.stringify(result, null, 2));
} catch (error) {
  console.error('\n❌ Caught error:', error.message);
  console.error('Stack:', error.stack);
}
