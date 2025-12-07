/**
 * Timezone Formatting Functions Tests
 * Tests for user-facing date/time formatting utilities
 */

import { describe, it, expect } from 'vitest';

import {
  formatDateOnly,
  formatBattleDate,
  getTimeRemaining,
  formatTimeRemaining,
} from '../src/utils/timezone.js';

describe('Timezone Formatting Functions', () => {
  describe('formatDateOnly', () => {
    it('should format Date object as simple date string', () => {
      const date = new Date('2024-12-05T10:30:00Z');
      const formatted = formatDateOnly(date);
      // Format is locale-dependent but should contain the date
      expect(formatted).toContain('2024');
      expect(formatted).toContain('5');
      expect(formatted).toContain('Dec');
    });

    it('should format ISO string as simple date string', () => {
      const formatted = formatDateOnly('2024-12-05T10:30:00Z');
      expect(formatted).toContain('2024');
      expect(formatted).toContain('5');
      expect(formatted).toContain('Dec');
    });
  });

  describe('formatBattleDate', () => {
    it('should format Date object as compact date', () => {
      const date = new Date('2024-12-05T10:30:00Z');
      const formatted = formatBattleDate(date);
      // Should be in MM/DD/YY format
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{2}/);
    });

    it('should format ISO string as compact date', () => {
      const formatted = formatBattleDate('2024-12-05T10:30:00Z');
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{2}/);
    });
  });

  describe('getTimeRemaining', () => {
    it('should calculate time remaining for future date', () => {
      const now = new Date();
      const future = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000); // 2 days, 5 hours from now
      const remaining = getTimeRemaining(future);

      expect(remaining.days).toBe(2);
      expect(remaining.hours).toBe(5);
      expect(remaining.total).toBeGreaterThan(0);
    });

    it('should return zeros for past date', () => {
      const past = new Date('2020-01-01T00:00:00Z');
      const remaining = getTimeRemaining(past);

      expect(remaining.days).toBe(0);
      expect(remaining.hours).toBe(0);
      expect(remaining.minutes).toBe(0);
      expect(remaining.seconds).toBe(0);
      expect(remaining.total).toBe(0);
    });

    it('should handle ISO string input', () => {
      const now = new Date();
      const future = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      const remaining = getTimeRemaining(future.toISOString());

      expect(remaining.hours).toBeGreaterThanOrEqual(0);
      expect(remaining.total).toBeGreaterThan(0);
    });
  });

  describe('formatTimeRemaining', () => {
    it('should format time with days and hours', () => {
      const now = new Date();
      const future = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000); // 2 days, 5 hours from now
      const formatted = formatTimeRemaining(future);

      expect(formatted).toContain('day');
      expect(formatted).toContain('hour');
    });

    it('should format time with only hours for less than 1 day', () => {
      const now = new Date();
      const future = new Date(now.getTime() + 5 * 60 * 60 * 1000 + 30 * 60 * 1000); // 5 hours, 30 minutes from now
      const formatted = formatTimeRemaining(future);

      expect(formatted).toContain('hour');
      expect(formatted).toContain('minute');
      expect(formatted).not.toContain('day');
    });

    it('should format time with only minutes for less than 1 hour', () => {
      const now = new Date();
      const future = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
      const formatted = formatTimeRemaining(future);

      expect(formatted).toContain('minute');
      expect(formatted).not.toContain('hour');
      expect(formatted).not.toContain('day');
    });

    it('should return "Started" for past date', () => {
      const past = new Date('2020-01-01T00:00:00Z');
      const formatted = formatTimeRemaining(past);

      expect(formatted).toBe('Started');
    });

    it('should handle singular forms correctly', () => {
      const now = new Date();
      const future1Day = new Date(now.getTime() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000); // 1 day, 1 hour from now
      const formatted = formatTimeRemaining(future1Day);

      expect(formatted).toContain('1 day');
      expect(formatted).toContain('1 hour');
      expect(formatted).not.toContain('days');
    });
  });
});
