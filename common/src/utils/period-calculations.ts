/**
 * Period summary calculation utilities for Angry Birdman
 * Implements monthly and yearly aggregation calculations
 * Based on: specs/high-level-spec.md Section 7 (Data Calculations)
 */

import { calculateAverage } from './calculations.js';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Battle data needed for monthly/yearly calculations
 */
export interface BattleForPeriod {
  result: number; // 1 = win, -1 = loss, 0 = tie
  fp: number;
  baselineFp: number;
  ratio: number;
  marginRatio: number;
  fpMargin: number;
  nonplayingCount: number;
  nonplayingFpRatio: number;
  reserveCount: number;
  reserveFpRatio: number;
}

/**
 * Player stats needed for monthly/yearly calculations
 */
export interface PlayerStatsForPeriod {
  playerId: number;
  score: number;
  fp: number;
  ratio: number;
  rank: number;
  ratioRank: number;
}

/**
 * Monthly/Yearly clan performance summary
 */
export interface PeriodClanPerformance {
  battleCount: number;
  wonCount: number;
  lostCount: number;
  tiedCount: number;
  averageFp: number;
  averageBaselineFp: number;
  averageRatio: number;
  averageMarginRatio: number;
  averageFpMargin: number;
  averageNonplayingCount: number;
  averageNonplayingFpRatio: number;
  averageReserveCount: number;
  averageReserveFpRatio: number;
}

/**
 * Monthly/Yearly individual player performance summary
 */
export interface PeriodIndividualPerformance {
  playerId: number;
  battlesPlayed: number;
  averageScore: number;
  averageFp: number;
  averageRatio: number;
  averageRank: number;
  averageRatioRank: number;
}

// ============================================================================
// Clan Performance Calculations
// ============================================================================

/**
 * Calculate monthly or yearly clan performance summary
 * @param battles - Array of battles in the period
 * @returns Period clan performance summary
 */
export function calculatePeriodClanPerformance(battles: BattleForPeriod[]): PeriodClanPerformance {
  if (battles.length === 0) {
    throw new Error('Cannot calculate period performance with no battles');
  }

  const battleCount = battles.length;
  const wonCount = battles.filter((b) => b.result === 1).length;
  const lostCount = battles.filter((b) => b.result === -1).length;
  const tiedCount = battles.filter((b) => b.result === 0).length;

  return {
    battleCount,
    wonCount,
    lostCount,
    tiedCount,
    averageFp: calculateAverage(battles.map((b) => b.fp)),
    averageBaselineFp: calculateAverage(battles.map((b) => b.baselineFp)),
    averageRatio: calculateAverage(battles.map((b) => b.ratio)),
    averageMarginRatio: calculateAverage(battles.map((b) => b.marginRatio)),
    averageFpMargin: calculateAverage(battles.map((b) => b.fpMargin)),
    averageNonplayingCount: calculateAverage(battles.map((b) => b.nonplayingCount)),
    averageNonplayingFpRatio: calculateAverage(battles.map((b) => b.nonplayingFpRatio)),
    averageReserveCount: calculateAverage(battles.map((b) => b.reserveCount)),
    averageReserveFpRatio: calculateAverage(battles.map((b) => b.reserveFpRatio)),
  };
}

// ============================================================================
// Individual Performance Calculations
// ============================================================================

/**
 * Group player stats by player ID
 * @param allPlayerStats - All player stats across battles in the period
 * @returns Map of playerId to array of stats
 */
function groupPlayerStatsByPlayerId(
  allPlayerStats: PlayerStatsForPeriod[]
): Map<number, PlayerStatsForPeriod[]> {
  const grouped = new Map<number, PlayerStatsForPeriod[]>();

  for (const stat of allPlayerStats) {
    const existing = grouped.get(stat.playerId) || [];
    existing.push(stat);
    grouped.set(stat.playerId, existing);
  }

  return grouped;
}

/**
 * Calculate monthly or yearly individual performance summaries
 * Only includes players with 3+ battles in the period
 * @param allPlayerStats - All player stats across battles in the period
 * @returns Array of individual performance summaries (only players with 3+ battles)
 */
export function calculatePeriodIndividualPerformance(
  allPlayerStats: PlayerStatsForPeriod[]
): PeriodIndividualPerformance[] {
  // Group stats by player
  const grouped = groupPlayerStatsByPlayerId(allPlayerStats);

  // Calculate averages for each player with 3+ battles
  const results: PeriodIndividualPerformance[] = [];

  for (const [playerId, stats] of grouped.entries()) {
    const battlesPlayed = stats.length;

    // Only include players with 3+ battles
    if (battlesPlayed < 3) {
      continue;
    }

    results.push({
      playerId,
      battlesPlayed,
      averageScore: calculateAverage(stats.map((s) => s.score)),
      averageFp: calculateAverage(stats.map((s) => s.fp)),
      averageRatio: calculateAverage(stats.map((s) => s.ratio)),
      averageRank: calculateAverage(stats.map((s) => s.rank)),
      averageRatioRank: calculateAverage(stats.map((s) => s.ratioRank)),
    });
  }

  return results;
}
