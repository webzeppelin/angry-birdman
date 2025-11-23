/**
 * Tests for period calculation utilities (monthly and yearly aggregations)
 * Based on: specs/high-level-spec.md Section 7 (Data Calculations)
 */

import { describe, expect, it } from 'vitest';

import { BATTLE_RESULTS } from '../src/constants';
import {
  calculatePeriodClanPerformance,
  calculatePeriodIndividualPerformance,
} from '../src/utils/period-calculations';

import type { BattleForPeriod, PlayerStatsForPeriod } from '../src/utils/period-calculations';

describe('Period Clan Performance Calculations', () => {
  const createBattle = (overrides: Partial<BattleForPeriod> = {}): BattleForPeriod => ({
    result: BATTLE_RESULTS.WIN,
    fp: 10000,
    baselineFp: 10000,
    ratio: 100,
    marginRatio: 10,
    fpMargin: 5,
    nonplayingCount: 2,
    nonplayingFpRatio: 20,
    reserveCount: 1,
    reserveFpRatio: 10,
    ...overrides,
  });

  it('should calculate clan performance for a single battle', () => {
    const battles = [createBattle()];
    const performance = calculatePeriodClanPerformance(battles);

    expect(performance.battleCount).toBe(1);
    expect(performance.wonCount).toBe(1);
    expect(performance.lostCount).toBe(0);
    expect(performance.tiedCount).toBe(0);
    expect(performance.averageFp).toBe(10000);
    expect(performance.averageBaselineFp).toBe(10000);
    expect(performance.averageRatio).toBe(100);
    expect(performance.averageMarginRatio).toBe(10);
    expect(performance.averageFpMargin).toBe(5);
    expect(performance.averageNonplayingCount).toBe(2);
    expect(performance.averageNonplayingFpRatio).toBe(20);
    expect(performance.averageReserveCount).toBe(1);
    expect(performance.averageReserveFpRatio).toBe(10);
  });

  it('should calculate clan performance across multiple battles', () => {
    const battles: BattleForPeriod[] = [
      createBattle({ result: BATTLE_RESULTS.WIN, fp: 10000, ratio: 100 }),
      createBattle({ result: BATTLE_RESULTS.LOSS, fp: 11000, ratio: 90 }),
      createBattle({ result: BATTLE_RESULTS.TIE, fp: 10500, ratio: 95 }),
      createBattle({ result: BATTLE_RESULTS.WIN, fp: 10200, ratio: 98 }),
    ];

    const performance = calculatePeriodClanPerformance(battles);

    expect(performance.battleCount).toBe(4);
    expect(performance.wonCount).toBe(2);
    expect(performance.lostCount).toBe(1);
    expect(performance.tiedCount).toBe(1);
    expect(performance.averageFp).toBe(10425); // (10000 + 11000 + 10500 + 10200) / 4
    expect(performance.averageRatio).toBe(95.75); // (100 + 90 + 95 + 98) / 4
  });

  it('should calculate all win statistics', () => {
    const battles: BattleForPeriod[] = [
      createBattle({ result: BATTLE_RESULTS.WIN }),
      createBattle({ result: BATTLE_RESULTS.WIN }),
      createBattle({ result: BATTLE_RESULTS.WIN }),
    ];

    const performance = calculatePeriodClanPerformance(battles);

    expect(performance.battleCount).toBe(3);
    expect(performance.wonCount).toBe(3);
    expect(performance.lostCount).toBe(0);
    expect(performance.tiedCount).toBe(0);
  });

  it('should calculate all loss statistics', () => {
    const battles: BattleForPeriod[] = [
      createBattle({ result: BATTLE_RESULTS.LOSS }),
      createBattle({ result: BATTLE_RESULTS.LOSS }),
    ];

    const performance = calculatePeriodClanPerformance(battles);

    expect(performance.battleCount).toBe(2);
    expect(performance.wonCount).toBe(0);
    expect(performance.lostCount).toBe(2);
    expect(performance.tiedCount).toBe(0);
  });

  it('should calculate all tie statistics', () => {
    const battles: BattleForPeriod[] = [
      createBattle({ result: BATTLE_RESULTS.TIE }),
      createBattle({ result: BATTLE_RESULTS.TIE }),
      createBattle({ result: BATTLE_RESULTS.TIE }),
    ];

    const performance = calculatePeriodClanPerformance(battles);

    expect(performance.battleCount).toBe(3);
    expect(performance.wonCount).toBe(0);
    expect(performance.lostCount).toBe(0);
    expect(performance.tiedCount).toBe(3);
  });

  it('should calculate average FP and baseline FP correctly', () => {
    const battles: BattleForPeriod[] = [
      createBattle({ fp: 10000, baselineFp: 10500 }),
      createBattle({ fp: 11000, baselineFp: 11500 }),
      createBattle({ fp: 10500, baselineFp: 11000 }),
    ];

    const performance = calculatePeriodClanPerformance(battles);

    expect(performance.averageFp).toBe(10500); // (10000 + 11000 + 10500) / 3
    expect(performance.averageBaselineFp).toBe(11000); // (10500 + 11500 + 11000) / 3
  });

  it('should calculate average margin ratios correctly', () => {
    const battles: BattleForPeriod[] = [
      createBattle({ marginRatio: 10, fpMargin: 5 }),
      createBattle({ marginRatio: -5, fpMargin: -3 }),
      createBattle({ marginRatio: 0, fpMargin: 0 }),
    ];

    const performance = calculatePeriodClanPerformance(battles);

    expect(performance.averageMarginRatio).toBeCloseTo(1.67, 2); // (10 + -5 + 0) / 3
    expect(performance.averageFpMargin).toBeCloseTo(0.67, 2); // (5 + -3 + 0) / 3
  });

  it('should calculate average nonplaying statistics correctly', () => {
    const battles: BattleForPeriod[] = [
      createBattle({ nonplayingCount: 2, nonplayingFpRatio: 20 }),
      createBattle({ nonplayingCount: 3, nonplayingFpRatio: 25 }),
      createBattle({ nonplayingCount: 1, nonplayingFpRatio: 15 }),
    ];

    const performance = calculatePeriodClanPerformance(battles);

    expect(performance.averageNonplayingCount).toBe(2); // (2 + 3 + 1) / 3
    expect(performance.averageNonplayingFpRatio).toBe(20); // (20 + 25 + 15) / 3
  });

  it('should calculate average reserve statistics correctly', () => {
    const battles: BattleForPeriod[] = [
      createBattle({ reserveCount: 1, reserveFpRatio: 10 }),
      createBattle({ reserveCount: 2, reserveFpRatio: 15 }),
      createBattle({ reserveCount: 1, reserveFpRatio: 12 }),
    ];

    const performance = calculatePeriodClanPerformance(battles);

    expect(performance.averageReserveCount).toBeCloseTo(1.33, 2); // (1 + 2 + 1) / 3
    expect(performance.averageReserveFpRatio).toBeCloseTo(12.33, 2); // (10 + 15 + 12) / 3
  });

  it('should handle battles with zero values correctly', () => {
    const battles: BattleForPeriod[] = [
      createBattle({
        nonplayingCount: 0,
        nonplayingFpRatio: 0,
        reserveCount: 0,
        reserveFpRatio: 0,
      }),
      createBattle({
        nonplayingCount: 0,
        nonplayingFpRatio: 0,
        reserveCount: 0,
        reserveFpRatio: 0,
      }),
    ];

    const performance = calculatePeriodClanPerformance(battles);

    expect(performance.averageNonplayingCount).toBe(0);
    expect(performance.averageNonplayingFpRatio).toBe(0);
    expect(performance.averageReserveCount).toBe(0);
    expect(performance.averageReserveFpRatio).toBe(0);
  });

  it('should throw error when given empty array', () => {
    expect(() => calculatePeriodClanPerformance([])).toThrow(
      'Cannot calculate period performance with no battles'
    );
  });

  it('should calculate complete period performance (integration test)', () => {
    // Simulate a full month with various battle outcomes
    const battles: BattleForPeriod[] = [
      createBattle({
        result: BATTLE_RESULTS.WIN,
        fp: 10000,
        baselineFp: 10000,
        ratio: 105,
        marginRatio: 15,
        fpMargin: 10,
        nonplayingCount: 2,
        nonplayingFpRatio: 18,
        reserveCount: 1,
        reserveFpRatio: 8,
      }),
      createBattle({
        result: BATTLE_RESULTS.LOSS,
        fp: 10200,
        baselineFp: 10100,
        ratio: 90,
        marginRatio: -12,
        fpMargin: -8,
        nonplayingCount: 5,
        nonplayingFpRatio: 25,
        reserveCount: 1,
        reserveFpRatio: 9,
      }),
      createBattle({
        result: BATTLE_RESULTS.WIN,
        fp: 10100,
        baselineFp: 10050,
        ratio: 98,
        marginRatio: 8,
        fpMargin: 5,
        nonplayingCount: 3,
        nonplayingFpRatio: 20,
        reserveCount: 1,
        reserveFpRatio: 8.5,
      }),
      createBattle({
        result: BATTLE_RESULTS.TIE,
        fp: 10050,
        baselineFp: 10025,
        ratio: 100,
        marginRatio: 0,
        fpMargin: 0,
        nonplayingCount: 4,
        nonplayingFpRatio: 22,
        reserveCount: 1,
        reserveFpRatio: 9,
      }),
    ];

    const performance = calculatePeriodClanPerformance(battles);

    // Verify all fields are calculated correctly
    expect(performance.battleCount).toBe(4);
    expect(performance.wonCount).toBe(2);
    expect(performance.lostCount).toBe(1);
    expect(performance.tiedCount).toBe(1);
    expect(performance.averageFp).toBe(10087.5);
    expect(performance.averageBaselineFp).toBe(10043.75);
    expect(performance.averageRatio).toBe(98.25);
    expect(performance.averageMarginRatio).toBe(2.75);
    expect(performance.averageFpMargin).toBe(1.75);
    expect(performance.averageNonplayingCount).toBe(3.5);
    expect(performance.averageNonplayingFpRatio).toBe(21.25);
    expect(performance.averageReserveCount).toBe(1);
    expect(performance.averageReserveFpRatio).toBeCloseTo(8.625, 3);
  });
});

describe('Period Individual Performance Calculations', () => {
  const createPlayerStats = (
    playerId: number,
    overrides: Partial<PlayerStatsForPeriod> = {}
  ): PlayerStatsForPeriod => ({
    playerId,
    score: 5000,
    fp: 500,
    ratio: 100,
    rank: 1,
    ratioRank: 1,
    ...overrides,
  });

  it('should calculate individual performance for single player with 3 battles', () => {
    const allStats: PlayerStatsForPeriod[] = [
      createPlayerStats(1, { score: 5000, fp: 500, ratio: 100, rank: 1, ratioRank: 1 }),
      createPlayerStats(1, { score: 5200, fp: 520, ratio: 100, rank: 2, ratioRank: 1 }),
      createPlayerStats(1, { score: 4800, fp: 480, ratio: 100, rank: 3, ratioRank: 2 }),
    ];

    const results = calculatePeriodIndividualPerformance(allStats);

    expect(results.length).toBe(1);
    expect(results[0]!.playerId).toBe(1);
    expect(results[0]!.battlesPlayed).toBe(3);
    expect(results[0]!.averageScore).toBe(5000); // (5000 + 5200 + 4800) / 3
    expect(results[0]!.averageFp).toBe(500); // (500 + 520 + 480) / 3
    expect(results[0]!.averageRatio).toBe(100);
    expect(results[0]!.averageRank).toBe(2); // (1 + 2 + 3) / 3
    expect(results[0]!.averageRatioRank).toBeCloseTo(1.33, 2); // (1 + 1 + 2) / 3
  });

  it('should exclude players with fewer than 3 battles', () => {
    const allStats: PlayerStatsForPeriod[] = [
      // Player 1: 2 battles (excluded)
      createPlayerStats(1, { score: 5000 }),
      createPlayerStats(1, { score: 5200 }),
      // Player 2: 3 battles (included)
      createPlayerStats(2, { score: 4000 }),
      createPlayerStats(2, { score: 4200 }),
      createPlayerStats(2, { score: 4100 }),
      // Player 3: 1 battle (excluded)
      createPlayerStats(3, { score: 6000 }),
    ];

    const results = calculatePeriodIndividualPerformance(allStats);

    expect(results.length).toBe(1);
    expect(results[0]!.playerId).toBe(2);
    expect(results[0]!.battlesPlayed).toBe(3);
  });

  it('should calculate performance for multiple players with 3+ battles', () => {
    const allStats: PlayerStatsForPeriod[] = [
      // Player 1: 4 battles
      createPlayerStats(1, { score: 5000, fp: 500, ratio: 100, rank: 1, ratioRank: 1 }),
      createPlayerStats(1, { score: 5200, fp: 520, ratio: 100, rank: 2, ratioRank: 1 }),
      createPlayerStats(1, { score: 4800, fp: 480, ratio: 100, rank: 3, ratioRank: 2 }),
      createPlayerStats(1, { score: 5100, fp: 510, ratio: 100, rank: 1, ratioRank: 1 }),
      // Player 2: 3 battles
      createPlayerStats(2, { score: 4000, fp: 400, ratio: 100, rank: 5, ratioRank: 4 }),
      createPlayerStats(2, { score: 4200, fp: 420, ratio: 100, rank: 4, ratioRank: 3 }),
      createPlayerStats(2, { score: 4100, fp: 410, ratio: 100, rank: 6, ratioRank: 5 }),
    ];

    const results = calculatePeriodIndividualPerformance(allStats);

    expect(results.length).toBe(2);

    // Check player 1
    const player1 = results.find((r) => r.playerId === 1);
    expect(player1).toBeDefined();
    expect(player1!.battlesPlayed).toBe(4);
    expect(player1!.averageScore).toBe(5025); // (5000 + 5200 + 4800 + 5100) / 4
    expect(player1!.averageFp).toBe(502.5); // (500 + 520 + 480 + 510) / 4
    expect(player1!.averageRank).toBe(1.75); // (1 + 2 + 3 + 1) / 4
    expect(player1!.averageRatioRank).toBe(1.25); // (1 + 1 + 2 + 1) / 4

    // Check player 2
    const player2 = results.find((r) => r.playerId === 2);
    expect(player2).toBeDefined();
    expect(player2!.battlesPlayed).toBe(3);
    expect(player2!.averageScore).toBe(4100); // (4000 + 4200 + 4100) / 3
    expect(player2!.averageFp).toBe(410); // (400 + 420 + 410) / 3
    expect(player2!.averageRank).toBe(5); // (5 + 4 + 6) / 3
    expect(player2!.averageRatioRank).toBe(4); // (4 + 3 + 5) / 3
  });

  it('should return empty array when no players have 3+ battles', () => {
    const allStats: PlayerStatsForPeriod[] = [
      createPlayerStats(1, { score: 5000 }),
      createPlayerStats(1, { score: 5200 }),
      createPlayerStats(2, { score: 4000 }),
    ];

    const results = calculatePeriodIndividualPerformance(allStats);

    expect(results.length).toBe(0);
  });

  it('should return empty array when given empty array', () => {
    const results = calculatePeriodIndividualPerformance([]);

    expect(results.length).toBe(0);
  });

  it('should handle player with exactly 3 battles (boundary case)', () => {
    const allStats: PlayerStatsForPeriod[] = [
      createPlayerStats(1, { score: 5000, fp: 500 }),
      createPlayerStats(1, { score: 5100, fp: 510 }),
      createPlayerStats(1, { score: 4900, fp: 490 }),
    ];

    const results = calculatePeriodIndividualPerformance(allStats);

    expect(results.length).toBe(1);
    expect(results[0]!.playerId).toBe(1);
    expect(results[0]!.battlesPlayed).toBe(3);
  });

  it('should handle varying FP growth over time', () => {
    const allStats: PlayerStatsForPeriod[] = [
      createPlayerStats(1, { score: 5000, fp: 500, ratio: 100 }),
      createPlayerStats(1, { score: 6000, fp: 600, ratio: 100 }), // FP grew
      createPlayerStats(1, { score: 7000, fp: 700, ratio: 100 }), // FP grew again
    ];

    const results = calculatePeriodIndividualPerformance(allStats);

    expect(results.length).toBe(1);
    expect(results[0]!.averageFp).toBe(600); // (500 + 600 + 700) / 3
    expect(results[0]!.averageScore).toBe(6000); // (5000 + 6000 + 7000) / 3
  });

  it('should handle varying performance ratios', () => {
    const allStats: PlayerStatsForPeriod[] = [
      createPlayerStats(1, { score: 5000, fp: 500, ratio: 100 }),
      createPlayerStats(1, { score: 4500, fp: 500, ratio: 90 }),
      createPlayerStats(1, { score: 5500, fp: 500, ratio: 110 }),
    ];

    const results = calculatePeriodIndividualPerformance(allStats);

    expect(results.length).toBe(1);
    expect(results[0]!.averageRatio).toBe(100); // (100 + 90 + 110) / 3
  });

  it('should calculate complete individual performance (integration test)', () => {
    // Simulate a complex month with 5 players
    const allStats: PlayerStatsForPeriod[] = [
      // Player 1: Consistent high performer, 5 battles
      createPlayerStats(1, { score: 5500, fp: 550, ratio: 100, rank: 1, ratioRank: 1 }),
      createPlayerStats(1, { score: 5600, fp: 560, ratio: 100, rank: 1, ratioRank: 1 }),
      createPlayerStats(1, { score: 5400, fp: 540, ratio: 100, rank: 2, ratioRank: 2 }),
      createPlayerStats(1, { score: 5700, fp: 570, ratio: 100, rank: 1, ratioRank: 1 }),
      createPlayerStats(1, { score: 5500, fp: 550, ratio: 100, rank: 1, ratioRank: 1 }),

      // Player 2: Improving player, 4 battles
      createPlayerStats(2, { score: 4000, fp: 500, ratio: 80, rank: 10, ratioRank: 15 }),
      createPlayerStats(2, { score: 4500, fp: 500, ratio: 90, rank: 8, ratioRank: 12 }),
      createPlayerStats(2, { score: 5000, fp: 500, ratio: 100, rank: 5, ratioRank: 8 }),
      createPlayerStats(2, { score: 5500, fp: 500, ratio: 110, rank: 3, ratioRank: 5 }),

      // Player 3: Declining player, 3 battles
      createPlayerStats(3, { score: 6000, fp: 600, ratio: 100, rank: 2, ratioRank: 3 }),
      createPlayerStats(3, { score: 5400, fp: 600, ratio: 90, rank: 4, ratioRank: 7 }),
      createPlayerStats(3, { score: 4800, fp: 600, ratio: 80, rank: 8, ratioRank: 12 }),

      // Player 4: Inconsistent player, 3 battles
      createPlayerStats(4, { score: 3000, fp: 300, ratio: 100, rank: 12, ratioRank: 6 }),
      createPlayerStats(4, { score: 4500, fp: 300, ratio: 150, rank: 5, ratioRank: 1 }),
      createPlayerStats(4, { score: 3500, fp: 300, ratio: 117, rank: 10, ratioRank: 4 }),

      // Player 5: Only 2 battles (excluded)
      createPlayerStats(5, { score: 5000, fp: 500, ratio: 100, rank: 3, ratioRank: 3 }),
      createPlayerStats(5, { score: 5200, fp: 520, ratio: 100, rank: 2, ratioRank: 2 }),
    ];

    const results = calculatePeriodIndividualPerformance(allStats);

    // Should have 4 players (player 5 excluded for insufficient battles)
    expect(results.length).toBe(4);

    // Verify Player 1 (consistent high performer)
    const player1 = results.find((r) => r.playerId === 1);
    expect(player1).toBeDefined();
    expect(player1!.battlesPlayed).toBe(5);
    expect(player1!.averageScore).toBe(5540);
    expect(player1!.averageFp).toBe(554);
    expect(player1!.averageRatio).toBe(100);
    expect(player1!.averageRank).toBe(1.2);
    expect(player1!.averageRatioRank).toBe(1.2);

    // Verify Player 2 (improving player)
    const player2 = results.find((r) => r.playerId === 2);
    expect(player2).toBeDefined();
    expect(player2!.battlesPlayed).toBe(4);
    expect(player2!.averageScore).toBe(4750);
    expect(player2!.averageRatio).toBe(95);
    expect(player2!.averageRank).toBe(6.5);
    expect(player2!.averageRatioRank).toBe(10);

    // Verify Player 3 (declining player)
    const player3 = results.find((r) => r.playerId === 3);
    expect(player3).toBeDefined();
    expect(player3!.battlesPlayed).toBe(3);
    expect(player3!.averageScore).toBeCloseTo(5400, 2);
    expect(player3!.averageRatio).toBe(90);

    // Verify Player 4 (inconsistent player)
    const player4 = results.find((r) => r.playerId === 4);
    expect(player4).toBeDefined();
    expect(player4!.battlesPlayed).toBe(3);
    expect(player4!.averageScore).toBeCloseTo(3666.67, 2);
    expect(player4!.averageRatio).toBeCloseTo(122.33, 2);

    // Verify Player 5 is excluded
    const player5 = results.find((r) => r.playerId === 5);
    expect(player5).toBeUndefined();
  });

  it('should handle multiple players with same playerId correctly', () => {
    // This tests the grouping logic
    const allStats: PlayerStatsForPeriod[] = [
      createPlayerStats(1, { score: 5000, fp: 500 }),
      createPlayerStats(2, { score: 4000, fp: 400 }),
      createPlayerStats(1, { score: 5100, fp: 510 }),
      createPlayerStats(3, { score: 3000, fp: 300 }),
      createPlayerStats(1, { score: 4900, fp: 490 }),
      createPlayerStats(2, { score: 4100, fp: 410 }),
      createPlayerStats(2, { score: 3900, fp: 390 }),
      createPlayerStats(3, { score: 3100, fp: 310 }),
      createPlayerStats(3, { score: 2900, fp: 290 }),
    ];

    const results = calculatePeriodIndividualPerformance(allStats);

    expect(results.length).toBe(3);

    // All three players should have exactly 3 battles
    expect(results.every((r) => r.battlesPlayed === 3)).toBe(true);

    // Verify each player's ID is present
    expect(results.find((r) => r.playerId === 1)).toBeDefined();
    expect(results.find((r) => r.playerId === 2)).toBeDefined();
    expect(results.find((r) => r.playerId === 3)).toBeDefined();
  });
});

describe('Period Calculations - Edge Cases', () => {
  it('should handle zero values in calculations gracefully', () => {
    const battles: BattleForPeriod[] = [
      {
        result: BATTLE_RESULTS.TIE,
        fp: 10000,
        baselineFp: 10000,
        ratio: 100,
        marginRatio: 0,
        fpMargin: 0,
        nonplayingCount: 0,
        nonplayingFpRatio: 0,
        reserveCount: 0,
        reserveFpRatio: 0,
      },
    ];

    const performance = calculatePeriodClanPerformance(battles);

    expect(performance.averageMarginRatio).toBe(0);
    expect(performance.averageFpMargin).toBe(0);
    expect(performance.averageNonplayingCount).toBe(0);
    expect(performance.averageReserveCount).toBe(0);
  });

  it('should handle floating point precision in averages', () => {
    const battles: BattleForPeriod[] = [
      {
        result: BATTLE_RESULTS.WIN,
        fp: 10000,
        baselineFp: 10000,
        ratio: 100.33,
        marginRatio: 10.11,
        fpMargin: 5.55,
        nonplayingCount: 2,
        nonplayingFpRatio: 20.22,
        reserveCount: 1,
        reserveFpRatio: 10.11,
      },
      {
        result: BATTLE_RESULTS.WIN,
        fp: 10000,
        baselineFp: 10000,
        ratio: 100.67,
        marginRatio: 10.22,
        fpMargin: 5.66,
        nonplayingCount: 2,
        nonplayingFpRatio: 20.44,
        reserveCount: 1,
        reserveFpRatio: 10.22,
      },
    ];

    const performance = calculatePeriodClanPerformance(battles);

    expect(performance.averageRatio).toBeCloseTo(100.5, 2);
    expect(performance.averageMarginRatio).toBeCloseTo(10.165, 3);
    expect(performance.averageFpMargin).toBeCloseTo(5.605, 3);
  });
});
