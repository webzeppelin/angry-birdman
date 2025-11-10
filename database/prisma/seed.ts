/**
 * Database Seed Script for Angry Birdman
 *
 * This script populates the database with sample data for development and testing:
 * - Action codes (HOLD, WARN, KICK, RESERVE, PASS)
 * - Sample clans with realistic data
 * - Test users with different roles
 * - Roster members for each clan
 * - Sample battles with player and nonplayer stats
 * - Monthly and yearly performance summaries
 *
 * Run with: npm run seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // ============================================================================
  // 1. Seed Action Codes
  // ============================================================================
  console.log('📋 Seeding action codes...');
  const actionCodes = [
    { actionCode: 'HOLD', displayName: 'Hold' },
    { actionCode: 'WARN', displayName: 'Warn' },
    { actionCode: 'KICK', displayName: 'Kick' },
    { actionCode: 'RESERVE', displayName: 'Move to Reserve' },
    { actionCode: 'PASS', displayName: 'Pass' },
  ];

  for (const code of actionCodes) {
    await prisma.actionCode.upsert({
      where: { actionCode: code.actionCode },
      update: {},
      create: code,
    });
  }
  console.log(`✅ Created ${actionCodes.length} action codes\n`);

  // ============================================================================
  // 2. Seed Sample Clans
  // ============================================================================
  console.log('🏛️ Seeding clans...');

  // Reset clan sequence to start at 54 for consistency with test users
  // This ensures test users created with clanId 54, 55, 56 will work correctly
  await prisma.$executeRaw`ALTER SEQUENCE clans_clan_id_seq RESTART WITH 54`;
  console.log('   Reset clan ID sequence to start at 54');

  const clan1 = await prisma.clan.upsert({
    where: { rovioId: 123456 },
    update: {},
    create: {
      rovioId: 123456,
      name: 'Angry Avengers',
      country: 'United States',
      registrationDate: new Date('2024-01-15'),
      active: true,
    },
  });

  const clan2 = await prisma.clan.upsert({
    where: { rovioId: 789012 },
    update: {},
    create: {
      rovioId: 789012,
      name: 'Feather Fury',
      country: 'Canada',
      registrationDate: new Date('2024-02-01'),
      active: true,
    },
  });

  await prisma.clan.upsert({
    where: { rovioId: 345678 },
    update: {},
    create: {
      rovioId: 345678,
      name: 'Bird Brain Battalion',
      country: 'United Kingdom',
      registrationDate: new Date('2024-03-10'),
      active: false, // Inactive clan for testing
    },
  });

  console.log(`✅ Created 3 clans\n`);

  // ============================================================================
  // 3. Seed Users
  // ============================================================================
  console.log('👥 Seeding users...');

  // Clan Owner for Angry Avengers
  await prisma.user.upsert({
    where: { userId: 'user-001' },
    update: {},
    create: {
      userId: 'user-001',
      username: 'angryowner',
      email: 'owner@angryavengers.com',
      clanId: clan1.clanId,
      owner: true,
    },
  });

  // Clan Admin for Angry Avengers
  await prisma.user.upsert({
    where: { userId: 'user-002' },
    update: {},
    create: {
      userId: 'user-002',
      username: 'angryadmin',
      email: 'admin@angryavengers.com',
      clanId: clan1.clanId,
      owner: false,
    },
  });

  // Clan Owner for Feather Fury
  await prisma.user.upsert({
    where: { userId: 'user-003' },
    update: {},
    create: {
      userId: 'user-003',
      username: 'featherboss',
      email: 'boss@featherfury.ca',
      clanId: clan2.clanId,
      owner: true,
    },
  });

  // Superadmin (not associated with any clan)
  await prisma.user.upsert({
    where: { userId: 'superadmin-001' },
    update: {},
    create: {
      userId: 'superadmin-001',
      username: 'superadmin',
      email: 'admin@angrybirdman.com',
      clanId: null,
      owner: false,
    },
  });

  console.log(`✅ Created 4 users\n`);

  // ============================================================================
  // 4. Seed Roster Members for Angry Avengers
  // ============================================================================
  console.log('🎮 Seeding roster members for Angry Avengers...');

  const rosterMembers = [
    { playerName: 'RedWarrior', fp: 3500, active: true },
    { playerName: 'BlueBlaster', fp: 3200, active: true },
    { playerName: 'YellowFlash', fp: 2800, active: true },
    { playerName: 'BlackBomber', fp: 2500, active: true },
    { playerName: 'WhiteWizard', fp: 2200, active: true },
    { playerName: 'GreenGunner', fp: 1800, active: true },
    { playerName: 'PinkPower', fp: 1500, active: true },
    { playerName: 'OrangeObliterator', fp: 1200, active: true },
    { playerName: 'PurplePhoenix', fp: 1000, active: true },
    { playerName: 'TealTornado', fp: 800, active: true },
    // Some inactive/reserve players
    { playerName: 'ReserveRed', fp: 150, active: true }, // Reserve player
    { playerName: 'ReserveBlue', fp: 120, active: true }, // Reserve player
    { playerName: 'FormerMember', fp: 2000, active: false, leftDate: new Date('2024-10-15') },
    { playerName: 'KickedPlayer', fp: 1500, active: false, kickedDate: new Date('2024-09-20') },
  ];

  const createdPlayers = [];
  for (const member of rosterMembers) {
    const player = await prisma.rosterMember.create({
      data: {
        clanId: clan1.clanId,
        playerName: member.playerName,
        active: member.active,
        joinedDate: new Date('2024-01-15'),
        leftDate: member.leftDate || null,
        kickedDate: member.kickedDate || null,
      },
    });
    createdPlayers.push({ ...player, fp: member.fp });
  }

  console.log(`✅ Created ${rosterMembers.length} roster members\n`);

  // ============================================================================
  // 5. Seed Sample Battles for Angry Avengers
  // ============================================================================
  console.log('⚔️ Seeding sample battles...');

  // Battle 1 - Recent battle (Won)
  const battle1Date = new Date('2024-11-01');
  const battle1Id = '20241101';

  // Only active non-reserve players (first 10)
  const activePlayers = createdPlayers.slice(0, 10);
  // Reserve players (next 2)
  const reservePlayers = createdPlayers.slice(10, 12);

  // Calculate battle metrics for Battle 1
  // Players 1-8 played, players 9-10 didn't play (non-reserve), players 11-12 in reserve
  const playingMembers = activePlayers.slice(0, 8);
  const nonPlayingNonReserve = activePlayers.slice(8, 10);

  // Calculate scores (higher FP = higher base score with some variation)
  const playerStats1 = playingMembers.map((player, index) => ({
    playerId: player.playerId,
    fp: player.fp,
    score: Math.floor(player.fp * 25 + Math.random() * player.fp * 5),
    rank: index + 1,
  }));

  const totalScore = playerStats1.reduce((sum, p) => sum + p.score, 0);
  const totalFp =
    playingMembers.reduce((sum, p) => sum + p.fp, 0) +
    nonPlayingNonReserve.reduce((sum, p) => sum + p.fp, 0);
  const baselineFp = 20000;
  const ratio = (totalScore / baselineFp) * 10;
  const averageRatio = (totalScore / totalFp) * 10;

  const opponentScore = totalScore - 5000; // We won
  const marginRatio = ((totalScore - opponentScore) / totalScore) * 100;
  const opponentFp = 18500;
  const fpMargin = ((baselineFp - opponentFp) / baselineFp) * 100;

  const nonplayingFpSum = nonPlayingNonReserve.reduce((sum, p) => sum + p.fp, 0);
  const nonplayingFpRatio = (nonplayingFpSum / totalFp) * 100;

  const reserveFpSum = reservePlayers.reduce((sum, p) => sum + p.fp, 0);
  const reserveFpRatio = (reserveFpSum / (totalFp + reserveFpSum)) * 100;

  const projectedScore = (1 + nonplayingFpRatio / 100) * totalScore;

  await prisma.clanBattle.create({
    data: {
      clanId: clan1.clanId,
      battleId: battle1Id,
      startDate: battle1Date,
      endDate: new Date('2024-11-02'),
      result: 1, // Win
      score: totalScore,
      fp: totalFp,
      baselineFp: baselineFp,
      ratio: ratio,
      averageRatio: averageRatio,
      projectedScore: projectedScore,
      opponentName: 'Rival Ravens',
      opponentRovioId: 999001,
      opponentCountry: 'Germany',
      opponentScore: opponentScore,
      opponentFp: opponentFp,
      marginRatio: marginRatio,
      fpMargin: fpMargin,
      nonplayingCount: nonPlayingNonReserve.length,
      nonplayingFpRatio: nonplayingFpRatio,
      reserveCount: reservePlayers.length,
      reserveFpRatio: reserveFpRatio,
    },
  });

  // Calculate ratio ranks first
  const sortedByRatio = [...playerStats1]
    .map((p) => ({ ...p, ratio: (p.score / p.fp) * 10 }))
    .sort((a, b) => b.ratio - a.ratio);

  const ratioRanks = new Map(sortedByRatio.map((p, index) => [p.playerId, index + 1]));

  // Add player stats
  for (const player of playerStats1) {
    const calculatedRatio = (player.score / player.fp) * 10;
    await prisma.clanBattlePlayerStats.create({
      data: {
        clanId: clan1.clanId,
        battleId: battle1Id,
        playerId: player.playerId,
        rank: player.rank,
        score: player.score,
        fp: player.fp,
        ratio: calculatedRatio,
        ratioRank: ratioRanks.get(player.playerId) || 1,
        actionCode: 'HOLD', // All good performers held
        actionReason: null,
      },
    });
  }

  // Add nonplayer stats (non-reserve)
  for (const player of nonPlayingNonReserve) {
    await prisma.clanBattleNonplayerStats.create({
      data: {
        clanId: clan1.clanId,
        battleId: battle1Id,
        playerId: player.playerId,
        fp: player.fp,
        reserve: false,
        actionCode: 'WARN',
        actionReason: 'Missed battle',
      },
    });
  }

  // Add nonplayer stats (reserve)
  for (const player of reservePlayers) {
    await prisma.clanBattleNonplayerStats.create({
      data: {
        clanId: clan1.clanId,
        battleId: battle1Id,
        playerId: player.playerId,
        fp: player.fp,
        reserve: true,
        actionCode: 'RESERVE',
        actionReason: 'Kept in reserve for FP management',
      },
    });
  }

  console.log(`✅ Created 1 battle with player and nonplayer stats\n`);

  // ============================================================================
  // 6. Seed Monthly Performance Summary
  // ============================================================================
  console.log('📊 Seeding monthly performance summary...');

  await prisma.monthlyClanPerformance.create({
    data: {
      clanId: clan1.clanId,
      monthId: '202411',
      battleCount: 1,
      wonCount: 1,
      lostCount: 0,
      tiedCount: 0,
      monthComplete: false,
      averageFp: totalFp,
      averageBaselineFp: baselineFp,
      averageRatio: ratio,
      averageMarginRatio: marginRatio,
      averageFpMargin: fpMargin,
      averageNonplayingCount: nonPlayingNonReserve.length,
      averageNonplayingFpRatio: nonplayingFpRatio,
      averageReserveCount: reservePlayers.length,
      averageReserveFpRatio: reserveFpRatio,
    },
  });

  console.log(`✅ Created monthly clan performance summary\n`);

  // ============================================================================
  // 7. Seed Roster Members for Feather Fury (minimal)
  // ============================================================================
  console.log('🎮 Seeding roster members for Feather Fury...');

  const clan2Members = [
    { playerName: 'FeatherLeader', active: true },
    { playerName: 'FeatherWarrior', active: true },
    { playerName: 'FeatherScout', active: true },
  ];

  for (const member of clan2Members) {
    await prisma.rosterMember.create({
      data: {
        clanId: clan2.clanId,
        playerName: member.playerName,
        active: member.active,
        joinedDate: new Date('2024-02-01'),
      },
    });
  }

  console.log(`✅ Created ${clan2Members.length} roster members for Feather Fury\n`);

  // ============================================================================
  // Summary
  // ============================================================================
  console.log('✨ Database seed completed successfully!\n');
  console.log('Summary:');
  console.log(`  - ${actionCodes.length} action codes`);
  console.log(`  - 3 clans (2 active, 1 inactive)`);
  console.log(`  - 4 users (2 owners, 1 admin, 1 superadmin)`);
  console.log(`  - ${rosterMembers.length + clan2Members.length} roster members`);
  console.log(`  - 1 battle with complete stats`);
  console.log(`  - 1 monthly performance summary\n`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
