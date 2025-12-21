#!/usr/bin/env node
/**
 * Compile Prisma's generated TypeScript client to JavaScript
 * 
 * Prisma 7 only generates TypeScript files. This script compiles them to JavaScript
 * so they can be imported at runtime without requiring tsx or other TS loaders.
 */

import { execSync } from 'child_process';
import { existsSync, readdirSync, unlinkSync } from 'fs';
import { resolve, join } from 'path';

const prismaClientPath = resolve(process.cwd(), 'node_modules/.prisma/client');

if (!existsSync(prismaClientPath)) {
  console.error('Error: Prisma client not generated. Run "prisma generate" first.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('Compiling Prisma client TypeScript to JavaScript...');

try {
  // Compile the TypeScript files in .prisma/client to JavaScript
  execSync(
    `npx tsc ${prismaClientPath}/*.ts ${prismaClientPath}/**/*.ts --outDir ${prismaClientPath} --module esnext --target es2022 --moduleResolution bundler --allowJs --skipLibCheck`,
    { stdio: 'inherit' }
  );
  
  // Remove all .ts files to prevent Node from importing them instead of .js
  // eslint-disable-next-line no-console
  console.log('Removing TypeScript source files...');
  removeTypeScriptFiles(prismaClientPath);
  
  // eslint-disable-next-line no-console
  console.log('✓ Prisma client compiled successfully');
} catch (error) {
  console.error('Failed to compile Prisma client:', error.message);
  process.exit(1);
}

/**
 * Recursively remove all .ts files from a directory
 * @param {string} dir - Directory path
 */
function removeTypeScriptFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory()) {
      removeTypeScriptFiles(fullPath);
    } else if (entry.name.endsWith('.ts')) {
      unlinkSync(fullPath);
    }
  }
}
