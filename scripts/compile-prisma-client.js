#!/usr/bin/env node
/**
 * Compile Prisma's generated TypeScript client to JavaScript
 * 
 * Prisma 7 only generates TypeScript files. This script compiles them to JavaScript
 * so they can be imported at runtime without requiring tsx or other TS loaders.
 */

import { execSync } from 'child_process';
import { existsSync, readdirSync, unlinkSync, readFileSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';

const prismaClientPath = resolve(process.cwd(), 'node_modules/.prisma/client');

if (!existsSync(prismaClientPath)) {
  console.error('Error: Prisma client not generated. Run "prisma generate" first.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('Compiling Prisma client TypeScript to JavaScript...');

try {
  // First, list all .ts files to compile
  const tsFiles = [];
  /**
   * Recursively find all TypeScript files
   * @param {string} dir - Directory path
   */
  function findTsFiles(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        findTsFiles(fullPath);
      } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
        tsFiles.push(fullPath);
      }
    }
  }
  findTsFiles(prismaClientPath);
  
  if (tsFiles.length === 0) {
    console.error('Error: No TypeScript files found in Prisma client directory');
    process.exit(1);
  }
  
  // eslint-disable-next-line no-console
  console.log(`Found ${tsFiles.length} TypeScript files to compile`);
  
  // Compile the TypeScript files in .prisma/client to JavaScript
  execSync(
    `npx tsc ${tsFiles.join(' ')} --outDir ${prismaClientPath} --module esnext --target es2022 --moduleResolution bundler --allowJs --skipLibCheck`,
    { stdio: 'inherit' }
  );
  
  // Rewrite imports in JS files to use .js extensions
  // eslint-disable-next-line no-console
  console.log('Rewriting imports to use .js extensions...');
  const rewriteCount = rewriteImports(prismaClientPath);
  // eslint-disable-next-line no-console
  console.log(`✓ Rewrote imports in ${rewriteCount} files`);
  
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
 * Recursively rewrite imports in .js files to use .js extensions
 * @param {string} dir - Directory path
 * @returns {number} Number of files modified
 */
function rewriteImports(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  let count = 0;
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory()) {
      count += rewriteImports(fullPath);
    } else if (entry.name.endsWith('.js')) {
      let content = readFileSync(fullPath, 'utf8');
      const originalContent = content;
      
      // Replace relative imports without extensions with .js
      // Matches: from "./something" or from "../something" or from "./path/something"
       
      content = content.replace(
        /from ['"](\.\.[/\\][\w/\\-]+|\.[/\\][\w/\\-]+)['"]/g,
        (match, /** @type {string} */ path) => {
          // Don't add .js if it already has an extension
           
          if (path.match(/\.\w+$/)) {
            return match;
          }
          // eslint-disable-next-line no-console
          console.log(`  ${fullPath}: Rewriting "${match}" to add .js`);
           
          return match.replace(path, `${path}.js`);
        }
      );
      
      // Also handle dynamic imports
       
      content = content.replace(
        /import\(['"](\.\.[/\\][\w/\\-]+|\.[/\\][\w/\\-]+)['"]\)/g,
        (match, /** @type {string} */ path) => {
           
          if (path.match(/\.\w+$/)) {
            return match;
          }
           
          return match.replace(path, `${path}.js`);
        }
      );
      
      if (content !== originalContent) {
        writeFileSync(fullPath, content, 'utf8');
        count++;
      }
    }
  }
  
  return count;
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
