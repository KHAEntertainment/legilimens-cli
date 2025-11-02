
import { promises as fs } from 'fs';
import path from 'path';
import glob from 'glob';

const workspaceRoot = path.resolve(process.cwd());

async function findUnreferencedScripts() {
    const scriptPaths = await new Promise((res, rej) => 
        glob('packages/**/scripts,*.sh,*.mjs', { cwd: workspaceRoot, absolute: true }, (err, files) => err ? rej(err) : res(files))
    );

    const allPackageJsonPaths = await new Promise((res, rej) => 
        glob('{package.json,packages/**/package.json}', { cwd: workspaceRoot, absolute: true }, (err, files) => err ? rej(err) : res(files))
    );

    const allPackageJsonContents = await Promise.all(
        allPackageJsonPaths.map(p => fs.readFile(p, 'utf-8'))
    );

    const combinedJsonContents = allPackageJsonContents.join('\n');

    const unreferencedScripts = [];
    for (const scriptPath of scriptPaths) {
        const relativeScriptPath = path.relative(workspaceRoot, scriptPath);
        if (!combinedJsonContents.includes(relativeScriptPath)) {
            unreferencedScripts.push(relativeScriptPath);
        }
    }

    console.log(JSON.stringify({ unreferencedScripts }, null, 2));
}

findUnreferencedScripts().catch(err => {
    console.error('Failed to run unreferenced scripts audit:', err);
    process.exit(1);
});
