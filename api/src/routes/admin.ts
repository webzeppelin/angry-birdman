/**
 * Superadmin API Routes
 * Story 2.16: Global user management for superadmins
 *
 * Provides superadmin-only operations for global user management
 */

import { authenticate, authorize } from '../middleware/auth.js';
import {
  createAuditService,
  AuditAction,
  EntityType,
  AuditResult,
} from '../services/audit.service.js';
import { createKeycloakService } from '../services/keycloak.service.js';

import type { PrismaClient } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';

// Type for Prisma transaction callback
type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
>;

interface UserSearchQuery {
  search?: string;
  clanId?: string;
  enabled?: string;
  page?: string;
  limit?: string;
}

interface PasswordResetBody {
  temporary: boolean;
  password: string;
}

interface ChangeClanBody {
  clanId: number | null;
  makeOwner?: boolean;
}

const adminRoutes: FastifyPluginAsync = async (fastify) => {
  const keycloak = createKeycloakService(fastify);
  const audit = createAuditService(fastify.prisma);

  /**
   * GET /api/admin/users
   * List and search all users (superadmin only)
   */
  fastify.get<{ Querystring: UserSearchQuery }>(
    '/users',
    {
      onRequest: [authenticate, authorize(['superadmin'])],
    },
    async (request, reply) => {
      const {
        search,
        clanId: clanIdStr,
        enabled: enabledStr,
        page: pageStr = '1',
        limit: limitStr = '50',
      } = request.query;

      const page = parseInt(pageStr, 10);
      const requestedLimit = parseInt(limitStr, 10);
      const limit = Math.min(requestedLimit, 100);
      const clanId = clanIdStr ? parseInt(clanIdStr, 10) : undefined;
      const enabled = enabledStr === 'true' ? true : enabledStr === 'false' ? false : undefined;

      if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid pagination parameters',
        });
      }

      try {
        const where: {
          clanId?: number | null;
          enabled?: boolean;
          OR?: Array<{
            username?: { contains: string; mode: 'insensitive' };
            email?: { contains: string; mode: 'insensitive' };
          }>;
        } = {};

        if (clanId !== undefined) where.clanId = clanId;
        if (enabled !== undefined) where.enabled = enabled;
        if (search) {
          where.OR = [
            { username: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ];
        }

        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
          fastify.prisma.user.findMany({
            where,
            include: { clan: { select: { clanId: true, name: true } } },
            orderBy: { username: 'asc' },
            skip,
            take: limit,
          }),
          fastify.prisma.user.count({ where }),
        ]);

        type UserWithClan = (typeof users)[number];
        return {
          users: users.map((user: UserWithClan) => ({
            userId: user.userId,
            username: user.username,
            email: user.email,
            enabled: user.enabled,
            owner: user.owner,
            clanId: user.clanId,
            clanName: user.clan?.name || null,
            createdAt: user.createdAt.toISOString(),
          })),
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        };
      } catch (error) {
        fastify.log.error(error, 'Failed to list users');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to list users',
        });
      }
    }
  );

  /**
   * GET /api/admin/users/:userId
   * Get user details (superadmin only)
   */
  fastify.get<{ Params: { userId: string } }>(
    '/users/:userId',
    {
      onRequest: [authenticate, authorize(['superadmin'])],
    },
    async (request, reply) => {
      try {
        const user = await fastify.prisma.user.findUnique({
          where: { userId: request.params.userId },
          include: {
            clan: {
              select: {
                clanId: true,
                rovioId: true,
                name: true,
                country: true,
                active: true,
              },
            },
          },
        });

        if (!user) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'User not found',
          });
        }

        return {
          userId: user.userId,
          username: user.username,
          email: user.email,
          enabled: user.enabled,
          owner: user.owner,
          clanId: user.clanId,
          clan: user.clan,
          createdAt: user.createdAt.toISOString(),
        };
      } catch (error) {
        fastify.log.error(error, 'Failed to get user');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to get user',
        });
      }
    }
  );

  /**
   * POST /api/admin/users/:userId/password-reset
   * Force password reset (superadmin only)
   */
  fastify.post<{ Params: { userId: string }; Body: PasswordResetBody }>(
    '/users/:userId/password-reset',
    {
      onRequest: [authenticate, authorize(['superadmin'])],
    },
    async (request, reply) => {
      const { userId } = request.params; // composite ID format
      const { temporary, password } = request.body;
      const actorId = request.authUser!.sub;

      if (!password || password.length < 8) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Password must be at least 8 characters',
        });
      }

      try {
        const user = await fastify.prisma.user.findUnique({ where: { userId } });
        if (!user) {
          return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
        }

        // Extract Keycloak sub from composite ID (format: keycloak:{sub})
        const keycloakSub = userId.split(':')[1];
        if (!keycloakSub) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Invalid user ID format',
          });
        }

        await keycloak.changePassword({ userId: keycloakSub, newPassword: password, temporary });

        await audit.log({
          actorId,
          actionType: AuditAction.USER_PASSWORD_CHANGED,
          entityType: EntityType.USER,
          entityId: userId,
          clanId: user.clanId,
          targetUserId: userId,
          details: { adminReset: true, temporary },
          result: AuditResult.SUCCESS,
        });

        return {
          message: temporary
            ? 'Password reset. User must change on next login.'
            : 'Password reset successfully',
        };
      } catch (error) {
        fastify.log.error(error, 'Failed to reset password');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to reset password',
        });
      }
    }
  );

  /**
   * POST /api/admin/users/:userId/disable
   * Disable user account (superadmin only)
   */
  fastify.post<{ Params: { userId: string } }>(
    '/users/:userId/disable',
    {
      onRequest: [authenticate, authorize(['superadmin'])],
    },
    async (request, reply) => {
      const { userId } = request.params;
      const actorId = request.authUser!.sub;

      try {
        const user = await fastify.prisma.user.findUnique({ where: { userId } });
        if (!user) {
          return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
        }
        if (!user.enabled) {
          return reply.status(400).send({ error: 'Bad Request', message: 'Already disabled' });
        }

        await fastify.prisma.user.update({ where: { userId }, data: { enabled: false } });
        // Note: Keycloak user enable/disable would require direct admin API call

        await audit.log({
          actorId,
          actionType: AuditAction.USER_DISABLED,
          entityType: EntityType.USER,
          entityId: userId,
          clanId: user.clanId,
          targetUserId: userId,
          result: AuditResult.SUCCESS,
        });

        return { message: 'User disabled successfully' };
      } catch (error) {
        fastify.log.error(error, 'Failed to disable user');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to disable user',
        });
      }
    }
  );

  /**
   * POST /api/admin/users/:userId/enable
   * Enable user account (superadmin only)
   */
  fastify.post<{ Params: { userId: string } }>(
    '/users/:userId/enable',
    {
      onRequest: [authenticate, authorize(['superadmin'])],
    },
    async (request, reply) => {
      const { userId } = request.params;
      const actorId = request.authUser!.sub;

      try {
        const user = await fastify.prisma.user.findUnique({ where: { userId } });
        if (!user) {
          return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
        }
        if (user.enabled) {
          return reply.status(400).send({ error: 'Bad Request', message: 'Already enabled' });
        }

        await fastify.prisma.user.update({ where: { userId }, data: { enabled: true } });
        // Note: Keycloak user enable/disable would require direct admin API call

        await audit.log({
          actorId,
          actionType: AuditAction.USER_ENABLED,
          entityType: EntityType.USER,
          entityId: userId,
          clanId: user.clanId,
          targetUserId: userId,
          result: AuditResult.SUCCESS,
        });

        return { message: 'User enabled successfully' };
      } catch (error) {
        fastify.log.error(error, 'Failed to enable user');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to enable user',
        });
      }
    }
  );

  /**
   * PUT /api/admin/users/:userId/clan
   * Change user's clan association (superadmin only)
   */
  fastify.put<{ Params: { userId: string }; Body: ChangeClanBody }>(
    '/users/:userId/clan',
    {
      onRequest: [authenticate, authorize(['superadmin'])],
    },
    async (request, reply) => {
      const { userId } = request.params;
      const { clanId, makeOwner = false } = request.body;
      const actorId = request.authUser!.sub;

      try {
        const user = await fastify.prisma.user.findUnique({ where: { userId } });
        if (!user) {
          return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
        }

        if (clanId !== null) {
          const clan = await fastify.prisma.clan.findUnique({ where: { clanId } });
          if (!clan) {
            return reply.status(404).send({ error: 'Not Found', message: 'Clan not found' });
          }
        }

        await fastify.prisma.$transaction(async (tx: PrismaTransaction) => {
          if (makeOwner && clanId !== null) {
            await tx.user.updateMany({
              where: { clanId, owner: true },
              data: { owner: false },
            });
          }

          // Determine new roles based on clan association
          let newRoles: string[];
          if (clanId === null) {
            // Removed from clan - reset to base role
            newRoles = ['user'];
          } else if (makeOwner) {
            // Made owner of clan
            newRoles = ['user', 'clan-owner'];
          } else {
            // Added as admin to clan
            newRoles = ['user', 'clan-admin'];
          }

          await tx.user.update({
            where: { userId },
            data: {
              clanId,
              owner: makeOwner,
              roles: { set: newRoles }, // Update database roles
            },
          });
        });

        await audit.log({
          actorId,
          actionType: AuditAction.USER_CLAN_ASSOCIATION_CHANGED,
          entityType: EntityType.USER,
          entityId: userId,
          clanId: clanId || undefined,
          targetUserId: userId,
          details: { oldClanId: user.clanId, newClanId: clanId, makeOwner },
          result: AuditResult.SUCCESS,
        });

        return { message: 'Clan association updated' };
      } catch (error) {
        fastify.log.error(error, 'Failed to change clan');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to change clan',
        });
      }
    }
  );

  /**
   * DELETE /api/admin/users/:userId
   * Permanently delete user (superadmin only)
   */
  fastify.delete<{ Params: { userId: string } }>(
    '/users/:userId',
    {
      onRequest: [authenticate, authorize(['superadmin'])],
    },
    async (request, reply) => {
      const { userId } = request.params;
      const actorId = request.authUser!.sub;

      try {
        const user = await fastify.prisma.user.findUnique({ where: { userId } });
        if (!user) {
          return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
        }

        await audit.log({
          actorId,
          actionType: AuditAction.USER_DELETED,
          entityType: EntityType.USER,
          entityId: userId,
          clanId: user.clanId,
          targetUserId: userId,
          details: { username: user.username, email: user.email },
          result: AuditResult.SUCCESS,
        });

        // Delete from database first
        await fastify.prisma.user.delete({ where: { userId } });

        // Extract Keycloak sub from composite ID and delete from Keycloak
        const keycloakSub = userId.split(':')[1];
        if (keycloakSub) {
          await keycloak.deleteUser(keycloakSub);
        }

        return { message: 'User deleted successfully' };
      } catch (error) {
        fastify.log.error(error, 'Failed to delete user');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to delete user',
        });
      }
    }
  );
};

export default adminRoutes;
