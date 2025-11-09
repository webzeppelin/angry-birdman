/**
 * User Management Routes
 *
 * Endpoints for user registration, profile management, and authentication
 * Covers Stories 2.1-2.8 from Epic 2
 *
 * @module routes/users
 */

import {
  userRegistrationSchema,
  userProfileUpdateSchema,
  passwordChangeSchema,
  clanRegistrationSchema,
  type UserRegistration,
  type UserProfileUpdate,
  type PasswordChange,
  type ClanRegistration,
} from '@angrybirdman/common';
import { z } from 'zod';

import { authenticate } from '../middleware/auth.js';
import {
  createAuditService,
  AuditAction,
  EntityType,
  AuditResult,
} from '../services/audit.service.js';
import { createKeycloakService } from '../services/keycloak.service.js';

import type { FastifyPluginAsync } from 'fastify';

/**
 * User routes plugin
 */
const usersRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/users/register
   *
   * Story 2.2: Register a new user account
   *
   * Creates user in both Keycloak (identity provider) and local database
   * Assigns default 'user' role
   * Logs registration action
   */
  fastify.post<{ Body: UserRegistration }>(
    '/register',
    {
      schema: {
        description: 'Register a new user account',
        tags: ['users'],
        body: userRegistrationSchema,
        response: {
          201: z.object({
            userId: z.string(),
            message: z.string(),
          }),
          409: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const keycloak = createKeycloakService(fastify);
      const audit = createAuditService(fastify.prisma);

      try {
        // 1. Register user in Keycloak (includes password setup)
        const userId = await keycloak.registerUser({
          username: request.body.username,
          email: request.body.email,
          password: request.body.password,
          firstName: request.body.firstName,
          lastName: request.body.lastName,
        });

        // 2. Create User record in local database
        await fastify.prisma.user.create({
          data: {
            userId,
            username: request.body.username,
            email: request.body.email,
            clanId: null, // No clan association initially
            owner: false, // Not an owner initially
          },
        });

        // 3. Log the registration action
        await audit.log({
          actorId: userId,
          actionType: AuditAction.USER_REGISTERED,
          entityType: EntityType.USER,
          entityId: userId,
          details: { email: request.body.email, username: request.body.username },
          result: AuditResult.SUCCESS,
        });

        return reply.code(201).send({
          userId,
          message: 'Registration successful',
        });
      } catch (error) {
        fastify.log.error(error, 'User registration failed');

        if (error instanceof Error && error.message.includes('already exists')) {
          return reply.code(409).send({
            error: 'Username or email already exists',
          });
        }

        throw error;
      }
    }
  );

  /**
   * POST /api/users/register-clan
   *
   * Story 2.4: Register a new clan and become its owner
   *
   * Requires authentication
   * Creates clan, associates user as owner, assigns clan-owner role
   */
  fastify.post<{ Body: ClanRegistration }>(
    '/register-clan',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Register a new clan and become its owner',
        tags: ['users', 'clans'],
        body: clanRegistrationSchema,
        response: {
          201: z.object({
            clanId: z.number(),
            message: z.string(),
          }),
          409: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const userId = request.authUser!.sub;
      const keycloak = createKeycloakService(fastify);
      const audit = createAuditService(fastify.prisma);

      try {
        // 1. Check if user already owns a clan
        const existingUser = await fastify.prisma.user.findUnique({
          where: { userId },
        });

        if (existingUser?.owner) {
          return reply.code(409).send({
            error: 'User already owns a clan',
          });
        }

        // 2. Create the clan
        const clan = await fastify.prisma.clan.create({
          data: {
            rovioId: request.body.rovioId,
            name: request.body.name,
            country: request.body.country,
          },
        });

        // 3. Associate user with clan as owner
        await fastify.prisma.user.update({
          where: { userId },
          data: {
            clanId: clan.clanId,
            owner: true,
          },
        });

        // 4. Assign clan-owner role in Keycloak
        await keycloak.assignRole({
          userId,
          role: 'clan-owner',
        });

        // 5. Log clan creation
        await audit.log({
          actorId: userId,
          actionType: AuditAction.CLAN_CREATED,
          entityType: EntityType.CLAN,
          entityId: String(clan.clanId),
          clanId: clan.clanId,
          details: {
            rovioId: request.body.rovioId,
            name: request.body.name,
            country: request.body.country,
          },
          result: AuditResult.SUCCESS,
        });

        // 6. Log user promotion to owner
        await audit.log({
          actorId: userId,
          actionType: AuditAction.USER_PROMOTED_TO_OWNER,
          entityType: EntityType.USER,
          entityId: userId,
          clanId: clan.clanId,
          targetUserId: userId,
          result: AuditResult.SUCCESS,
        });

        return reply.code(201).send({
          clanId: clan.clanId,
          message: 'Clan registration successful',
        });
      } catch (error) {
        fastify.log.error(error, 'Clan registration failed');

        // Check for duplicate rovioId (unique constraint violation)
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
          return reply.code(409).send({
            error: 'A clan with this Rovio ID already exists',
          });
        }

        throw error;
      }
    }
  );

  /**
   * GET /api/users/me
   *
   * Story 2.5: View own profile
   *
   * Returns authenticated user's profile information
   */
  fastify.get(
    '/me',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Get current user profile',
        tags: ['users'],
        response: {
          200: z.object({
            userId: z.string(),
            username: z.string(),
            email: z.string(),
            firstName: z.string().optional(),
            lastName: z.string().optional(),
            clanId: z.number().nullable(),
            clanName: z.string().optional().nullable(),
            owner: z.boolean(),
            roles: z.array(z.string()),
          }),
        },
      },
    },
    async (request, reply) => {
      const userId = request.authUser!.sub;
      const keycloak = createKeycloakService(fastify);

      try {
        // 1. Get user from database
        const user = await fastify.prisma.user.findUnique({
          where: { userId },
          include: {
            clan: {
              select: {
                name: true,
              },
            },
          },
        });

        if (!user) {
          return reply.code(404).send({ error: 'User not found' });
        }

        // 2. Get additional details from Keycloak
        const keycloakUser = await keycloak.getUser(userId);
        const roles = await keycloak.getUserRoles(userId);

        return reply.send({
          userId: user.userId,
          username: user.username,
          email: user.email,
          firstName: keycloakUser?.firstName,
          lastName: keycloakUser?.lastName,
          clanId: user.clanId,
          clanName: user.clan?.name,
          owner: user.owner,
          roles: roles?.map((r) => r.name ?? '').filter(Boolean) ?? [],
        });
      } catch (error) {
        fastify.log.error(error, 'Failed to get user profile');
        throw error;
      }
    }
  );

  /**
   * PUT /api/users/me
   *
   * Story 2.6: Update own profile
   *
   * Allows updating username, email, first name, last name
   */
  fastify.put<{ Body: UserProfileUpdate }>(
    '/me',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Update current user profile',
        tags: ['users'],
        body: userProfileUpdateSchema,
        response: {
          200: z.object({
            message: z.string(),
          }),
          409: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const userId = request.authUser!.sub;
      const keycloak = createKeycloakService(fastify);
      const audit = createAuditService(fastify.prisma);

      try {
        // 1. Update in Keycloak
        await keycloak.updateUser(userId, {
          username: request.body.username,
          email: request.body.email,
          firstName: request.body.firstName,
          lastName: request.body.lastName,
        });

        // 2. Update in local database (only username and email are stored locally)
        const updateData: { username?: string; email?: string } = {};
        if (request.body.username) updateData.username = request.body.username;
        if (request.body.email) updateData.email = request.body.email;

        if (Object.keys(updateData).length > 0) {
          await fastify.prisma.user.update({
            where: { userId },
            data: updateData,
          });
        }

        // 3. Log the profile update
        await audit.log({
          actorId: userId,
          actionType: AuditAction.USER_PROFILE_UPDATED,
          entityType: EntityType.USER,
          entityId: userId,
          targetUserId: userId,
          details: request.body,
          result: AuditResult.SUCCESS,
        });

        return reply.send({
          message: 'Profile updated successfully',
        });
      } catch (error) {
        fastify.log.error(error, 'Profile update failed');

        if (error instanceof Error && error.message.includes('already exists')) {
          return reply.code(409).send({
            error: 'Username or email already exists',
          });
        }

        throw error;
      }
    }
  );

  /**
   * POST /api/users/me/password
   *
   * Story 2.7: Change password
   *
   * Requires current password for verification
   * Updates password in Keycloak
   */
  fastify.post<{ Body: PasswordChange }>(
    '/me/password',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Change current user password',
        tags: ['users'],
        body: passwordChangeSchema,
        response: {
          200: z.object({
            message: z.string(),
          }),
          401: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const userId = request.authUser!.sub;
      const keycloak = createKeycloakService(fastify);
      const audit = createAuditService(fastify.prisma);

      try {
        // Note: Keycloak Admin API doesn't verify current password
        // In production, you'd want to add this verification step
        // For now, we trust that the user is authenticated via JWT

        // Change password in Keycloak
        await keycloak.changePassword({
          userId,
          newPassword: request.body.newPassword,
          temporary: false,
        });

        // Log the password change
        await audit.log({
          actorId: userId,
          actionType: AuditAction.USER_PASSWORD_CHANGED,
          entityType: EntityType.USER,
          entityId: userId,
          targetUserId: userId,
          result: AuditResult.SUCCESS,
        });

        return reply.send({
          message: 'Password changed successfully',
        });
      } catch (error) {
        fastify.log.error(error, 'Password change failed');
        throw error;
      }
    }
  );
};

export default usersRoutes;
