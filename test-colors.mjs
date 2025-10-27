#!/usr/bin/env node
/**
 * Quick test to verify terminal color support
 */

// Force colors BEFORE importing chalk
process.env.FORCE_COLOR = '3';

import chalk from 'chalk';
import gradient from 'gradient-string';

// CRITICAL: Force chalk to use colors even if TTY detection fails
// This is needed because process.stdout.isTTY can be undefined in some contexts
if (chalk.level === 0) {
  console.log('[FIXING] Chalk level was 0, forcing to 3 (TrueColor support)');
  chalk.level = 3;
}

console.log('\n=== Terminal Color Test ===\n');

console.log('Environment:');
console.log('  TERM:', process.env.TERM);
console.log('  COLORTERM:', process.env.COLORTERM);
console.log('  FORCE_COLOR:', process.env.FORCE_COLOR);
console.log('  isTTY:', process.stdout.isTTY);
console.log('  Chalk level:', chalk.level);
console.log('');

console.log('Basic Colors (chalk):');
console.log('  ' + chalk.red('Red'));
console.log('  ' + chalk.green('Green'));
console.log('  ' + chalk.blue('Blue'));
console.log('  ' + chalk.yellow('Yellow'));
console.log('  ' + chalk.magenta('Magenta'));
console.log('  ' + chalk.cyan('Cyan'));
console.log('');

console.log('Bright Colors:');
console.log('  ' + chalk.redBright('Bright Red'));
console.log('  ' + chalk.greenBright('Bright Green'));
console.log('  ' + chalk.blueBright('Bright Blue'));
console.log('');

console.log('Background Colors:');
console.log('  ' + chalk.bgRed.white(' Red BG '));
console.log('  ' + chalk.bgGreen.black(' Green BG '));
console.log('  ' + chalk.bgBlue.white(' Blue BG '));
console.log('');

console.log('Gradients:');
const purpleToCyan = gradient(['#7F5AF0', '#2CB1BC', '#22D3EE']);
console.log('  ' + purpleToCyan('Purple to Cyan Gradient'));
console.log('  ' + gradient('red', 'yellow', 'green')('Red Yellow Green Gradient'));
console.log('');

console.log('Styles:');
console.log('  ' + chalk.bold('Bold text'));
console.log('  ' + chalk.italic('Italic text'));
console.log('  ' + chalk.underline('Underlined text'));
console.log('  ' + chalk.dim('Dimmed text'));
console.log('');

console.log('If you see colors above, terminal color support is working! ✨');
console.log('If you see plain text or codes like [31m, colors are NOT working.');
console.log('');
