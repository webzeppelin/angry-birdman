/**
 * Tests for calculation utilities
 */

import { describe, expect, it } from 'vitest';

import { BATTLE_RESULTS } from '../src/constants';
import {
  calculateAverage,
  calculateAverageRatio,
  calculateBattleResult,
  calculateClanRatio,
  calculateCount,
  calculateFpMargin,
  calculateMarginRatio,
  calculateNonplayingCount,
  calculateNonplayingFp,
  calculateNonplayingFpRatio,
  calculatePlayerRatio,
  calculatePlayerRatioRanks,
  calculateProjectedScore,
  calculateRatioRanks,
  calculateReserveCount,
  calculateReserveFp,
  calculateReserveFpRatio,
  calculateSum,
  calculateTotalFp,
  roundToDecimals,
  validateNonNegative,
  validatePositive,
} from '../src/utils/calculations';

describe('Battle Result Calculations', () => {
  it('should return WIN when score > opponentScore', () => {
    expect(calculateBattleResult(1000, 900)).toBe(BATTLE_RESULTS.WIN);
    expect(calculateBattleResult(500, 100)).toBe(BATTLE_RESULTS.WIN);
  });

  it('should return LOSS when score < opponentScore', () => {
    expect(calculateBattleResult(900, 1000)).toBe(BATTLE_RESULTS.LOSS);
    expect(calculateBattleResult(100, 500)).toBe(BATTLE_RESULTS.LOSS);
  });

  it('should return TIE when scores are equal', () => {
    expect(calculateBattleResult(1000, 1000)).toBe(BATTLE_RESULTS.TIE);
    expect(calculateBattleResult(0, 0)).toBe(BATTLE_RESULTS.TIE);
  });
});

describe('Ratio Calculations', () => {
  it('should calculate clan ratio correctly', () => {
    // Example from spec: score / baselineFp * 1000
    expect(calculateClanRatio(100000, 10000)).toBe(10000);
    expect(calculateClanRatio(50000, 5000)).toBe(10000);
    expect(calculateClanRatio(75000, 10000)).toBe(7500);
  });

  it('should calculate average ratio correctly', () => {
    // Example: score / fp * 1000
    expect(calculateAverageRatio(100000, 10000)).toBe(10000);
    expect(calculateAverageRatio(50000, 5000)).toBe(10000);
  });

  it('should calculate player ratio correctly', () => {
    // Player ratio: score / fp * 1000
    expect(calculatePlayerRatio(1000, 100)).toBe(10000);
    expect(calculatePlayerRatio(500, 50)).toBe(10000);
    expect(calculatePlayerRatio(750, 100)).toBe(7500);
  });

  it('should throw error when dividing by zero', () => {
    expect(() => calculateClanRatio(1000, 0)).toThrow('baselineFp cannot be zero');
    expect(() => calculateAverageRatio(1000, 0)).toThrow('fp cannot be zero');
    expect(() => calculatePlayerRatio(1000, 0)).toThrow('fp cannot be zero');
  });

  it('should handle decimal results', () => {
    // 100000 / 9999 * 1000 = 10001.00...
    const result = calculateClanRatio(100000, 9999);
    expect(result).toBeCloseTo(10001, 2);
  });
});

describe('Projected Score Calculation', () => {
  it('should calculate projected score correctly', () => {
    // Formula: (1 + nonplayingFpRatio/100) * score
    // If 20% didn't play, projected score is score * 1.2
    expect(calculateProjectedScore(100000, 20)).toBe(120000);
    expect(calculateProjectedScore(50000, 10)).toBeCloseTo(55000, 5); // Use toBeCloseTo for floating point
    expect(calculateProjectedScore(100000, 0)).toBe(100000);
  });

  it('should handle fractional percentages', () => {
    const result = calculateProjectedScore(100000, 15.5);
    expect(result).toBe(115500);
  });
});

describe('Margin Calculations', () => {
  it('should calculate margin ratio correctly', () => {
    // Formula: ((score - opponentScore) / score) * 100
    // We scored 100000, opponent scored 90000: 10% margin
    expect(calculateMarginRatio(100000, 90000)).toBe(10);

    // We scored 100000, opponent scored 110000: -10% margin (we lost)
    expect(calculateMarginRatio(100000, 110000)).toBe(-10);

    // Tie
    expect(calculateMarginRatio(100000, 100000)).toBe(0);
  });

  it('should calculate FP margin correctly', () => {
    // Formula: ((baselineFp - opponentFp) / baselineFp) * 100
    // We have 10000 FP, opponent has 9000 FP: 10% advantage
    expect(calculateFpMargin(10000, 9000)).toBe(10);

    // We have 10000 FP, opponent has 11000 FP: -10% disadvantage
    expect(calculateFpMargin(10000, 11000)).toBe(-10);

    // Equal FP
    expect(calculateFpMargin(10000, 10000)).toBe(0);
  });

  it('should throw error when score is zero', () => {
    expect(() => calculateMarginRatio(0, 1000)).toThrow('score cannot be zero');
  });

  it('should throw error when baselineFp is zero', () => {
    expect(() => calculateFpMargin(0, 1000)).toThrow('baselineFp cannot be zero');
  });
});

describe('Non-Playing FP Ratio Calculations', () => {
  it('should calculate nonplaying FP ratio correctly', () => {
    // Formula: (nonplayingFp / fp) * 100
    // 2000 FP didn't play out of 10000 total: 20%
    expect(calculateNonplayingFpRatio(2000, 10000)).toBe(20);
    expect(calculateNonplayingFpRatio(1000, 10000)).toBe(10);
    expect(calculateNonplayingFpRatio(0, 10000)).toBe(0);
  });

  it('should return 0 when fp is 0', () => {
    expect(calculateNonplayingFpRatio(1000, 0)).toBe(0);
  });

  it('should calculate reserve FP ratio correctly', () => {
    // Formula: (reserveFp / (fp + reserveFp)) * 100
    // 2000 FP in reserve, 10000 FP active: 2000/12000 = 16.67%
    expect(calculateReserveFpRatio(2000, 10000)).toBeCloseTo(16.67, 2);
    expect(calculateReserveFpRatio(0, 10000)).toBe(0);
  });

  it('should return 0 when total FP is 0', () => {
    expect(calculateReserveFpRatio(0, 0)).toBe(0);
  });
});

describe('Ratio Ranking', () => {
  it('should rank players by ratio (highest first)', () => {
    const ratios = [80, 100, 90, 85, 95];
    const ranks = calculateRatioRanks(ratios);

    // Ratios: [80, 100, 90, 85, 95]
    // Sorted: [100, 95, 90, 85, 80]
    // Ranks:  [5, 1, 3, 4, 2]
    expect(ranks).toEqual([5, 1, 3, 4, 2]);
  });

  it('should handle single player', () => {
    const ratios = [100];
    const ranks = calculateRatioRanks(ratios);
    expect(ranks).toEqual([1]);
  });

  it('should handle identical ratios', () => {
    const ratios = [100, 100, 100];
    const ranks = calculateRatioRanks(ratios);
    // All get different ranks based on their order (stable sort behavior)
    expect(ranks).toEqual([1, 2, 3]); // First occurrence gets rank 1, etc.
  });

  it('should handle empty array', () => {
    const ratios: number[] = [];
    const ranks = calculateRatioRanks(ratios);
    expect(ranks).toEqual([]);
  });
});

describe('Aggregation Calculations', () => {
  it('should calculate average correctly', () => {
    expect(calculateAverage([10, 20, 30])).toBe(20);
    expect(calculateAverage([5])).toBe(5);
    expect(calculateAverage([1, 2, 3, 4, 5])).toBe(3);
  });

  it('should throw error for empty array', () => {
    expect(() => calculateAverage([])).toThrow('Cannot calculate average of empty array');
  });

  it('should calculate sum correctly', () => {
    expect(calculateSum([10, 20, 30])).toBe(60);
    expect(calculateSum([5])).toBe(5);
    expect(calculateSum([])).toBe(0);
    expect(calculateSum([-10, 10])).toBe(0);
  });

  it('should calculate count with predicate correctly', () => {
    const numbers = [1, 2, 3, 4, 5];

    expect(calculateCount(numbers, (n) => n > 3)).toBe(2);
    expect(calculateCount(numbers, (n) => n % 2 === 0)).toBe(2);
    expect(calculateCount(numbers, (n) => n < 0)).toBe(0);
  });
});

describe('Validation Helpers', () => {
  it('should validate positive numbers', () => {
    expect(() => validatePositive(10, 'value')).not.toThrow();
    expect(() => validatePositive(0.1, 'value')).not.toThrow();
  });

  it('should throw error for non-positive numbers', () => {
    expect(() => validatePositive(0, 'value')).toThrow('value must be positive, got 0');
    expect(() => validatePositive(-5, 'value')).toThrow('value must be positive, got -5');
  });

  it('should validate non-negative numbers', () => {
    expect(() => validateNonNegative(10, 'value')).not.toThrow();
    expect(() => validateNonNegative(0, 'value')).not.toThrow();
  });

  it('should throw error for negative numbers', () => {
    expect(() => validateNonNegative(-1, 'value')).toThrow('value must be non-negative, got -1');
  });
});

describe('Rounding Utilities', () => {
  it('should round to specified decimal places', () => {
    expect(roundToDecimals(3.14159, 2)).toBe(3.14);
    expect(roundToDecimals(3.14159, 4)).toBe(3.1416);
    expect(roundToDecimals(10.555, 2)).toBe(10.56);
    expect(roundToDecimals(10, 2)).toBe(10);
  });

  it('should handle negative numbers', () => {
    expect(roundToDecimals(-3.14159, 2)).toBe(-3.14);
  });

  it('should handle zero decimal places', () => {
    expect(roundToDecimals(3.7, 0)).toBe(4);
    expect(roundToDecimals(3.4, 0)).toBe(3);
  });
});

describe('Player Performance Helper Functions', () => {
  it('should calculate total FP from player and nonplayer stats', () => {
    const playerStats = [{ fp: 500 }, { fp: 600 }, { fp: 550 }];
    const nonplayerStats = [
      { fp: 200, reserve: false },
      { fp: 150, reserve: false },
      { fp: 100, reserve: true }, // Should be excluded
    ];

    const totalFp = calculateTotalFp(playerStats, nonplayerStats);

    // 500 + 600 + 550 + 200 + 150 = 2000 (reserve 100 excluded)
    expect(totalFp).toBe(2000);
  });

  it('should handle empty arrays in total FP calculation', () => {
    expect(calculateTotalFp([], [])).toBe(0);
    expect(calculateTotalFp([{ fp: 500 }], [])).toBe(500);
    expect(calculateTotalFp([], [{ fp: 200, reserve: false }])).toBe(200);
  });

  it('should calculate nonplaying count excluding reserves', () => {
    const nonplayerStats = [
      { reserve: false },
      { reserve: false },
      { reserve: true },
      { reserve: false },
      { reserve: true },
    ];

    const count = calculateNonplayingCount(nonplayerStats);

    expect(count).toBe(3); // Only non-reserve nonplayers
  });

  it('should calculate reserve count', () => {
    const nonplayerStats = [
      { reserve: false },
      { reserve: false },
      { reserve: true },
      { reserve: false },
      { reserve: true },
    ];

    const count = calculateReserveCount(nonplayerStats);

    expect(count).toBe(2); // Only reserve players
  });

  it('should calculate nonplaying FP excluding reserves', () => {
    const nonplayerStats = [
      { fp: 200, reserve: false },
      { fp: 150, reserve: false },
      { fp: 100, reserve: true },
      { fp: 180, reserve: false },
      { fp: 120, reserve: true },
    ];

    const nonplayingFp = calculateNonplayingFp(nonplayerStats);

    expect(nonplayingFp).toBe(530); // 200 + 150 + 180 (reserves excluded)
  });

  it('should calculate reserve FP', () => {
    const nonplayerStats = [
      { fp: 200, reserve: false },
      { fp: 150, reserve: false },
      { fp: 100, reserve: true },
      { fp: 180, reserve: false },
      { fp: 120, reserve: true },
    ];

    const reserveFp = calculateReserveFp(nonplayerStats);

    expect(reserveFp).toBe(220); // 100 + 120
  });

  it('should handle empty nonplayer arrays', () => {
    expect(calculateNonplayingCount([])).toBe(0);
    expect(calculateReserveCount([])).toBe(0);
    expect(calculateNonplayingFp([])).toBe(0);
    expect(calculateReserveFp([])).toBe(0);
  });

  it('should handle all reserves in nonplayer stats', () => {
    const allReserves = [
      { fp: 100, reserve: true },
      { fp: 120, reserve: true },
      { fp: 110, reserve: true },
    ];

    expect(calculateNonplayingCount(allReserves)).toBe(0);
    expect(calculateNonplayingFp(allReserves)).toBe(0);
    expect(calculateReserveCount(allReserves)).toBe(3);
    expect(calculateReserveFp(allReserves)).toBe(330);
  });

  it('should handle all non-reserves in nonplayer stats', () => {
    const allNonReserves = [
      { fp: 100, reserve: false },
      { fp: 120, reserve: false },
      { fp: 110, reserve: false },
    ];

    expect(calculateNonplayingCount(allNonReserves)).toBe(3);
    expect(calculateNonplayingFp(allNonReserves)).toBe(330);
    expect(calculateReserveCount(allNonReserves)).toBe(0);
    expect(calculateReserveFp(allNonReserves)).toBe(0);
  });
});

describe('Player Ratio Ranking with Objects', () => {
  it('should calculate ratio ranks for player stats objects', () => {
    const playerStats = [
      { playerId: 1, score: 5000, fp: 500, ratio: 10000, rank: 1 },
      { playerId: 2, score: 4500, fp: 500, ratio: 9000, rank: 2 },
      { playerId: 3, score: 5500, fp: 500, ratio: 11000, rank: 3 },
      { playerId: 4, score: 4800, fp: 500, ratio: 9600, rank: 4 },
    ];

    const withRatioRanks = calculatePlayerRatioRanks(playerStats);

    // Sorted by ratio: [11000, 10000, 9600, 9000]
    // Ratio ranks: [3, 1, 4, 2] -> [playerId 3, 1, 4, 2]
    expect(withRatioRanks[0]!.ratioRank).toBe(2); // Player 1: ratio 10000
    expect(withRatioRanks[1]!.ratioRank).toBe(4); // Player 2: ratio 9000
    expect(withRatioRanks[2]!.ratioRank).toBe(1); // Player 3: ratio 11000
    expect(withRatioRanks[3]!.ratioRank).toBe(3); // Player 4: ratio 9600
  });

  it('should preserve original player stats fields', () => {
    const playerStats = [
      { playerId: 1, score: 5000, fp: 500, ratio: 10000, rank: 1 },
      { playerId: 2, score: 4500, fp: 500, ratio: 9000, rank: 2 },
    ];

    const withRatioRanks = calculatePlayerRatioRanks(playerStats);

    expect(withRatioRanks[0]).toMatchObject({
      playerId: 1,
      score: 5000,
      fp: 500,
      ratio: 10000,
      rank: 1,
    });

    expect(withRatioRanks[1]).toMatchObject({
      playerId: 2,
      score: 4500,
      fp: 500,
      ratio: 9000,
      rank: 2,
    });
  });

  it('should handle single player in ratio rank calculation', () => {
    const playerStats = [{ playerId: 1, score: 5000, fp: 500, ratio: 10000, rank: 1 }];

    const withRatioRanks = calculatePlayerRatioRanks(playerStats);

    expect(withRatioRanks.length).toBe(1);
    expect(withRatioRanks[0]!.ratioRank).toBe(1);
  });

  it('should handle empty array in ratio rank calculation', () => {
    const withRatioRanks = calculatePlayerRatioRanks([]);

    expect(withRatioRanks.length).toBe(0);
  });
});

describe('Integration Tests - Full Battle Calculation', () => {
  it('should calculate all battle metrics correctly', () => {
    // Sample battle data
    const clanScore = 100000;
    const opponentScore = 90000;
    const baselineFp = 10000;
    const opponentFp = 9500;
    const totalFp = 10000; // Sum of all player FPs
    const nonplayingFp = 2000;
    const reserveFp = 500;

    // Calculate all metrics
    const result = calculateBattleResult(clanScore, opponentScore);
    const clanRatio = calculateClanRatio(clanScore, baselineFp);
    const averageRatio = calculateAverageRatio(clanScore, totalFp);
    const marginRatio = calculateMarginRatio(clanScore, opponentScore);
    const fpMargin = calculateFpMargin(baselineFp, opponentFp);
    const nonplayingFpRatio = calculateNonplayingFpRatio(nonplayingFp, totalFp);
    const reserveFpRatio = calculateReserveFpRatio(reserveFp, totalFp);
    const projectedScore = calculateProjectedScore(clanScore, nonplayingFpRatio);

    // Verify results
    expect(result).toBe(BATTLE_RESULTS.WIN);
    expect(clanRatio).toBe(10000);
    expect(averageRatio).toBe(10000);
    expect(marginRatio).toBe(10); // Won by 10%
    expect(fpMargin).toBe(5); // FP advantage of 5% (10000 - 9500 = 500, 500/10000 = 0.05 = 5%)
    expect(nonplayingFpRatio).toBe(20); // 20% didn't play
    expect(reserveFpRatio).toBeCloseTo(4.76, 2); // ~4.76% in reserve
    expect(projectedScore).toBe(120000); // Would have scored 120k if all played
  });

  it('should calculate complete battle with player and nonplayer stats', () => {
    // Battle metadata
    const clanScore = 100000;
    const opponentScore = 95000;
    const baselineFp = 10000;

    // Player stats
    const playerStats = [
      { playerId: 1, score: 6000, fp: 600, ratio: 10000, rank: 1 },
      { playerId: 2, score: 5500, fp: 550, ratio: 10000, rank: 2 },
      { playerId: 3, score: 5000, fp: 500, ratio: 10000, rank: 3 },
    ];

    // Nonplayer stats
    const nonplayerStats = [
      { fp: 200, reserve: false },
      { fp: 150, reserve: false },
      { fp: 100, reserve: true },
    ];

    // Calculate metrics
    const result = calculateBattleResult(clanScore, opponentScore);
    const totalFp = calculateTotalFp(playerStats, nonplayerStats);
    const nonplayingFp = calculateNonplayingFp(nonplayerStats);
    const reserveFp = calculateReserveFp(nonplayerStats);
    const clanRatio = calculateClanRatio(clanScore, baselineFp);
    const averageRatio = calculateAverageRatio(clanScore, totalFp);
    const nonplayingFpRatio = calculateNonplayingFpRatio(nonplayingFp, totalFp);
    const reserveFpRatio = calculateReserveFpRatio(reserveFp, totalFp);
    const playersWithRatioRank = calculatePlayerRatioRanks(playerStats);

    // Verify calculations
    expect(result).toBe(BATTLE_RESULTS.WIN);
    expect(totalFp).toBe(2000); // 600 + 550 + 500 + 200 + 150
    expect(nonplayingFp).toBe(350); // 200 + 150
    expect(reserveFp).toBe(100);
    expect(clanRatio).toBe(10000); // 100000 / 10000 * 1000
    expect(averageRatio).toBe(50000); // 100000 / 2000 * 1000
    expect(nonplayingFpRatio).toBe(17.5); // 350 / 2000 * 100
    expect(reserveFpRatio).toBeCloseTo(4.76, 2); // 100 / 2100 * 100
    expect(playersWithRatioRank.length).toBe(3);
    expect(playersWithRatioRank.every((p) => 'ratioRank' in p)).toBe(true);
  });
});
