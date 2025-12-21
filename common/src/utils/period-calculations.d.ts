/**
 * Period summary calculation utilities for Angry Birdman
 * Implements monthly and yearly aggregation calculations
 * Based on: specs/high-level-spec.md Section 7 (Data Calculations)
 */
/**
 * Battle data needed for monthly/yearly calculations
 */
export interface BattleForPeriod {
    result: number;
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
/**
 * Calculate monthly or yearly clan performance summary
 * @param battles - Array of battles in the period
 * @returns Period clan performance summary
 */
export declare function calculatePeriodClanPerformance(battles: BattleForPeriod[]): PeriodClanPerformance;
/**
 * Calculate monthly or yearly individual performance summaries
 * Only includes players with 3+ battles in the period
 * @param allPlayerStats - All player stats across battles in the period
 * @returns Array of individual performance summaries (only players with 3+ battles)
 */
export declare function calculatePeriodIndividualPerformance(allPlayerStats: PlayerStatsForPeriod[]): PeriodIndividualPerformance[];
//# sourceMappingURL=period-calculations.d.ts.map