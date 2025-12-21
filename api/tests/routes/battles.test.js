/**
 * Battle Routes Tests
 * Tests for battle CRUD operations with Master Battle integration
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../src/app.js';
import { createAuthenticatedHeaders } from '../helpers/auth-helper.js';
import { prisma } from '../setup.js';
describe('Battle Routes with Master Battle Integration', () => {
    let app;
    let testClanId;
    let testPlayer1Id;
    let testPlayer2Id;
    const masterBattleId = '20241202';
    let authHeaders;
    let testUserId;
    beforeAll(async () => {
        app = await buildApp();
    });
    afterAll(async () => {
        await app.close();
    });
    beforeEach(async () => {
        // Create test data for each test (setup.ts clears database before each test)
        // Create action codes (required for foreign key)
        await prisma.actionCode.createMany({
            data: [
                { actionCode: 'HOLD', displayName: 'Hold' },
                { actionCode: 'WARN', displayName: 'Warn' },
                { actionCode: 'KICK', displayName: 'Kick' },
                { actionCode: 'RESERVE', displayName: 'Reserve' },
                { actionCode: 'PASS', displayName: 'Pass' },
            ],
            skipDuplicates: true,
        });
        // Create test user - using just the sub claim, auth middleware will construct composite ID
        testUserId = 'test-battle-routes-user';
        await prisma.user.create({
            data: {
                userId: `keycloak:${testUserId}`, // Composite ID format: issuer:subject
                username: 'battletest',
                email: 'battletest@test.com',
            },
        });
        // Create test clan
        const clan = await prisma.clan.create({
            data: {
                name: 'Battle Routes Test Clan',
                rovioId: 999998,
                country: 'Test Country',
                active: true,
            },
        });
        testClanId = clan.clanId;
        // Associate user with clan
        await prisma.user.update({
            where: { userId: `keycloak:${testUserId}` },
            data: { clanId: testClanId },
        });
        // Create auth headers
        authHeaders = createAuthenticatedHeaders(app, {
            sub: testUserId,
            preferred_username: 'battletest',
            email: 'battletest@test.com',
            realm_access: { roles: ['admin'] },
        });
        // Create test players
        const player1 = await prisma.rosterMember.create({
            data: {
                clanId: testClanId,
                playerName: 'Route Test Player 1',
                active: true,
                joinedDate: new Date('2024-01-01'),
            },
        });
        testPlayer1Id = player1.playerId;
        const player2 = await prisma.rosterMember.create({
            data: {
                clanId: testClanId,
                playerName: 'Route Test Player 2',
                active: true,
                joinedDate: new Date('2024-01-01'),
            },
        });
        testPlayer2Id = player2.playerId;
        // Create master battle
        await prisma.masterBattle.create({
            data: {
                battleId: masterBattleId,
                startTimestamp: new Date('2024-12-02T05:00:00.000Z'),
                endTimestamp: new Date('2024-12-03T04:59:59.999Z'),
                createdBy: null,
                notes: 'Test battle for routes',
            },
        });
    });
    describe('POST /api/clans/:clanId/battles', () => {
        it('should create battle with valid battleId', async () => {
            const battleData = {
                battleId: masterBattleId,
                opponentRovioId: 888887,
                opponentName: 'Route Test Opponent',
                opponentCountry: 'Opponent Country',
                score: 50000,
                baselineFp: 2500,
                opponentScore: 45000,
                opponentFp: 2300,
                playerStats: [
                    {
                        playerId: testPlayer1Id,
                        rank: 1,
                        score: 25000,
                        fp: 1000,
                        actionCode: 'HOLD',
                    },
                    {
                        playerId: testPlayer2Id,
                        rank: 2,
                        score: 25000,
                        fp: 1500,
                        actionCode: 'HOLD',
                    },
                ],
                nonplayerStats: [],
            };
            const response = await app.inject({
                method: 'POST',
                url: `/api/clans/${testClanId}/battles`,
                headers: {
                    ...authHeaders,
                },
                payload: battleData,
            });
            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.body);
            expect(body.battleId).toBe(masterBattleId);
            expect(body.score).toBe(50000);
            expect(body.startDate).toBeDefined();
            expect(body.endDate).toBeDefined();
        });
        it('should reject invalid battleId not in MasterBattle', async () => {
            const battleData = {
                battleId: '19990102',
                opponentRovioId: 888887,
                opponentName: 'Route Test Opponent',
                opponentCountry: 'Opponent Country',
                score: 50000,
                baselineFp: 2500,
                opponentScore: 45000,
                opponentFp: 2300,
                playerStats: [
                    {
                        playerId: testPlayer1Id,
                        rank: 1,
                        score: 25000,
                        fp: 1000,
                        actionCode: 'HOLD',
                    },
                ],
                nonplayerStats: [],
            };
            const response = await app.inject({
                method: 'POST',
                url: `/api/clans/${testClanId}/battles`,
                headers: {
                    ...authHeaders,
                },
                payload: battleData,
            });
            expect(response.statusCode).toBe(500); // Service throws error
            const body = JSON.parse(response.body);
            expect(body.message).toContain('master schedule');
        });
        it('should reject duplicate battleId for same clan', async () => {
            const battleData = {
                battleId: masterBattleId,
                opponentRovioId: 888887,
                opponentName: 'Route Test Opponent',
                opponentCountry: 'Opponent Country',
                score: 50000,
                baselineFp: 2500,
                opponentScore: 45000,
                opponentFp: 2300,
                playerStats: [
                    {
                        playerId: testPlayer1Id,
                        rank: 1,
                        score: 25000,
                        fp: 1000,
                        actionCode: 'HOLD',
                    },
                ],
                nonplayerStats: [],
            };
            // Create first battle
            await app.inject({
                method: 'POST',
                url: `/api/clans/${testClanId}/battles`,
                headers: {
                    ...authHeaders,
                },
                payload: battleData,
            });
            // Try to create duplicate
            const response = await app.inject({
                method: 'POST',
                url: `/api/clans/${testClanId}/battles`,
                headers: {
                    ...authHeaders,
                },
                payload: battleData,
            });
            expect(response.statusCode).toBe(409);
            const body = JSON.parse(response.body);
            expect(body.message).toContain('already been recorded');
        });
        it('should reject request without authentication', async () => {
            const battleData = {
                battleId: masterBattleId,
                opponentRovioId: 888887,
                opponentName: 'Route Test Opponent',
                opponentCountry: 'Opponent Country',
                score: 50000,
                baselineFp: 2500,
                opponentScore: 45000,
                opponentFp: 2300,
                playerStats: [
                    {
                        playerId: testPlayer1Id,
                        rank: 1,
                        score: 25000,
                        fp: 1000,
                        actionCode: 'HOLD',
                    },
                ],
                nonplayerStats: [],
            };
            const response = await app.inject({
                method: 'POST',
                url: `/api/clans/${testClanId}/battles`,
                payload: battleData,
            });
            expect(response.statusCode).toBe(401);
        });
    });
    describe('GET /api/clans/:clanId/battles/:battleId', () => {
        it('should retrieve battle by battleId', async () => {
            // Create battle first
            const battleData = {
                battleId: masterBattleId,
                opponentRovioId: 888887,
                opponentName: 'Route Test Opponent',
                opponentCountry: 'Opponent Country',
                score: 50000,
                baselineFp: 2500,
                opponentScore: 45000,
                opponentFp: 2300,
                playerStats: [
                    {
                        playerId: testPlayer1Id,
                        rank: 1,
                        score: 25000,
                        fp: 1000,
                        actionCode: 'HOLD',
                    },
                ],
                nonplayerStats: [],
            };
            await app.inject({
                method: 'POST',
                url: `/api/clans/${testClanId}/battles`,
                headers: {
                    ...authHeaders,
                },
                payload: battleData,
            });
            // Retrieve battle
            const response = await app.inject({
                method: 'GET',
                url: `/api/clans/${testClanId}/battles/${masterBattleId}`,
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.battleId).toBe(masterBattleId);
            expect(body.score).toBe(50000);
        });
        it('should return 404 for non-existent battle', async () => {
            const response = await app.inject({
                method: 'GET',
                url: `/api/clans/${testClanId}/battles/19990103`,
            });
            expect(response.statusCode).toBe(404);
        });
    });
    describe('PUT /api/clans/:clanId/battles/:battleId', () => {
        it('should update battle score', async () => {
            // Create battle first
            const battleData = {
                battleId: masterBattleId,
                opponentRovioId: 888887,
                opponentName: 'Route Test Opponent',
                opponentCountry: 'Opponent Country',
                score: 50000,
                baselineFp: 2500,
                opponentScore: 45000,
                opponentFp: 2300,
                playerStats: [
                    {
                        playerId: testPlayer1Id,
                        rank: 1,
                        score: 25000,
                        fp: 1000,
                        actionCode: 'HOLD',
                    },
                ],
                nonplayerStats: [],
            };
            await app.inject({
                method: 'POST',
                url: `/api/clans/${testClanId}/battles`,
                headers: {
                    ...authHeaders,
                },
                payload: battleData,
            });
            // Update battle
            const updateData = {
                score: 55000,
            };
            const response = await app.inject({
                method: 'PUT',
                url: `/api/clans/${testClanId}/battles/${masterBattleId}`,
                headers: {
                    ...authHeaders,
                },
                payload: updateData,
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.score).toBe(55000);
            expect(body.battleId).toBe(masterBattleId);
        });
        it('should return 404 for non-existent battle', async () => {
            const updateData = {
                score: 55000,
            };
            const response = await app.inject({
                method: 'PUT',
                url: `/api/clans/${testClanId}/battles/19990104`,
                headers: {
                    ...authHeaders,
                },
                payload: updateData,
            });
            expect(response.statusCode).toBe(404);
        });
        it('should reject request without authentication', async () => {
            const updateData = {
                score: 55000,
            };
            const response = await app.inject({
                method: 'PUT',
                url: `/api/clans/${testClanId}/battles/${masterBattleId}`,
                payload: updateData,
            });
            expect(response.statusCode).toBe(401);
        });
    });
    describe('DELETE /api/clans/:clanId/battles/:battleId', () => {
        it('should delete battle', async () => {
            // Create battle first
            const battleData = {
                battleId: masterBattleId,
                opponentRovioId: 888887,
                opponentName: 'Route Test Opponent',
                opponentCountry: 'Opponent Country',
                score: 50000,
                baselineFp: 2500,
                opponentScore: 45000,
                opponentFp: 2300,
                playerStats: [
                    {
                        playerId: testPlayer1Id,
                        rank: 1,
                        score: 25000,
                        fp: 1000,
                        actionCode: 'HOLD',
                    },
                ],
                nonplayerStats: [],
            };
            await app.inject({
                method: 'POST',
                url: `/api/clans/${testClanId}/battles`,
                headers: {
                    ...authHeaders,
                },
                payload: battleData,
            });
            // Delete battle
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/clans/${testClanId}/battles/${masterBattleId}`,
                headers: {
                    ...authHeaders,
                },
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.success).toBe(true);
            // Verify deletion
            const getResponse = await app.inject({
                method: 'GET',
                url: `/api/clans/${testClanId}/battles/${masterBattleId}`,
            });
            expect(getResponse.statusCode).toBe(404);
        });
        it('should return 404 for non-existent battle', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/clans/${testClanId}/battles/19990105`,
                headers: {
                    ...authHeaders,
                },
            });
            expect(response.statusCode).toBe(404);
        });
        it('should reject request without authentication', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/clans/${testClanId}/battles/${masterBattleId}`,
            });
            expect(response.statusCode).toBe(401);
        });
    });
    describe('GET /api/clans/:clanId/battles', () => {
        it('should list battles for clan', async () => {
            // Create a battle
            const battleData = {
                battleId: masterBattleId,
                opponentRovioId: 888887,
                opponentName: 'Route Test Opponent',
                opponentCountry: 'Opponent Country',
                score: 50000,
                baselineFp: 2500,
                opponentScore: 45000,
                opponentFp: 2300,
                playerStats: [
                    {
                        playerId: testPlayer1Id,
                        rank: 1,
                        score: 25000,
                        fp: 1000,
                        actionCode: 'HOLD',
                    },
                ],
                nonplayerStats: [],
            };
            await app.inject({
                method: 'POST',
                url: `/api/clans/${testClanId}/battles`,
                headers: {
                    ...authHeaders,
                },
                payload: battleData,
            });
            // List battles
            const response = await app.inject({
                method: 'GET',
                url: `/api/clans/${testClanId}/battles`,
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.battles).toHaveLength(1);
            expect(body.battles[0].battleId).toBe(masterBattleId);
        });
    });
});
//# sourceMappingURL=battles.test.js.map