/**
 * Calculation utilities for Angry Birdman
 * Implements all calculation formulas from high-level-spec.md Section 7
 */

import { BATTLE_RESULTS, PERCENTAGE_MULTIPLIER, RATIO_MULTIPLIER } from '../constants/index.js';

import type { BattleResult } from '../constants/index.js';

// ============================================================================
// Battle Calculations
// ============================================================================

/**
 * Calculate battle result based on clan score vs opponent score
 * @param score - Clan's total score
 * @param opponentScore - Opponent's total score
 * @returns 1 for win, -1 for loss, 0 for tie
 */
export function calculateBattleResult(score: number, opponentScore: number): BattleResult {
  if (score > opponentScore) {
    return BATTLE_RESULTS.WIN;
  }
  if (score < opponentScore) {
    return BATTLE_RESULTS.LOSS;
  }
  return BATTLE_RESULTS.TIE;
}

/**
 * Calculate clan ratio score (official)
 * Formula: (score / baselineFp) * 10
 * @param score - Clan's total score
 * @param baselineFp - Clan's baseline Flock Power
 * @returns Clan ratio score
 */
export function calculateClanRatio(score: number, baselineFp: number): number {
  if (baselineFp === 0) {
    throw new Error('baselineFp cannot be zero');
  }
  return (score / baselineFp) * RATIO_MULTIPLIER;
}

/**
 * Calculate average ratio (based on actual FP of all players)
 * Formula: (score / fp) * 10
 * @param score - Clan's total score
 * @param fp - Sum of all Flock Powers (excluding reserves)
 * @returns Average ratio score
 */
export function calculateAverageRatio(score: number, fp: number): number {
  if (fp === 0) {
    throw new Error('fp cannot be zero');
  }
  return (score / fp) * RATIO_MULTIPLIER;
}

/**
 * Calculate player ratio score
 * Formula: (score / fp) * 10
 * @param score - Player's score
 * @param fp - Player's Flock Power
 * @returns Player's ratio score
 */
export function calculatePlayerRatio(score: number, fp: number): number {
  if (fp === 0) {
    throw new Error('fp cannot be zero');
  }
  return (score / fp) * RATIO_MULTIPLIER;
}

/**
 * Calculate projected score if all players participated
 * Formula: (1 + nonplayingFpRatio/100) * score
 * @param score - Actual clan score
 * @param nonplayingFpRatio - Percentage of FP from non-players
 * @returns Projected score
 */
export function calculateProjectedScore(score: number, nonplayingFpRatio: number): number {
  return (1 + nonplayingFpRatio / PERCENTAGE_MULTIPLIER) * score;
}

/**
 * Calculate margin ratio (percentage of score difference)
 * Formula: ((score - opponentScore) / score) * 100
 * Positive means we won by that percentage, negative means we lost
 * @param score - Clan's total score
 * @param opponentScore - Opponent's total score
 * @returns Margin ratio as percentage
 */
export function calculateMarginRatio(score: number, opponentScore: number): number {
  if (score === 0) {
    throw new Error('score cannot be zero');
  }
  return ((score - opponentScore) / score) * PERCENTAGE_MULTIPLIER;
}

/**
 * Calculate Flock Power margin (percentage difference in baseline FP)
 * Formula: ((baselineFp - opponentFp) / baselineFp) * 100
 * Positive means we have higher FP, negative means opponent has higher FP
 * @param baselineFp - Clan's baseline Flock Power
 * @param opponentFp - Opponent's baseline Flock Power
 * @returns FP margin as percentage
 */
export function calculateFpMargin(baselineFp: number, opponentFp: number): number {
  if (baselineFp === 0) {
    throw new Error('baselineFp cannot be zero');
  }
  return ((baselineFp - opponentFp) / baselineFp) * PERCENTAGE_MULTIPLIER;
}

/**
 * Calculate nonplaying FP ratio (excluding reserves)
 * Formula: (nonplayingFp / fp) * 100
 * @param nonplayingFp - Sum of FP from non-playing members (excluding reserves)
 * @param fp - Total FP (excluding reserves)
 * @returns Nonplaying FP ratio as percentage
 */
export function calculateNonplayingFpRatio(nonplayingFp: number, fp: number): number {
  if (fp === 0) {
    return 0; // If no one played, ratio is 0
  }
  return (nonplayingFp / fp) * PERCENTAGE_MULTIPLIER;
}

/**
 * Calculate reserve FP ratio
 * Formula: (reserveFp / (fp + reserveFp)) * 100
 * @param reserveFp - Sum of FP from reserve players
 * @param fp - Total FP (excluding reserves)
 * @returns Reserve FP ratio as percentage
 */
export function calculateReserveFpRatio(reserveFp: number, fp: number): number {
  const totalFp = fp + reserveFp;
  if (totalFp === 0) {
    return 0;
  }
  return (reserveFp / totalFp) * PERCENTAGE_MULTIPLIER;
}

// ============================================================================
// Player Performance Calculations
// ============================================================================

/**
 * Calculate ratio ranking for players
 * Sorts players by ratio score (highest to lowest) and assigns ranks
 * @param playerRatios - Array of player ratios
 * @returns Array of ranks corresponding to input order
 */
export function calculateRatioRanks(playerRatios: number[]): number[] {
  // Create array of {ratio, originalIndex}
  const indexed = playerRatios.map((ratio, index) => ({ ratio, originalIndex: index }));

  // Sort by ratio (descending - highest ratio gets rank 1)
  indexed.sort((a, b) => b.ratio - a.ratio);

  // Assign ranks
  const ranks = new Array<number>(playerRatios.length);
  indexed.forEach((item, rank) => {
    ranks[item.originalIndex] = rank + 1;
  });

  return ranks;
}

/**
 * Interface for player stats with calculated fields
 */
export interface PlayerStatsWithRatio {
  playerId: number;
  score: number;
  fp: number;
  ratio: number;
  rank: number;
}

/**
 * Calculate ratio ranks for a collection of player stats
 * @param playerStats - Array of player stats objects
 * @returns Array of player stats with ratioRank added
 */
export function calculatePlayerRatioRanks(
  playerStats: PlayerStatsWithRatio[]
): (PlayerStatsWithRatio & { ratioRank: number })[] {
  // Calculate ratios
  const ratios = playerStats.map((player) => player.ratio);

  // Get ratio ranks
  const ratioRanks = calculateRatioRanks(ratios);

  // Return player stats with ratio rank added
  return playerStats.map((player, index) => {
    const ratioRank = ratioRanks[index];
    if (ratioRank === undefined) {
      throw new Error('Ratio rank calculation failed');
    }
    return {
      ...player,
      ratioRank,
    };
  });
}

/**
 * Calculate total FP for battle (players + nonplayers excluding reserves)
 * @param playerStats - Array of player stats
 * @param nonplayerStats - Array of nonplayer stats
 * @returns Total FP excluding reserves
 */
export function calculateTotalFp(
  playerStats: { fp: number }[],
  nonplayerStats: { fp: number; reserve: boolean }[]
): number {
  const playerFp = calculateSum(playerStats.map((p) => p.fp));
  const nonplayerFp = calculateSum(nonplayerStats.filter((np) => !np.reserve).map((np) => np.fp));
  return playerFp + nonplayerFp;
}

/**
 * Calculate nonplaying count (excluding reserves)
 * @param nonplayerStats - Array of nonplayer stats
 * @returns Count of non-reserve nonplayers
 */
export function calculateNonplayingCount(nonplayerStats: { reserve: boolean }[]): number {
  return nonplayerStats.filter((np) => !np.reserve).length;
}

/**
 * Calculate reserve count
 * @param nonplayerStats - Array of nonplayer stats
 * @returns Count of reserve players
 */
export function calculateReserveCount(nonplayerStats: { reserve: boolean }[]): number {
  return nonplayerStats.filter((np) => np.reserve).length;
}

/**
 * Calculate nonplaying FP (excluding reserves)
 * @param nonplayerStats - Array of nonplayer stats
 * @returns Sum of FP for non-reserve nonplayers
 */
export function calculateNonplayingFp(nonplayerStats: { fp: number; reserve: boolean }[]): number {
  return calculateSum(nonplayerStats.filter((np) => !np.reserve).map((np) => np.fp));
}

/**
 * Calculate reserve FP
 * @param nonplayerStats - Array of nonplayer stats
 * @returns Sum of FP for reserve players
 */
export function calculateReserveFp(nonplayerStats: { fp: number; reserve: boolean }[]): number {
  return calculateSum(nonplayerStats.filter((np) => np.reserve).map((np) => np.fp));
}

// ============================================================================
// Aggregated Statistics Calculations
// ============================================================================

/**
 * Calculate average from array of values
 * @param values - Array of numeric values
 * @returns Average value
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) {
    throw new Error('Cannot calculate average of empty array');
  }
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Calculate sum of array of values
 * @param values - Array of numeric values
 * @returns Sum of values
 */
export function calculateSum(values: number[]): number {
  return values.reduce((acc, val) => acc + val, 0);
}

/**
 * Calculate count of values matching a condition
 * @param values - Array of values
 * @param predicate - Function to test each value
 * @returns Count of matching values
 */
export function calculateCount<T>(values: T[], predicate: (value: T) => boolean): number {
  return values.filter(predicate).length;
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate that a value is positive
 * @param value - Value to validate
 * @param fieldName - Name of field for error message
 * @throws Error if value is not positive
 */
export function validatePositive(value: number, fieldName: string): void {
  if (value <= 0) {
    throw new Error(`${fieldName} must be positive, got ${value}`);
  }
}

/**
 * Validate that a value is non-negative
 * @param value - Value to validate
 * @param fieldName - Name of field for error message
 * @throws Error if value is negative
 */
export function validateNonNegative(value: number, fieldName: string): void {
  if (value < 0) {
    throw new Error(`${fieldName} must be non-negative, got ${value}`);
  }
}

/**
 * Round a number to specified decimal places
 * @param value - Value to round
 * @param decimals - Number of decimal places
 * @returns Rounded value
 */
export function roundToDecimals(value: number, decimals: number): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}
