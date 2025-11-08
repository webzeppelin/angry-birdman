/**
 * Tests for date formatting utilities
 */

import { describe, expect, it } from 'vitest';

import {
  formatBattleDisplay,
  formatDateISO,
  formatMonthDisplay,
  generateBattleId,
  generateMonthId,
  generateYearId,
  getBattleIdsForMonth,
  getMonthIdFromBattleId,
  getMonthIdsForYear,
  getYearIdFromBattleId,
  getYearIdFromMonthId,
  parseBattleId,
  parseMonthId,
  parseYearId,
  validateBattleId,
  validateMonthId,
  validateYearId,
} from '../src/utils/date-formatting';

describe('Battle ID Generation', () => {
  it('should generate battle ID from date', () => {
    const date = new Date(2025, 10, 8); // November 8, 2025
    expect(generateBattleId(date)).toBe('20251108');
  });

  it('should pad month and day with zeros', () => {
    const date = new Date(2025, 0, 5); // January 5, 2025
    expect(generateBattleId(date)).toBe('20250105');
  });

  it('should handle different years', () => {
    const date1 = new Date(2024, 5, 15); // June 15, 2024
    const date2 = new Date(2026, 11, 31); // December 31, 2026

    expect(generateBattleId(date1)).toBe('20240615');
    expect(generateBattleId(date2)).toBe('20261231');
  });
});

describe('Month ID Generation', () => {
  it('should generate month ID from date', () => {
    const date = new Date(2025, 10, 8); // November 2025
    expect(generateMonthId(date)).toBe('202511');
  });

  it('should pad month with zero', () => {
    const date = new Date(2025, 0, 15); // January 2025
    expect(generateMonthId(date)).toBe('202501');
  });
});

describe('Year ID Generation', () => {
  it('should generate year ID from date', () => {
    const date = new Date(2025, 10, 8);
    expect(generateYearId(date)).toBe('2025');
  });

  it('should handle different years', () => {
    expect(generateYearId(new Date(2024, 0, 1))).toBe('2024');
    expect(generateYearId(new Date(2030, 11, 31))).toBe('2030');
  });
});

describe('Battle ID Parsing', () => {
  it('should parse valid battle ID to date', () => {
    const date = parseBattleId('20251108');

    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(10); // November (0-indexed)
    expect(date.getDate()).toBe(8);
  });

  it('should throw error for invalid length', () => {
    expect(() => parseBattleId('2025110')).toThrow('Invalid battle ID length');
    expect(() => parseBattleId('202511088')).toThrow('Invalid battle ID length');
  });

  it('should throw error for non-numeric characters', () => {
    expect(() => parseBattleId('2025AB08')).toThrow('Invalid battle ID format');
  });

  it('should throw error for invalid dates', () => {
    expect(() => parseBattleId('20251332')).toThrow('Invalid date in battle ID');
    expect(() => parseBattleId('20250230')).toThrow('Invalid date in battle ID'); // Feb 30
  });
});

describe('Month ID Parsing', () => {
  it('should parse valid month ID to date', () => {
    const date = parseMonthId('202511');

    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(10); // November
    expect(date.getDate()).toBe(1); // First day of month
  });

  it('should throw error for invalid length', () => {
    expect(() => parseMonthId('20251')).toThrow('Invalid month ID length');
    expect(() => parseMonthId('2025111')).toThrow('Invalid month ID length');
  });

  it('should throw error for invalid month', () => {
    expect(() => parseMonthId('202513')).toThrow('Invalid month in month ID');
    expect(() => parseMonthId('202500')).toThrow('Invalid month in month ID');
  });
});

describe('Year ID Parsing', () => {
  it('should parse valid year ID to date', () => {
    const date = parseYearId('2025');

    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(0); // January
    expect(date.getDate()).toBe(1); // First day of year
  });

  it('should throw error for invalid length', () => {
    expect(() => parseYearId('202')).toThrow('Invalid year ID length');
    expect(() => parseYearId('20255')).toThrow('Invalid year ID length');
  });

  it('should throw error for non-numeric', () => {
    expect(() => parseYearId('202A')).toThrow();
  });
});

describe('ID Validation', () => {
  it('should validate correct battle IDs', () => {
    expect(validateBattleId('20251108')).toBe(true);
    expect(validateBattleId('20240101')).toBe(true);
    expect(validateBattleId('20261231')).toBe(true);
  });

  it('should invalidate incorrect battle IDs', () => {
    expect(validateBattleId('2025110')).toBe(false); // Too short
    expect(validateBattleId('20251332')).toBe(false); // Invalid month
    expect(validateBattleId('20250230')).toBe(false); // Invalid day
  });

  it('should validate correct month IDs', () => {
    expect(validateMonthId('202511')).toBe(true);
    expect(validateMonthId('202401')).toBe(true);
    expect(validateMonthId('202612')).toBe(true);
  });

  it('should invalidate incorrect month IDs', () => {
    expect(validateMonthId('20251')).toBe(false); // Too short
    expect(validateMonthId('202513')).toBe(false); // Invalid month
  });

  it('should validate correct year IDs', () => {
    expect(validateYearId('2025')).toBe(true);
    expect(validateYearId('2024')).toBe(true);
    expect(validateYearId('2030')).toBe(true);
  });

  it('should invalidate incorrect year IDs', () => {
    expect(validateYearId('202')).toBe(false); // Too short
    expect(validateYearId('20255')).toBe(false); // Too long
  });
});

describe('Date Range Helpers', () => {
  it('should get all battle IDs for a month', () => {
    const battleIds = getBattleIdsForMonth('202511'); // November 2025
    expect(battleIds.length).toBe(30); // November has 30 days
    expect(battleIds[0]).toBe('20251101');
    expect(battleIds[29]).toBe('20251130');
  });

  it('should handle February in leap year', () => {
    const battleIds = getBattleIdsForMonth('202402'); // February 2024 (leap year)
    expect(battleIds.length).toBe(29);
    expect(battleIds[28]).toBe('20240229');
  });

  it('should handle February in non-leap year', () => {
    const battleIds = getBattleIdsForMonth('202502'); // February 2025 (non-leap)
    expect(battleIds.length).toBe(28);
    expect(battleIds[27]).toBe('20250228');
  });

  it('should get all month IDs for a year', () => {
    const monthIds = getMonthIdsForYear('2025');
    expect(monthIds.length).toBe(12);
    expect(monthIds[0]).toBe('202501');
    expect(monthIds[11]).toBe('202512');
  });
});

describe('ID Extraction', () => {
  it('should extract month ID from battle ID', () => {
    expect(getMonthIdFromBattleId('20251108')).toBe('202511');
    expect(getMonthIdFromBattleId('20240105')).toBe('202401');
  });

  it('should extract year ID from battle ID', () => {
    expect(getYearIdFromBattleId('20251108')).toBe('2025');
    expect(getYearIdFromBattleId('20240105')).toBe('2024');
  });

  it('should extract year ID from month ID', () => {
    expect(getYearIdFromMonthId('202511')).toBe('2025');
    expect(getYearIdFromMonthId('202401')).toBe('2024');
  });

  it('should throw error for invalid IDs', () => {
    expect(() => getMonthIdFromBattleId('2025110')).toThrow('Invalid battle ID');
    expect(() => getYearIdFromMonthId('20251')).toThrow('Invalid month ID');
  });
});

describe('Date Formatting for Display', () => {
  it('should format date as ISO string', () => {
    const date = new Date(2025, 10, 8);
    expect(formatDateISO(date)).toBe('2025-11-08');
  });

  it('should format month for display (en-US)', () => {
    const formatted = formatMonthDisplay('202511', 'en-US');
    expect(formatted).toBe('November 2025');
  });

  it('should format battle date for display (en-US)', () => {
    const formatted = formatBattleDisplay('20251108', 'en-US');
    expect(formatted).toBe('November 8, 2025');
  });

  it('should pad single-digit dates in ISO format', () => {
    const date = new Date(2025, 0, 5); // January 5
    expect(formatDateISO(date)).toBe('2025-01-05');
  });
});

describe('Round-Trip Conversion', () => {
  it('should convert date to battle ID and back', () => {
    const originalDate = new Date(2025, 10, 8);
    const battleId = generateBattleId(originalDate);
    const parsedDate = parseBattleId(battleId);

    expect(parsedDate.getFullYear()).toBe(originalDate.getFullYear());
    expect(parsedDate.getMonth()).toBe(originalDate.getMonth());
    expect(parsedDate.getDate()).toBe(originalDate.getDate());
  });

  it('should convert date to month ID and back', () => {
    const originalDate = new Date(2025, 10, 8);
    const monthId = generateMonthId(originalDate);
    const parsedDate = parseMonthId(monthId);

    expect(parsedDate.getFullYear()).toBe(originalDate.getFullYear());
    expect(parsedDate.getMonth()).toBe(originalDate.getMonth());
  });

  it('should convert date to year ID and back', () => {
    const originalDate = new Date(2025, 10, 8);
    const yearId = generateYearId(originalDate);
    const parsedDate = parseYearId(yearId);

    expect(parsedDate.getFullYear()).toBe(originalDate.getFullYear());
  });
});
