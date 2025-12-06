/**
 * Unit tests for Battle ID utilities
 */

import { describe, it, expect } from 'vitest';

import {
  parseBattleId,
  validateBattleId,
  getNextBattleId,
  getPreviousBattleId,
  battleIdToDate,
  compareBattleIds,
  sortBattleIdsAscending,
  sortBattleIdsDescending,
} from '../src/utils/battleId.js';
import { generateBattleId } from '../src/utils/date-formatting.js';

describe('battleId utilities', () => {
  describe('generateBattleId', () => {
    it('should generate correct battle ID from date', () => {
      const date = new Date(2025, 0, 15); // January 15, 2025
      expect(generateBattleId(date)).toBe('20250115');
    });

    it('should pad month and day with leading zeros', () => {
      const date = new Date(2025, 0, 5); // January 5, 2025
      expect(generateBattleId(date)).toBe('20250105');
    });

    it('should handle end of year', () => {
      const date = new Date(2024, 11, 31); // December 31, 2024
      expect(generateBattleId(date)).toBe('20241231');
    });

    it('should handle leap year date', () => {
      const date = new Date(2024, 1, 29); // February 29, 2024
      expect(generateBattleId(date)).toBe('20240229');
    });
  });

  describe('parseBattleId', () => {
    it('should parse valid battle ID correctly', () => {
      const result = parseBattleId('20250115');
      expect(result).toEqual(new Date(2025, 0, 15));
    });

    it('should parse battle ID with leading zeros', () => {
      const result = parseBattleId('20250105');
      expect(result).toEqual(new Date(2025, 0, 5));
    });

    it('should throw error for invalid format', () => {
      expect(() => parseBattleId('2025011')).toThrow();
      expect(() => parseBattleId('202501155')).toThrow();
      expect(() => parseBattleId('abcd1234')).toThrow();
    });

    it('should throw error for invalid date', () => {
      expect(() => parseBattleId('20250229')).toThrow(); // 2025 is not a leap year
      expect(() => parseBattleId('20250132')).toThrow(); // January has 31 days max
      expect(() => parseBattleId('20251332')).toThrow(); // Month 13 doesn't exist
    });
  });

  describe('validateBattleId', () => {
    it('should return true for valid battle IDs', () => {
      expect(validateBattleId('20250115')).toBe(true);
      expect(validateBattleId('20240229')).toBe(true); // Leap year
      expect(validateBattleId('20241231')).toBe(true);
    });

    it('should return false for invalid format', () => {
      expect(validateBattleId('2025011')).toBe(false); // Too short
      expect(validateBattleId('202501155')).toBe(false); // Too long
      expect(validateBattleId('abcd1234')).toBe(false); // Not numeric
      expect(validateBattleId('')).toBe(false); // Empty
    });

    it('should return false for invalid dates', () => {
      expect(validateBattleId('20250229')).toBe(false); // Not a leap year
      expect(validateBattleId('20250132')).toBe(false); // January 32nd
      expect(validateBattleId('20251332')).toBe(false); // Month 13
      expect(validateBattleId('20250431')).toBe(false); // April 31st
    });
  });

  describe('getNextBattleId', () => {
    it('should calculate next battle ID (3 days later)', () => {
      expect(getNextBattleId('20250115')).toBe('20250118');
    });

    it('should handle month boundary', () => {
      expect(getNextBattleId('20250129')).toBe('20250201');
    });

    it('should handle year boundary', () => {
      expect(getNextBattleId('20241230')).toBe('20250102');
    });

    it('should handle leap year', () => {
      expect(getNextBattleId('20240227')).toBe('20240301'); // Feb 27 + 3 = Mar 1 in leap year
      expect(getNextBattleId('20250227')).toBe('20250302'); // Feb 27 + 3 = Mar 2 in non-leap year
    });

    it('should throw error for invalid battle ID', () => {
      expect(() => getNextBattleId('invalid')).toThrow();
    });
  });

  describe('getPreviousBattleId', () => {
    it('should calculate previous battle ID (3 days earlier)', () => {
      expect(getPreviousBattleId('20250118')).toBe('20250115');
    });

    it('should handle month boundary', () => {
      expect(getPreviousBattleId('20250201')).toBe('20250129');
    });

    it('should handle year boundary', () => {
      expect(getPreviousBattleId('20250102')).toBe('20241230');
    });

    it('should throw error for invalid battle ID', () => {
      expect(() => getPreviousBattleId('invalid')).toThrow();
    });
  });

  describe('battleIdToDate', () => {
    it('should convert battle ID to Date object', () => {
      const date = battleIdToDate('20250115');
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(0); // January (0-indexed)
      expect(date.getDate()).toBe(15);
    });

    it('should handle leap year date', () => {
      const date = battleIdToDate('20240229');
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(1); // February
      expect(date.getDate()).toBe(29);
    });

    it('should throw error for invalid battle ID', () => {
      expect(() => battleIdToDate('invalid')).toThrow();
    });
  });

  describe('compareBattleIds', () => {
    it('should return negative when first is earlier', () => {
      expect(compareBattleIds('20250115', '20250118')).toBeLessThan(0);
    });

    it('should return positive when first is later', () => {
      expect(compareBattleIds('20250118', '20250115')).toBeGreaterThan(0);
    });

    it('should return zero when equal', () => {
      expect(compareBattleIds('20250115', '20250115')).toBe(0);
    });

    it('should work across year boundaries', () => {
      expect(compareBattleIds('20241231', '20250101')).toBeLessThan(0);
    });
  });

  describe('sortBattleIdsAscending', () => {
    it('should sort battle IDs oldest first', () => {
      const ids = ['20250118', '20250115', '20250121', '20250112'];
      const sorted = sortBattleIdsAscending(ids);
      expect(sorted).toEqual(['20250112', '20250115', '20250118', '20250121']);
    });

    it('should not mutate original array', () => {
      const ids = ['20250118', '20250115'];
      const sorted = sortBattleIdsAscending(ids);
      expect(ids).toEqual(['20250118', '20250115']); // Original unchanged
      expect(sorted).toEqual(['20250115', '20250118']);
    });

    it('should handle empty array', () => {
      expect(sortBattleIdsAscending([])).toEqual([]);
    });

    it('should handle single element', () => {
      expect(sortBattleIdsAscending(['20250115'])).toEqual(['20250115']);
    });
  });

  describe('sortBattleIdsDescending', () => {
    it('should sort battle IDs newest first', () => {
      const ids = ['20250115', '20250118', '20250112', '20250121'];
      const sorted = sortBattleIdsDescending(ids);
      expect(sorted).toEqual(['20250121', '20250118', '20250115', '20250112']);
    });

    it('should not mutate original array', () => {
      const ids = ['20250115', '20250118'];
      const sorted = sortBattleIdsDescending(ids);
      expect(ids).toEqual(['20250115', '20250118']); // Original unchanged
      expect(sorted).toEqual(['20250118', '20250115']);
    });

    it('should handle empty array', () => {
      expect(sortBattleIdsDescending([])).toEqual([]);
    });

    it('should handle single element', () => {
      expect(sortBattleIdsDescending(['20250115'])).toEqual(['20250115']);
    });
  });

  describe('integration tests', () => {
    it('should round-trip: date -> battleId -> date', () => {
      const originalDate = new Date(2025, 0, 15);
      const battleId = generateBattleId(originalDate);
      const reconstructedDate = battleIdToDate(battleId);

      expect(reconstructedDate.getFullYear()).toBe(originalDate.getFullYear());
      expect(reconstructedDate.getMonth()).toBe(originalDate.getMonth());
      expect(reconstructedDate.getDate()).toBe(originalDate.getDate());
    });

    it('should handle battle sequence correctly', () => {
      let battleId = '20250115';

      // Next 3 battles
      battleId = getNextBattleId(battleId); // Jan 18
      expect(battleId).toBe('20250118');

      battleId = getNextBattleId(battleId); // Jan 21
      expect(battleId).toBe('20250121');

      battleId = getNextBattleId(battleId); // Jan 24
      expect(battleId).toBe('20250124');

      // Go back
      battleId = getPreviousBattleId(battleId); // Jan 21
      expect(battleId).toBe('20250121');
    });
  });
});
