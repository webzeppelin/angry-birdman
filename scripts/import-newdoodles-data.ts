/**
 * Import script for Newdoodles clan battle data
 *
 * This script imports battle data from a custom CSV format into the Angry Birdman database.
 * It handles:
 * - Clan creation/lookup
 * - User ownership assignment
 * - Automatic roster management (add players, detect departures, handle kicks)
 * - Battle data import with proper calculations
 *
 * Usage: tsx scripts/import-newdoodles-data.ts
 */
/* eslint-disable no-console */

import { readFileSync } from 'fs';

import { PrismaClient } from '@prisma/client';

import {
  calculateBattleResult,
  calculateClanRatio,
  calculateAverageRatio,
  calculatePlayerRatio,
  calculateProjectedScore,
  calculateMarginRatio,
  calculateFpMargin,
  calculateNonplayingFpRatio,
  calculateReserveFpRatio,
  calculateTotalFp,
  calculateNonplayingCount,
  calculateReserveCount,
  calculateNonplayingFp,
  calculateReserveFp,
  calculatePlayerRatioRanks,
} from '../common/src/utils/calculations.js';

const prisma = new PrismaClient();

// Constants for the Newdoodles clan
const CLAN_NAME = 'Newdoodles';
const CLAN_COUNTRY = 'United States';
const CLAN_ROVIO_ID = 551148;
const OWNER_USER_ID = 'keycloak:275386a9-b13d-4cd4-a282-d44b0d6a2146';
const DATA_FILE_PATH = './scripts/data/newdoodles-battles.csv';

// Interfaces for parsed battle data
interface PlayerData {
  position: number;
  playerName: string;
  score: number;
  fp: number;
}

interface NonplayerData {
  playerName: string;
  fp: number;
  action: string;
}

interface BattleData {
  battleId: string;
  startDate: Date;
  endDate: Date;
  opponentName: string;
  opponentCountry: string;
  opponentRovioId: number;
  score: number;
  opponentScore: number;
  baselineFp: number;
  opponentFp: number;
  players: PlayerData[];
  nonplayers: NonplayerData[];
  reserves: NonplayerData[];
}

/**
 * Parse the custom CSV format for battle data
 */
function parseBattleData(content: string): BattleData[] {
  const battles: BattleData[] = [];
  const lines = content.split('\n');
  let i = 0;

  // Track opponents and assign incremental Rovio IDs
  const opponentRovioIdMap = new Map<string, number>();
  let nextRovioId = 1;

  while (i < lines.length) {
    const line = lines[i]?.trim() || '';

    // Look for Battle Header
    if (line.startsWith('Battle Id,Opponent Name')) {
      i++; // Move to battle data line
      const battleLine = lines[i]?.trim() || '';
      if (!battleLine) {
        i++;
        continue;
      }

      const battleParts = battleLine.split(',');
      const battleId = battleParts[0]?.trim() || '';
      const opponentName = battleParts[1]?.trim() || '';
      const opponentCountry = battleParts[2]?.trim() || '';
      const score = parseInt(battleParts[3]?.trim() || '0');
      const opponentScore = parseInt(battleParts[4]?.trim() || '0');
      // Skip WL Factor (calculated)
      const baselineFp = parseInt(battleParts[6]?.trim() || '0');
      const opponentFp = parseInt(battleParts[7]?.trim() || '0');
      // Skip FP Difference (calculated)

      // Assign Rovio ID based on opponent name
      let opponentRovioId = opponentRovioIdMap.get(opponentName);
      if (!opponentRovioId) {
        opponentRovioId = nextRovioId++;
        opponentRovioIdMap.set(opponentName, opponentRovioId);
      }

      // Parse dates from battleId (format: YYYYMMDD)
      const year = parseInt(battleId.substring(0, 4));
      const month = parseInt(battleId.substring(4, 6)) - 1; // JS months are 0-indexed
      const day = parseInt(battleId.substring(6, 8));
      const startDate = new Date(year, month, day);
      const endDate = new Date(year, month, day + 1); // Battles last 2 days

      i++; // Move past battle data line
      i++; // Skip blank line

      // Look for Players Header
      if (lines[i]?.trim().startsWith('Position,Player Name')) {
        i++; // Move to first player
        const players: PlayerData[] = [];

        // Parse all players until blank line
        while (i < lines.length && lines[i]?.trim() !== '') {
          const playerLine = lines[i]?.trim() || '';
          const playerParts = playerLine.split(',');

          players.push({
            position: parseInt(playerParts[0]?.trim() || '0'),
            playerName: playerParts[1]?.trim() || '',
            score: parseInt(playerParts[2]?.trim() || '0'),
            fp: parseInt(playerParts[3]?.trim() || '0'),
            // Skip Ratio and Ratio Pos (calculated)
          });

          i++;
        }

        i++; // Skip blank line

        // Look for Nonplayers section
        const nonplayers: NonplayerData[] = [];
        if (lines[i]?.trim() === 'Nonplayers:') {
          i++; // Move past header
          i++; // Skip blank line

          // Parse nonplayers until we hit blank line or Reserve section
          while (i < lines.length && lines[i]?.trim() !== '' && lines[i]?.trim() !== 'Reserve:') {
            const npLine = lines[i]?.trim() || '';
            const npParts = npLine.split(',');
            const actionRaw = npParts[2]?.trim() || '';

            nonplayers.push({
              playerName: npParts[0]?.trim() || '',
              fp: parseInt(npParts[1]?.trim() || '0'),
              action: actionRaw === '' ? 'HOLD' : actionRaw.toUpperCase(),
            });

            i++;
          }

          i++; // Skip blank line or move to Reserve
        }

        // Look for Reserve section
        const reserves: NonplayerData[] = [];
        if (lines[i]?.trim() === 'Reserve:') {
          i++; // Move past header
          i++; // Skip blank line

          // Parse reserves until we hit blank line or separator
          while (i < lines.length && lines[i]?.trim() !== '' && lines[i]?.trim() !== '---') {
            const resLine = lines[i]?.trim() || '';
            const resParts = resLine.split(',');
            const actionRaw = resParts[2]?.trim() || '';

            reserves.push({
              playerName: resParts[0]?.trim() || '',
              fp: parseInt(resParts[1]?.trim() || '0'),
              action: actionRaw === '' ? 'HOLD' : actionRaw.toUpperCase(),
            });

            i++;
          }
        }

        // Add battle to collection
        battles.push({
          battleId,
          startDate,
          endDate,
          opponentName,
          opponentCountry,
          opponentRovioId, // Assigned incrementally per unique opponent
          score,
          opponentScore,
          baselineFp,
          opponentFp,
          players,
          nonplayers,
          reserves,
        });

        // Look for separator
        while (i < lines.length && lines[i]?.trim() !== '---') {
          i++;
        }
      }
    }

    i++;
  }

  return battles;
}

/**
 * Get or create the Newdoodles clan
 */
async function getOrCreateClan(): Promise<number> {
  console.log(`\nChecking for existing clan "${CLAN_NAME}"...`);

  // Check if clan exists
  let clan = await prisma.clan.findFirst({
    where: { rovioId: CLAN_ROVIO_ID },
  });

  if (clan) {
    console.log(`✓ Found existing clan with ID: ${clan.clanId}`);
    return clan.clanId;
  }

  // Create the clan
  console.log(`Creating new clan "${CLAN_NAME}"...`);
  clan = await prisma.clan.create({
    data: {
      name: CLAN_NAME,
      country: CLAN_COUNTRY,
      rovioId: CLAN_ROVIO_ID,
      registrationDate: new Date(),
      active: true,
    },
  });

  console.log(`✓ Created clan with ID: ${clan.clanId}`);
  return clan.clanId;
}

/**
 * Assign clan ownership to the specified user
 */
async function assignClanOwnership(clanId: number): Promise<void> {
  console.log(`\nAssigning clan ownership to user ${OWNER_USER_ID}...`);

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { userId: OWNER_USER_ID },
  });

  if (!user) {
    throw new Error(`User ${OWNER_USER_ID} not found in database`);
  }

  // Update user to be clan owner
  await prisma.user.update({
    where: { userId: OWNER_USER_ID },
    data: {
      clanId,
      owner: true,
      roles: ['clan-owner'],
    },
  });

  console.log(`✓ Assigned ownership to ${user.username}`);
}

/**
 * Get roster member by name, or create if doesn't exist
 */
async function getOrCreateRosterMember(
  clanId: number,
  playerName: string,
  joinDate: Date
): Promise<number> {
  let member = await prisma.rosterMember.findFirst({
    where: {
      clanId,
      playerName,
    },
  });

  if (!member) {
    console.log(`  + Adding new roster member: ${playerName}`);
    member = await prisma.rosterMember.create({
      data: {
        clanId,
        playerName,
        active: true,
        joinedDate: joinDate,
      },
    });
  }

  return member.playerId;
}

/**
 * Detect and handle players who left before the battle
 */
async function handleDepartures(
  clanId: number,
  battleStartDate: Date,
  currentBattlePlayers: Set<string>
): Promise<void> {
  // Get all currently active roster members
  const activeMembers = await prisma.rosterMember.findMany({
    where: {
      clanId,
      active: true,
    },
  });

  const leftDate = new Date(battleStartDate);
  leftDate.setDate(leftDate.getDate() - 1); // Day before battle

  for (const member of activeMembers) {
    if (!currentBattlePlayers.has(member.playerName)) {
      console.log(
        `  - Detected departure: ${member.playerName} (left ${leftDate.toISOString().split('T')[0]})`
      );
      await prisma.rosterMember.update({
        where: { playerId: member.playerId },
        data: {
          active: false,
          leftDate: leftDate,
        },
      });
    }
  }
}

/**
 * Handle kick actions
 */
async function handleKicks(clanId: number, kickDate: Date, playerName: string): Promise<void> {
  const member = await prisma.rosterMember.findFirst({
    where: {
      clanId,
      playerName,
      active: true,
    },
  });

  if (member) {
    console.log(`  × Kicking player: ${playerName}`);
    await prisma.rosterMember.update({
      where: { playerId: member.playerId },
      data: {
        active: false,
        kickedDate: kickDate,
      },
    });
  }
}

/**
 * Handle Left actions (player left during battle without playing)
 */
async function handleLeft(clanId: number, leftDate: Date, playerName: string): Promise<void> {
  const member = await prisma.rosterMember.findFirst({
    where: {
      clanId,
      playerName,
      active: true,
    },
  });

  if (member) {
    console.log(`  - Player left during battle: ${playerName}`);
    await prisma.rosterMember.update({
      where: { playerId: member.playerId },
      data: {
        active: false,
        leftDate: leftDate,
      },
    });
  }
}

/**
 * Import a single battle
 */
async function importBattle(clanId: number, battle: BattleData): Promise<void> {
  console.log(`\n== Processing Battle ${battle.battleId} vs ${battle.opponentName} ==`);

  // Check if battle already exists
  const existingBattle = await prisma.clanBattle.findUnique({
    where: {
      clanId_battleId: {
        clanId,
        battleId: battle.battleId,
      },
    },
  });

  if (existingBattle) {
    console.log(`⊘ Battle ${battle.battleId} already exists, skipping...`);
    return;
  }

  // Build set of all players in this battle (for detecting departures)
  const allPlayerNames = new Set<string>();

  for (const player of battle.players) {
    allPlayerNames.add(player.playerName);
  }

  for (const np of battle.nonplayers) {
    allPlayerNames.add(np.playerName);
  }

  for (const res of battle.reserves) {
    allPlayerNames.add(res.playerName);
  }

  // Detect and handle departures before processing this battle
  await handleDepartures(clanId, battle.startDate, allPlayerNames);

  // Get or create roster members for all players
  const dayBeforeBattle = new Date(battle.startDate);
  dayBeforeBattle.setDate(dayBeforeBattle.getDate() - 1);

  const playerIdMap = new Map<string, number>();

  // Process playing members
  for (const player of battle.players) {
    const playerId = await getOrCreateRosterMember(clanId, player.playerName, dayBeforeBattle);
    playerIdMap.set(player.playerName, playerId);
  }

  // Process non-playing members
  for (const np of battle.nonplayers) {
    const playerId = await getOrCreateRosterMember(clanId, np.playerName, dayBeforeBattle);
    playerIdMap.set(np.playerName, playerId);
  }

  // Process reserve members
  for (const res of battle.reserves) {
    const playerId = await getOrCreateRosterMember(clanId, res.playerName, dayBeforeBattle);
    playerIdMap.set(res.playerName, playerId);
  }

  // Calculate player stats with ratios and ratio ranks
  const playerStats = battle.players.map((p) => {
    const playerId = playerIdMap.get(p.playerName);
    if (!playerId) {
      throw new Error(`Player ID not found for ${p.playerName}`);
    }
    return {
      playerId,
      playerName: p.playerName,
      rank: p.position,
      score: p.score,
      fp: p.fp,
      ratio: calculatePlayerRatio(p.score, p.fp),
    };
  });

  const rankedStats = calculatePlayerRatioRanks(playerStats);

  // Calculate battle-level stats
  const nonplayerStats = [
    ...battle.nonplayers.map((np) => ({ fp: np.fp, reserve: false })),
    ...battle.reserves.map((res) => ({ fp: res.fp, reserve: true })),
  ];

  const totalFp = calculateTotalFp(
    battle.players.map((p) => ({ fp: p.fp })),
    nonplayerStats
  );

  const nonplayingFp = calculateNonplayingFp(nonplayerStats);
  const reserveFp = calculateReserveFp(nonplayerStats);
  const nonplayingCount = calculateNonplayingCount(nonplayerStats);
  const reserveCount = calculateReserveCount(nonplayerStats);

  const result = calculateBattleResult(battle.score, battle.opponentScore);
  const ratio = calculateClanRatio(battle.score, battle.baselineFp);
  const averageRatio = calculateAverageRatio(battle.score, totalFp);
  const nonplayingFpRatio = calculateNonplayingFpRatio(nonplayingFp, totalFp);
  const projectedScore = calculateProjectedScore(battle.score, nonplayingFpRatio);
  const marginRatio = calculateMarginRatio(battle.score, battle.opponentScore);
  const fpMargin = calculateFpMargin(battle.baselineFp, battle.opponentFp);
  const reserveFpRatio = calculateReserveFpRatio(reserveFp, totalFp);

  console.log(
    `  Score: ${battle.score} - ${battle.opponentScore} (${result === 1 ? 'WIN' : result === -1 ? 'LOSS' : 'TIE'})`
  );
  console.log(`  Ratio: ${ratio.toFixed(2)} | Avg Ratio: ${averageRatio.toFixed(2)}`);

  // Create the battle
  await prisma.clanBattle.create({
    data: {
      clanId,
      battleId: battle.battleId,
      startDate: battle.startDate,
      endDate: battle.endDate,
      result,
      score: battle.score,
      fp: totalFp,
      baselineFp: battle.baselineFp,
      ratio,
      averageRatio,
      projectedScore,
      opponentName: battle.opponentName,
      opponentRovioId: battle.opponentRovioId,
      opponentCountry: battle.opponentCountry,
      opponentScore: battle.opponentScore,
      opponentFp: battle.opponentFp,
      marginRatio,
      fpMargin,
      nonplayingCount,
      nonplayingFpRatio,
      reserveCount,
      reserveFpRatio,
    },
  });

  // Create player stats
  for (const stat of rankedStats) {
    await prisma.clanBattlePlayerStats.create({
      data: {
        clanId,
        battleId: battle.battleId,
        playerId: stat.playerId,
        rank: stat.rank,
        score: stat.score,
        fp: stat.fp,
        ratio: stat.ratio,
        ratioRank: stat.ratioRank,
        actionCode: 'HOLD', // "You play, you stay" policy
        actionReason: null,
      },
    });
  }

  // Create nonplayer stats (non-reserves)
  for (const np of battle.nonplayers) {
    const playerId = playerIdMap.get(np.playerName);
    if (!playerId) continue;

    const actionCode = np.action && np.action !== '' ? np.action : 'HOLD';

    await prisma.clanBattleNonplayerStats.create({
      data: {
        clanId,
        battleId: battle.battleId,
        playerId,
        fp: np.fp,
        reserve: false,
        actionCode,
        actionReason: null,
      },
    });

    // Handle kicks and lefts
    if (np.action === 'KICK') {
      await handleKicks(clanId, battle.endDate, np.playerName);
    } else if (np.action === 'LEFT') {
      await handleLeft(clanId, battle.startDate, np.playerName);
    }
  }

  // Create reserve stats
  for (const res of battle.reserves) {
    const playerId = playerIdMap.get(res.playerName);
    if (!playerId) continue;

    const actionCode = res.action && res.action !== '' ? res.action : 'HOLD';

    await prisma.clanBattleNonplayerStats.create({
      data: {
        clanId,
        battleId: battle.battleId,
        playerId,
        fp: res.fp,
        reserve: true,
        actionCode,
        actionReason: null,
      },
    });
  }

  console.log(`✓ Battle ${battle.battleId} imported successfully`);
}

/**
 * Main import function
 */
async function main() {
  try {
    console.log('========================================');
    console.log('Newdoodles Battle Data Import');
    console.log('========================================');

    // Read and parse the CSV file
    console.log(`\nReading data from: ${DATA_FILE_PATH}`);
    const content = readFileSync(DATA_FILE_PATH, 'utf-8');
    const battles = parseBattleData(content);
    console.log(`✓ Parsed ${battles.length} battles`);

    // Get or create clan
    const clanId = await getOrCreateClan();

    // Assign ownership
    await assignClanOwnership(clanId);

    // Import each battle in order
    for (const battle of battles) {
      await importBattle(clanId, battle);
    }

    console.log('\n========================================');
    console.log('✓ Import completed successfully!');
    console.log('========================================\n');
  } catch (error) {
    console.error('\n========================================');
    console.error('✗ Import failed:');
    console.error(error);
    console.error('========================================\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
void main();
