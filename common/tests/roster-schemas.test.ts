/**
 * Roster Schema Validation Tests
 * Tests for roster-related Zod schemas
 */

import { describe, it, expect } from 'vitest';

import {
  rosterMemberLeftSchema,
  rosterMemberKickedSchema,
  rosterMemberReactivateSchema,
  rosterListQuerySchema,
} from '../src/schemas/roster.js';

describe('Roster Schemas', () => {
  describe('rosterMemberLeftSchema', () => {
    it('should validate with leftDate provided', () => {
      const data = {
        leftDate: new Date('2024-12-05'),
      };
      const result = rosterMemberLeftSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate without leftDate (optional)', () => {
      const data = {};
      const result = rosterMemberLeftSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid leftDate', () => {
      const data = {
        leftDate: 'invalid-date',
      };
      const result = rosterMemberLeftSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('rosterMemberKickedSchema', () => {
    it('should validate with kickedDate and reason', () => {
      const data = {
        kickedDate: new Date('2024-12-05'),
        reason: 'Inactive player',
      };
      const result = rosterMemberKickedSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate without kickedDate and reason (optional)', () => {
      const data = {};
      const result = rosterMemberKickedSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate with just kickedDate', () => {
      const data = {
        kickedDate: new Date('2024-12-05'),
      };
      const result = rosterMemberKickedSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate with just reason', () => {
      const data = {
        reason: 'Poor performance',
      };
      const result = rosterMemberKickedSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject reason longer than 500 characters', () => {
      const data = {
        reason: 'a'.repeat(501),
      };
      const result = rosterMemberKickedSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept reason exactly 500 characters', () => {
      const data = {
        reason: 'a'.repeat(500),
      };
      const result = rosterMemberKickedSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('rosterMemberReactivateSchema', () => {
    it('should validate with joinedDate provided', () => {
      const data = {
        joinedDate: new Date('2024-12-05'),
      };
      const result = rosterMemberReactivateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate without joinedDate (optional)', () => {
      const data = {};
      const result = rosterMemberReactivateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid joinedDate', () => {
      const data = {
        joinedDate: 'not-a-date',
      };
      const result = rosterMemberReactivateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('rosterListQuerySchema', () => {
    it('should validate with default values', () => {
      const data = {};
      const result = rosterListQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true); // default transformed from 'true' string
        expect(result.data.sortOrder).toBe('asc');
        expect(result.data.limit).toBe(50);
        expect(result.data.page).toBe(1);
      }
    });

    it('should transform active="true" to boolean true', () => {
      const data = { active: 'true' as const };
      const result = rosterListQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });

    it('should transform active="false" to boolean false', () => {
      const data = { active: 'false' as const };
      const result = rosterListQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(false);
      }
    });

    it('should transform active="all" to undefined', () => {
      const data = { active: 'all' as const };
      const result = rosterListQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBeUndefined();
      }
    });

    it('should validate search parameter', () => {
      const data = { search: 'John Doe' };
      const result = rosterListQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe('John Doe');
      }
    });

    it('should validate sortBy parameter', () => {
      const data = { sortBy: 'playerName' as const };
      const result = rosterListQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sortBy).toBe('playerName');
      }
    });

    it('should reject invalid sortBy value', () => {
      const data = { sortBy: 'invalid' };
      const result = rosterListQuerySchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate sortOrder parameter', () => {
      const data = { sortOrder: 'desc' as const };
      const result = rosterListQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sortOrder).toBe('desc');
      }
    });

    it('should reject limit greater than 100', () => {
      const data = { limit: 101 };
      const result = rosterListQuerySchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept limit exactly 100', () => {
      const data = { limit: 100 };
      const result = rosterListQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject negative limit', () => {
      const data = { limit: -1 };
      const result = rosterListQuerySchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject negative page', () => {
      const data = { page: 0 };
      const result = rosterListQuerySchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept positive page numbers', () => {
      const data = { page: 5 };
      const result = rosterListQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(5);
      }
    });

    it('should validate complete query with all parameters', () => {
      const data = {
        active: 'false' as const,
        search: 'test',
        sortBy: 'joinedDate' as const,
        sortOrder: 'desc' as const,
        limit: 25,
        page: 2,
      };
      const result = rosterListQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(false);
        expect(result.data.search).toBe('test');
        expect(result.data.sortBy).toBe('joinedDate');
        expect(result.data.sortOrder).toBe('desc');
        expect(result.data.limit).toBe(25);
        expect(result.data.page).toBe(2);
      }
    });
  });
});
