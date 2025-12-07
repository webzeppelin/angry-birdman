/**
 * Roster Routes Tests
 * Integration tests for roster management API endpoints
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

import { buildApp } from '../../src/app.js';
import { createAuthenticatedHeaders } from '../helpers/auth-helper.js';
import { prisma } from '../setup.js';

import type { FastifyInstance } from 'fastify';

describe('Roster Routes', () => {
  let app: FastifyInstance;
  let testClanId: number;
  let testPlayer1Id: number;
  let testPlayer2Id: number;
  let authHeaders: Record<string, string>;
  let testUserId: string;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Create test user
    testUserId = 'test-roster-user';
    await prisma.user.create({
      data: {
        userId: `keycloak:${testUserId}`,
        username: 'rostertest',
        email: 'rostertest@test.com',
      },
    });

    // Create test clan
    const clan = await prisma.clan.create({
      data: {
        name: 'Roster Test Clan',
        rovioId: 999991,
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
      preferred_username: 'rostertest',
      email: 'rostertest@test.com',
      realm_access: { roles: ['admin'] },
    });

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
        active: false,
        joinedDate: new Date('2024-01-01'),
        leftDate: new Date('2024-06-01'),
      },
    });
    testPlayer2Id = player2.playerId;
  });

  describe('GET /api/clans/:clanId/roster', () => {
    it('should return active players by default', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/clans/${testClanId}/roster`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.players).toHaveLength(1);
      expect(body.players[0].playerName).toBe('Test Player 1');
      expect(body.players[0].active).toBe(true);
    });

    it('should return all players when active=all', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/clans/${testClanId}/roster?active=all`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.players).toHaveLength(2);
    });

    it('should return inactive players when active=false', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/clans/${testClanId}/roster?active=false`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.players).toHaveLength(1);
      expect(body.players[0].playerName).toBe('Test Player 2');
      expect(body.players[0].active).toBe(false);
    });

    it('should filter by search term', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/clans/${testClanId}/roster?active=all&search=Player 1`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.players).toHaveLength(1);
      expect(body.players[0].playerName).toBe('Test Player 1');
    });

    it('should return empty array for non-existent clan', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/clans/99999/roster',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.players).toHaveLength(0);
    });
  });

  describe('GET /api/clans/:clanId/roster/:playerId/history', () => {
    it('should return player history with summary and recent battles', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/clans/${testClanId}/roster/${testPlayer1Id}/history`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.player).toBeDefined();
      expect(body.player.playerName).toBe('Test Player 1');
      expect(body.player.playerId).toBe(testPlayer1Id);
      expect(body.summary).toBeDefined();
      expect(body.recentBattles).toBeDefined();
      expect(body.actionCodeHistory).toBeDefined();
    });

    it('should return 404 for non-existent player', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/clans/${testClanId}/roster/99999/history`,
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /api/clans/:clanId/roster', () => {
    it('should create new player when authenticated', async () => {
      const newPlayer = {
        playerName: 'New Test Player',
        joinedDate: '2024-12-01',
      };

      const response = await app.inject({
        method: 'POST',
        url: `/api/clans/${testClanId}/roster`,
        headers: authHeaders,
        payload: newPlayer,
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.playerName).toBe('New Test Player');
      expect(body.active).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      const newPlayer = {
        playerName: 'New Test Player',
        joinedDate: '2024-12-01',
      };

      const response = await app.inject({
        method: 'POST',
        url: `/api/clans/${testClanId}/roster`,
        payload: newPlayer,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject duplicate player name in clan', async () => {
      const duplicatePlayer = {
        playerName: 'Test Player 1',
        joinedDate: '2024-12-01',
      };

      const response = await app.inject({
        method: 'POST',
        url: `/api/clans/${testClanId}/roster`,
        headers: authHeaders,
        payload: duplicatePlayer,
      });

      expect(response.statusCode).toBe(409);
    });
  });

  describe('PUT /api/clans/:clanId/roster/:playerId', () => {
    it('should update player information', async () => {
      const updates = {
        playerName: 'Updated Player 1',
      };

      const response = await app.inject({
        method: 'PUT',
        url: `/api/clans/${testClanId}/roster/${testPlayer1Id}`,
        headers: authHeaders,
        payload: updates,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.playerName).toBe('Updated Player 1');
    });

    it('should return 401 when not authenticated', async () => {
      const updates = {
        playerName: 'Updated Player 1',
      };

      const response = await app.inject({
        method: 'PUT',
        url: `/api/clans/${testClanId}/roster/${testPlayer1Id}`,
        payload: updates,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 for non-existent player', async () => {
      const updates = {
        playerName: 'Updated Name',
      };

      const response = await app.inject({
        method: 'PUT',
        url: `/api/clans/${testClanId}/roster/99999`,
        headers: authHeaders,
        payload: updates,
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /api/clans/:clanId/roster/:playerId/left', () => {
    it('should mark player as left', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/clans/${testClanId}/roster/${testPlayer1Id}/left`,
        headers: authHeaders,
        payload: {
          leftDate: '2024-12-05',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.active).toBe(false);
      expect(body.leftDate).toBeDefined();
    });

    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/clans/${testClanId}/roster/${testPlayer1Id}/left`,
        payload: {},
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/clans/:clanId/roster/:playerId/kicked', () => {
    it('should mark player as kicked', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/clans/${testClanId}/roster/${testPlayer1Id}/kicked`,
        headers: authHeaders,
        payload: {
          kickedDate: '2024-12-05',
          reason: 'Inactive',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.active).toBe(false);
      expect(body.kickedDate).toBeDefined();
    });

    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/clans/${testClanId}/roster/${testPlayer1Id}/kicked`,
        payload: {},
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/clans/:clanId/roster/:playerId/reactivate', () => {
    it('should reactivate inactive player', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/clans/${testClanId}/roster/${testPlayer2Id}/reactivate`,
        headers: authHeaders,
        payload: {
          joinedDate: '2024-12-05',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.active).toBe(true);
      expect(body.leftDate).toBeNull();
      expect(body.kickedDate).toBeNull();
    });

    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/clans/${testClanId}/roster/${testPlayer2Id}/reactivate`,
        payload: {},
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
