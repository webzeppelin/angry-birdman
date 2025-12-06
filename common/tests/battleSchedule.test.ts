/**
 * Unit tests for battle schedule validators
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  battleIdSchema,
  masterBattleSchema,
  createMasterBattleSchema,
  updateNextBattleDateSchema,
  battleSelectionSchema,
  systemSettingSchema,
  updateSystemSettingSchema,
  masterBattleQuerySchema,
  validateBattleIdWithError,
  validateNextBattleDateWithError,
} from '../src/schemas/battleSchedule.js';

describe('battleSchedule validators', () => {
  describe('battleIdSchema', () => {
    it('should accept valid battle IDs', () => {
      expect(battleIdSchema.parse('20250115')).toBe('20250115');
      expect(battleIdSchema.parse('20240229')).toBe('20240229'); // Leap year
      expect(battleIdSchema.parse('20241231')).toBe('20241231');
    });

    it('should reject invalid formats', () => {
      expect(() => battleIdSchema.parse('2025011')).toThrow(); // Too short
      expect(() => battleIdSchema.parse('202501155')).toThrow(); // Too long
      expect(() => battleIdSchema.parse('abcd1234')).toThrow(); // Not numeric
      expect(() => battleIdSchema.parse('')).toThrow(); // Empty
    });

    it('should reject invalid dates', () => {
      expect(() => battleIdSchema.parse('20250229')).toThrow(); // Not a leap year
      expect(() => battleIdSchema.parse('20250132')).toThrow(); // Invalid day
      expect(() => battleIdSchema.parse('20251332')).toThrow(); // Invalid month
      expect(() => battleIdSchema.parse('20250431')).toThrow(); // April 31st
    });
  });

  describe('masterBattleSchema', () => {
    it('should accept valid master battle data', () => {
      const validData = {
        battleId: '20250115',
        startTimestamp: new Date('2025-01-15T00:00:00Z'),
        endTimestamp: new Date('2025-01-17T23:59:59Z'),
        createdBy: 'user123',
        notes: 'Test battle',
      };

      const result = masterBattleSchema.parse(validData);
      expect(result.battleId).toBe('20250115');
    });

    it('should accept null for optional fields', () => {
      const validData = {
        battleId: '20250115',
        startTimestamp: new Date('2025-01-15T00:00:00Z'),
        endTimestamp: new Date('2025-01-17T23:59:59Z'),
        createdBy: null,
        notes: null,
      };

      const result = masterBattleSchema.parse(validData);
      expect(result.createdBy).toBeNull();
      expect(result.notes).toBeNull();
    });

    it('should reject invalid battle ID', () => {
      const invalidData = {
        battleId: 'invalid',
        startTimestamp: new Date(),
        endTimestamp: new Date(),
      };

      expect(() => masterBattleSchema.parse(invalidData)).toThrow();
    });
  });

  describe('createMasterBattleSchema', () => {
    it('should accept valid creation data', () => {
      const validData = {
        startDate: new Date('2025-01-15T00:00:00Z'),
        createdBy: 'user123',
        notes: 'Test battle',
      };

      const result = createMasterBattleSchema.parse(validData);
      expect(result.startDate).toBeInstanceOf(Date);
    });

    it('should accept minimal data', () => {
      const validData = {
        startDate: new Date('2025-01-15T00:00:00Z'),
      };

      const result = createMasterBattleSchema.parse(validData);
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.createdBy).toBeUndefined();
      expect(result.notes).toBeUndefined();
    });

    it('should reject notes longer than 1000 characters', () => {
      const validData = {
        startDate: new Date('2025-01-15T00:00:00Z'),
        notes: 'a'.repeat(1001),
      };

      expect(() => createMasterBattleSchema.parse(validData)).toThrow();
    });
  });

  describe('updateNextBattleDateSchema', () => {
    beforeEach(() => {
      // Set system time to Jan 15, 2025
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should accept valid future date', () => {
      const validData = {
        nextBattleStartDate: '2025-01-20T00:00:00Z',
      };

      const result = updateNextBattleDateSchema.parse(validData);
      expect(result.nextBattleStartDate).toBe('2025-01-20T00:00:00Z');
    });

    it('should reject past dates', () => {
      const invalidData = {
        nextBattleStartDate: '2025-01-10T00:00:00Z',
      };

      expect(() => updateNextBattleDateSchema.parse(invalidData)).toThrow(/future/);
    });

    it('should reject invalid datetime format', () => {
      const invalidData = {
        nextBattleStartDate: '2025-01-20',
      };

      expect(() => updateNextBattleDateSchema.parse(invalidData)).toThrow(/datetime/);
    });

    it('should reject non-ISO format', () => {
      const invalidData = {
        nextBattleStartDate: 'January 20, 2025',
      };

      expect(() => updateNextBattleDateSchema.parse(invalidData)).toThrow();
    });
  });

  describe('battleSelectionSchema', () => {
    it('should accept valid battle ID', () => {
      const validData = {
        battleId: '20250115',
      };

      const result = battleSelectionSchema.parse(validData);
      expect(result.battleId).toBe('20250115');
    });

    it('should reject invalid battle ID', () => {
      const invalidData = {
        battleId: 'invalid',
      };

      expect(() => battleSelectionSchema.parse(invalidData)).toThrow();
    });
  });

  describe('systemSettingSchema', () => {
    it('should accept valid system setting', () => {
      const validData = {
        key: 'nextBattleStartDate',
        value: '2025-01-20T00:00:00Z',
        description: 'Next battle start date',
        dataType: 'date',
      };

      const result = systemSettingSchema.parse(validData);
      expect(result.key).toBe('nextBattleStartDate');
    });

    it('should accept all valid data types', () => {
      const dataTypes = ['string', 'number', 'boolean', 'date', 'json'] as const;

      dataTypes.forEach((dataType) => {
        const validData = {
          key: 'testKey',
          value: 'testValue',
          dataType,
        };

        const result = systemSettingSchema.parse(validData);
        expect(result.dataType).toBe(dataType);
      });
    });

    it('should reject invalid data type', () => {
      const invalidData = {
        key: 'testKey',
        value: 'testValue',
        dataType: 'invalid',
      };

      expect(() => systemSettingSchema.parse(invalidData)).toThrow();
    });

    it('should reject empty key', () => {
      const invalidData = {
        key: '',
        value: 'testValue',
        dataType: 'string',
      };

      expect(() => systemSettingSchema.parse(invalidData)).toThrow();
    });

    it('should reject key longer than 100 characters', () => {
      const invalidData = {
        key: 'a'.repeat(101),
        value: 'testValue',
        dataType: 'string',
      };

      expect(() => systemSettingSchema.parse(invalidData)).toThrow();
    });
  });

  describe('updateSystemSettingSchema', () => {
    it('should accept valid update data', () => {
      const validData = {
        value: 'newValue',
        description: 'Updated description',
      };

      const result = updateSystemSettingSchema.parse(validData);
      expect(result.value).toBe('newValue');
    });

    it('should accept minimal update data', () => {
      const validData = {
        value: 'newValue',
      };

      const result = updateSystemSettingSchema.parse(validData);
      expect(result.value).toBe('newValue');
      expect(result.description).toBeUndefined();
    });
  });

  describe('masterBattleQuerySchema', () => {
    it('should accept valid query options', () => {
      const validData = {
        page: 2,
        limit: 50,
        sortBy: 'startTimestamp',
        sortOrder: 'desc',
      };

      const result = masterBattleQuerySchema.parse(validData);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(50);
    });

    it('should use default values', () => {
      const result = masterBattleQuerySchema.parse({});

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.sortBy).toBe('battleId');
      expect(result.sortOrder).toBe('desc');
    });

    it('should reject invalid page number', () => {
      expect(() => masterBattleQuerySchema.parse({ page: 0 })).toThrow();
      expect(() => masterBattleQuerySchema.parse({ page: -1 })).toThrow();
      expect(() => masterBattleQuerySchema.parse({ page: 1.5 })).toThrow();
    });

    it('should reject invalid limit', () => {
      expect(() => masterBattleQuerySchema.parse({ limit: 0 })).toThrow();
      expect(() => masterBattleQuerySchema.parse({ limit: 101 })).toThrow(); // Max 100
      expect(() => masterBattleQuerySchema.parse({ limit: -1 })).toThrow();
    });

    it('should accept valid sort fields', () => {
      const sortFields = ['battleId', 'startTimestamp', 'createdAt'] as const;

      sortFields.forEach((sortBy) => {
        const result = masterBattleQuerySchema.parse({ sortBy });
        expect(result.sortBy).toBe(sortBy);
      });
    });

    it('should reject invalid sort field', () => {
      expect(() => masterBattleQuerySchema.parse({ sortBy: 'invalid' })).toThrow();
    });

    it('should accept valid sort orders', () => {
      const result1 = masterBattleQuerySchema.parse({ sortOrder: 'asc' });
      expect(result1.sortOrder).toBe('asc');

      const result2 = masterBattleQuerySchema.parse({ sortOrder: 'desc' });
      expect(result2.sortOrder).toBe('desc');
    });

    it('should reject invalid sort order', () => {
      expect(() => masterBattleQuerySchema.parse({ sortOrder: 'invalid' })).toThrow();
    });

    it('should accept date range filters', () => {
      const validData = {
        startDateFrom: new Date('2025-01-01'),
        startDateTo: new Date('2025-01-31'),
      };

      const result = masterBattleQuerySchema.parse(validData);
      expect(result.startDateFrom).toBeInstanceOf(Date);
      expect(result.startDateTo).toBeInstanceOf(Date);
    });
  });

  describe('validateBattleIdWithError helper', () => {
    it('should return success for valid battle ID', () => {
      const result = validateBattleIdWithError('20250115');
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error for invalid battle ID', () => {
      const result = validateBattleIdWithError('invalid');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
    });

    it('should provide meaningful error messages', () => {
      const result = validateBattleIdWithError('2025011');
      expect(result.success).toBe(false);
      expect(result.error).toContain('YYYYMMDD');
    });
  });

  describe('validateNextBattleDateWithError helper', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return success for valid future date', () => {
      const result = validateNextBattleDateWithError('2025-01-20T00:00:00Z');
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error for past date', () => {
      const result = validateNextBattleDateWithError('2025-01-10T00:00:00Z');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('future');
    });

    it('should return error for invalid format', () => {
      const result = validateNextBattleDateWithError('2025-01-20');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('edge cases and integration', () => {
    it('should handle battle IDs at month boundaries', () => {
      expect(battleIdSchema.parse('20250131')).toBe('20250131');
      expect(battleIdSchema.parse('20250201')).toBe('20250201');
    });

    it('should handle battle IDs at year boundaries', () => {
      expect(battleIdSchema.parse('20241231')).toBe('20241231');
      expect(battleIdSchema.parse('20250101')).toBe('20250101');
    });

    it('should handle leap year vs non-leap year', () => {
      expect(battleIdSchema.parse('20240229')).toBe('20240229'); // Valid
      expect(() => battleIdSchema.parse('20250229')).toThrow(); // Invalid
    });
  });
});
