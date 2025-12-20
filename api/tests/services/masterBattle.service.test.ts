/**
 * Master Battle Service Tests
 *
 * Unit tests for MasterBattleService business logic
 */

import { type Prisma } from '@angrybirdman/database';
import { describe, it, expect, beforeEach } from 'vitest';

import { MasterBattleService } from '../../src/services/masterBattle.service';
import { prisma } from '../setup';

describe('MasterBattleService', () => {
  let service: MasterBattleService;

  beforeEach(() => {
    service = new MasterBattleService(prisma);
  });

  describe('getAllBattles', () => {
    it('should return empty array when no battles exist', async () => {
      const result = await service.getAllBattles();

      expect(result.battles).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
    });

    it('should return paginated battles', async () => {
      // Create 5 test battles
      const battles = Array.from({ length: 5 }, (_, i) => {
        const date = new Date('2025-12-01');
        date.setDate(date.getDate() + i * 3);
        const battleId = date.toISOString().split('T')[0]!.replace(/-/g, '');
        return {
          battleId,
          startTimestamp: new Date(date.getTime() + 5 * 60 * 60 * 1000),
          endTimestamp: new Date(date.getTime() + (48 * 60 * 60 - 1) * 1000 + 5 * 60 * 60 * 1000),
          createdBy: null,
        };
      });

      await prisma.masterBattle.createMany({ data: battles });

      const result = await service.getAllBattles({ page: 1, limit: 3 });

      expect(result.battles).toHaveLength(3);
      expect(result.total).toBe(5);
      expect(result.totalPages).toBe(2);
    });

    it('should support sorting', async () => {
      await prisma.masterBattle.createMany({
        data: [
          {
            battleId: '20251207',
            startTimestamp: new Date('2025-12-07T05:00:00Z'),
            endTimestamp: new Date('2025-12-09T04:59:59Z'),
            createdBy: null,
          },
          {
            battleId: '20251201',
            startTimestamp: new Date('2025-12-01T05:00:00Z'),
            endTimestamp: new Date('2025-12-03T04:59:59Z'),
            createdBy: null,
          },
        ],
      });

      const result = await service.getAllBattles({ sortOrder: 'asc' });

      expect(result.battles[0]!.battleId).toBe('20251201');
      expect(result.battles[1]!.battleId).toBe('20251207');
    });
  });

  describe('getAvailableBattles', () => {
    it('should return only started battles', async () => {
      const now = new Date();
      const pastDate = new Date(now);
      pastDate.setDate(pastDate.getDate() - 10);
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + 10);

      await prisma.masterBattle.createMany({
        data: [
          {
            battleId: '20251120',
            startTimestamp: pastDate,
            endTimestamp: new Date(pastDate.getTime() + 48 * 60 * 60 * 1000),
            createdBy: null,
          },
          {
            battleId: '20251215',
            startTimestamp: futureDate,
            endTimestamp: new Date(futureDate.getTime() + 48 * 60 * 60 * 1000),
            createdBy: null,
          },
        ],
      });

      const battles = await service.getAvailableBattles();

      expect(battles).toHaveLength(1);
      expect(battles[0]!.battleId).toBe('20251120');
    });

    it('should sort battles by most recent first', async () => {
      const now = new Date();
      const battles: Prisma.MasterBattleCreateManyInput[] = [];

      for (let i = 5; i > 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i * 3);
        const battleId = date.toISOString().split('T')[0]!.replace(/-/g, '');
        battles.push({
          battleId,
          startTimestamp: date,
          endTimestamp: new Date(date.getTime() + 48 * 60 * 60 * 1000),
          createdBy: null,
        });
      }

      await prisma.masterBattle.createMany({ data: battles });

      const result = await service.getAvailableBattles();

      // Verify descending order (battleIds are strings in YYYYMMDD format)
      for (let i = 1; i < result.length; i++) {
        const prev = result[i - 1];
        const curr = result[i];
        expect(prev!.battleId > curr!.battleId).toBe(true);
      }
    });
  });

  describe('getNextBattleDate', () => {
    it('should return next battle date from settings', async () => {
      const nextDate = new Date('2025-12-15T05:00:00Z');
      await prisma.systemSetting.create({
        data: {
          key: 'nextBattleStartDate',
          value: nextDate.toISOString(),
          description: 'Next scheduled battle start date',
          dataType: 'date',
        },
      });

      const result = await service.getNextBattleDate();

      expect(result).toBeInstanceOf(Date);
    });

    it('should handle JSON-stringified date value from legacy seed', async () => {
      const nextDate = new Date('2025-12-15T05:00:00Z');
      await prisma.systemSetting.create({
        data: {
          key: 'nextBattleStartDate',
          value: JSON.stringify(nextDate.toISOString()),
          description: 'Next scheduled battle start date',
          dataType: 'date',
        },
      });

      const result = await service.getNextBattleDate();

      expect(result).toBeInstanceOf(Date);
      expect(result.toString()).not.toBe('Invalid Date');
    });

    it('should throw error if setting not found', async () => {
      await expect(service.getNextBattleDate()).rejects.toThrow(
        'Next battle start date not configured'
      );
    });
  });

  describe('updateNextBattleDate', () => {
    it('should update next battle date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      await service.updateNextBattleDate(
        { nextBattleStartDate: futureDate.toISOString() },
        'test-user-id'
      );

      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'nextBattleStartDate' },
      });

      expect(setting).toBeTruthy();
      expect(setting?.key).toBe('nextBattleStartDate');
    });

    it('should reject past dates', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);

      await expect(
        service.updateNextBattleDate({ nextBattleStartDate: pastDate.toISOString() }, 'test-user')
      ).rejects.toThrow('must be in the future');
    });

    it('should create setting if not exists', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      await service.updateNextBattleDate(
        { nextBattleStartDate: futureDate.toISOString() },
        'test-user'
      );

      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'nextBattleStartDate' },
      });

      expect(setting).toBeTruthy();
    });
  });

  describe('createMasterBattle', () => {
    it('should create a new master battle', async () => {
      // Use Date constructor with explicit year/month/day to avoid timezone issues
      const startDate = new Date(2025, 11, 20); // Month is 0-indexed, so 11 = December

      const battle = await service.createMasterBattle(
        {
          startDate: startDate,
          notes: 'Test battle',
        },
        'test-user-id'
      );

      expect(battle.battleId).toBe('20251220');
      expect(battle.createdBy).toBe('test-user-id');
      expect(battle.notes).toBe('Test battle');
    });

    it('should reject duplicate battle IDs', async () => {
      // Create existing battle
      await prisma.masterBattle.create({
        data: {
          battleId: '20251220',
          startTimestamp: new Date('2025-12-20T05:00:00Z'),
          endTimestamp: new Date('2025-12-21T04:59:59Z'),
          createdBy: null,
        },
      });

      // Use Date constructor with explicit year/month/day to avoid timezone issues
      const startDate = new Date(2025, 11, 20); // Month is 0-indexed, so 11 = December

      await expect(
        service.createMasterBattle(
          {
            startDate: startDate,
          },
          'test-user'
        )
      ).rejects.toThrow('already exists');
    });

    it('should calculate correct end timestamp', async () => {
      // Use Date constructor with explicit year/month/day to avoid timezone issues
      const startDate = new Date(2025, 11, 15); // Month is 0-indexed, so 11 = December

      const battle = await service.createMasterBattle(
        {
          startDate: startDate,
        },
        'test-user'
      );

      // End should be 48 hours after start (2 days)
      const startTime = new Date(battle.startTimestamp).getTime();
      const endTime = new Date(battle.endTimestamp).getTime();
      const hoursDiff = (endTime - startTime) / (1000 * 60 * 60);

      expect(hoursDiff).toBeCloseTo(48, 0);
    });
  });

  describe('getBattleScheduleInfo', () => {
    it('should return comprehensive schedule information', async () => {
      const now = new Date();
      const currentStart = new Date(now);
      currentStart.setDate(currentStart.getDate() - 1);

      // Create current battle
      await prisma.masterBattle.create({
        data: {
          battleId: '20251204',
          startTimestamp: currentStart,
          endTimestamp: new Date(currentStart.getTime() + 48 * 60 * 60 * 1000),
          createdBy: null,
        },
      });

      // Set next battle date
      const nextDate = new Date(now);
      nextDate.setDate(nextDate.getDate() + 3);
      await prisma.systemSetting.create({
        data: {
          key: 'nextBattleStartDate',
          value: nextDate.toISOString(),
          description: 'Next scheduled battle start date',
          dataType: 'date',
        },
      });

      const info = await service.getBattleScheduleInfo();

      expect(info.currentBattle?.battleId).toBe('20251204');
      expect(info.nextBattleStartDate).toBeInstanceOf(Date);
      expect(info.availableBattles).toBeInstanceOf(Array);
    });

    it('should handle missing next battle date gracefully', async () => {
      const info = await service.getBattleScheduleInfo();

      expect(info.nextBattleStartDate).toBeInstanceOf(Date);
      expect(info.currentBattle).toBeNull();
    });
  });

  describe('getBattleById', () => {
    it('should return battle by ID', async () => {
      await prisma.masterBattle.create({
        data: {
          battleId: '20251210',
          startTimestamp: new Date('2025-12-10T05:00:00Z'),
          endTimestamp: new Date('2025-12-12T04:59:59Z'),
          createdBy: null,
          notes: 'Test battle',
        },
      });

      const battle = await service.getBattleById('20251210');

      expect(battle).toBeTruthy();
      expect(battle?.battleId).toBe('20251210');
      expect(battle?.notes).toBe('Test battle');
    });

    it('should return null for non-existent battle', async () => {
      const battle = await service.getBattleById('20251231');

      expect(battle).toBeNull();
    });
  });

  describe('getRecentBattles', () => {
    it('should return recent battles in descending order', async () => {
      const battles = Array.from({ length: 10 }, (_, i) => {
        const date = new Date('2025-11-01');
        date.setDate(date.getDate() + i * 3);
        const battleId = date.toISOString().split('T')[0]!.replace(/-/g, '');
        return {
          battleId,
          startTimestamp: new Date(date.getTime() + 5 * 60 * 60 * 1000),
          endTimestamp: new Date(date.getTime() + (48 * 60 * 60 - 1) * 1000 + 5 * 60 * 60 * 1000),
          createdBy: null,
        };
      });

      await prisma.masterBattle.createMany({ data: battles });

      const recent = await service.getRecentBattles(10);

      expect(recent).toHaveLength(10);
      // Verify descending order (battleIds are strings in YYYYMMDD format)
      for (let i = 1; i < recent.length; i++) {
        expect(recent[i - 1]!.battleId > recent[i]!.battleId).toBe(true);
      }
    });
  });
});
