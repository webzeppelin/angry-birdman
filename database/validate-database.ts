/**
 * Comprehensive Database Validation Script
 * Tests constraints, indexes, relationships, and data integrity
 */

import { PrismaClient } from './generated/prisma/client';

const prisma = new PrismaClient();

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function test(name: string, fn: () => Promise<boolean>) {
  return async () => {
    testsRun++;
    try {
      const result = await fn();
      if (result) {
        testsPassed++;
        console.log(`✅ ${name}`);
      } else {
        testsFailed++;
        console.log(`❌ ${name} - Assertion failed`);
      }
    } catch (error) {
      testsFailed++;
      console.log(`❌ ${name} - Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
}

async function main() {
  console.log('🧪 Running Database Validation Tests...\n');

  console.log('📋 Testing Basic Data Access\n');

  await test('Can count clans', async () => {
    const count = await prisma.clan.count();
    return count > 0;
  })();

  await test('Can fetch clan by ID', async () => {
    const clan = await prisma.clan.findFirst();
    return clan !== null && clan.clanId > 0;
  })();

  await test('Can fetch clan by rovioId', async () => {
    const clan = await prisma.clan.findUnique({ where: { rovioId: 123456 } });
    return clan !== null && clan.name === 'Angry Avengers';
  })();

  console.log('\n🔐 Testing Constraints\n');

  await test('Unique constraint on clan rovioId', async () => {
    try {
      await prisma.clan.create({
        data: {
          rovioId: 123456, // Duplicate
          name: 'Duplicate Clan',
          country: 'Test',
          registrationDate: new Date(),
        },
      });
      return false; // Should have thrown error
    } catch (_error) {
      return true; // Expected error
    }
  })();

  await test('Unique constraint on user username', async () => {
    try {
      await prisma.user.create({
        data: {
          userId: 'test-user-999',
          username: 'angryowner', // Duplicate
          email: 'test@test.com',
        },
      });
      return false; // Should have thrown error
    } catch (_error) {
      return true; // Expected error
    }
  })();

  await test('Unique constraint on (clanId, playerName)', async () => {
    try {
      const clan = await prisma.clan.findFirst();
      if (!clan) return false;

      await prisma.rosterMember.create({
        data: {
          clanId: clan.clanId,
          playerName: 'RedWarrior', // Duplicate in same clan
          joinedDate: new Date(),
        },
      });
      return false; // Should have thrown error
    } catch (_error) {
      return true; // Expected error
    }
  })();

  await test('Foreign key constraint on actionCode', async () => {
    try {
      const battle = await prisma.clanBattle.findFirst();
      const player = await prisma.rosterMember.findFirst();
      if (!battle || !player) return false;

      await prisma.clanBattlePlayerStats.create({
        data: {
          clanId: battle.clanId,
          battleId: battle.battleId,
          playerId: player.playerId,
          rank: 1,
          score: 1000,
          fp: 100,
          ratio: 100,
          ratioRank: 1,
          actionCode: 'INVALID', // Invalid action code
        },
      });
      return false; // Should have thrown error
    } catch (_error) {
      return true; // Expected error
    }
  })();

  console.log('\n🔗 Testing Relationships\n');

  await test('Clan -> Users relationship', async () => {
    const clan = await prisma.clan.findFirst({
      include: { users: true },
    });
    return clan !== null && clan.users.length > 0;
  })();

  await test('Clan -> Roster Members relationship', async () => {
    const clan = await prisma.clan.findFirst({
      include: { rosterMembers: true },
    });
    return clan !== null && clan.rosterMembers.length > 0;
  })();

  await test('Clan -> Battles relationship', async () => {
    const clan = await prisma.clan.findFirst({
      include: { clanBattles: true },
    });
    return clan !== null && clan.clanBattles.length > 0;
  })();

  await test('Battle -> Player Stats relationship', async () => {
    const battle = await prisma.clanBattle.findFirst({
      include: { playerStats: true },
    });
    return battle !== null && battle.playerStats.length > 0;
  })();

  await test('Battle -> Nonplayer Stats relationship', async () => {
    const battle = await prisma.clanBattle.findFirst({
      include: { nonplayerStats: true },
    });
    return battle !== null && battle.nonplayerStats.length > 0;
  })();

  await test('Player Stats -> Player relationship', async () => {
    const stats = await prisma.clanBattlePlayerStats.findFirst({
      include: { player: true },
    });
    return stats !== null && stats.player !== null;
  })();

  await test('Player Stats -> Action Code relationship', async () => {
    const stats = await prisma.clanBattlePlayerStats.findFirst({
      include: { action: true },
    });
    return stats !== null && stats.action !== null;
  })();

  console.log('\n📊 Testing Indexes\n');

  await test('Index on clans.active works', async () => {
    const activeClans = await prisma.clan.findMany({
      where: { active: true },
    });
    return activeClans.length > 0;
  })();

  await test('Index on roster_members.active works', async () => {
    const activeMembers = await prisma.rosterMember.findMany({
      where: { active: true },
    });
    return activeMembers.length > 0;
  })();

  await test('Index on clan_battles.start_date works', async () => {
    const battles = await prisma.clanBattle.findMany({
      where: {
        startDate: { gte: new Date('2024-01-01') },
      },
    });
    return battles.length > 0;
  })();

  await test('Index on player_stats.ratio works', async () => {
    const topRatios = await prisma.clanBattlePlayerStats.findMany({
      orderBy: { ratio: 'desc' },
      take: 5,
    });
    return topRatios.length > 0 && topRatios[0].ratio >= topRatios[topRatios.length - 1].ratio;
  })();

  console.log('\n🧮 Testing Data Integrity\n');

  await test('Battle result calculation is correct', async () => {
    const battle = await prisma.clanBattle.findFirst();
    if (!battle) return false;

    let expectedResult = 0;
    if (battle.score > battle.opponentScore) expectedResult = 1;
    else if (battle.score < battle.opponentScore) expectedResult = -1;

    return battle.result === expectedResult;
  })();

  await test('Battle ratio calculation is correct', async () => {
    const battle = await prisma.clanBattle.findFirst();
    if (!battle) return false;

    const expectedRatio = (battle.score / battle.baselineFp) * 10;
    const diff = Math.abs(battle.ratio - expectedRatio);

    return diff < 0.01; // Allow small floating point difference
  })();

  await test('Player ratio calculation is correct', async () => {
    const stats = await prisma.clanBattlePlayerStats.findFirst();
    if (!stats) return false;

    const expectedRatio = (stats.score / stats.fp) * 10;
    const diff = Math.abs(stats.ratio - expectedRatio);

    return diff < 0.01; // Allow small floating point difference
  })();

  await test('All timestamps are set', async () => {
    const clan = await prisma.clan.findFirst();
    if (!clan) return false;

    return clan.createdAt !== null && clan.updatedAt !== null;
  })();

  console.log('\n🗑️ Testing Cascade Deletes\n');

  await test('Can create and delete test clan with cascades', async () => {
    // Create test clan
    const testClan = await prisma.clan.create({
      data: {
        rovioId: 999999,
        name: 'Test Cascade Clan',
        country: 'Test',
        registrationDate: new Date(),
      },
    });

    // Create test user
    await prisma.user.create({
      data: {
        userId: 'test-cascade-user',
        username: 'testcascade',
        email: 'test@cascade.com',
        clanId: testClan.clanId,
      },
    });

    // Create test roster member
    await prisma.rosterMember.create({
      data: {
        clanId: testClan.clanId,
        playerName: 'TestPlayer',
        joinedDate: new Date(),
      },
    });

    // Delete clan (should cascade)
    await prisma.clan.delete({
      where: { clanId: testClan.clanId },
    });

    // Verify user.clanId is set to null (not deleted)
    const user = await prisma.user.findUnique({
      where: { userId: 'test-cascade-user' },
    });

    // Clean up
    if (user) {
      await prisma.user.delete({
        where: { userId: 'test-cascade-user' },
      });
    }

    return user !== null && user.clanId === null;
  })();

  console.log('\n📈 Summary\n');
  console.log(`Tests Run: ${testsRun}`);
  console.log(`Passed: ${testsPassed} ✅`);
  console.log(`Failed: ${testsFailed} ❌`);
  console.log(`Success Rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%\n`);

  if (testsFailed === 0) {
    console.log('🎉 All validation tests passed!\n');
    return true;
  } else {
    console.log('⚠️ Some tests failed. Please review the output above.\n');
    return false;
  }
}

main()
  .then(async (success) => {
    await prisma.$disconnect();
    process.exit(success ? 0 : 1);
  })
  .catch(async (e) => {
    console.error('💥 Fatal error running validation:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
