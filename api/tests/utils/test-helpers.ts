import { type FastifyInstance } from 'fastify';

import { prisma } from '../setup';

import { buildApp } from '@/app';

/**
 * Create a test instance of the Fastify application
 */
export async function createTestApp(): Promise<FastifyInstance> {
  // Set test environment before building app
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'silent';

  const app = await buildApp();

  // App already has prisma decorated by database plugin
  // It will use the DATABASE_URL from environment

  await app.ready();
  return app;
}

/**
 * Factory functions for creating test data
 */
export const testData = {
  /**
   * Create a test clan
   */
  async createClan(data: { name: string; rovioId?: number; country?: string; active?: boolean }) {
    return prisma.clan.create({
      data: {
        name: data.name,
        rovioId: data.rovioId || Math.floor(Math.random() * 1000000),
        country: data.country || 'US',
        active: data.active ?? true,
      },
    });
  },

  /**
   * Create a test user
   */
  async createUser(data: {
    userId: string;
    email: string;
    username: string;
    clanId?: number;
    owner?: boolean;
  }) {
    return prisma.user.create({
      data: {
        userId: data.userId,
        email: data.email,
        username: data.username,
        clanId: data.clanId || null,
        owner: data.owner ?? false,
      },
    });
  },

  /**
   * Create a test roster member
   */
  async createRosterMember(data: { clanId: number; playerName: string; active?: boolean }) {
    return prisma.rosterMember.create({
      data: {
        clanId: data.clanId,
        playerName: data.playerName,
        active: data.active ?? true,
        joinedDate: new Date(),
      },
    });
  },

  /**
   * Create a test clan battle with calculated fields
   */
  async createClanBattle(data: {
    battleId: string;
    clanId: number;
    startDate: Date;
    endDate: Date;
    score: number;
    baselineFp: number;
    opponentName: string;
    opponentScore: number;
    opponentFp: number;
  }) {
    // Calculate required fields
    const result = data.score > data.opponentScore ? 1 : data.score < data.opponentScore ? -1 : 0;
    const ratio = (data.score / data.baselineFp) * 10;
    const averageRatio = (data.score / data.baselineFp) * 10; // Simplified for test
    const marginRatio = ((data.score - data.opponentScore) / data.score) * 100;
    const fpMargin = ((data.baselineFp - data.opponentFp) / data.baselineFp) * 100;

    return prisma.clanBattle.create({
      data: {
        battleId: data.battleId,
        clanId: data.clanId,
        startDate: data.startDate,
        endDate: data.endDate,
        result,
        score: data.score,
        fp: data.baselineFp,
        baselineFp: data.baselineFp,
        ratio,
        averageRatio,
        projectedScore: data.score, // Simplified
        opponentRovioId: Math.floor(Math.random() * 1000000),
        opponentName: data.opponentName,
        opponentCountry: 'US',
        opponentScore: data.opponentScore,
        opponentFp: data.opponentFp,
        marginRatio,
        fpMargin,
        nonplayingCount: 0,
        nonplayingFpRatio: 0,
        reserveCount: 0,
        reserveFpRatio: 0,
      },
    });
  },

  /**
   * Create test player stats for a battle
   * Note: Must create corresponding RosterMember first
   */
  async createPlayerStats(data: {
    battleId: string;
    clanId: number;
    playerId: number;
    rank: number;
    score: number;
    fp: number;
    actionCode?: string;
  }) {
    // Calculate ratio
    const ratio = (data.score / data.fp) * 10;

    return prisma.clanBattlePlayerStats.create({
      data: {
        battleId: data.battleId,
        clanId: data.clanId,
        playerId: data.playerId,
        rank: data.rank,
        score: data.score,
        fp: data.fp,
        ratio,
        ratioRank: data.rank, // Simplified for test data
        actionCode: data.actionCode || 'HOLD',
      },
    });
  },

  /**
   * Create action code lookup entry
   */
  async createActionCodeLookup(actionCode: string, displayName: string) {
    return prisma.actionCode.create({
      data: {
        actionCode,
        displayName,
      },
    });
  },
};

/**
 * Generate a mock JWT token for testing
 * Note: This creates a token structure but won't be cryptographically valid
 * For actual auth testing, use Keycloak test tokens
 */
export function createMockJWT(payload: {
  sub: string;
  email: string;
  preferred_username: string;
  clanId?: number;
  realm_access?: { roles: string[] };
}) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  ).toString('base64url');
  const signature = 'mock-signature';

  return `${header}.${body}.${signature}`;
}

/**
 * Sleep utility for async test delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
