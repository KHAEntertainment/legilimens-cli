
import {
    spawn
} from 'child_process';
import {
    fileURLToPath
} from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..', '..');

// Default list of candidate files to check for references.
// This can be overridden by command-line arguments.
const defaultCandidatePaths = [
    'docs/quickstart.md',
    'docs/consitution-original.md',
    'docs/frameworks/framework_vercel_ai.md',
    'docs/libraries/library_example_dependency.md',
];

async function runRipgrep(filePath) {
    return new Promise((resolve, reject) => {
        const rg = spawn('rg', [
            '--count-matches',
            '--glob',
            `!${path.basename(filePath)}`, // Exclude the file itself from search
            '--glob',
            '!node_modules',
            filePath,
            '.'
        ], {
            cwd: workspaceRoot
        });

        let output = '';
        rg.stdout.on('data', (data) => {
            output += data.toString();
        });

        rg.on('close', (code) => {
            // rg returns 1 if no matches are found, which is not an error for us.
            if (code !== 0 && code !== 1) {
                return reject(new Error(`ripgrep exited with code ${code}`));
            }
            const matchLine = output.trim().split('\n').pop() || '';
            const match = matchLine.match(/(\d+)/);
            resolve(match ? parseInt(match[1], 10) : 0);
        });

        rg.on('error', (err) => {
            reject(err);
        });
    });
}


async function main() {
    const args = process.argv.slice(2);
    const candidatePaths = args.length > 0 ? args : defaultCandidatePaths;

    const referenceCounts = {};

    for (const filePath of candidatePaths) {
        try {
            const count = await runRipgrep(filePath);
            referenceCounts[filePath] = count;
        } catch (error) {
            console.error(`Error auditing ${filePath}:`, error);
            referenceCounts[filePath] = -1; // Indicate an error
        }
    }

    console.log(JSON.stringify(referenceCounts, null, 2));
}

main().catch(err => {
    console.error('Failed to run reference audit:', err);
    process.exit(1);
});
