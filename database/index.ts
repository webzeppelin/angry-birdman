/**
 * Database package entry point
 *
 * Re-exports Prisma Client and types for use by API and other services
 *
 * Import strategy: Use dynamic import to avoid ESM/tsx resolution issues
 * This works around tsx having trouble with namespace exports in re-export syntax
 */

// Use dynamic import to load the compiled Prisma client
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const prismaModule = await import('../node_modules/.prisma/client/client.js');

// Re-export with explicit typing (eslint disabled due to dynamic import limitations)
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
export const PrismaClient = prismaModule.PrismaClient;
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
export const Prisma = prismaModule.Prisma;
