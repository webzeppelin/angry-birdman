/**
 * Type definitions for Angry Birdman
 * These types match the Prisma schema and provide TypeScript type safety
 * throughout the application.
 */

import type { ActionCode, BattleResult } from '../constants/index.js';

// Export battle schedule types
export * from './battleSchedule.js';

// ============================================================================
// Core Entity Types
// ============================================================================

/**
 * Represents a clan using Angry Birdman
 */
export interface Clan {
  clanId: number;
  rovioId: number;
  name: string;
  country: string;
  registrationDate: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input type for creating a new clan
 */
export interface ClanCreate {
  rovioId: number;
  name: string;
  country: string;
  registrationDate?: Date;
  active?: boolean;
}

/**
 * Input type for updating a clan
 */
export interface ClanUpdate {
  name?: string;
  country?: string;
  active?: boolean;
}

/**
 * Represents an administrator user
 */
export interface User {
  userId: string;
  username: string;
  email: string;
  clanId: number | null;
  owner: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input type for creating a new user
 */
export interface UserCreate {
  userId: string;
  username: string;
  email: string;
  clanId?: number | null;
  owner?: boolean;
}

/**
 * Input type for updating a user
 */
export interface UserUpdate {
  email?: string;
  clanId?: number | null;
  owner?: boolean;
}

/**
 * Represents a member of a clan's roster
 */
export interface RosterMember {
  playerId: number;
  clanId: number;
  playerName: string;
  active: boolean;
  joinedDate: Date;
  leftDate: Date | null;
  kickedDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input type for creating a new roster member
 */
export interface RosterMemberCreate {
  clanId: number;
  playerName: string;
  active?: boolean;
  joinedDate?: Date;
}

/**
 * Input type for updating a roster member
 */
export interface RosterMemberUpdate {
  playerName?: string;
  active?: boolean;
  leftDate?: Date | null;
  kickedDate?: Date | null;
}

// ============================================================================
// Battle Data Types
// ============================================================================

/**
 * Represents a Clan-vs-Clan (CvC) battle
 */
export interface ClanBattle {
  clanId: number;
  battleId: string;
  startDate: Date;
  endDate: Date;
  result: BattleResult;
  score: number;
  fp: number;
  baselineFp: number;
  ratio: number;
  averageRatio: number;
  projectedScore: number;
  opponentName: string;
  opponentRovioId: number;
  opponentCountry: string;
  opponentScore: number;
  opponentFp: number;
  marginRatio: number;
  fpMargin: number;
  nonplayingCount: number;
  nonplayingFpRatio: number;
  reserveCount: number;
  reserveFpRatio: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input type for creating a new clan battle
 * Calculated fields will be computed server-side
 */
export interface ClanBattleCreate {
  clanId: number;
  startDate: Date;
  endDate: Date;
  score: number;
  baselineFp: number;
  opponentName: string;
  opponentRovioId: number;
  opponentCountry: string;
  opponentScore: number;
  opponentFp: number;
}

/**
 * Input type for updating a clan battle
 */
export interface ClanBattleUpdate {
  startDate?: Date;
  endDate?: Date;
  score?: number;
  baselineFp?: number;
  opponentName?: string;
  opponentRovioId?: number;
  opponentCountry?: string;
  opponentScore?: number;
  opponentFp?: number;
}

/**
 * Represents individual player performance in a battle
 */
export interface ClanBattlePlayerStats {
  clanId: number;
  battleId: string;
  playerId: number;
  rank: number;
  score: number;
  fp: number;
  ratio: number;
  ratioRank: number;
  actionCode: ActionCode;
  actionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input type for creating player stats
 */
export interface ClanBattlePlayerStatsCreate {
  clanId: number;
  battleId: string;
  playerId: number;
  rank: number;
  score: number;
  fp: number;
  actionCode: ActionCode;
  actionReason?: string | null;
}

/**
 * Input type for updating player stats
 */
export interface ClanBattlePlayerStatsUpdate {
  rank?: number;
  score?: number;
  fp?: number;
  actionCode?: ActionCode;
  actionReason?: string | null;
}

/**
 * Represents non-playing roster members in a battle
 */
export interface ClanBattleNonplayerStats {
  clanId: number;
  battleId: string;
  playerId: number;
  fp: number;
  reserve: boolean;
  actionCode: ActionCode;
  actionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input type for creating nonplayer stats
 */
export interface ClanBattleNonplayerStatsCreate {
  clanId: number;
  battleId: string;
  playerId: number;
  fp: number;
  reserve?: boolean;
  actionCode: ActionCode;
  actionReason?: string | null;
}

/**
 * Input type for updating nonplayer stats
 */
export interface ClanBattleNonplayerStatsUpdate {
  fp?: number;
  reserve?: boolean;
  actionCode?: ActionCode;
  actionReason?: string | null;
}

// ============================================================================
// Lookup Table Types
// ============================================================================

/**
 * Represents a post-battle action code
 */
export interface ActionCodeEntity {
  actionCode: ActionCode;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Aggregated Statistics Types - Monthly
// ============================================================================

/**
 * Represents monthly clan performance summary
 */
export interface MonthlyClanPerformance {
  clanId: number;
  monthId: string;
  battleCount: number;
  wonCount: number;
  lostCount: number;
  tiedCount: number;
  monthComplete: boolean;
  averageFp: number;
  averageBaselineFp: number;
  averageRatio: number;
  averageMarginRatio: number;
  averageFpMargin: number;
  averageNonplayingCount: number;
  averageNonplayingFpRatio: number;
  averageReserveCount: number;
  averageReserveFpRatio: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents monthly individual player performance summary
 */
export interface MonthlyIndividualPerformance {
  clanId: number;
  monthId: string;
  playerId: number;
  battlesPlayed: number;
  averageScore: number;
  averageFp: number;
  averageRatio: number;
  averageRank: number;
  averageRatioRank: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Aggregated Statistics Types - Yearly
// ============================================================================

/**
 * Represents yearly clan performance summary
 */
export interface YearlyClanPerformance {
  clanId: number;
  yearId: string;
  battleCount: number;
  wonCount: number;
  lostCount: number;
  tiedCount: number;
  yearComplete: boolean;
  averageFp: number;
  averageBaselineFp: number;
  averageRatio: number;
  averageMarginRatio: number;
  averageFpMargin: number;
  averageNonplayingCount: number;
  averageNonplayingFpRatio: number;
  averageReserveCount: number;
  averageReserveFpRatio: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents yearly individual player performance summary
 */
export interface YearlyIndividualPerformance {
  clanId: number;
  yearId: string;
  playerId: number;
  battlesPlayed: number;
  averageScore: number;
  averageFp: number;
  averageRatio: number;
  averageRank: number;
  averageRatioRank: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Represents a battle with related player and nonplayer stats
 */
export interface ClanBattleWithStats extends ClanBattle {
  playerStats: ClanBattlePlayerStats[];
  nonplayerStats: ClanBattleNonplayerStats[];
}

/**
 * Represents a roster member with their battle history
 */
export interface RosterMemberWithStats extends RosterMember {
  battleCount: number;
  averageRatio: number;
  averageRank: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * API error response
 */
export interface ApiError {
  message: string;
  code: string;
  details?: unknown;
}
