
import { promises as fs } from 'fs';
import path from 'path';
import glob from 'glob';
import crypto from 'crypto';

const workspaceRoot = path.resolve(process.cwd());

// Function to normalize markdown content
function normalizeContent(content) {
    return content.replace(/\s+/g, ' ').trim();
}

// Function to compute hash of content
function computeHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
}

async function findDuplicateMarkdown() {
    const searchPaths = ['README.md', 'docs/**/*.md'];
    const allFiles = (await Promise.all(
        searchPaths.map(p => new Promise((res, rej) => glob(p, { cwd: workspaceRoot, absolute: true }, (err, files) => err ? rej(err) : res(files))))
    )).flat();

    const hashes = {};
    for (const file of allFiles) {
        try {
            const content = await fs.readFile(file, 'utf-8');
            const normalized = normalizeContent(content);
            const hash = computeHash(normalized);

            if (!hashes[hash]) {
                hashes[hash] = [];
            }
            hashes[hash].push(path.relative(workspaceRoot, file));
        } catch (error) {
            console.error(`Error processing file ${file}:`, error);
        }
    }

    const duplicates = Object.values(hashes).filter(group => group.length > 1);

    console.log(JSON.stringify({ duplicates }, null, 2));
}

findDuplicateMarkdown().catch(err => {
    console.error('Failed to run duplicate docs audit:', err);
    process.exit(1);
});
