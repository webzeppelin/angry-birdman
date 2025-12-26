/**
 * Database package entry point
 *
 * Re-exports Prisma Client and types for use throughout the application.
 *
 * This file provides a stable import path that abstracts the actual
 * Prisma client generation location. All application code should import
 * from '@angrybirdman/database' rather than directly from generated files.
 */

// Import from generated Prisma client using standard static imports
export { PrismaClient, Prisma } from './generated/prisma/client';

// Export the singleton client instance
export { prisma } from './client';

// Re-export useful types for external consumers
export type {
  Clan,
  User,
  RosterMember,
  ClanBattle,
  ClanBattlePlayerStats,
  ClanBattleNonplayerStats,
  MasterBattle,
  SystemSetting,
  ActionCode,
  MonthlyIndividualPerformance,
  YearlyIndividualPerformance,
  MonthlyClanPerformance,
  YearlyClanPerformance,
  AuditLog,
  AdminRequest,
} from './generated/prisma/client';
