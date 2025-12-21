/**
 * Unit tests for BattleSchedulerService
 *
 * Tests the battle scheduler logic including:
 * - Battle creation when time passes next battle date
 * - Next battle date updates
 * - Duplicate battle prevention
 * - Error handling
 * - Timezone conversions
 */
import { createEstDate, generateBattleIdFromEst } from '@angrybirdman/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BattleSchedulerService } from '../../src/services/battleScheduler.service.js';
import { prisma } from '../setup.js';
// Mock logger
const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    child: vi.fn(() => mockLogger),
};
describe('BattleSchedulerService', () => {
    let service;
    beforeEach(() => {
        service = new BattleSchedulerService(prisma, mockLogger);
        vi.clearAllMocks();
    });
    describe('checkAndCreateBattle', () => {
        it('should create battle when current time passes next battle date', async () => {
            // Set next battle date to yesterday
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setUTCHours(0, 0, 0, 0);
            await prisma.systemSetting.create({
                data: {
                    key: 'nextBattleStartDate',
                    value: yesterday.toISOString(),
                    dataType: 'date',
                    description: 'Next scheduled battle start date (EST)',
                },
            });
            // Run scheduler check
            await service.checkAndCreateBattle();
            // Verify battle was created
            const battleId = generateBattleIdFromEst(yesterday);
            const battle = await prisma.masterBattle.findUnique({
                where: { battleId },
            });
            expect(battle).toBeDefined();
            expect(battle?.battleId).toBe(battleId);
            expect(battle?.createdBy).toBeNull(); // Automatic creation
            // Verify next battle date was updated (+3 days)
            const setting = await prisma.systemSetting.findUnique({
                where: { key: 'nextBattleStartDate' },
            });
            const newNextDate = new Date(setting.value);
            const expectedNextDate = new Date(yesterday);
            expectedNextDate.setDate(expectedNextDate.getDate() + 3);
            expect(newNextDate.toISOString()).toBe(expectedNextDate.toISOString());
        });
        it('should not create battle when current time is before next battle date', async () => {
            // Set next battle date to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setUTCHours(0, 0, 0, 0);
            await prisma.systemSetting.create({
                data: {
                    key: 'nextBattleStartDate',
                    value: tomorrow.toISOString(),
                    dataType: 'date',
                    description: 'Next scheduled battle start date (EST)',
                },
            });
            // Run scheduler check
            await service.checkAndCreateBattle();
            // Verify no battle was created
            const battleId = generateBattleIdFromEst(tomorrow);
            const battle = await prisma.masterBattle.findUnique({
                where: { battleId },
            });
            expect(battle).toBeNull();
            // Verify next battle date was not updated
            const setting = await prisma.systemSetting.findUnique({
                where: { key: 'nextBattleStartDate' },
            });
            expect(setting.value).toBe(tomorrow.toISOString());
        });
        it('should not create duplicate battle if already exists', async () => {
            // Set next battle date to yesterday
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setUTCHours(0, 0, 0, 0);
            const battleId = generateBattleIdFromEst(yesterday);
            // Create battle manually first
            await prisma.masterBattle.create({
                data: {
                    battleId,
                    startTimestamp: yesterday,
                    endTimestamp: new Date(yesterday.getTime() + 2 * 24 * 60 * 60 * 1000),
                    createdBy: 'test-user',
                    notes: 'Test battle',
                },
            });
            await prisma.systemSetting.create({
                data: {
                    key: 'nextBattleStartDate',
                    value: yesterday.toISOString(),
                    dataType: 'date',
                    description: 'Next scheduled battle start date (EST)',
                },
            });
            // Run scheduler check
            await service.checkAndCreateBattle();
            // Verify only one battle exists
            const battles = await prisma.masterBattle.findMany({
                where: { battleId },
            });
            expect(battles).toHaveLength(1);
            expect(battles[0]?.createdBy).toBe('test-user'); // Original battle preserved
        });
        it('should handle missing nextBattleStartDate gracefully', async () => {
            // Don't create nextBattleStartDate setting
            await service.checkAndCreateBattle();
            // Should log warning but not throw
            expect(mockLogger.warn).toHaveBeenCalledWith('No nextBattleStartDate found in system settings');
        });
        it('should handle errors gracefully without throwing', async () => {
            // Create invalid setting
            await prisma.systemSetting.create({
                data: {
                    key: 'nextBattleStartDate',
                    value: 'invalid-date',
                    dataType: 'date',
                    description: 'Invalid date',
                },
            });
            // Should not throw
            await expect(service.checkAndCreateBattle()).resolves.not.toThrow();
            // Should log error
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });
    describe('manuallyCreateBattle', () => {
        it('should create battle for specified date', async () => {
            const testDate = createEstDate(2025, 12, 15);
            const battleId = await service.manuallyCreateBattle(testDate);
            const battle = await prisma.masterBattle.findUnique({
                where: { battleId },
            });
            expect(battle).toBeDefined();
            expect(battle?.battleId).toBe('20251215');
            expect(battle?.createdBy).toBeNull(); // Automatic creation
        });
        it('should calculate correct end timestamp (2 days later)', async () => {
            const testDate = createEstDate(2025, 12, 15, 0, 0, 0);
            const battleId = await service.manuallyCreateBattle(testDate);
            const battle = await prisma.masterBattle.findUnique({
                where: { battleId },
            });
            // End should be 2 days later at 23:59:59
            const startTime = battle.startTimestamp.getTime();
            const endTime = battle.endTimestamp.getTime();
            const diffInHours = (endTime - startTime) / (1000 * 60 * 60);
            // Should be approximately 48 hours (2 days)
            expect(diffInHours).toBeGreaterThan(47);
            expect(diffInHours).toBeLessThan(49);
        });
    });
    describe('isSchedulerEnabled', () => {
        it('should return true when schedulerEnabled is "true"', async () => {
            await prisma.systemSetting.create({
                data: {
                    key: 'schedulerEnabled',
                    value: 'true',
                    dataType: 'boolean',
                    description: 'Enable automatic battle creation',
                },
            });
            const enabled = await service.isSchedulerEnabled();
            expect(enabled).toBe(true);
        });
        it('should return false when schedulerEnabled is "false"', async () => {
            await prisma.systemSetting.create({
                data: {
                    key: 'schedulerEnabled',
                    value: 'false',
                    dataType: 'boolean',
                    description: 'Enable automatic battle creation',
                },
            });
            const enabled = await service.isSchedulerEnabled();
            expect(enabled).toBe(false);
        });
        it('should return true when setting does not exist (default)', async () => {
            const enabled = await service.isSchedulerEnabled();
            expect(enabled).toBe(true);
        });
    });
    describe('battle timing calculations', () => {
        it('should create battles with correct EST to GMT conversion', async () => {
            // Create a battle for a known EST date
            const estDate = createEstDate(2025, 12, 15, 0, 0, 0);
            const battleId = await service.manuallyCreateBattle(estDate);
            const battle = await prisma.masterBattle.findUnique({
                where: { battleId },
            });
            // Start timestamp in GMT should be 5 hours ahead of EST midnight
            const expectedStartGmt = new Date(estDate.getTime() + 5 * 60 * 60 * 1000);
            // Allow for small timing differences (within 1 second)
            const timeDiff = Math.abs(battle.startTimestamp.getTime() - expectedStartGmt.getTime());
            expect(timeDiff).toBeLessThan(1000);
        });
    });
    describe('integration with system settings', () => {
        it('should update nextBattleStartDate atomically', async () => {
            const initialDate = new Date();
            initialDate.setDate(initialDate.getDate() - 1);
            initialDate.setUTCHours(0, 0, 0, 0);
            await prisma.systemSetting.create({
                data: {
                    key: 'nextBattleStartDate',
                    value: initialDate.toISOString(),
                    dataType: 'date',
                    description: 'Test date',
                },
            });
            await service.checkAndCreateBattle();
            // Verify update
            const setting = await prisma.systemSetting.findUnique({
                where: { key: 'nextBattleStartDate' },
            });
            const newDate = new Date(setting.value);
            const expectedDate = new Date(initialDate);
            expectedDate.setDate(expectedDate.getDate() + 3);
            expect(newDate.toISOString()).toBe(expectedDate.toISOString());
        });
        it('should create setting if not exists when updating', async () => {
            // Don't create setting initially
            const testDate = createEstDate(2025, 12, 15);
            // Manually create battle and update next date
            await service.manuallyCreateBattle(testDate);
            const newDate = new Date(testDate);
            newDate.setDate(newDate.getDate() + 3);
            // This should upsert the setting
            await service['updateNextBattleDate'](newDate);
            const setting = await prisma.systemSetting.findUnique({
                where: { key: 'nextBattleStartDate' },
            });
            expect(setting).toBeDefined();
            expect(setting.value).toBe(newDate.toISOString());
        });
    });
});
//# sourceMappingURL=battleScheduler.service.test.js.map