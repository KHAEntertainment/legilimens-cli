
import { promises as fs } from 'fs';
import path from 'path';
import glob from 'glob';

const workspaceRoot = path.resolve(process.cwd());
const SIZE_THRESHOLD_MB = 2;
const SIZE_THRESHOLD_BYTES = SIZE_THRESHOLD_MB * 1024 * 1024;

async function findLargeBinaries() {
    const searchPaths = ['tests/**', 'docs/**'];
    const ignorePatterns = ['**/static-backup/**'];

    const allFiles = (await Promise.all(
        searchPaths.map(p => new Promise((res, rej) => glob(p, { cwd: workspaceRoot, ignore: ignorePatterns, nodir: true }, (err, files) => err ? rej(err) : res(files))))
    )).flat();

    const largeFiles = [];

    for (const file of allFiles) {
        try {
            const stats = await fs.stat(path.join(workspaceRoot, file));
            if (stats.size > SIZE_THRESHOLD_BYTES) {
                largeFiles.push({
                    path: file,
                    size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
                });
            }
        } catch (error) {
            console.error(`Error processing file ${file}:`, error);
        }
    }

    console.log(JSON.stringify({ largeFiles }, null, 2));
}

findLargeBinaries().catch(err => {
    console.error('Failed to run binaries audit:', err);
    process.exit(1);
});
