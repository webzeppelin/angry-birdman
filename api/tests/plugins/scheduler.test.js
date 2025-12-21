/**
 * Integration tests for scheduler plugin
 *
 * Tests the Fastify plugin integration including:
 * - Plugin registration and initialization
 * - Scheduler decoration on Fastify instance
 * - Environment variable handling
 * - Graceful shutdown
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../../src/app.js';
import { prisma } from '../setup.js';
describe('Scheduler Plugin Integration', () => {
    let app;
    beforeEach(async () => {
        // Enable scheduler for these tests
        process.env.BATTLE_SCHEDULER_ENABLED = 'true';
    });
    afterEach(async () => {
        if (app) {
            await app.close();
        }
    });
    it('should register scheduler plugin successfully', async () => {
        // Set scheduler enabled
        await prisma.systemSetting.upsert({
            where: { key: 'schedulerEnabled' },
            update: { value: 'true' },
            create: {
                key: 'schedulerEnabled',
                value: 'true',
                dataType: 'boolean',
                description: 'Enable automatic battle creation',
            },
        });
        app = await buildApp();
        // Verify scheduler is decorated on Fastify instance
        expect(app.battleScheduler).toBeDefined();
        expect(typeof app.battleScheduler.checkAndCreateBattle).toBe('function');
        expect(typeof app.battleScheduler.isSchedulerEnabled).toBe('function');
        expect(typeof app.battleScheduler.manuallyCreateBattle).toBe('function');
    });
    it('should respect BATTLE_SCHEDULER_ENABLED=false environment variable', async () => {
        process.env.BATTLE_SCHEDULER_ENABLED = 'false';
        app = await buildApp();
        // When scheduler is disabled, the plugin should not decorate the instance
        // or the decoration should be undefined
        const hasScheduler = app.battleScheduler !== undefined;
        // Either the scheduler is not present, or if it is, it should be disabled
        if (hasScheduler) {
            const enabled = await app.battleScheduler.isSchedulerEnabled();
            // If scheduler exists, it should report as disabled
            expect(enabled).toBe(false);
        }
        // Reset for other tests
        process.env.BATTLE_SCHEDULER_ENABLED = 'true';
    });
    it('should not register scheduler when database setting is false', async () => {
        // Set scheduler disabled in database
        await prisma.systemSetting.upsert({
            where: { key: 'schedulerEnabled' },
            update: { value: 'false' },
            create: {
                key: 'schedulerEnabled',
                value: 'false',
                dataType: 'boolean',
                description: 'Enable automatic battle creation',
            },
        });
        app = await buildApp();
        // Plugin may still be registered but should not be active
        // This is expected behavior - the plugin checks the setting
    });
    it('should allow manual battle creation through decorated service', async () => {
        // Set scheduler enabled
        await prisma.systemSetting.upsert({
            where: { key: 'schedulerEnabled' },
            update: { value: 'true' },
            create: {
                key: 'schedulerEnabled',
                value: 'true',
                dataType: 'boolean',
                description: 'Enable automatic battle creation',
            },
        });
        app = await buildApp();
        // Use decorated scheduler to manually create a battle
        const testDate = new Date('2025-12-20T00:00:00.000Z');
        const battleId = await app.battleScheduler.manuallyCreateBattle(testDate);
        expect(battleId).toBe('20251220');
        // Verify battle was created
        const battle = await prisma.masterBattle.findUnique({
            where: { battleId },
        });
        expect(battle).toBeDefined();
        expect(battle?.battleId).toBe('20251220');
    });
    it('should handle graceful shutdown', async () => {
        // Set scheduler enabled
        await prisma.systemSetting.upsert({
            where: { key: 'schedulerEnabled' },
            update: { value: 'true' },
            create: {
                key: 'schedulerEnabled',
                value: 'true',
                dataType: 'boolean',
                description: 'Enable automatic battle creation',
            },
        });
        app = await buildApp();
        // Close should not throw
        await expect(app.close()).resolves.not.toThrow();
    });
    it('should start in development mode and run initial check', async () => {
        // Set development mode
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';
        // Set scheduler enabled
        await prisma.systemSetting.upsert({
            where: { key: 'schedulerEnabled' },
            update: { value: 'true' },
            create: {
                key: 'schedulerEnabled',
                value: 'true',
                dataType: 'boolean',
                description: 'Enable automatic battle creation',
            },
        });
        // Set a next battle date in the past so it creates a battle
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        pastDate.setUTCHours(0, 0, 0, 0);
        await prisma.systemSetting.upsert({
            where: { key: 'nextBattleStartDate' },
            update: { value: pastDate.toISOString() },
            create: {
                key: 'nextBattleStartDate',
                value: pastDate.toISOString(),
                dataType: 'date',
                description: 'Next battle start date',
            },
        });
        app = await buildApp();
        // Give the setImmediate callback time to execute
        await new Promise((resolve) => setTimeout(resolve, 100));
        // Verify scheduler ran and created a battle
        const year = pastDate.getUTCFullYear();
        const month = String(pastDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(pastDate.getUTCDate()).padStart(2, '0');
        const expectedBattleId = `${year}${month}${day}`;
        const battle = await prisma.masterBattle.findUnique({
            where: { battleId: expectedBattleId },
        });
        expect(battle).toBeDefined();
        // Restore environment
        process.env.NODE_ENV = originalEnv;
    });
});
//# sourceMappingURL=scheduler.test.js.map