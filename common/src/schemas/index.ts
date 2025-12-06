/**
 * Zod validation schemas for Angry Birdman
 * These schemas provide runtime validation for all data entities
 */

import { z } from 'zod';

// Re-export user management schemas
export * from './user-management.js';

// Re-export roster management schemas
export * from './roster.js';

// Re-export battle management schemas
export * from './battle.js';

// Re-export battle schedule schemas
export * from './battleSchedule.js';

import {
  ACTION_CODES,
  BATTLE_ID_LENGTH,
  BATTLE_RESULTS,
  MAX_FLOCK_POWER,
  MIN_BATTLES_FOR_STATS,
  MIN_FLOCK_POWER,
  MONTH_ID_LENGTH,
  YEAR_ID_LENGTH,
} from '../constants/index.js';

// ============================================================================
// Primitive Schemas
// ============================================================================

/**
 * Schema for action codes
 */
export const actionCodeSchema = z.enum([
  ACTION_CODES.HOLD,
  ACTION_CODES.WARN,
  ACTION_CODES.KICK,
  ACTION_CODES.RESERVE,
  ACTION_CODES.PASS,
]);

/**
 * Schema for battle results
 */
export const battleResultSchema = z.union([
  z.literal(BATTLE_RESULTS.WIN),
  z.literal(BATTLE_RESULTS.LOSS),
  z.literal(BATTLE_RESULTS.TIE),
]);

/**
 * Schema for positive integers (Flock Power, scores, etc.)
 */
export const positiveIntegerSchema = z.number().int().positive();

/**
 * Schema for non-negative integers (counts, ranks, etc.)
 */
export const nonNegativeIntegerSchema = z.number().int().nonnegative();

/**
 * Schema for Flock Power values
 */
export const flockPowerSchema = z.number().int().min(MIN_FLOCK_POWER).max(MAX_FLOCK_POWER);

/**
 * Schema for battle ID (YYYYMMDD)
 */
export const battleIdSchema = z
  .string()
  .length(BATTLE_ID_LENGTH)
  .regex(/^\d{8}$/, 'Battle ID must be 8 digits in YYYYMMDD format');

/**
 * Schema for month ID (YYYYMM)
 */
export const monthIdSchema = z
  .string()
  .length(MONTH_ID_LENGTH)
  .regex(/^\d{6}$/, 'Month ID must be 6 digits in YYYYMM format');

/**
 * Schema for year ID (YYYY)
 */
export const yearIdSchema = z
  .string()
  .length(YEAR_ID_LENGTH)
  .regex(/^\d{4}$/, 'Year ID must be 4 digits in YYYY format');

// ============================================================================
// Core Entity Schemas
// ============================================================================

/**
 * Schema for Clan entity
 */
export const clanSchema = z.object({
  clanId: positiveIntegerSchema,
  rovioId: positiveIntegerSchema,
  name: z.string().min(1).max(100),
  country: z.string().min(1).max(100),
  registrationDate: z.date(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Schema for creating a clan
 */
export const clanCreateSchema = z.object({
  rovioId: positiveIntegerSchema,
  name: z.string().min(1).max(100),
  country: z.string().min(1).max(100),
  registrationDate: z.date().optional(),
  active: z.boolean().optional().default(true),
});

/**
 * Schema for updating a clan
 */
export const clanUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  country: z.string().min(1).max(100).optional(),
  active: z.boolean().optional(),
});

/**
 * Schema for User entity
 */
export const userSchema = z.object({
  userId: z.string().min(1).max(255),
  username: z.string().min(1).max(100),
  email: z.string().email().max(255),
  clanId: positiveIntegerSchema.nullable(),
  owner: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Schema for creating a user
 */
export const userCreateSchema = z.object({
  userId: z.string().min(1).max(255),
  username: z.string().min(1).max(100),
  email: z.string().email().max(255),
  clanId: positiveIntegerSchema.nullable().optional(),
  owner: z.boolean().optional().default(false),
});

/**
 * Schema for updating a user
 */
export const userUpdateSchema = z.object({
  email: z.string().email().max(255).optional(),
  clanId: positiveIntegerSchema.nullable().optional(),
  owner: z.boolean().optional(),
});

/**
 * Schema for RosterMember entity
 */
export const rosterMemberSchema = z.object({
  playerId: positiveIntegerSchema,
  clanId: positiveIntegerSchema,
  playerName: z.string().min(1).max(100),
  active: z.boolean(),
  joinedDate: z.date(),
  leftDate: z.date().nullable(),
  kickedDate: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Schema for creating a roster member
 */
export const rosterMemberCreateSchema = z.object({
  clanId: positiveIntegerSchema,
  playerName: z.string().min(1).max(100),
  active: z.boolean().optional().default(true),
  joinedDate: z.date().optional(),
});

/**
 * Schema for updating a roster member
 */
export const rosterMemberUpdateSchema = z.object({
  playerName: z.string().min(1).max(100).optional(),
  active: z.boolean().optional(),
  leftDate: z.date().nullable().optional(),
  kickedDate: z.date().nullable().optional(),
});

// ============================================================================
// Battle Data Schemas
// ============================================================================

/**
 * Schema for ClanBattle entity
 */
export const clanBattleSchema = z.object({
  clanId: positiveIntegerSchema,
  battleId: battleIdSchema,
  startDate: z.date(),
  endDate: z.date(),
  result: battleResultSchema,
  score: nonNegativeIntegerSchema,
  fp: positiveIntegerSchema,
  baselineFp: positiveIntegerSchema,
  ratio: z.number().positive(),
  averageRatio: z.number().positive(),
  projectedScore: z.number().positive(),
  opponentName: z.string().min(1).max(100),
  opponentRovioId: positiveIntegerSchema,
  opponentCountry: z.string().min(1).max(100),
  opponentScore: nonNegativeIntegerSchema,
  opponentFp: positiveIntegerSchema,
  marginRatio: z.number(),
  fpMargin: z.number(),
  nonplayingCount: nonNegativeIntegerSchema,
  nonplayingFpRatio: z.number().nonnegative(),
  reserveCount: nonNegativeIntegerSchema,
  reserveFpRatio: z.number().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Schema for creating a clan battle
 */
export const clanBattleCreateSchema = z.object({
  clanId: positiveIntegerSchema,
  startDate: z.date(),
  endDate: z.date(),
  score: nonNegativeIntegerSchema,
  baselineFp: positiveIntegerSchema,
  opponentName: z.string().min(1).max(100),
  opponentRovioId: positiveIntegerSchema,
  opponentCountry: z.string().min(1).max(100),
  opponentScore: nonNegativeIntegerSchema,
  opponentFp: positiveIntegerSchema,
});

/**
 * Schema for updating a clan battle
 */
export const clanBattleUpdateSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  score: nonNegativeIntegerSchema.optional(),
  baselineFp: positiveIntegerSchema.optional(),
  opponentName: z.string().min(1).max(100).optional(),
  opponentRovioId: positiveIntegerSchema.optional(),
  opponentCountry: z.string().min(1).max(100).optional(),
  opponentScore: nonNegativeIntegerSchema.optional(),
  opponentFp: positiveIntegerSchema.optional(),
});

/**
 * Schema for ClanBattlePlayerStats entity
 */
export const clanBattlePlayerStatsSchema = z.object({
  clanId: positiveIntegerSchema,
  battleId: battleIdSchema,
  playerId: positiveIntegerSchema,
  rank: positiveIntegerSchema,
  score: nonNegativeIntegerSchema,
  fp: flockPowerSchema,
  ratio: z.number().positive(),
  ratioRank: positiveIntegerSchema,
  actionCode: actionCodeSchema,
  actionReason: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Schema for creating player stats
 */
export const clanBattlePlayerStatsCreateSchema = z.object({
  clanId: positiveIntegerSchema,
  battleId: battleIdSchema,
  playerId: positiveIntegerSchema,
  rank: positiveIntegerSchema,
  score: nonNegativeIntegerSchema,
  fp: flockPowerSchema,
  actionCode: actionCodeSchema,
  actionReason: z.string().nullable().optional(),
});

/**
 * Schema for updating player stats
 */
export const clanBattlePlayerStatsUpdateSchema = z.object({
  rank: positiveIntegerSchema.optional(),
  score: nonNegativeIntegerSchema.optional(),
  fp: flockPowerSchema.optional(),
  actionCode: actionCodeSchema.optional(),
  actionReason: z.string().nullable().optional(),
});

/**
 * Schema for ClanBattleNonplayerStats entity
 */
export const clanBattleNonplayerStatsSchema = z.object({
  clanId: positiveIntegerSchema,
  battleId: battleIdSchema,
  playerId: positiveIntegerSchema,
  fp: flockPowerSchema,
  reserve: z.boolean(),
  actionCode: actionCodeSchema,
  actionReason: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Schema for creating nonplayer stats
 */
export const clanBattleNonplayerStatsCreateSchema = z.object({
  clanId: positiveIntegerSchema,
  battleId: battleIdSchema,
  playerId: positiveIntegerSchema,
  fp: flockPowerSchema,
  reserve: z.boolean().optional().default(false),
  actionCode: actionCodeSchema,
  actionReason: z.string().nullable().optional(),
});

/**
 * Schema for updating nonplayer stats
 */
export const clanBattleNonplayerStatsUpdateSchema = z.object({
  fp: flockPowerSchema.optional(),
  reserve: z.boolean().optional(),
  actionCode: actionCodeSchema.optional(),
  actionReason: z.string().nullable().optional(),
});

// ============================================================================
// Aggregated Statistics Schemas
// ============================================================================

/**
 * Schema for MonthlyClanPerformance entity
 */
export const monthlyClanPerformanceSchema = z.object({
  clanId: positiveIntegerSchema,
  monthId: monthIdSchema,
  battleCount: positiveIntegerSchema,
  wonCount: nonNegativeIntegerSchema,
  lostCount: nonNegativeIntegerSchema,
  tiedCount: nonNegativeIntegerSchema,
  monthComplete: z.boolean(),
  averageFp: z.number().positive(),
  averageBaselineFp: z.number().positive(),
  averageRatio: z.number().positive(),
  averageMarginRatio: z.number(),
  averageFpMargin: z.number(),
  averageNonplayingCount: z.number().nonnegative(),
  averageNonplayingFpRatio: z.number().nonnegative(),
  averageReserveCount: z.number().nonnegative(),
  averageReserveFpRatio: z.number().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Schema for MonthlyIndividualPerformance entity
 */
export const monthlyIndividualPerformanceSchema = z.object({
  clanId: positiveIntegerSchema,
  monthId: monthIdSchema,
  playerId: positiveIntegerSchema,
  battlesPlayed: z.number().int().min(MIN_BATTLES_FOR_STATS),
  averageScore: z.number().nonnegative(),
  averageFp: z.number().positive(),
  averageRatio: z.number().positive(),
  averageRank: z.number().positive(),
  averageRatioRank: z.number().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Schema for YearlyClanPerformance entity
 */
export const yearlyClanPerformanceSchema = z.object({
  clanId: positiveIntegerSchema,
  yearId: yearIdSchema,
  battleCount: positiveIntegerSchema,
  wonCount: nonNegativeIntegerSchema,
  lostCount: nonNegativeIntegerSchema,
  tiedCount: nonNegativeIntegerSchema,
  yearComplete: z.boolean(),
  averageFp: z.number().positive(),
  averageBaselineFp: z.number().positive(),
  averageRatio: z.number().positive(),
  averageMarginRatio: z.number(),
  averageFpMargin: z.number(),
  averageNonplayingCount: z.number().nonnegative(),
  averageNonplayingFpRatio: z.number().nonnegative(),
  averageReserveCount: z.number().nonnegative(),
  averageReserveFpRatio: z.number().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Schema for YearlyIndividualPerformance entity
 */
export const yearlyIndividualPerformanceSchema = z.object({
  clanId: positiveIntegerSchema,
  yearId: yearIdSchema,
  playerId: positiveIntegerSchema,
  battlesPlayed: z.number().int().min(MIN_BATTLES_FOR_STATS),
  averageScore: z.number().nonnegative(),
  averageFp: z.number().positive(),
  averageRatio: z.number().positive(),
  averageRank: z.number().positive(),
  averageRatioRank: z.number().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ============================================================================
// API Request Schemas
// ============================================================================

/**
 * Schema for pagination parameters
 */
export const paginationSchema = z.object({
  page: positiveIntegerSchema.optional().default(1),
  pageSize: positiveIntegerSchema.max(100).optional().default(20),
});

/**
 * Schema for sorting parameters
 */
export const sortingSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

/**
 * Schema for date range filter
 */
export const dateRangeSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

// Export type inference helpers
export type ActionCodeSchema = z.infer<typeof actionCodeSchema>;
export type BattleResultSchema = z.infer<typeof battleResultSchema>;
export type ClanSchema = z.infer<typeof clanSchema>;
export type ClanCreateSchema = z.infer<typeof clanCreateSchema>;
export type ClanUpdateSchema = z.infer<typeof clanUpdateSchema>;
export type UserSchema = z.infer<typeof userSchema>;
export type UserCreateSchema = z.infer<typeof userCreateSchema>;
export type UserUpdateSchema = z.infer<typeof userUpdateSchema>;
export type RosterMemberSchema = z.infer<typeof rosterMemberSchema>;
export type RosterMemberCreateSchema = z.infer<typeof rosterMemberCreateSchema>;
export type RosterMemberUpdateSchema = z.infer<typeof rosterMemberUpdateSchema>;
export type ClanBattleSchema = z.infer<typeof clanBattleSchema>;
export type ClanBattleCreateSchema = z.infer<typeof clanBattleCreateSchema>;
export type ClanBattleUpdateSchema = z.infer<typeof clanBattleUpdateSchema>;
export type ClanBattlePlayerStatsSchema = z.infer<typeof clanBattlePlayerStatsSchema>;
export type ClanBattlePlayerStatsCreateSchema = z.infer<typeof clanBattlePlayerStatsCreateSchema>;
export type ClanBattlePlayerStatsUpdateSchema = z.infer<typeof clanBattlePlayerStatsUpdateSchema>;
export type ClanBattleNonplayerStatsSchema = z.infer<typeof clanBattleNonplayerStatsSchema>;
export type ClanBattleNonplayerStatsCreateSchema = z.infer<
  typeof clanBattleNonplayerStatsCreateSchema
>;
export type ClanBattleNonplayerStatsUpdateSchema = z.infer<
  typeof clanBattleNonplayerStatsUpdateSchema
>;
export type MonthlyClanPerformanceSchema = z.infer<typeof monthlyClanPerformanceSchema>;
export type MonthlyIndividualPerformanceSchema = z.infer<typeof monthlyIndividualPerformanceSchema>;
export type YearlyClanPerformanceSchema = z.infer<typeof yearlyClanPerformanceSchema>;
export type YearlyIndividualPerformanceSchema = z.infer<typeof yearlyIndividualPerformanceSchema>;
export type PaginationSchema = z.infer<typeof paginationSchema>;
export type SortingSchema = z.infer<typeof sortingSchema>;
export type DateRangeSchema = z.infer<typeof dateRangeSchema>;
