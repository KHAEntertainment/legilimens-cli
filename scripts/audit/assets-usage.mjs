
import { promises as fs } from 'fs';
import path from 'path';
import glob from 'glob';

const workspaceRoot = path.resolve(process.cwd());

async function auditAssetsUsage() {
    const sourceFiles = await new Promise((res, rej) => 
        glob('packages/**/src/**/*.{ts,tsx}', { cwd: workspaceRoot, absolute: true }, (err, files) => err ? rej(err) : res(files))
    );

    const assetPaths = {
        banners: await new Promise((res, rej) => glob('packages/cli/src/assets/**', { cwd: workspaceRoot, nodir: true }, (err, files) => err ? rej(err) : res(files))),
        templates: await new Promise((res, rej) => glob('docs/templates/**', { cwd: workspaceRoot, nodir: true }, (err, files) => err ? rej(err) : res(files))),
        envExamples: await new Promise((res, rej) => glob('packages/**/.env.example', { cwd: workspaceRoot, nodir: true }, (err, files) => err ? rej(err) : res(files))),
    };

    const usageSummary = {
        banners: {},
        templates: {},
        envExamples: {},
    };

    for (const assetType in assetPaths) {
        for (const assetPath of assetPaths[assetType]) {
            usageSummary[assetType][assetPath] = 0;
        }
    }

    for (const sourceFile of sourceFiles) {
        const content = await fs.readFile(sourceFile, 'utf-8');
        for (const assetType in assetPaths) {
            for (const assetPath of assetPaths[assetType]) {
                if (content.includes(path.basename(assetPath))) {
                    usageSummary[assetType][assetPath]++;
                }
            }
        }
    }

    console.log(JSON.stringify(usageSummary, null, 2));
}

auditAssetsUsage().catch(err => {
    console.error('Failed to run assets usage audit:', err);
    process.exit(1);
});
