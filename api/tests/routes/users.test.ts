/**
 * User Routes Test Suite
 *
 * Tests for user registration, profile management, and password changes.
 * Covers Stories 2.1-2.8 from Epic 2.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { buildApp } from '../../src/app.js';
import { createAuthenticatedHeaders } from '../helpers/auth-helper.js';
import { mockKeycloakService, resetKeycloakMock } from '../helpers/keycloak-mock.js';
import { prisma } from '../setup.js';

import type { FastifyInstance } from 'fastify';

// Mock the Keycloak service module
vi.mock('../../src/services/keycloak.service.js', () => ({
  createKeycloakService: vi.fn(() => mockKeycloakService),
  KeycloakService: vi.fn(() => mockKeycloakService),
}));

describe('User Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApp();
    resetKeycloakMock();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/users/register', () => {
    it('should register a new user successfully', async () => {
      const keycloakUserId = 'keycloak-test-user-id';
      mockKeycloakService.registerUser.mockResolvedValue(keycloakUserId);

      const response = await app.inject({
        method: 'POST',
        url: '/api/users/register',
        payload: {
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'SecurePass123!',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.userId).toBe(keycloakUserId);
      expect(body.message).toBe('Registration successful');

      // Verify Keycloak was called
      expect(mockKeycloakService.registerUser).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        firstName: undefined,
        lastName: undefined,
      });

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { username: 'newuser' },
      });
      expect(user).not.toBeNull();
      expect(user?.email).toBe('newuser@example.com');
      expect(user?.userId).toBe(keycloakUserId);
    });

    it('should return 409 when username already exists', async () => {
      // Create existing user
      await prisma.user.create({
        data: {
          userId: 'existing-keycloak-id',
          username: 'existinguser',
          email: 'existing@example.com',
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/users/register',
        payload: {
          username: 'existinguser',
          email: 'different@example.com',
          password: 'SecurePass123!',
        },
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('already exists');
    });

    it('should return 409 when email already exists', async () => {
      // Create existing user
      await prisma.user.create({
        data: {
          userId: 'existing-keycloak-id',
          username: 'existinguser',
          email: 'existing@example.com',
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/users/register',
        payload: {
          username: 'differentuser',
          email: 'existing@example.com',
          password: 'SecurePass123!',
        },
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('already exists');
    });

    it('should return 400 for invalid email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/users/register',
        payload: {
          username: 'newuser',
          email: 'invalid-email',
          password: 'SecurePass123!',
          displayName: 'New User',
        },
      });

      expect(response.statusCode).toBe(400);
      // Validation error from Fastify
    });

    it('should return 400 for weak password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/users/register',
        payload: {
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'weak',
          displayName: 'New User',
        },
      });

      expect(response.statusCode).toBe(400);
      // Validation error from Fastify
    });

    it('should return 400 for missing required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/users/register',
        payload: {
          username: 'newuser',
          // Missing email and password
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle Keycloak registration failure', async () => {
      mockKeycloakService.registerUser.mockRejectedValue(new Error('Keycloak service unavailable'));

      const response = await app.inject({
        method: 'POST',
        url: '/api/users/register',
        payload: {
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          displayName: 'New User',
        },
      });

      expect(response.statusCode).toBe(500);

      // Verify no user was created in database
      const user = await prisma.user.findUnique({
        where: { username: 'newuser' },
      });
      expect(user).toBeNull();
    });
  });

  describe('POST /api/users/register-clan', () => {
    let testUser: { userId: string };

    beforeEach(async () => {
      // Create test user who will register a clan
      testUser = await prisma.user.create({
        data: {
          userId: 'founder-keycloak-id',
          username: 'clanfounder',
          email: 'founder@example.com',
        },
      });
    });

    it('should register a new clan successfully', async () => {
      mockKeycloakService.assignRole.mockResolvedValue(undefined);

      const response = await app.inject({
        method: 'POST',
        url: '/api/users/register-clan',
        headers: createAuthenticatedHeaders(app, {
          sub: testUser.userId,
          preferred_username: 'clanfounder',
          email: 'founder@example.com',
        }),
        payload: {
          name: 'Test Clan',
          rovioId: 12345678,
          country: 'US',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.clanId).toBeDefined();
      expect(body.message).toBe('Clan registration successful');

      // Verify Keycloak role assignment was called
      expect(mockKeycloakService.assignRole).toHaveBeenCalledWith({
        userId: testUser.userId,
        role: 'clan-owner',
      });

      // Verify clan was created in database
      const clan = await prisma.clan.findUnique({
        where: { rovioId: 12345678 },
      });
      expect(clan).not.toBeNull();
      expect(clan?.name).toBe('Test Clan');

      // Verify user's clanId was updated and owner flag set
      const updatedUser = await prisma.user.findUnique({
        where: { userId: testUser.userId },
      });
      expect(updatedUser?.clanId).toBe(clan?.clanId);
      expect(updatedUser?.owner).toBe(true);

      // Verify audit logs were created (clan creation + user promotion)
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          actorId: testUser.userId,
        },
      });
      expect(auditLogs.length).toBeGreaterThanOrEqual(2);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/users/register-clan',
        payload: {
          name: 'Test Clan',
          rovioId: 'TESTCLAN123',
          description: 'A test clan',
          country: 'US',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 409 when user already owns a clan', async () => {
      // Create existing clan
      const existingClan = await prisma.clan.create({
        data: {
          name: 'Existing Clan',
          rovioId: 11111111,
          country: 'US',
        },
      });

      // Update user to be clan owner
      await prisma.user.update({
        where: { userId: testUser.userId },
        data: { clanId: existingClan.clanId, owner: true },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/users/register-clan',
        headers: createAuthenticatedHeaders(app, {
          sub: testUser.userId,
          preferred_username: 'clanfounder',
          email: 'founder@example.com',
          clanId: existingClan.clanId.toString(),
          realm_access: { roles: ['clan-owner'] },
        }),
        payload: {
          name: 'Second Clan',
          rovioId: 22222222,
          country: 'US',
        },
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('already owns');
    });

    it('should return 409 when rovioId already exists', async () => {
      // Create existing clan (no owner needed, just for rovioId conflict)
      await prisma.clan.create({
        data: {
          name: 'Existing Clan',
          rovioId: 99999999,
          country: 'US',
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/users/register-clan',
        headers: createAuthenticatedHeaders(app, {
          sub: testUser.userId,
          preferred_username: 'clanfounder',
          email: 'founder@example.com',
        }),
        payload: {
          name: 'My Clan',
          rovioId: 99999999, // Duplicate
          country: 'US',
        },
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('already exists');
    });

    it('should return 400 for invalid clan data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/users/register-clan',
        headers: createAuthenticatedHeaders(app, {
          sub: testUser.userId,
          preferred_username: 'clanfounder',
          email: 'founder@example.com',
        }),
        payload: {
          name: 'Test Clan',
          // Missing required rovioId and country
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/users/me', () => {
    let testUser: { userId: string; clanId?: number | null };

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          userId: 'test-keycloak-id',
          username: 'testuser',
          email: 'test@example.com',
        },
      });
    });

    it('should return current user profile', async () => {
      mockKeycloakService.getUser.mockResolvedValue({
        id: testUser.userId,
        username: 'testuser',
        email: 'test@example.com',
        enabled: true,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/users/me',
        headers: createAuthenticatedHeaders(app, {
          sub: testUser.userId,
          preferred_username: 'testuser',
          email: 'test@example.com',
        }),
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.userId).toBe(testUser.userId);
      expect(body.username).toBe('testuser');
      expect(body.email).toBe('test@example.com');
      expect(body.clanId).toBeNull();
      expect(body.owner).toBe(false);
      expect(body.roles).toBeInstanceOf(Array);
    });

    it('should return user with clan details', async () => {
      mockKeycloakService.getUser.mockResolvedValue({
        id: testUser.userId,
        username: 'testuser',
        email: 'test@example.com',
        enabled: true,
      });

      // Create clan and associate user
      const clan = await prisma.clan.create({
        data: {
          name: 'Test Clan',
          rovioId: 88888888,
          country: 'US',
        },
      });

      await prisma.user.update({
        where: { userId: testUser.userId },
        data: { clanId: clan.clanId },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/users/me',
        headers: createAuthenticatedHeaders(app, {
          sub: testUser.userId,
          preferred_username: 'testuser',
          email: 'test@example.com',
          clanId: clan.clanId.toString(),
        }),
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.clanId).toBe(clan.clanId);
      expect(body.clanName).toBe('Test Clan');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users/me',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 when user not found in database', async () => {
      // Delete the user from database but JWT is still valid
      await prisma.user.delete({
        where: { userId: testUser.userId },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/users/me',
        headers: createAuthenticatedHeaders(app, {
          sub: testUser.userId,
          preferred_username: 'testuser',
          email: 'test@example.com',
        }),
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('PUT /api/users/me', () => {
    let testUser: { userId: string };

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          username: 'testuser',
          email: 'test@example.com',
          // displayName removed - not in User schema
          userId: 'test-keycloak-id',
        },
      });
    });

    it('should update user profile successfully', async () => {
      mockKeycloakService.updateUser.mockResolvedValue(undefined);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/users/me',
        headers: createAuthenticatedHeaders(app, {
          sub: testUser.userId,
          preferred_username: 'testuser',
          email: 'test@example.com',
        }),
        payload: {
          username: 'updateduser',
          email: 'newemail@example.com',
          firstName: 'Updated',
          lastName: 'Name',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Profile updated successfully');

      // Verify Keycloak was updated with all fields
      expect(mockKeycloakService.updateUser).toHaveBeenCalledWith(testUser.userId, {
        username: 'updateduser',
        email: 'newemail@example.com',
        firstName: 'Updated',
        lastName: 'Name',
      });

      // Verify database was updated (username and email only)
      const updatedUser = await prisma.user.findUnique({
        where: { userId: testUser.userId },
      });
      expect(updatedUser?.username).toBe('updateduser');
      expect(updatedUser?.email).toBe('newemail@example.com');

      // Verify audit log
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          actorId: testUser.userId,
        },
      });
      expect(auditLog).not.toBeNull();
    });

    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/users/me',
        payload: {
          username: 'updated',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 409 when new email already exists', async () => {
      // Create another user with the target email
      await prisma.user.create({
        data: {
          userId: 'other-keycloak-id',
          username: 'otheruser',
          email: 'taken@example.com',
        },
      });

      mockKeycloakService.updateUser.mockRejectedValue(
        new Error('Username or email already exists')
      );

      const response = await app.inject({
        method: 'PUT',
        url: '/api/users/me',
        headers: createAuthenticatedHeaders(app, {
          sub: testUser.userId,
          preferred_username: 'testuser',
          email: 'test@example.com',
        }),
        payload: {
          email: 'taken@example.com',
        },
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('already exists');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/users/me',
        headers: createAuthenticatedHeaders(app, {
          sub: testUser.userId,
          preferred_username: 'testuser',
          email: 'test@example.com',
        }),
        payload: {
          email: 'invalid-email-format',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle Keycloak update failure', async () => {
      mockKeycloakService.updateUser.mockRejectedValue(new Error('Keycloak update failed'));

      const response = await app.inject({
        method: 'PUT',
        url: '/api/users/me',
        headers: createAuthenticatedHeaders(app, {
          sub: testUser.userId,
          preferred_username: 'testuser',
          email: 'test@example.com',
        }),
        payload: {
          email: 'newemail@example.com',
        },
      });

      expect(response.statusCode).toBe(500);
    });
  });

  describe('POST /api/users/me/password', () => {
    let testUser: { userId: string };

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          username: 'testuser',
          email: 'test@example.com',
          // displayName removed - not in User schema
          userId: 'test-keycloak-id',
        },
      });
    });

    it('should change password successfully', async () => {
      mockKeycloakService.changePassword.mockResolvedValue(undefined);

      const response = await app.inject({
        method: 'POST',
        url: '/api/users/me/password',
        headers: createAuthenticatedHeaders(app, {
          sub: testUser.userId,
          preferred_username: 'testuser',
          email: 'test@example.com',
        }),
        payload: {
          newPassword: 'NewSecurePass123!',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Password changed successfully');

      // Verify Keycloak was called
      expect(mockKeycloakService.changePassword).toHaveBeenCalledWith({
        userId: testUser.userId,
        newPassword: 'NewSecurePass123!',
        temporary: false,
      });

      // Verify audit log
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          actorId: testUser.userId,
        },
      });
      expect(auditLog).not.toBeNull();
    });

    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/users/me/password',
        payload: {
          newPassword: 'NewSecurePass123!',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 400 for weak password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/users/me/password',
        headers: createAuthenticatedHeaders(app, {
          sub: testUser.userId,
          preferred_username: 'testuser',
          email: 'test@example.com',
        }),
        payload: {
          newPassword: 'weak',
        },
      });

      expect(response.statusCode).toBe(400);
      // Validation error from Fastify schema
    });

    it('should return 400 for missing password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/users/me/password',
        headers: createAuthenticatedHeaders(app, {
          sub: testUser.userId,
          preferred_username: 'testuser',
          email: 'test@example.com',
        }),
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle Keycloak password change failure', async () => {
      mockKeycloakService.changePassword.mockRejectedValue(new Error('Password change failed'));

      const response = await app.inject({
        method: 'POST',
        url: '/api/users/me/password',
        headers: createAuthenticatedHeaders(app, {
          sub: testUser.userId,
          preferred_username: 'testuser',
          email: 'test@example.com',
        }),
        payload: {
          newPassword: 'NewSecurePass123!',
        },
      });

      expect(response.statusCode).toBe(500);
    });
  });
});
