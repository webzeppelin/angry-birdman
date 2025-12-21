/**
 * Database package entry point
 *
 * Re-exports Prisma Client and types for use by API and other services
 * Runtime resolution handled by tsx which can load @prisma/client after generation
 */

// @ts-expect-error - Prisma client types available after generation
export { PrismaClient, Prisma } from '@prisma/client';
