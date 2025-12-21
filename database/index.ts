/**
 * Database package entry point
 *
 * Re-exports Prisma Client and types for use by API and other services
 */

// @ts-expect-error - Path is correct at runtime after Prisma generation
export { PrismaClient, Prisma } from '../../node_modules/.prisma/client/client';
