/**
 * Calculation utilities for Angry Birdman
 * Implements all calculation formulas from high-level-spec.md Section 7
 */
import type { BattleResult } from '../constants/index.js';
/**
 * Calculate battle result based on clan score vs opponent score
 * @param score - Clan's total score
 * @param opponentScore - Opponent's total score
 * @returns 1 for win, -1 for loss, 0 for tie
 */
export declare function calculateBattleResult(score: number, opponentScore: number): BattleResult;
/**
 * Calculate clan ratio score (official)
 * Formula: (score / baselineFp) * 10
 * @param score - Clan's total score
 * @param baselineFp - Clan's baseline Flock Power
 * @returns Clan ratio score
 */
export declare function calculateClanRatio(score: number, baselineFp: number): number;
/**
 * Calculate average ratio (based on actual FP of all players)
 * Formula: (score / fp) * 10
 * @param score - Clan's total score
 * @param fp - Sum of all Flock Powers (excluding reserves)
 * @returns Average ratio score
 */
export declare function calculateAverageRatio(score: number, fp: number): number;
/**
 * Calculate player ratio score
 * Formula: (score / fp) * 10
 * @param score - Player's score
 * @param fp - Player's Flock Power
 * @returns Player's ratio score
 */
export declare function calculatePlayerRatio(score: number, fp: number): number;
/**
 * Calculate projected score if all players participated
 * Formula: (1 + nonplayingFpRatio/100) * score
 * @param score - Actual clan score
 * @param nonplayingFpRatio - Percentage of FP from non-players
 * @returns Projected score
 */
export declare function calculateProjectedScore(score: number, nonplayingFpRatio: number): number;
/**
 * Calculate margin ratio (percentage of score difference)
 * Formula: ((score - opponentScore) / score) * 100
 * Positive means we won by that percentage, negative means we lost
 * @param score - Clan's total score
 * @param opponentScore - Opponent's total score
 * @returns Margin ratio as percentage
 */
export declare function calculateMarginRatio(score: number, opponentScore: number): number;
/**
 * Calculate Flock Power margin (percentage difference in baseline FP)
 * Formula: ((baselineFp - opponentFp) / baselineFp) * 100
 * Positive means we have higher FP, negative means opponent has higher FP
 * @param baselineFp - Clan's baseline Flock Power
 * @param opponentFp - Opponent's baseline Flock Power
 * @returns FP margin as percentage
 */
export declare function calculateFpMargin(baselineFp: number, opponentFp: number): number;
/**
 * Calculate nonplaying FP ratio (excluding reserves)
 * Formula: (nonplayingFp / fp) * 100
 * @param nonplayingFp - Sum of FP from non-playing members (excluding reserves)
 * @param fp - Total FP (excluding reserves)
 * @returns Nonplaying FP ratio as percentage
 */
export declare function calculateNonplayingFpRatio(nonplayingFp: number, fp: number): number;
/**
 * Calculate reserve FP ratio
 * Formula: (reserveFp / (fp + reserveFp)) * 100
 * @param reserveFp - Sum of FP from reserve players
 * @param fp - Total FP (excluding reserves)
 * @returns Reserve FP ratio as percentage
 */
export declare function calculateReserveFpRatio(reserveFp: number, fp: number): number;
/**
 * Calculate ratio ranking for players
 * Sorts players by ratio score (highest to lowest) and assigns ranks
 * @param playerRatios - Array of player ratios
 * @returns Array of ranks corresponding to input order
 */
export declare function calculateRatioRanks(playerRatios: number[]): number[];
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
export declare function calculatePlayerRatioRanks(playerStats: PlayerStatsWithRatio[]): (PlayerStatsWithRatio & {
    ratioRank: number;
})[];
/**
 * Calculate total FP for battle (players + nonplayers excluding reserves)
 * @param playerStats - Array of player stats
 * @param nonplayerStats - Array of nonplayer stats
 * @returns Total FP excluding reserves
 */
export declare function calculateTotalFp(playerStats: {
    fp: number;
}[], nonplayerStats: {
    fp: number;
    reserve: boolean;
}[]): number;
/**
 * Calculate nonplaying count (excluding reserves)
 * @param nonplayerStats - Array of nonplayer stats
 * @returns Count of non-reserve nonplayers
 */
export declare function calculateNonplayingCount(nonplayerStats: {
    reserve: boolean;
}[]): number;
/**
 * Calculate reserve count
 * @param nonplayerStats - Array of nonplayer stats
 * @returns Count of reserve players
 */
export declare function calculateReserveCount(nonplayerStats: {
    reserve: boolean;
}[]): number;
/**
 * Calculate nonplaying FP (excluding reserves)
 * @param nonplayerStats - Array of nonplayer stats
 * @returns Sum of FP for non-reserve nonplayers
 */
export declare function calculateNonplayingFp(nonplayerStats: {
    fp: number;
    reserve: boolean;
}[]): number;
/**
 * Calculate reserve FP
 * @param nonplayerStats - Array of nonplayer stats
 * @returns Sum of FP for reserve players
 */
export declare function calculateReserveFp(nonplayerStats: {
    fp: number;
    reserve: boolean;
}[]): number;
/**
 * Calculate average from array of values
 * @param values - Array of numeric values
 * @returns Average value
 */
export declare function calculateAverage(values: number[]): number;
/**
 * Calculate sum of array of values
 * @param values - Array of numeric values
 * @returns Sum of values
 */
export declare function calculateSum(values: number[]): number;
/**
 * Calculate count of values matching a condition
 * @param values - Array of values
 * @param predicate - Function to test each value
 * @returns Count of matching values
 */
export declare function calculateCount<T>(values: T[], predicate: (value: T) => boolean): number;
/**
 * Validate that a value is positive
 * @param value - Value to validate
 * @param fieldName - Name of field for error message
 * @throws Error if value is not positive
 */
export declare function validatePositive(value: number, fieldName: string): void;
/**
 * Validate that a value is non-negative
 * @param value - Value to validate
 * @param fieldName - Name of field for error message
 * @throws Error if value is negative
 */
export declare function validateNonNegative(value: number, fieldName: string): void;
/**
 * Round a number to specified decimal places
 * @param value - Value to round
 * @param decimals - Number of decimal places
 * @returns Rounded value
 */
export declare function roundToDecimals(value: number, decimals: number): number;
//# sourceMappingURL=calculations.d.ts.map