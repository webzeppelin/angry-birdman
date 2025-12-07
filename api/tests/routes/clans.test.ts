import { type FastifyInstance } from 'fastify';
import { describe, it, expect, beforeEach } from 'vitest';

import { buildApp } from '../../src/app';
import {
  createAuthenticatedHeaders,
  createTestUser,
  createTestSuperadmin,
} from '../helpers/auth-helper';
import { prisma } from '../setup';

describe('Clan Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApp();
  });

  describe('GET /api/clans', () => {
    it('should return empty array when no clans exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/clans',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as { clans: unknown[]; pagination: { total: number } };
      expect(body).toHaveProperty('clans');
      expect(body).toHaveProperty('pagination');
      expect(body.clans).toEqual([]);
      expect(body.pagination.total).toBe(0);
    });

    it('should return list of clans with battle counts', async () => {
      // Create test clans
      const clan1 = await prisma.clan.create({
        data: {
          rovioId: 123456,
          name: 'Test Clan Alpha',
          country: 'US',
          registrationDate: new Date('2025-01-01'),
        },
      });

      await prisma.clan.create({
        data: {
          rovioId: 789012,
          name: 'Test Clan Beta',
          country: 'UK',
          registrationDate: new Date('2025-01-15'),
        },
      });

      // Create master battle first (required for foreign key constraint)
      await prisma.masterBattle.create({
        data: {
          battleId: '20250101',
          startTimestamp: new Date('2025-01-01T05:00:00.000Z'),
          endTimestamp: new Date('2025-01-03T04:59:59.999Z'),
        },
      });

      // Create some battles for clan1
      await prisma.clanBattle.create({
        data: {
          clanId: clan1.clanId,
          battleId: '20250101',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-02'),
          result: 1,
          score: 50000,
          fp: 40000,
          baselineFp: 40000,
          ratio: 12.5,
          averageRatio: 12.5,
          projectedScore: 50000,
          opponentRovioId: 999999,
          opponentName: 'Opponent',
          opponentCountry: 'CA',
          opponentScore: 45000,
          opponentFp: 38000,
          marginRatio: 10.0,
          fpMargin: 5.0,
          nonplayingCount: 0,
          nonplayingFpRatio: 0,
          reserveCount: 0,
          reserveFpRatio: 0,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/clans',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.clans).toHaveLength(2);
      expect(body.clans[0]).toMatchObject({
        rovioId: 123456,
        name: 'Test Clan Alpha',
        country: 'US',
      });
      expect(body.clans[0].battleCount).toBe(1);
      expect(body.clans[1].battleCount).toBe(0);
    });

    it('should filter clans by search term', async () => {
      await prisma.clan.create({
        data: {
          rovioId: 123456,
          name: 'Alpha Clan',
          country: 'US',
          registrationDate: new Date('2025-01-01'),
        },
      });

      await prisma.clan.create({
        data: {
          rovioId: 789012,
          name: 'Beta Squad',
          country: 'UK',
          registrationDate: new Date('2025-01-15'),
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/clans?search=alpha',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.clans).toHaveLength(1);
      expect(body.clans[0].name).toBe('Alpha Clan');
    });

    it('should filter clans by country', async () => {
      await prisma.clan.create({
        data: {
          rovioId: 123456,
          name: 'US Clan',
          country: 'US',
          registrationDate: new Date('2025-01-01'),
        },
      });

      await prisma.clan.create({
        data: {
          rovioId: 789012,
          name: 'UK Clan',
          country: 'UK',
          registrationDate: new Date('2025-01-15'),
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/clans?country=UK',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.clans).toHaveLength(1);
      expect(body.clans[0].country).toBe('UK');
    });

    it('should filter by active status', async () => {
      await prisma.clan.create({
        data: {
          rovioId: 123456,
          name: 'Active Clan',
          country: 'US',
          active: true,
          registrationDate: new Date('2025-01-01'),
        },
      });

      await prisma.clan.create({
        data: {
          rovioId: 789012,
          name: 'Inactive Clan',
          country: 'UK',
          active: false,
          registrationDate: new Date('2025-01-15'),
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/clans?active=true',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.clans).toHaveLength(1);
      expect(body.clans[0].active).toBe(true);
    });

    it('should paginate results correctly', async () => {
      // Create 5 clans
      for (let i = 1; i <= 5; i++) {
        await prisma.clan.create({
          data: {
            rovioId: 100000 + i,
            name: `Clan ${i}`,
            country: 'US',
            registrationDate: new Date('2025-01-01'),
          },
        });
      }

      // Get first page (limit 3)
      const response1 = await app.inject({
        method: 'GET',
        url: '/api/clans?limit=3&page=1',
      });

      expect(response1.statusCode).toBe(200);
      const body1 = JSON.parse(response1.body);
      expect(body1.clans).toHaveLength(3);
      expect(body1.pagination).toMatchObject({
        total: 5,
        page: 1,
        limit: 3,
        totalPages: 2,
      });

      // Get second page
      const response2 = await app.inject({
        method: 'GET',
        url: '/api/clans?limit=3&page=2',
      });

      expect(response2.statusCode).toBe(200);
      const body2 = JSON.parse(response2.body);
      expect(body2.clans).toHaveLength(2);
      expect(body2.pagination.page).toBe(2);
    });

    it('should sort clans by name', async () => {
      await prisma.clan.create({
        data: {
          rovioId: 123456,
          name: 'Zulu Clan',
          country: 'US',
          registrationDate: new Date('2025-01-01'),
        },
      });

      await prisma.clan.create({
        data: {
          rovioId: 789012,
          name: 'Alpha Clan',
          country: 'UK',
          registrationDate: new Date('2025-01-15'),
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/clans?sortBy=name&sortOrder=asc',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.clans[0].name).toBe('Alpha Clan');
      expect(body.clans[1].name).toBe('Zulu Clan');
    });
  });

  describe('GET /api/clans/:clanId', () => {
    it('should return clan details with statistics', async () => {
      const clan = await prisma.clan.create({
        data: {
          rovioId: 123456,
          name: 'Test Clan',
          country: 'US',
          registrationDate: new Date('2025-01-01'),
        },
      });

      // Create master battle first (required for foreign key constraint)
      await prisma.masterBattle.create({
        data: {
          battleId: '20250101',
          startTimestamp: new Date('2025-01-01T05:00:00.000Z'),
          endTimestamp: new Date('2025-01-03T04:59:59.999Z'),
        },
      });

      // Add battle
      await prisma.clanBattle.create({
        data: {
          clanId: clan.clanId,
          battleId: '20250101',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-02'),
          result: 1,
          score: 50000,
          fp: 40000,
          baselineFp: 40000,
          ratio: 12.5,
          averageRatio: 12.5,
          projectedScore: 50000,
          opponentRovioId: 999999,
          opponentName: 'Opponent',
          opponentCountry: 'CA',
          opponentScore: 45000,
          opponentFp: 38000,
          marginRatio: 10.0,
          fpMargin: 5.0,
          nonplayingCount: 0,
          nonplayingFpRatio: 0,
          reserveCount: 0,
          reserveFpRatio: 0,
        },
      });

      // Add roster members
      await prisma.rosterMember.create({
        data: {
          clanId: clan.clanId,
          playerName: 'Player One',
          joinedDate: new Date('2025-01-01'),
          active: true,
        },
      });

      await prisma.rosterMember.create({
        data: {
          clanId: clan.clanId,
          playerName: 'Player Two',
          joinedDate: new Date('2025-01-05'),
          active: false,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/clans/${clan.clanId}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toMatchObject({
        clanId: clan.clanId,
        rovioId: 123456,
        name: 'Test Clan',
        country: 'US',
        active: true,
      });
      expect(body.stats.totalBattles).toBe(1);
      expect(body.stats.activePlayers).toBe(1);
      expect(body.stats.totalPlayers).toBe(2);
    });

    it('should return 404 for non-existent clan', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/clans/99999',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('not found');
    });

    it('should return 400 for invalid clan ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/clans/invalid',
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/clans', () => {
    it('should create new clan when authenticated', async () => {
      // Create test user in database
      const user = await prisma.user.create({
        data: {
          userId: 'test-user-id',
          username: 'testuser',
          email: 'test@example.com',
        },
      });

      // Create authenticated headers with test user
      const testUser = createTestUser({
        sub: user.userId,
        preferred_username: user.username,
        email: user.email,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/clans',
        headers: createAuthenticatedHeaders(app, testUser),
        payload: {
          rovioId: 123456,
          name: 'New Clan',
          country: 'US',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toMatchObject({
        rovioId: 123456,
        name: 'New Clan',
        country: 'US',
      });
      expect(body.clanId).toBeDefined();

      // Verify user is now owner
      const updatedUser = await prisma.user.findUnique({
        where: { userId: user.userId },
      });
      expect(updatedUser?.owner).toBe(true);
      expect(updatedUser?.clanId).toBe(body.clanId);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/clans',
        payload: {
          rovioId: 123456,
          name: 'New Clan',
          country: 'US',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 400 for invalid payload', async () => {
      const user = await prisma.user.create({
        data: {
          userId: 'test-user-id-2',
          username: 'testuser2',
          email: 'test2@example.com',
        },
      });

      const testUser = createTestUser({
        sub: user.userId,
        preferred_username: user.username,
        email: user.email,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/clans',
        headers: createAuthenticatedHeaders(app, testUser),
        payload: {
          // Missing required fields
          name: 'New Clan',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 409 if rovioId already exists', async () => {
      // Create existing clan
      await prisma.clan.create({
        data: {
          rovioId: 123456,
          name: 'Existing Clan',
          country: 'US',
          registrationDate: new Date(),
        },
      });

      const user = await prisma.user.create({
        data: {
          userId: 'test-user-id-3',
          username: 'testuser3',
          email: 'test3@example.com',
        },
      });

      const testUser = createTestUser({
        sub: user.userId,
        preferred_username: user.username,
        email: user.email,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/clans',
        headers: createAuthenticatedHeaders(app, testUser),
        payload: {
          rovioId: 123456,
          name: 'New Clan',
          country: 'US',
        },
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('already exists');
    });

    it('should transfer ownership if user owns another clan', async () => {
      // Create existing clan
      const existingClan = await prisma.clan.create({
        data: {
          rovioId: 111111,
          name: 'Old Clan',
          country: 'US',
          registrationDate: new Date(),
        },
      });

      // Create user who owns existing clan
      const user = await prisma.user.create({
        data: {
          userId: 'test-user-id-4',
          username: 'testuser4',
          email: 'test4@example.com',
          clanId: existingClan.clanId,
          owner: true,
        },
      });

      const testUser = createTestUser({
        sub: user.userId,
        preferred_username: user.username,
        email: user.email,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/clans',
        headers: createAuthenticatedHeaders(app, testUser),
        payload: {
          rovioId: 222222,
          name: 'New Clan',
          country: 'UK',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);

      // Verify user now owns new clan
      const updatedUser = await prisma.user.findUnique({
        where: { userId: user.userId },
      });
      expect(updatedUser?.clanId).toBe(body.clanId);
      expect(updatedUser?.owner).toBe(true);
    });
  });

  describe('PATCH /api/clans/:clanId', () => {
    it('should update clan when owner', async () => {
      const clan = await prisma.clan.create({
        data: {
          rovioId: 123456,
          name: 'Test Clan',
          country: 'US',
          registrationDate: new Date(),
        },
      });

      const user = await prisma.user.create({
        data: {
          userId: 'test-user-id-5',
          username: 'testuser5',
          email: 'test5@example.com',
          clanId: clan.clanId,
          owner: true,
        },
      });

      const testUser = createTestUser({
        sub: user.userId,
        preferred_username: user.username,
        email: user.email,
      });

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/clans/${clan.clanId}`,
        headers: createAuthenticatedHeaders(app, testUser),
        payload: {
          name: 'Updated Clan Name',
          country: 'CA',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.name).toBe('Updated Clan Name');
      expect(body.country).toBe('CA');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/clans/1',
        payload: {
          name: 'Updated Name',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 403 when not owner or superadmin', async () => {
      const clan = await prisma.clan.create({
        data: {
          rovioId: 123456,
          name: 'Test Clan',
          country: 'US',
          registrationDate: new Date(),
        },
      });

      const user = await prisma.user.create({
        data: {
          userId: 'test-user-id-6',
          username: 'testuser6',
          email: 'test6@example.com',
          clanId: clan.clanId,
          owner: false, // Not owner
        },
      });

      const testUser = createTestUser({
        sub: user.userId,
        preferred_username: user.username,
        email: user.email,
      });

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/clans/${clan.clanId}`,
        headers: createAuthenticatedHeaders(app, testUser),
        payload: {
          name: 'Updated Name',
        },
      });

      expect(response.statusCode).toBe(403);
    });

    it('should allow superadmin to update any clan', async () => {
      const clan = await prisma.clan.create({
        data: {
          rovioId: 123456,
          name: 'Test Clan',
          country: 'US',
          registrationDate: new Date(),
        },
      });

      const user = await prisma.user.create({
        data: {
          userId: 'test-superadmin-id',
          username: 'superadmin',
          email: 'admin@example.com',
        },
      });

      const testSuperadmin = createTestSuperadmin({
        sub: user.userId,
        preferred_username: user.username,
        email: user.email,
      });

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/clans/${clan.clanId}`,
        headers: createAuthenticatedHeaders(app, testSuperadmin),
        payload: {
          name: 'Admin Updated Name',
          active: false,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.name).toBe('Admin Updated Name');
      expect(body.active).toBe(false);
    });

    it('should return 404 for non-existent clan', async () => {
      const user = await prisma.user.create({
        data: {
          userId: 'test-user-id-7',
          username: 'testuser7',
          email: 'test7@example.com',
        },
      });

      const testSuperadmin = createTestSuperadmin({
        sub: user.userId,
        preferred_username: user.username,
        email: user.email,
      });

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/clans/99999',
        headers: createAuthenticatedHeaders(app, testSuperadmin),
        payload: {
          name: 'Updated Name',
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
