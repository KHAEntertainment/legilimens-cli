
import { exec } from 'child_process';
import { promisify } from 'util';
import { describe, it, expect } from 'vitest';

const execAsync = promisify(exec);

describe('CLI Smoke Test', () => {
    it('should run --help without errors and show basic help text', async () => {
        const command = 'pnpm --filter @legilimens/cli start -- --help';
        
        try {
            const { stdout, stderr } = await execAsync(command);

            // Check for zero exit code implicitly by not catching an error
            expect(stderr).toBe('');
            expect(stdout).toContain('Usage: legilimens [options]');
            expect(stdout).toContain('A modern agentic CLI for gateway documentation');

        } catch (error) {
            // If execAsync throws, it means a non-zero exit code
            console.error('Smoke test failed:', error);
            expect(error).toBeNull(); // Force failure to show error output
        }
    }, 30000); // 30s timeout for slow CI environments
});
