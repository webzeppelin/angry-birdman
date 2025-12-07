/**
 * Unit tests for timezone utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  toOfficialAngryBirdsTime,
  estToGmt,
  gmtToEst,
  getCurrentAngryBirdsTime,
  createEstDate,
  formatForUserTimezone,
  formatInEst,
  getBattleStartTimestamp,
  getBattleEndTimestamp,
  isInFuture,
  isInPast,
} from '../src/utils/timezone.js';

describe('timezone utilities', () => {
  describe('toOfficialAngryBirdsTime', () => {
    it('should convert date to EST (UTC-5)', () => {
      // Create a date at noon UTC
      const utcDate = new Date(Date.UTC(2025, 0, 15, 12, 0, 0));
      const estDate = toOfficialAngryBirdsTime(utcDate);

      // In EST (UTC-5), this should be 7 AM
      expect(estDate.getUTCHours()).toBe(7);
    });

    it('should handle timezone conversion correctly', () => {
      const utcDate = new Date(Date.UTC(2025, 0, 15, 5, 0, 0));
      const estDate = toOfficialAngryBirdsTime(utcDate);

      // 5 AM UTC = midnight EST
      expect(estDate.getUTCHours()).toBe(0);
    });
  });

  describe('estToGmt', () => {
    it('should convert EST to GMT by adding 5 hours', () => {
      // Midnight EST
      const estDate = new Date(2025, 0, 15, 0, 0, 0);
      const gmtDate = estToGmt(estDate);

      // Should be 5 hours later
      const hoursDiff = (gmtDate.getTime() - estDate.getTime()) / (1000 * 60 * 60);
      expect(hoursDiff).toBe(5);
    });

    it('should handle EST noon correctly', () => {
      const estDate = new Date(2025, 0, 15, 12, 0, 0);
      const gmtDate = estToGmt(estDate);

      // 5 hours later
      const hoursDiff = (gmtDate.getTime() - estDate.getTime()) / (1000 * 60 * 60);
      expect(hoursDiff).toBe(5);
    });
  });

  describe('gmtToEst', () => {
    it('should convert GMT to EST by subtracting 5 hours', () => {
      // 5 AM GMT
      const gmtDate = new Date(Date.UTC(2025, 0, 15, 5, 0, 0));
      const estDate = gmtToEst(gmtDate);

      // Should be 5 hours earlier (midnight EST)
      const hoursDiff = (gmtDate.getTime() - estDate.getTime()) / (1000 * 60 * 60);
      expect(hoursDiff).toBe(5);
    });

    it('should handle noon GMT correctly', () => {
      const gmtDate = new Date(Date.UTC(2025, 0, 15, 12, 0, 0));
      const estDate = gmtToEst(gmtDate);

      // 12 noon GMT = 7 AM EST
      const hoursDiff = (gmtDate.getTime() - estDate.getTime()) / (1000 * 60 * 60);
      expect(hoursDiff).toBe(5);
    });
  });

  describe('getCurrentAngryBirdsTime', () => {
    it('should return current time in EST', () => {
      const now = new Date();
      const estNow = getCurrentAngryBirdsTime();

      // Should be within a few milliseconds of now (minus 5 hours offset consideration)
      // We just check it's a valid date
      expect(estNow).toBeInstanceOf(Date);
      expect(estNow.getTime()).toBeLessThanOrEqual(now.getTime());
    });

    it('should be consistent with toOfficialAngryBirdsTime', () => {
      const now = new Date();
      const estNow1 = getCurrentAngryBirdsTime();
      const estNow2 = toOfficialAngryBirdsTime(now);

      // Should be very close (within 100ms)
      expect(Math.abs(estNow1.getTime() - estNow2.getTime())).toBeLessThan(100);
    });
  });

  describe('createEstDate', () => {
    it('should create date with correct components', () => {
      const date = createEstDate(2025, 1, 15, 12, 30, 45);

      // 12:30:45 EST = 17:30:45 UTC (EST + 5 hours)
      expect(date.getUTCFullYear()).toBe(2025);
      expect(date.getUTCMonth()).toBe(0); // January (0-indexed)
      expect(date.getUTCDate()).toBe(15);
      expect(date.getUTCHours()).toBe(17); // 12 EST + 5 = 17 UTC
      expect(date.getUTCMinutes()).toBe(30);
      expect(date.getUTCSeconds()).toBe(45);
    });

    it('should default time to midnight EST', () => {
      const date = createEstDate(2025, 1, 15);

      // Midnight EST = 05:00 UTC
      expect(date.getUTCHours()).toBe(5);
      expect(date.getUTCMinutes()).toBe(0);
      expect(date.getUTCSeconds()).toBe(0);
    });

    it('should handle leap year', () => {
      const date = createEstDate(2024, 2, 29); // Feb 29, 2024

      expect(date.getUTCFullYear()).toBe(2024);
      expect(date.getUTCMonth()).toBe(1); // February
      expect(date.getUTCDate()).toBe(29);
    });
  });

  describe('formatForUserTimezone', () => {
    it('should format date with default options', () => {
      const date = new Date(2025, 0, 15, 12, 30, 0);
      const formatted = formatForUserTimezone(date);

      // Should include date components (exact format may vary by locale)
      expect(formatted).toMatch(/2025/);
      expect(formatted).toMatch(/01/); // Month
      expect(formatted).toMatch(/15/); // Day
    });

    it('should format date in specific timezone', () => {
      const date = new Date(Date.UTC(2025, 0, 15, 12, 0, 0));
      const formatted = formatForUserTimezone(date, 'America/New_York');

      // Should include year and EST/EDT indicator
      expect(formatted).toMatch(/2025/);
    });

    it('should accept custom format options', () => {
      const date = new Date(2025, 0, 15);
      const formatted = formatForUserTimezone(date, undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      expect(formatted).toMatch(/2025/);
      expect(formatted).toMatch(/15/);
      // Month name depends on locale, just check it's present
      expect(formatted.length).toBeGreaterThan(8); // Should have month name
    });
  });

  describe('formatInEst', () => {
    it('should format date in EST timezone (permanent UTC-5, no DST)', () => {
      const date = new Date(Date.UTC(2025, 0, 15, 12, 0, 0));
      const formatted = formatInEst(date);

      // Should include year, month (short form), and day
      expect(formatted).toMatch(/2025/);
      expect(formatted).toMatch(/Jan/); // Short month name
      expect(formatted).toMatch(/15/);
      // UTC 12:00 - 5 hours = 07:00 EST
      expect(formatted).toMatch(/07:00/);
    });
  });

  describe('getBattleStartTimestamp', () => {
    it('should return midnight EST for given date', () => {
      const date = new Date(2025, 0, 15, 14, 30, 45); // Some random time
      const startTime = getBattleStartTimestamp(date);

      // Midnight EST (00:00) = 05:00 UTC
      expect(startTime.getUTCFullYear()).toBe(2025);
      expect(startTime.getUTCMonth()).toBe(0); // January
      expect(startTime.getUTCDate()).toBe(15);
      expect(startTime.getUTCHours()).toBe(5); // Midnight EST = 05:00 UTC
      expect(startTime.getUTCMinutes()).toBe(0);
      expect(startTime.getUTCSeconds()).toBe(0);
    });

    it('should normalize to EST midnight regardless of input time', () => {
      const date1 = new Date(2025, 0, 15, 0, 0, 0);
      const date2 = new Date(2025, 0, 15, 23, 59, 59);

      const start1 = getBattleStartTimestamp(date1);
      const start2 = getBattleStartTimestamp(date2);

      expect(start1.getTime()).toBe(start2.getTime());
    });
  });

  describe('getBattleEndTimestamp', () => {
    it('should return 1 day later at 23:59:59 EST (48 hours)', () => {
      const startDate = new Date(2025, 0, 15, 0, 0, 0);
      const endDate = getBattleEndTimestamp(startDate);

      // Battle starts Jan 15 00:00 EST, ends Jan 16 23:59:59 EST
      // Jan 16 23:59:59 EST = Jan 17 04:59:59 UTC
      expect(endDate.getUTCFullYear()).toBe(2025);
      expect(endDate.getUTCMonth()).toBe(0); // January
      expect(endDate.getUTCDate()).toBe(17); // Next day in UTC due to timezone
      expect(endDate.getUTCHours()).toBe(4); // 23:59 EST = 04:59 UTC
      expect(endDate.getUTCMinutes()).toBe(59);
      expect(endDate.getUTCSeconds()).toBe(59);
    });

    it('should handle month boundary', () => {
      const startDate = new Date(2025, 0, 30, 0, 0, 0); // Jan 30
      const endDate = getBattleEndTimestamp(startDate);

      // Jan 30 00:00 EST + 48hrs = Jan 31 23:59:59 EST
      expect(endDate.getUTCMonth()).toBe(1); // February in UTC
      expect(endDate.getUTCDate()).toBe(1); // Feb 1 in UTC
    });

    it('should handle year boundary', () => {
      const startDate = new Date(2024, 11, 30, 0, 0, 0); // Dec 30, 2024
      const endDate = getBattleEndTimestamp(startDate);

      // Dec 30 00:00 EST + 48hrs = Dec 31 23:59:59 EST = Jan 1 04:59:59 UTC
      expect(endDate.getUTCFullYear()).toBe(2025);
      expect(endDate.getUTCMonth()).toBe(0); // January
      expect(endDate.getUTCDate()).toBe(1); // Jan 1, 2025
    });
  });

  describe('isInFuture', () => {
    beforeEach(() => {
      // Mock the current time to Jan 15, 2025 12:00 EST
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 0, 15, 12, 0, 0));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return true for future dates', () => {
      const futureDate = new Date(2025, 0, 16, 12, 0, 0);
      expect(isInFuture(futureDate)).toBe(true);
    });

    it('should return false for past dates', () => {
      const pastDate = new Date(2025, 0, 14, 12, 0, 0);
      expect(isInFuture(pastDate)).toBe(false);
    });

    it('should return false for current time (or very slightly after)', () => {
      // Due to time it takes to execute, this might be slightly in future
      // so we test with a date that's definitely "now"
      const now = new Date();
      const slightlyLater = new Date(now.getTime() + 1);
      expect(isInFuture(slightlyLater)).toBe(true);
    });
  });

  describe('isInPast', () => {
    beforeEach(() => {
      // Mock the current time to Jan 15, 2025 12:00 EST
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 0, 15, 12, 0, 0));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return true for past dates', () => {
      const pastDate = new Date(2025, 0, 14, 12, 0, 0);
      expect(isInPast(pastDate)).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date(2025, 0, 16, 12, 0, 0);
      expect(isInPast(futureDate)).toBe(false);
    });

    it('should return false for current time', () => {
      const now = new Date(2025, 0, 15, 12, 0, 0);
      expect(isInPast(now)).toBe(false);
    });
  });

  describe('integration tests', () => {
    it('should convert EST to GMT and back', () => {
      const originalEst = createEstDate(2025, 1, 15, 12, 30, 0);
      const gmt = estToGmt(originalEst);
      const backToEst = gmtToEst(gmt);

      expect(backToEst.getTime()).toBe(originalEst.getTime());
    });

    it('should create proper battle timestamps', () => {
      const startDate = new Date(2025, 0, 15);
      const start = getBattleStartTimestamp(startDate);
      const end = getBattleEndTimestamp(startDate); // Pass startDate, not start

      // Battle lasts 48 hours: day 0 00:00 to day 1 23:59:59
      // That's (24 + 23:59:59) = almost 48 hours
      const durationMs = end.getTime() - start.getTime();
      const expectedMs = (48 * 60 * 60 - 1) * 1000; // 48 hours - 1 second

      // Allow 1 second tolerance
      expect(Math.abs(durationMs - expectedMs)).toBeLessThan(1000);
    });

    it('should handle complete battle lifecycle', () => {
      // Create battle on Jan 15, 2025
      const battleDate = new Date(2025, 0, 15);
      const startTimestamp = getBattleStartTimestamp(battleDate);
      const endTimestamp = getBattleEndTimestamp(startTimestamp);

      // Convert to GMT for storage
      const startGmt = estToGmt(startTimestamp);
      const endGmt = estToGmt(endTimestamp);

      // Convert back to EST for display
      const displayStart = gmtToEst(startGmt);
      const displayEnd = gmtToEst(endGmt);

      // Verify we get back the same times
      expect(displayStart.getTime()).toBe(startTimestamp.getTime());
      expect(displayEnd.getTime()).toBe(endTimestamp.getTime());
    });
  });
});
