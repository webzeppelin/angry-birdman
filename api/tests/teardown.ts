import type { PrismaClient } from '@angrybirdman/database';

// Extend global type to include our test client
declare global {
  var __prisma_test_client: PrismaClient | undefined;
}

/**
 * Global teardown for test suite
 * Disconnects from database to prevent hanging connections
 */
export default async function teardown() {
  const prisma: PrismaClient | undefined = global.__prisma_test_client;

  if (prisma) {
    await prisma.$disconnect();
  }
}
