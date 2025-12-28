#!/usr/bin/env node
/**
 * Post-build script to add .js extensions to relative imports in compiled JS files.
 * 
 * TypeScript with moduleResolution: "bundler" doesn't add .js extensions,
 * but Node.js ESM requires them. This script fixes that.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, 'dist');

async function* walkFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(path);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      yield path;
    }
  }
}

async function fixImports(filePath) {
  const content = await readFile(filePath, 'utf8');
  
  // Match import/export statements with relative paths that don't have extensions
  // Handles: import { X } from './path'  or  export { X } from './path'
  const fixedContent = content.replace(
    /(\bfrom\s+['"])(\.\.[\/\\]|\.[\/\\])((?:[^'"]*[\/\\])?[^'"\s]+)(?<!\.js|\.mjs|\.cjs)(['"])/g,
    '$1$2$3.js$4'
  );
  
  if (content !== fixedContent) {
    await writeFile(filePath, fixedContent, 'utf8');
    console.log(`Fixed imports in: ${filePath}`);
  }
}

async function main() {
  console.log('Adding .js extensions to ESM imports...');
  let count = 0;
  
  for await (const file of walkFiles(distDir)) {
    await fixImports(file);
    count++;
  }
  
  console.log(`Processed ${count} JavaScript files.`);
}

main().catch(err => {
  console.error('Error fixing imports:', err);
  process.exit(1);
});
