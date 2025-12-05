/* eslint-disable no-console */
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import pg from 'pg';

import { PrismaClient } from '../database/generated/client/client.js';

// Load environment variables
dotenv.config({ path: './database/prisma/.env' });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function verifyImport() {
  console.log('=== Verifying Newdoodles Import ===\n');

  // Get clan
  const clan = await prisma.clan.findFirst({
    where: { rovioId: 551148 },
    include: {
      users: true,
    },
  });

  if (!clan) {
    console.log('✗ Clan not found!');
    return;
  }

  console.log(`✓ Clan: ${clan.name} (ID: ${clan.clanId})`);
  console.log(`  Owner: ${clan.users.find((u) => u.owner)?.username || 'None'}\n`);

  // Get roster count
  const activeRoster = await prisma.rosterMember.count({
    where: { clanId: clan.clanId, active: true },
  });

  const inactiveRoster = await prisma.rosterMember.count({
    where: { clanId: clan.clanId, active: false },
  });

  console.log(`✓ Roster: ${activeRoster} active, ${inactiveRoster} inactive\n`);

  // Get battles
  const battles = await prisma.clanBattle.findMany({
    where: { clanId: clan.clanId },
    orderBy: { battleId: 'asc' },
    include: {
      _count: {
        select: {
          playerStats: true,
          nonplayerStats: true,
        },
      },
    },
  });

  console.log(`✓ Battles: ${battles.length} imported\n`);

  for (const battle of battles) {
    const resultStr = battle.result === 1 ? 'WIN' : battle.result === -1 ? 'LOSS' : 'TIE';
    console.log(
      `  ${battle.battleId} vs ${battle.opponentName} (Rovio ID: ${battle.opponentRovioId})`
    );
    console.log(`    Score: ${battle.score} - ${battle.opponentScore} (${resultStr})`);
    console.log(
      `    Ratio: ${battle.ratio.toFixed(2)} | Avg Ratio: ${battle.averageRatio.toFixed(2)}`
    );
    console.log(
      `    Players: ${battle._count.playerStats}, Nonplayers: ${battle._count.nonplayerStats}`
    );
  }

  console.log('\n=== Import Verified Successfully! ===');

  await prisma.$disconnect();
}

verifyImport().catch(console.error);
