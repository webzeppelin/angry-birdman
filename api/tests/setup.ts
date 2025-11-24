import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { beforeEach, afterAll } from 'vitest';

// Load environment variables from .env file
config({ path: '../../.env' });

// Create a singleton PrismaClient for tests
// Use a separate database or schema for testing
// Default to local database connection if not explicitly set
const databaseUrl =
  process.env.DATABASE_URL_TEST ||
  process.env.DATABASE_URL ||
  'postgresql://angrybirdman:angrybirdman_dev_password@localhost:5432/angrybirdman?schema=public';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
  log: process.env.LOG_QUERIES === 'true' ? ['query', 'error', 'warn'] : ['error'],
});

// Export prisma instance for use in tests
export { prisma };

/**
 * Clean up database before each test
 * This ensures each test starts with a clean slate
 *
 * IMPORTANT: This will DELETE ALL DATA from the test database before each test!
 * Make sure DATABASE_URL_TEST is set to a separate test database, NOT your dev database.
 */
beforeEach(async () => {
  // Clear data in reverse order of dependencies to avoid FK constraint violations
  await prisma.monthlyIndividualPerformance.deleteMany();
  await prisma.yearlyIndividualPerformance.deleteMany();
  await prisma.monthlyClanPerformance.deleteMany();
  await prisma.yearlyClanPerformance.deleteMany();
  await prisma.clanBattlePlayerStats.deleteMany();
  await prisma.clanBattleNonplayerStats.deleteMany();
  await prisma.clanBattle.deleteMany();
  await prisma.actionCode.deleteMany();
  await prisma.rosterMember.deleteMany();
  await prisma.adminRequest.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.clan.deleteMany();
});

/**
 * Disconnect from database after all tests
 * Using afterAll ensures proper cleanup
 */
afterAll(async () => {
  await prisma.$disconnect();
});
