/**
 * Period summary calculation utilities for Angry Birdman
 * Implements monthly and yearly aggregation calculations
 * Based on: specs/high-level-spec.md Section 7 (Data Calculations)
 */
import { calculateAverage } from './calculations.js';
// ============================================================================
// Clan Performance Calculations
// ============================================================================
/**
 * Calculate monthly or yearly clan performance summary
 * @param battles - Array of battles in the period
 * @returns Period clan performance summary
 */
export function calculatePeriodClanPerformance(battles) {
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
function groupPlayerStatsByPlayerId(allPlayerStats) {
    const grouped = new Map();
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
export function calculatePeriodIndividualPerformance(allPlayerStats) {
    // Group stats by player
    const grouped = groupPlayerStatsByPlayerId(allPlayerStats);
    // Calculate averages for each player with 3+ battles
    const results = [];
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
//# sourceMappingURL=period-calculations.js.map