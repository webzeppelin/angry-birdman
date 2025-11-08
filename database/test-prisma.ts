/**
 * Simple test script to verify Prisma Client is working correctly
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Testing Prisma Client...\n');

  // Test 1: Count clans
  const clanCount = await prisma.clan.count();
  console.log(`✅ Found ${clanCount} clans`);

  // Test 2: List action codes
  const actionCodes = await prisma.actionCode.findMany();
  console.log(`✅ Found ${actionCodes.length} action codes: ${actionCodes.map(a => a.actionCode).join(', ')}`);

  // Test 3: Get clan with users
  const clanWithUsers = await prisma.clan.findFirst({
    where: { active: true },
    include: {
      users: true,
      rosterMembers: {
        where: { active: true },
        take: 3,
      },
    },
  });
  console.log(`✅ Clan "${clanWithUsers?.name}" has ${clanWithUsers?.users.length} users and ${clanWithUsers?.rosterMembers.length} active roster members`);

  // Test 4: Get battle with stats
  const battle = await prisma.clanBattle.findFirst({
    include: {
      playerStats: true,
      nonplayerStats: true,
    },
  });
  console.log(`✅ Battle ${battle?.battleId} has ${battle?.playerStats.length} player stats and ${battle?.nonplayerStats.length} nonplayer stats`);

  // Test 5: Test relationships
  const user = await prisma.user.findFirst({
    include: {
      clan: true,
    },
  });
  console.log(`✅ User "${user?.username}" belongs to clan "${user?.clan?.name}"`);

  console.log('\n✨ All Prisma Client tests passed!\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error testing Prisma Client:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
