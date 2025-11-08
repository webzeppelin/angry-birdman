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
  calculateNonplayingFpRatio,
  calculatePlayerRatio,
  calculateProjectedScore,
  calculateRatioRanks,
  calculateReserveFpRatio,
  calculateSum,
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
    // Example from spec: score / baselineFp * 10
    expect(calculateClanRatio(100000, 10000)).toBe(100);
    expect(calculateClanRatio(50000, 5000)).toBe(100);
    expect(calculateClanRatio(75000, 10000)).toBe(75);
  });

  it('should calculate average ratio correctly', () => {
    // Example: score / fp * 10
    expect(calculateAverageRatio(100000, 10000)).toBe(100);
    expect(calculateAverageRatio(50000, 5000)).toBe(100);
  });

  it('should calculate player ratio correctly', () => {
    // Player ratio: score / fp * 10
    expect(calculatePlayerRatio(1000, 100)).toBe(100);
    expect(calculatePlayerRatio(500, 50)).toBe(100);
    expect(calculatePlayerRatio(750, 100)).toBe(75);
  });

  it('should throw error when dividing by zero', () => {
    expect(() => calculateClanRatio(1000, 0)).toThrow('baselineFp cannot be zero');
    expect(() => calculateAverageRatio(1000, 0)).toThrow('fp cannot be zero');
    expect(() => calculatePlayerRatio(1000, 0)).toThrow('fp cannot be zero');
  });

  it('should handle decimal results', () => {
    // 100000 / 9999 * 10 = 100.01...
    const result = calculateClanRatio(100000, 9999);
    expect(result).toBeCloseTo(100.01, 2);
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
    expect(clanRatio).toBe(100);
    expect(averageRatio).toBe(100);
    expect(marginRatio).toBe(10); // Won by 10%
    expect(fpMargin).toBe(5); // FP advantage of 5% (10000 - 9500 = 500, 500/10000 = 0.05 = 5%)
    expect(nonplayingFpRatio).toBe(20); // 20% didn't play
    expect(reserveFpRatio).toBeCloseTo(4.76, 2); // ~4.76% in reserve
    expect(projectedScore).toBe(120000); // Would have scored 120k if all played
  });
});
