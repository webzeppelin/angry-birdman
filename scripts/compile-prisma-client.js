#!/usr/bin/env node
/**
 * Compile Prisma's generated TypeScript client to JavaScript
 * 
 * Prisma 7 only generates TypeScript files. This script compiles them to JavaScript
 * so they can be imported at runtime without requiring tsx or other TS loaders.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

const prismaClientPath = resolve(process.cwd(), 'node_modules/.prisma/client');

if (!existsSync(prismaClientPath)) {
  console.error('Error: Prisma client not generated. Run "prisma generate" first.');
  process.exit(1);
}

console.log('Compiling Prisma client TypeScript to JavaScript...');

try {
  // Compile the TypeScript files in .prisma/client to JavaScript
  execSync(
    `npx tsc ${prismaClientPath}/*.ts ${prismaClientPath}/**/*.ts --outDir ${prismaClientPath} --module esnext --target es2022 --moduleResolution bundler --allowJs --skipLibCheck`,
    { stdio: 'inherit' }
  );
  
  console.log('✓ Prisma client compiled successfully');
} catch (error) {
  console.error('Failed to compile Prisma client:', error.message);
  process.exit(1);
}
