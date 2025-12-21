/**
 * Master Battle Routes Tests
 *
 * Tests for centralized battle schedule API endpoints
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { buildApp } from '../../src/app';
import { createAuthenticatedHeaders, createTestUser, createTestSuperadmin, } from '../helpers/auth-helper';
import { prisma } from '../setup';
describe('Master Battle Routes', () => {
    let app;
    beforeEach(async () => {
        app = await buildApp();
    });
    describe('GET /api/master-battles', () => {
        it('should return empty array when no battles exist', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/master-battles',
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('battles');
            expect(body).toHaveProperty('total');
            expect(body.battles).toEqual([]);
            expect(body.total).toBe(0);
        });
        it('should return list of master battles with pagination', async () => {
            // Create test master battles
            await prisma.masterBattle.createMany({
                data: [
                    {
                        battleId: '20251201',
                        startTimestamp: new Date('2025-12-01T05:00:00Z'),
                        endTimestamp: new Date('2025-12-03T04:59:59Z'),
                        createdBy: null,
                    },
                    {
                        battleId: '20251204',
                        startTimestamp: new Date('2025-12-04T05:00:00Z'),
                        endTimestamp: new Date('2025-12-06T04:59:59Z'),
                        createdBy: null,
                    },
                    {
                        battleId: '20251207',
                        startTimestamp: new Date('2025-12-07T05:00:00Z'),
                        endTimestamp: new Date('2025-12-09T04:59:59Z'),
                        createdBy: null,
                    },
                ],
            });
            const response = await app.inject({
                method: 'GET',
                url: '/api/master-battles',
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.battles).toHaveLength(3);
            expect(body.total).toBe(3);
            expect(body.page).toBe(1);
            expect(body.totalPages).toBe(1);
        });
        it('should support pagination parameters', async () => {
            // Create 5 test battles
            const battles = Array.from({ length: 5 }, (_, i) => {
                const date = new Date('2025-11-01');
                date.setDate(date.getDate() + i * 3);
                const battleId = date.toISOString().split('T')[0].replace(/-/g, '');
                return {
                    battleId,
                    startTimestamp: new Date(date.getTime() + 5 * 60 * 60 * 1000), // 5am GMT
                    endTimestamp: new Date(date.getTime() + (48 * 60 * 60 - 1) * 1000 + 5 * 60 * 60 * 1000),
                    createdBy: null,
                };
            });
            await prisma.masterBattle.createMany({ data: battles });
            const response = await app.inject({
                method: 'GET',
                url: '/api/master-battles?page=2&limit=2',
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.battles).toHaveLength(2);
            expect(body.page).toBe(2);
            expect(body.limit).toBe(2);
            expect(body.total).toBe(5);
            expect(body.totalPages).toBe(3);
        });
        it('should support sorting by date', async () => {
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
                    {
                        battleId: '20251204',
                        startTimestamp: new Date('2025-12-04T05:00:00Z'),
                        endTimestamp: new Date('2025-12-06T04:59:59Z'),
                        createdBy: null,
                    },
                ],
            });
            const response = await app.inject({
                method: 'GET',
                url: '/api/master-battles?sortOrder=asc',
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.battles[0].battleId).toBe('20251201');
            expect(body.battles[1].battleId).toBe('20251204');
            expect(body.battles[2].battleId).toBe('20251207');
        });
    });
    describe('GET /api/master-battles/available', () => {
        it('should return only battles that have started', async () => {
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
            const response = await app.inject({
                method: 'GET',
                url: '/api/master-battles/available',
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveLength(1);
            expect(body[0].battleId).toBe('20251120');
        });
        it('should sort available battles with most recent first', async () => {
            const now = new Date();
            const battles = [];
            for (let i = 5; i > 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i * 3);
                const battleId = date.toISOString().split('T')[0].replace(/-/g, '');
                battles.push({
                    battleId,
                    startTimestamp: date,
                    endTimestamp: new Date(date.getTime() + 48 * 60 * 60 * 1000),
                    createdBy: null,
                });
            }
            await prisma.masterBattle.createMany({ data: battles });
            const response = await app.inject({
                method: 'GET',
                url: '/api/master-battles/available',
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.length).toBeGreaterThan(1);
            // Verify descending order (battleIds are strings in YYYYMMDD format)
            for (let i = 1; i < body.length; i++) {
                expect(body[i - 1].battleId > body[i].battleId).toBe(true);
            }
        });
    });
    describe('GET /api/master-battles/schedule-info', () => {
        it('should return schedule information with current and next battles', async () => {
            const now = new Date();
            const currentStart = new Date(now);
            currentStart.setDate(currentStart.getDate() - 1);
            // Create current battle (started yesterday, ends tomorrow)
            await prisma.masterBattle.create({
                data: {
                    battleId: '20251204',
                    startTimestamp: currentStart,
                    endTimestamp: new Date(currentStart.getTime() + 48 * 60 * 60 * 1000),
                    createdBy: null,
                },
            });
            // Set next battle date in system settings
            const nextDate = new Date(now);
            nextDate.setDate(nextDate.getDate() + 3);
            await prisma.systemSetting.upsert({
                where: { key: 'nextBattleStartDate' },
                create: {
                    key: 'nextBattleStartDate',
                    value: nextDate.toISOString(),
                    description: 'Next scheduled battle start date',
                    dataType: 'date',
                },
                update: {
                    value: nextDate.toISOString(),
                },
            });
            const response = await app.inject({
                method: 'GET',
                url: '/api/master-battles/schedule-info',
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('currentBattle');
            expect(body).toHaveProperty('nextBattle');
            expect(body).toHaveProperty('nextBattleStartDate');
            expect(body).toHaveProperty('availableBattles');
            expect(body.currentBattle?.battleId).toBe('20251204');
        });
    });
    describe('GET /api/master-battles/next-battle-date (Superadmin)', () => {
        it('should require authentication', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/master-battles/next-battle-date',
            });
            expect(response.statusCode).toBe(401);
        });
        it('should require superadmin role', async () => {
            const dbUser = await prisma.user.create({
                data: {
                    userId: 'keycloak:test-user-get-next-1',
                    username: 'testuser',
                    email: 'test@example.com',
                },
            });
            const user = createTestUser({ sub: dbUser.userId.split(':')[1], email: dbUser.email });
            const headers = createAuthenticatedHeaders(app, user);
            const response = await app.inject({
                method: 'GET',
                url: '/api/master-battles/next-battle-date',
                headers,
            });
            expect(response.statusCode).toBe(403);
        });
        it('should return next battle date for superadmin', async () => {
            const dbAdmin = await prisma.user.create({
                data: {
                    userId: 'keycloak:test-superadmin-get-next-2',
                    username: 'superadmin',
                    roles: ['superadmin'],
                    email: 'superadmin@example.com',
                },
            });
            const superadmin = createTestSuperadmin({
                sub: dbAdmin.userId.split(':')[1],
                email: dbAdmin.email,
            });
            const headers = createAuthenticatedHeaders(app, superadmin);
            const nextDate = new Date('2025-12-15T05:00:00Z');
            await prisma.systemSetting.upsert({
                where: { key: 'nextBattleStartDate' },
                create: {
                    key: 'nextBattleStartDate',
                    value: nextDate.toISOString(),
                    description: 'Next scheduled battle start date',
                    dataType: 'date',
                },
                update: {
                    value: nextDate.toISOString(),
                },
            });
            const response = await app.inject({
                method: 'GET',
                url: '/api/master-battles/next-battle-date',
                headers,
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('nextBattleStartDate');
        });
        it('should return 404 if next battle date not configured', async () => {
            const dbAdmin = await prisma.user.create({
                data: {
                    userId: 'keycloak:test-superadmin-get-next-3',
                    username: 'superadmin2',
                    roles: ['superadmin'],
                    email: 'superadmin2@example.com',
                },
            });
            const superadmin = createTestSuperadmin({
                sub: dbAdmin.userId.split(':')[1],
                email: dbAdmin.email,
            });
            const headers = createAuthenticatedHeaders(app, superadmin);
            const response = await app.inject({
                method: 'GET',
                url: '/api/master-battles/next-battle-date',
                headers,
            });
            expect(response.statusCode).toBe(404);
        });
    });
    describe('PUT /api/master-battles/next-battle-date (Superadmin)', () => {
        it('should require authentication', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: '/api/master-battles/next-battle-date',
                payload: {
                    nextBattleStartDate: new Date('2025-12-20T05:00:00Z').toISOString(),
                },
            });
            expect(response.statusCode).toBe(401);
        });
        it('should require superadmin role', async () => {
            const dbUser = await prisma.user.create({
                data: {
                    userId: 'keycloak:test-user-put-next-1',
                    username: 'testuser',
                    email: 'test@example.com',
                },
            });
            const user = createTestUser({ sub: dbUser.userId.split(':')[1], email: dbUser.email });
            const headers = createAuthenticatedHeaders(app, user);
            const response = await app.inject({
                method: 'PUT',
                url: '/api/master-battles/next-battle-date',
                headers,
                payload: {
                    nextBattleStartDate: new Date('2025-12-20T05:00:00Z').toISOString(),
                },
            });
            expect(response.statusCode).toBe(403);
        });
        it('should update next battle date for superadmin', async () => {
            const dbAdmin = await prisma.user.create({
                data: {
                    userId: 'keycloak:test-superadmin-put-next-2',
                    username: 'superadmin',
                    roles: ['superadmin'],
                    email: 'superadmin@example.com',
                },
            });
            const superadmin = createTestSuperadmin({
                sub: dbAdmin.userId.split(':')[1],
                email: dbAdmin.email,
            });
            const headers = createAuthenticatedHeaders(app, superadmin);
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 10);
            const response = await app.inject({
                method: 'PUT',
                url: '/api/master-battles/next-battle-date',
                headers,
                payload: {
                    nextBattleStartDate: futureDate.toISOString(),
                },
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.message).toContain('updated successfully');
            // Verify the setting was updated
            const setting = await prisma.systemSetting.findUnique({
                where: { key: 'nextBattleStartDate' },
            });
            expect(setting).toBeTruthy();
        });
        it('should reject past dates', async () => {
            const dbAdmin = await prisma.user.create({
                data: {
                    userId: 'keycloak:test-superadmin-put-next-3',
                    username: 'superadmin2',
                    roles: ['superadmin'],
                    email: 'superadmin2@example.com',
                },
            });
            const superadmin = createTestSuperadmin({
                sub: dbAdmin.userId.split(':')[1],
                email: dbAdmin.email,
            });
            const headers = createAuthenticatedHeaders(app, superadmin);
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 10);
            const response = await app.inject({
                method: 'PUT',
                url: '/api/master-battles/next-battle-date',
                headers,
                payload: {
                    nextBattleStartDate: pastDate.toISOString(),
                },
            });
            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.body);
            expect(body.message).toContain('must be in the future');
        });
        it('should create audit log entry', async () => {
            const dbAdmin = await prisma.user.create({
                data: {
                    userId: 'keycloak:test-superadmin-put-next-4',
                    username: 'superadmin3',
                    roles: ['superadmin'],
                    email: 'superadmin3@example.com',
                },
            });
            const superadmin = createTestSuperadmin({
                sub: dbAdmin.userId.split(':')[1],
                email: dbAdmin.email,
            });
            const headers = createAuthenticatedHeaders(app, superadmin);
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 10);
            await app.inject({
                method: 'PUT',
                url: '/api/master-battles/next-battle-date',
                headers,
                payload: {
                    nextBattleStartDate: futureDate.toISOString(),
                },
            });
            // Verify audit log was created
            const auditLog = await prisma.auditLog.findFirst({
                where: {
                    actorId: dbAdmin.userId,
                    entityType: 'SYSTEM_SETTING',
                    entityId: 'nextBattleStartDate',
                },
                orderBy: { createdAt: 'desc' },
            });
            expect(auditLog).toBeTruthy();
            expect(auditLog?.actionType).toBe('SYSTEM_SETTING_UPDATED');
        });
    });
    describe('POST /api/master-battles (Superadmin)', () => {
        it('should require authentication', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/master-battles',
                payload: {
                    startDate: new Date('2025-12-20T00:00:00-05:00'),
                    notes: 'Test battle',
                },
            });
            expect(response.statusCode).toBe(401);
        });
        it('should require superadmin role', async () => {
            const dbUser = await prisma.user.create({
                data: {
                    userId: 'keycloak:test-user-post-battle-1',
                    username: 'testuser',
                    email: 'test@example.com',
                },
            });
            const user = createTestUser({ sub: dbUser.userId.split(':')[1], email: dbUser.email });
            const headers = createAuthenticatedHeaders(app, user);
            const response = await app.inject({
                method: 'POST',
                url: '/api/master-battles',
                headers,
                payload: {
                    startDate: new Date('2025-12-20T00:00:00-05:00'),
                    notes: 'Test battle',
                },
            });
            expect(response.statusCode).toBe(403);
        });
        it('should create master battle for superadmin', async () => {
            const dbAdmin = await prisma.user.create({
                data: {
                    userId: 'keycloak:test-superadmin-post-battle-2',
                    username: 'superadmin',
                    roles: ['superadmin'],
                    email: 'superadmin@example.com',
                },
            });
            const superadmin = createTestSuperadmin({
                sub: dbAdmin.userId.split(':')[1],
                email: dbAdmin.email,
            });
            const headers = createAuthenticatedHeaders(app, superadmin);
            // Use Date constructor for consistent timezone handling
            const startDate = new Date(2025, 11, 20); // Dec 20, 2025
            const response = await app.inject({
                method: 'POST',
                url: '/api/master-battles',
                headers,
                payload: {
                    startDate: startDate.toISOString(),
                    notes: 'Manually created test battle',
                },
            });
            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('battleId');
            expect(body.battleId).toBe('20251220');
            expect(body.createdBy).toBe(dbAdmin.userId);
            expect(body.notes).toBe('Manually created test battle');
        });
        it('should reject duplicate battle IDs', async () => {
            const dbAdmin = await prisma.user.create({
                data: {
                    userId: 'keycloak:test-superadmin-post-battle-3',
                    username: 'superadmin2',
                    roles: ['superadmin'],
                    email: 'superadmin2@example.com',
                },
            });
            const superadmin = createTestSuperadmin({
                sub: dbAdmin.userId.split(':')[1],
                email: dbAdmin.email,
            });
            const headers = createAuthenticatedHeaders(app, superadmin);
            // Create existing battle
            await prisma.masterBattle.create({
                data: {
                    battleId: '20251220',
                    startTimestamp: new Date('2025-12-20T05:00:00Z'),
                    endTimestamp: new Date('2025-12-22T04:59:59Z'),
                    createdBy: null,
                },
            });
            // Use Date constructor for consistent timezone handling
            const startDate = new Date(2025, 11, 20); // Dec 20, 2025
            const response = await app.inject({
                method: 'POST',
                url: '/api/master-battles',
                headers,
                payload: {
                    startDate: startDate.toISOString(),
                },
            });
            expect(response.statusCode).toBe(409);
            const body = JSON.parse(response.body);
            expect(body.message).toContain('already exists');
        });
        it('should create audit log entry', async () => {
            const dbAdmin = await prisma.user.create({
                data: {
                    userId: 'keycloak:test-superadmin-post-battle-4',
                    username: 'superadmin3',
                    roles: ['superadmin'],
                    email: 'superadmin3@example.com',
                },
            });
            const superadmin = createTestSuperadmin({
                sub: dbAdmin.userId.split(':')[1],
                email: dbAdmin.email,
            });
            const headers = createAuthenticatedHeaders(app, superadmin);
            const startDate = new Date(2025, 11, 25); // Dec 25, 2025
            await app.inject({
                method: 'POST',
                url: '/api/master-battles',
                headers,
                payload: {
                    startDate: startDate.toISOString(),
                    notes: 'Test battle for audit',
                },
            });
            // Verify audit log was created
            const auditLog = await prisma.auditLog.findFirst({
                where: {
                    actorId: dbAdmin.userId,
                    entityType: 'MASTER_BATTLE',
                },
                orderBy: { createdAt: 'desc' },
            });
            expect(auditLog).toBeTruthy();
            expect(auditLog?.actionType).toBe('MASTER_BATTLE_CREATED');
            expect(auditLog?.entityId).toBe('20251225');
        });
    });
    describe('GET /api/master-battles/:battleId', () => {
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
            const response = await app.inject({
                method: 'GET',
                url: '/api/master-battles/20251210',
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.battleId).toBe('20251210');
            expect(body.notes).toBe('Test battle');
        });
        it('should return 404 for non-existent battle', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/master-battles/20251231',
            });
            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.body);
            expect(body.message).toContain('not found');
        });
    });
});
//# sourceMappingURL=master-battles.test.js.map