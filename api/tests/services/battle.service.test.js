/**
 * Battle Service Tests
 * Tests for battle data management with Master Battle integration
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { BattleService } from '../../src/services/battle.service.js';
import { prisma } from '../setup.js';
const battleService = new BattleService(prisma);
describe('BattleService with Master Battle Integration', () => {
    let testClanId;
    let testPlayer1Id;
    let testPlayer2Id;
    const masterBattleId = '20241201';
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
        // Create test clan
        const clan = await prisma.clan.create({
            data: {
                name: 'Battle Test Clan',
                rovioId: 999999,
                country: 'Test Country',
                active: true,
            },
        });
        testClanId = clan.clanId;
        // Create test players
        const player1 = await prisma.rosterMember.create({
            data: {
                clanId: testClanId,
                playerName: 'Test Player 1',
                active: true,
                joinedDate: new Date('2024-01-01'),
            },
        });
        testPlayer1Id = player1.playerId;
        const player2 = await prisma.rosterMember.create({
            data: {
                clanId: testClanId,
                playerName: 'Test Player 2',
                active: true,
                joinedDate: new Date('2024-01-01'),
            },
        });
        testPlayer2Id = player2.playerId;
        // Create master battle
        await prisma.masterBattle.create({
            data: {
                battleId: masterBattleId,
                startTimestamp: new Date('2024-12-01T05:00:00.000Z'), // Midnight EST
                endTimestamp: new Date('2024-12-02T04:59:59.999Z'), // End of day 1 EST
                createdBy: null, // Auto-created
                notes: 'Test battle',
            },
        });
    });
    describe('createBattle', () => {
        it('should create battle using battleId from MasterBattle', async () => {
            const battleData = {
                battleId: masterBattleId,
                opponentRovioId: 888888,
                opponentName: 'Test Opponent',
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
            const result = await battleService.createBattle(testClanId, battleData);
            expect(result).toBeDefined();
            expect(result.battleId).toBe(masterBattleId);
            expect(result.clanId).toBe(testClanId);
            expect(result.score).toBe(50000);
            expect(result.startDate).toBeDefined();
            expect(result.endDate).toBeDefined();
            expect(result.playerStats).toHaveLength(2);
        });
        it('should reject invalid battleId not in MasterBattle', async () => {
            const battleData = {
                battleId: '19990101', // Non-existent battle
                opponentRovioId: 888888,
                opponentName: 'Test Opponent',
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
            await expect(battleService.createBattle(testClanId, battleData)).rejects.toThrow('does not exist in the master schedule');
        });
        it('should reject duplicate battleId for same clan', async () => {
            const battleData = {
                battleId: masterBattleId,
                opponentRovioId: 888888,
                opponentName: 'Test Opponent',
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
            await battleService.createBattle(testClanId, battleData);
            // Try to create duplicate
            await expect(battleService.createBattle(testClanId, battleData)).rejects.toThrow('has already been recorded for this clan');
        });
        it('should correctly denormalize dates from MasterBattle', async () => {
            const battleData = {
                battleId: masterBattleId,
                opponentRovioId: 888888,
                opponentName: 'Test Opponent',
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
            const result = await battleService.createBattle(testClanId, battleData);
            // Get the master battle to compare
            const masterBattle = await prisma.masterBattle.findUnique({
                where: { battleId: masterBattleId },
            });
            // Compare dates (ClanBattle stores date-only, MasterBattle stores full timestamp)
            // Just verify the dates are defined and from same day
            expect(result.startDate).toBeDefined();
            expect(result.endDate).toBeDefined();
            const startDay = new Date(result.startDate).getUTCDate();
            const endDay = new Date(result.endDate).getUTCDate();
            const masterStartDay = new Date(masterBattle.startTimestamp).getUTCDate();
            const masterEndDay = new Date(masterBattle.endTimestamp).getUTCDate();
            expect(startDay).toBe(masterStartDay);
            expect(endDay).toBe(masterEndDay);
        });
        it('should calculate all battle statistics correctly', async () => {
            const battleData = {
                battleId: masterBattleId,
                opponentRovioId: 888888,
                opponentName: 'Test Opponent',
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
            const result = await battleService.createBattle(testClanId, battleData);
            // Check calculated fields
            expect(result.result).toBe(1); // Win
            expect(result.ratio).toBeCloseTo(20000); // (50000 / 2500) * 1000
            expect(result.fp).toBe(2500); // Total FP
            expect(result.playerStats).toHaveLength(2);
            expect(result.playerStats[0]?.ratio).toBeCloseTo(25000); // (25000 / 1000) * 1000
            expect(result.playerStats[1]?.ratio).toBeCloseTo(16666.67, 1); // (25000 / 1500) * 1000
        });
    });
    describe('updateBattle', () => {
        it('should update battle without changing battleId or dates', async () => {
            // Create initial battle
            const battleData = {
                battleId: masterBattleId,
                opponentRovioId: 888888,
                opponentName: 'Test Opponent',
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
            await battleService.createBattle(testClanId, battleData);
            // Update score and player stats (both needed for update to work)
            const updateData = {
                score: 55000,
                playerStats: [
                    {
                        playerId: testPlayer1Id,
                        rank: 1,
                        score: 30000, // Updated score
                        fp: 1000,
                        actionCode: 'HOLD',
                    },
                ],
            };
            const result = await battleService.updateBattle(testClanId, masterBattleId, updateData);
            expect(result.battleId).toBe(masterBattleId);
            expect(result.score).toBe(55000);
            expect(result.playerStats).toHaveLength(1);
            expect(result.playerStats[0]?.score).toBe(30000);
            // Dates should remain from MasterBattle
            expect(result.startDate).toBeDefined();
            expect(result.endDate).toBeDefined();
        });
        it('should throw error for non-existent battle', async () => {
            const updateData = {
                score: 55000,
            };
            await expect(battleService.updateBattle(testClanId, '19990101', updateData)).rejects.toThrow('not found');
        });
    });
    describe('getBattleById', () => {
        it('should retrieve battle with all details', async () => {
            const battleData = {
                battleId: masterBattleId,
                opponentRovioId: 888888,
                opponentName: 'Test Opponent',
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
            await battleService.createBattle(testClanId, battleData);
            const result = await battleService.getBattleById(testClanId, masterBattleId);
            expect(result).toBeDefined();
            expect(result.battleId).toBe(masterBattleId);
            expect(result.playerStats).toHaveLength(1);
        });
        it('should throw error for non-existent battle', async () => {
            await expect(battleService.getBattleById(testClanId, '19990101')).rejects.toThrow('not found');
        });
    });
    describe('deleteBattle', () => {
        it('should delete battle successfully', async () => {
            const battleData = {
                battleId: masterBattleId,
                opponentRovioId: 888888,
                opponentName: 'Test Opponent',
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
            await battleService.createBattle(testClanId, battleData);
            await battleService.deleteBattle(testClanId, masterBattleId);
            // Verify deletion
            const battle = await prisma.clanBattle.findUnique({
                where: {
                    clanId_battleId: { clanId: testClanId, battleId: masterBattleId },
                },
            });
            expect(battle).toBeNull();
        });
        it('should throw error for non-existent battle', async () => {
            await expect(battleService.deleteBattle(testClanId, '19990101')).rejects.toThrow('not found');
        });
    });
});
//# sourceMappingURL=battle.service.test.js.map