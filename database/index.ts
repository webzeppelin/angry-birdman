/**
 * Database package entry point
 *
 * Re-exports Prisma Client and types for use by API and other services
 * Runtime resolution handled by tsx which can load the generated TypeScript client
 */

// Import from the generated TypeScript client directly
// tsx handles TypeScript imports at runtime
export { PrismaClient, Prisma } from '../node_modules/.prisma/client/client.js';
