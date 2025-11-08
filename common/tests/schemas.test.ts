/**
 * Tests for Zod validation schemas
 */

import { describe, expect, it } from 'vitest';

import { ACTION_CODES, BATTLE_RESULTS } from '../src/constants';
import {
  actionCodeSchema,
  battleIdSchema,
  battleResultSchema,
  clanBattleCreateSchema,
  clanBattlePlayerStatsCreateSchema,
  clanCreateSchema,
  flockPowerSchema,
  monthIdSchema,
  monthlyIndividualPerformanceSchema,
  nonNegativeIntegerSchema,
  paginationSchema,
  positiveIntegerSchema,
  rosterMemberCreateSchema,
  userCreateSchema,
  yearIdSchema,
} from '../src/schemas';

describe('Primitive Schemas', () => {
  describe('actionCodeSchema', () => {
    it('should validate correct action codes', () => {
      expect(actionCodeSchema.parse(ACTION_CODES.HOLD)).toBe('HOLD');
      expect(actionCodeSchema.parse(ACTION_CODES.WARN)).toBe('WARN');
      expect(actionCodeSchema.parse(ACTION_CODES.KICK)).toBe('KICK');
      expect(actionCodeSchema.parse(ACTION_CODES.RESERVE)).toBe('RESERVE');
      expect(actionCodeSchema.parse(ACTION_CODES.PASS)).toBe('PASS');
    });

    it('should reject invalid action codes', () => {
      expect(() => actionCodeSchema.parse('INVALID')).toThrow();
      expect(() => actionCodeSchema.parse('hold')).toThrow();
      expect(() => actionCodeSchema.parse('')).toThrow();
    });
  });

  describe('battleResultSchema', () => {
    it('should validate correct battle results', () => {
      expect(battleResultSchema.parse(BATTLE_RESULTS.WIN)).toBe(1);
      expect(battleResultSchema.parse(BATTLE_RESULTS.LOSS)).toBe(-1);
      expect(battleResultSchema.parse(BATTLE_RESULTS.TIE)).toBe(0);
    });

    it('should reject invalid battle results', () => {
      expect(() => battleResultSchema.parse(2)).toThrow();
      expect(() => battleResultSchema.parse(-2)).toThrow();
      expect(() => battleResultSchema.parse('WIN')).toThrow();
    });
  });

  describe('positiveIntegerSchema', () => {
    it('should validate positive integers', () => {
      expect(positiveIntegerSchema.parse(1)).toBe(1);
      expect(positiveIntegerSchema.parse(100)).toBe(100);
      expect(positiveIntegerSchema.parse(999999)).toBe(999999);
    });

    it('should reject zero and negative numbers', () => {
      expect(() => positiveIntegerSchema.parse(0)).toThrow();
      expect(() => positiveIntegerSchema.parse(-1)).toThrow();
    });

    it('should reject non-integers', () => {
      expect(() => positiveIntegerSchema.parse(1.5)).toThrow();
      expect(() => positiveIntegerSchema.parse(NaN)).toThrow();
    });
  });

  describe('nonNegativeIntegerSchema', () => {
    it('should validate non-negative integers', () => {
      expect(nonNegativeIntegerSchema.parse(0)).toBe(0);
      expect(nonNegativeIntegerSchema.parse(1)).toBe(1);
      expect(nonNegativeIntegerSchema.parse(100)).toBe(100);
    });

    it('should reject negative numbers', () => {
      expect(() => nonNegativeIntegerSchema.parse(-1)).toThrow();
    });
  });

  describe('flockPowerSchema', () => {
    it('should validate flock power within range', () => {
      expect(flockPowerSchema.parse(1)).toBe(1);
      expect(flockPowerSchema.parse(100)).toBe(100);
      expect(flockPowerSchema.parse(5000)).toBe(5000);
    });

    it('should reject flock power outside range', () => {
      expect(() => flockPowerSchema.parse(0)).toThrow();
      expect(() => flockPowerSchema.parse(5001)).toThrow();
    });
  });
});

describe('ID Schemas', () => {
  describe('battleIdSchema', () => {
    it('should validate correct battle IDs', () => {
      expect(battleIdSchema.parse('20251108')).toBe('20251108');
      expect(battleIdSchema.parse('20240101')).toBe('20240101');
    });

    it('should reject invalid battle IDs', () => {
      expect(() => battleIdSchema.parse('2025110')).toThrow(); // Too short
      expect(() => battleIdSchema.parse('202511088')).toThrow(); // Too long
      expect(() => battleIdSchema.parse('2025AB08')).toThrow(); // Non-numeric
    });
  });

  describe('monthIdSchema', () => {
    it('should validate correct month IDs', () => {
      expect(monthIdSchema.parse('202511')).toBe('202511');
      expect(monthIdSchema.parse('202401')).toBe('202401');
    });

    it('should reject invalid month IDs', () => {
      expect(() => monthIdSchema.parse('20251')).toThrow(); // Too short
      expect(() => monthIdSchema.parse('2025111')).toThrow(); // Too long
    });
  });

  describe('yearIdSchema', () => {
    it('should validate correct year IDs', () => {
      expect(yearIdSchema.parse('2025')).toBe('2025');
      expect(yearIdSchema.parse('2024')).toBe('2024');
    });

    it('should reject invalid year IDs', () => {
      expect(() => yearIdSchema.parse('202')).toThrow(); // Too short
      expect(() => yearIdSchema.parse('20255')).toThrow(); // Too long
    });
  });
});

describe('Entity Create Schemas', () => {
  describe('clanCreateSchema', () => {
    it('should validate correct clan data', () => {
      const validClan = {
        rovioId: 12345,
        name: 'Test Clan',
        country: 'USA',
      };

      const parsed = clanCreateSchema.parse(validClan);
      expect(parsed.rovioId).toBe(12345);
      expect(parsed.name).toBe('Test Clan');
      expect(parsed.country).toBe('USA');
      expect(parsed.active).toBe(true); // Default value
    });

    it('should reject invalid clan data', () => {
      expect(() =>
        clanCreateSchema.parse({
          rovioId: -1,
          name: 'Test',
          country: 'USA',
        })
      ).toThrow();

      expect(() =>
        clanCreateSchema.parse({
          rovioId: 123,
          name: '',
          country: 'USA',
        })
      ).toThrow();
    });
  });

  describe('userCreateSchema', () => {
    it('should validate correct user data', () => {
      const validUser = {
        userId: 'uuid-123',
        username: 'testuser',
        email: 'test@example.com',
      };

      const parsed = userCreateSchema.parse(validUser);
      expect(parsed.userId).toBe('uuid-123');
      expect(parsed.username).toBe('testuser');
      expect(parsed.email).toBe('test@example.com');
      expect(parsed.owner).toBe(false); // Default value
    });

    it('should reject invalid email', () => {
      expect(() =>
        userCreateSchema.parse({
          userId: 'uuid-123',
          username: 'testuser',
          email: 'invalid-email',
        })
      ).toThrow();
    });
  });

  describe('rosterMemberCreateSchema', () => {
    it('should validate correct roster member data', () => {
      const validMember = {
        clanId: 1,
        playerName: 'PlayerOne',
      };

      const parsed = rosterMemberCreateSchema.parse(validMember);
      expect(parsed.clanId).toBe(1);
      expect(parsed.playerName).toBe('PlayerOne');
      expect(parsed.active).toBe(true); // Default value
    });

    it('should reject invalid roster member data', () => {
      expect(() =>
        rosterMemberCreateSchema.parse({
          clanId: 0,
          playerName: 'Player',
        })
      ).toThrow();
    });
  });

  describe('clanBattleCreateSchema', () => {
    it('should validate correct battle data', () => {
      const validBattle = {
        clanId: 1,
        startDate: new Date('2025-11-08'),
        endDate: new Date('2025-11-09'),
        score: 100000,
        baselineFp: 10000,
        opponentName: 'Enemy Clan',
        opponentRovioId: 54321,
        opponentCountry: 'Canada',
        opponentScore: 90000,
        opponentFp: 9500,
      };

      const parsed = clanBattleCreateSchema.parse(validBattle);
      expect(parsed.clanId).toBe(1);
      expect(parsed.score).toBe(100000);
      expect(parsed.opponentName).toBe('Enemy Clan');
    });

    it('should reject negative scores', () => {
      expect(() =>
        clanBattleCreateSchema.parse({
          clanId: 1,
          startDate: new Date('2025-11-08'),
          endDate: new Date('2025-11-09'),
          score: -1000,
          baselineFp: 10000,
          opponentName: 'Enemy',
          opponentRovioId: 123,
          opponentCountry: 'USA',
          opponentScore: 1000,
          opponentFp: 1000,
        })
      ).toThrow();
    });
  });

  describe('clanBattlePlayerStatsCreateSchema', () => {
    it('should validate correct player stats data', () => {
      const validStats = {
        clanId: 1,
        battleId: '20251108',
        playerId: 1,
        rank: 1,
        score: 5000,
        fp: 500,
        actionCode: ACTION_CODES.HOLD,
      };

      const parsed = clanBattlePlayerStatsCreateSchema.parse(validStats);
      expect(parsed.rank).toBe(1);
      expect(parsed.score).toBe(5000);
      expect(parsed.actionCode).toBe('HOLD');
    });

    it('should reject invalid flock power', () => {
      expect(() =>
        clanBattlePlayerStatsCreateSchema.parse({
          clanId: 1,
          battleId: '20251108',
          playerId: 1,
          rank: 1,
          score: 5000,
          fp: 0, // Invalid: FP must be at least 1
          actionCode: ACTION_CODES.HOLD,
        })
      ).toThrow();
    });
  });
});

describe('Aggregated Statistics Schemas', () => {
  describe('monthlyIndividualPerformanceSchema', () => {
    it('should validate correct monthly performance data', () => {
      const validData = {
        clanId: 1,
        monthId: '202511',
        playerId: 1,
        battlesPlayed: 5,
        averageScore: 4500.5,
        averageFp: 450.2,
        averageRatio: 100.5,
        averageRank: 2.5,
        averageRatioRank: 1.8,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const parsed = monthlyIndividualPerformanceSchema.parse(validData);
      expect(parsed.battlesPlayed).toBe(5);
      expect(parsed.averageScore).toBe(4500.5);
    });

    it('should reject battles played less than minimum', () => {
      expect(() =>
        monthlyIndividualPerformanceSchema.parse({
          clanId: 1,
          monthId: '202511',
          playerId: 1,
          battlesPlayed: 2, // Less than MIN_BATTLES_FOR_STATS (3)
          averageScore: 4500,
          averageFp: 450,
          averageRatio: 100,
          averageRank: 2,
          averageRatioRank: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ).toThrow();
    });
  });
});

describe('API Request Schemas', () => {
  describe('paginationSchema', () => {
    it('should apply default values', () => {
      const parsed = paginationSchema.parse({});
      expect(parsed.page).toBe(1);
      expect(parsed.pageSize).toBe(20);
    });

    it('should validate custom values', () => {
      const parsed = paginationSchema.parse({ page: 5, pageSize: 50 });
      expect(parsed.page).toBe(5);
      expect(parsed.pageSize).toBe(50);
    });

    it('should reject invalid values', () => {
      expect(() => paginationSchema.parse({ page: 0 })).toThrow();
      expect(() => paginationSchema.parse({ pageSize: 101 })).toThrow(); // Max 100
    });
  });
});

describe('Complex Validation Scenarios', () => {
  it('should validate complete battle entry data', () => {
    const battleData = {
      clanId: 1,
      startDate: new Date('2025-11-08'),
      endDate: new Date('2025-11-09'),
      score: 100000,
      baselineFp: 10000,
      opponentName: 'Enemy Clan',
      opponentRovioId: 54321,
      opponentCountry: 'Canada',
      opponentScore: 90000,
      opponentFp: 9500,
    };

    const playerStats = [
      {
        clanId: 1,
        battleId: '20251108',
        playerId: 1,
        rank: 1,
        score: 5000,
        fp: 500,
        actionCode: ACTION_CODES.HOLD,
      },
      {
        clanId: 1,
        battleId: '20251108',
        playerId: 2,
        rank: 2,
        score: 4500,
        fp: 450,
        actionCode: ACTION_CODES.WARN,
      },
    ];

    // Validate battle
    expect(() => clanBattleCreateSchema.parse(battleData)).not.toThrow();

    // Validate all player stats
    playerStats.forEach((stats) => {
      expect(() => clanBattlePlayerStatsCreateSchema.parse(stats)).not.toThrow();
    });
  });
});
