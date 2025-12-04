/**
 * Clan Routes
 *
 * API routes for clan operations including:
 * - Public clan directory browsing
 * - Clan profile viewing
 * - Clan registration and management (requires authentication)
 */

import { z } from 'zod';

import { authenticate } from '../middleware/auth.js';

import type { PrismaClient } from '@angrybirdman/database';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

// Type for Prisma transaction callback
type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
>;

// Validation schemas
const clanQuerySchema = z.object({
  search: z.string().optional(),
  country: z.string().optional(),
  active: z.enum(['true', 'false', 'all']).optional().default('true'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(['name', 'country', 'registrationDate']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

const clanCreateSchema = z.object({
  rovioId: z.number().int().positive(),
  name: z.string().min(1).max(100),
  country: z.string().min(1).max(100),
});

const clanUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  country: z.string().min(1).max(100).optional(),
  active: z.boolean().optional(),
});

const clanIdParamSchema = z.object({
  clanId: z.string(),
});

const clanUserParamsSchema = z.object({
  clanId: z.string(),
  userId: z.string(),
});

// Response schemas
const clanItemSchema = z.object({
  clanId: z.number(),
  rovioId: z.number(),
  name: z.string(),
  country: z.string(),
  registrationDate: z.string(),
  active: z.boolean(),
  battleCount: z.number(),
});

const paginationSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

const clansListResponseSchema = z.object({
  clans: z.array(clanItemSchema),
  pagination: paginationSchema,
});

const clanDetailSchema = z.object({
  clanId: z.number(),
  rovioId: z.number(),
  name: z.string(),
  country: z.string(),
  registrationDate: z.string(),
  active: z.boolean(),
  stats: z.object({
    totalBattles: z.number(),
    activePlayers: z.number(),
    totalPlayers: z.number(),
  }),
});

const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
});

const clanCreatedResponseSchema = z.object({
  clanId: z.number(),
  rovioId: z.number(),
  name: z.string(),
  country: z.string(),
  registrationDate: z.string(),
  active: z.boolean(),
});

const clanUpdatedResponseSchema = z.object({
  clanId: z.number(),
  rovioId: z.number(),
  name: z.string(),
  country: z.string(),
  active: z.boolean(),
});

const adminUserSchema = z.object({
  userId: z.string(),
  username: z.string(),
  email: z.string(),
  owner: z.boolean(),
  roles: z.array(z.string()),
});

const adminsListResponseSchema = z.object({
  admins: z.array(adminUserSchema),
});

const successMessageSchema = z.object({
  message: z.string(),
});

type ClanQueryParams = z.infer<typeof clanQuerySchema>;
type ClanCreateBody = z.infer<typeof clanCreateSchema>;
type ClanUpdateBody = z.infer<typeof clanUpdateSchema>;

export default function clanRoutes(fastify: FastifyInstance, _opts: unknown, done: () => void) {
  /**
   * GET /api/clans
   * Get list of all clans with filtering and pagination (public endpoint)
   */
  fastify.get<{ Querystring: ClanQueryParams }>(
    '/',
    {
      schema: {
        description: 'Get list of clans with optional filtering and pagination',
        tags: ['Clans'],
        querystring: clanQuerySchema,
        response: {
          200: clansListResponseSchema,
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: ClanQueryParams }>, reply: FastifyReply) => {
      const queryResult = clanQuerySchema.safeParse(request.query);

      if (!queryResult.success) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid query parameters',
          details: queryResult.error.issues,
        });
      }

      const { search, country, active, page, limit, sortBy, sortOrder } = queryResult.data;

      // Build where clause
      const where: {
        active?: boolean;
        country?: string;
        name?: { contains: string; mode: 'insensitive' };
      } = {};

      if (active !== 'all') {
        where.active = active === 'true';
      }

      if (country) {
        where.country = country;
      }

      if (search) {
        where.name = { contains: search, mode: 'insensitive' };
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      try {
        // Get total count
        const total = await fastify.prisma.clan.count({ where });

        // Get clans with battle count
        const clans = await fastify.prisma.clan.findMany({
          where,
          select: {
            clanId: true,
            rovioId: true,
            name: true,
            country: true,
            registrationDate: true,
            active: true,
            _count: {
              select: { clanBattles: true },
            },
          },
          orderBy: {
            [sortBy]: sortOrder,
          },
          skip,
          take: limit,
        });

        type ClanListItem = (typeof clans)[number];
        return {
          clans: clans.map((clan: ClanListItem) => ({
            clanId: clan.clanId,
            rovioId: clan.rovioId,
            name: clan.name,
            country: clan.country,
            registrationDate: clan.registrationDate.toISOString().split('T')[0],
            active: clan.active,
            battleCount: clan._count.clanBattles,
          })),
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        };
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch clans');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch clans',
        });
      }
    }
  );

  /**
   * GET /api/clans/:clanId
   * Get detailed information about a specific clan (public endpoint)
   */
  fastify.get<{ Params: { clanId: string } }>(
    '/:clanId',
    {
      schema: {
        description: 'Get detailed information about a specific clan',
        tags: ['Clans'],
        params: clanIdParamSchema,
        response: {
          200: clanDetailSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request: FastifyRequest<{ Params: { clanId: string } }>, reply: FastifyReply) => {
      const clanId = parseInt(request.params.clanId, 10);

      if (isNaN(clanId)) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid clan ID',
        });
      }

      try {
        const clan = await fastify.prisma.clan.findUnique({
          where: { clanId },
          include: {
            _count: {
              select: {
                clanBattles: true,
                rosterMembers: true,
              },
            },
          },
        });

        if (!clan) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Clan not found',
          });
        }

        // Get count of active players
        const activePlayers = await fastify.prisma.rosterMember.count({
          where: {
            clanId,
            active: true,
          },
        });

        return {
          clanId: clan.clanId,
          rovioId: clan.rovioId,
          name: clan.name,
          country: clan.country,
          registrationDate: clan.registrationDate.toISOString().split('T')[0],
          active: clan.active,
          stats: {
            totalBattles: clan._count.clanBattles,
            activePlayers,
            totalPlayers: clan._count.rosterMembers,
          },
        };
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch clan details');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch clan details',
        });
      }
    }
  );

  /**
   * POST /api/clans
   * Register a new clan (requires authentication)
   */
  fastify.post<{ Body: ClanCreateBody }>(
    '/',
    {
      schema: {
        description: 'Register a new clan',
        tags: ['Clans'],
        security: [{ bearerAuth: [] }],
        body: clanCreateSchema,
        response: {
          201: clanCreatedResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    async (request: FastifyRequest<{ Body: ClanCreateBody }>, reply: FastifyReply) => {
      // Check authentication
      const token = request.cookies.access_token;
      if (!token) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      // Validate request body
      const bodyResult = clanCreateSchema.safeParse(request.body);
      if (!bodyResult.success) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid clan data',
          details: bodyResult.error.issues,
        });
      }

      const { rovioId, name, country } = bodyResult.data;

      try {
        // Decode token to get user ID
        const decoded = fastify.jwt.decode(token) as { sub: string };
        const userId = decoded.sub;

        // Check if user exists
        const user = await fastify.prisma.user.findUnique({
          where: { userId },
        });

        if (!user) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'User not found',
          });
        }

        // Check if clan with this Rovio ID already exists
        const existingClan = await fastify.prisma.clan.findUnique({
          where: { rovioId },
        });

        if (existingClan) {
          return reply.status(409).send({
            error: 'Conflict',
            message: 'A clan with this Rovio ID already exists',
          });
        }

        // Create clan and update user as owner in a transaction
        const clan = await fastify.prisma.$transaction(async (tx: PrismaTransaction) => {
          // Create the clan
          const newClan = await tx.clan.create({
            data: {
              rovioId,
              name,
              country,
              registrationDate: new Date(),
              active: true,
            },
          });

          // If user is currently owner of another clan, remove that ownership
          if (user.owner && user.clanId) {
            await tx.user.updateMany({
              where: {
                clanId: user.clanId,
                owner: true,
              },
              data: {
                owner: false,
              },
            });
          }

          // Update user to be owner of new clan
          await tx.user.update({
            where: { userId },
            data: {
              clanId: newClan.clanId,
              owner: true,
            },
          });

          return newClan;
        });

        fastify.log.info({ clanId: clan.clanId, userId }, 'New clan registered');

        return reply.status(201).send({
          clanId: clan.clanId,
          rovioId: clan.rovioId,
          name: clan.name,
          country: clan.country,
          registrationDate: clan.registrationDate.toISOString().split('T')[0],
          active: clan.active,
        });
      } catch (error) {
        fastify.log.error(error, 'Failed to create clan');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to create clan',
        });
      }
    }
  );

  /**
   * PATCH /api/clans/:clanId
   * Update clan information (requires owner or superadmin)
   */
  fastify.patch<{ Params: { clanId: string }; Body: ClanUpdateBody }>(
    '/:clanId',
    {
      schema: {
        description: 'Update clan information',
        tags: ['Clans'],
        security: [{ bearerAuth: [] }],
        params: clanIdParamSchema,
        body: clanUpdateSchema,
        response: {
          200: clanUpdatedResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { clanId: string }; Body: ClanUpdateBody }>,
      reply: FastifyReply
    ) => {
      // Check authentication
      const token = request.cookies.access_token;
      if (!token) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const clanId = parseInt(request.params.clanId, 10);
      if (isNaN(clanId)) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid clan ID',
        });
      }

      // Validate request body
      const bodyResult = clanUpdateSchema.safeParse(request.body);
      if (!bodyResult.success) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid clan data',
          details: bodyResult.error.issues,
        });
      }

      const updates = bodyResult.data;

      // Check if there are any updates
      if (Object.keys(updates).length === 0) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'No updates provided',
        });
      }

      try {
        // Decode token to get user info
        const decoded = fastify.jwt.decode(token) as {
          sub: string;
          realm_access?: { roles: string[] };
        };
        const userId = decoded.sub;
        const isSuperadmin = decoded.realm_access?.roles?.includes('superadmin') || false;

        // Get user
        const user = await fastify.prisma.user.findUnique({
          where: { userId },
        });

        if (!user) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'User not found',
          });
        }

        // Check if clan exists
        const clan = await fastify.prisma.clan.findUnique({
          where: { clanId },
        });

        if (!clan) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Clan not found',
          });
        }

        // Check authorization: must be owner of this clan or superadmin
        const isOwner = user.owner && user.clanId === clanId;
        if (!isOwner && !isSuperadmin) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'Only clan owner or superadmin can update clan information',
          });
        }

        // Update clan
        const updatedClan = await fastify.prisma.clan.update({
          where: { clanId },
          data: updates,
        });

        fastify.log.info({ clanId, userId }, 'Clan updated');

        return {
          clanId: updatedClan.clanId,
          rovioId: updatedClan.rovioId,
          name: updatedClan.name,
          country: updatedClan.country,
          active: updatedClan.active,
        };
      } catch (error) {
        fastify.log.error(error, 'Failed to update clan');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to update clan',
        });
      }
    }
  );

  /**
   * GET /api/clans/:clanId/admins
   * Story 2.11: List all admin users for a clan
   *
   * Returns clan owner and all clan admins
   * Accessible by: clan admins, clan owner, superadmin
   */
  fastify.get<{ Params: { clanId: string } }>(
    '/:clanId/admins',
    {
      onRequest: [authenticate],
      schema: {
        description: 'List all admin users for a clan',
        tags: ['Clans'],
        security: [{ bearerAuth: [] }],
        params: clanIdParamSchema,
        response: {
          200: adminsListResponseSchema,
        },
      },
    },
    async (request: FastifyRequest<{ Params: { clanId: string } }>, reply: FastifyReply) => {
      const authUser = request.authUser;
      if (!authUser) {
        return reply
          .status(401)
          .send({ error: 'Unauthorized', message: 'Authentication required' });
      }

      const clanId = parseInt(request.params.clanId, 10);

      if (isNaN(clanId)) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid clan ID',
        });
      }

      try {
        // Check authorization - use database roles from authUser
        const isSuperadmin = authUser.roles.includes('superadmin');
        const isClanMember = authUser.clanId === clanId;

        if (!isSuperadmin && !isClanMember) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'You do not have access to this clan',
          });
        }

        // Get all admin users for this clan
        const admins = await fastify.prisma.user.findMany({
          where: {
            clanId,
          },
          select: {
            userId: true,
            username: true,
            email: true,
            owner: true,
          },
          orderBy: [
            { owner: 'desc' }, // Owner first
            { username: 'asc' },
          ],
        });

        // Note: In a full implementation, you'd also fetch roles from Keycloak
        // For now, we'll derive from the owner flag
        type AdminDetails = (typeof admins)[number];
        return {
          admins: admins.map((admin: AdminDetails) => ({
            userId: admin.userId,
            username: admin.username,
            email: admin.email,
            owner: admin.owner,
            roles: admin.owner ? ['clan-owner'] : ['clan-admin'],
          })),
        };
      } catch (error) {
        fastify.log.error(error, 'Failed to list clan admins');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to list clan admins',
        });
      }
    }
  );

  /**
   * POST /api/clans/:clanId/admins/:userId/promote
   * Story 2.13: Promote an admin to owner
   *
   * Transfers ownership from current owner to the specified admin
   * Only current owner or superadmin can promote
   */
  fastify.post<{ Params: { clanId: string; userId: string } }>(
    '/:clanId/admins/:userId/promote',
    {
      schema: {
        description: 'Promote an admin to owner',
        tags: ['Clans'],
        security: [{ bearerAuth: [] }],
        params: clanUserParamsSchema,
        response: {
          200: successMessageSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { clanId: string; userId: string } }>,
      reply: FastifyReply
    ) => {
      const token = request.cookies.access_token;
      if (!token) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const clanId = parseInt(request.params.clanId, 10);
      const targetUserId = request.params.userId;

      if (isNaN(clanId)) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid clan ID',
        });
      }

      try {
        const decoded = fastify.jwt.decode(token) as {
          sub: string;
          realm_access?: { roles: string[] };
        };
        const actorId = decoded.sub;
        const userRoles = decoded.realm_access?.roles || [];
        const isSuperadmin = userRoles.includes('superadmin');

        // Get actor and target users
        const [actor, targetUser] = await Promise.all([
          fastify.prisma.user.findUnique({ where: { userId: actorId } }),
          fastify.prisma.user.findUnique({ where: { userId: targetUserId } }),
        ]);

        if (!actor) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'User not found',
          });
        }

        if (!targetUser) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Target user not found',
          });
        }

        // Check authorization - must be current owner or superadmin
        const isOwner = actor.owner && actor.clanId === clanId;
        if (!isOwner && !isSuperadmin) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'Only clan owner or superadmin can promote users',
          });
        }

        // Check that target user is a member of this clan
        if (targetUser.clanId !== clanId) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Target user is not a member of this clan',
          });
        }

        // Check that target user is not already owner
        if (targetUser.owner) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'User is already the clan owner',
          });
        }

        // Perform promotion in transaction
        await fastify.prisma.$transaction(async (tx: PrismaTransaction) => {
          // Demote current owner(s)
          await tx.user.updateMany({
            where: {
              clanId,
              owner: true,
            },
            data: {
              owner: false,
            },
          });

          // Promote target user
          await tx.user.update({
            where: { userId: targetUserId },
            data: {
              owner: true,
            },
          });
        });

        // Note: In full implementation, would also update Keycloak roles
        // and create audit log entry

        fastify.log.info({ clanId, targetUserId, actorId }, 'User promoted to owner');

        return {
          message: 'User promoted to owner successfully',
        };
      } catch (error) {
        fastify.log.error(error, 'Failed to promote user');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to promote user',
        });
      }
    }
  );

  /**
   * DELETE /api/clans/:clanId/admins/:userId
   * Story 2.14: Remove an admin from clan
   *
   * Removes the user's clan association and admin role
   * Only owner or superadmin can remove admins
   * Cannot remove the owner (must transfer ownership first)
   */
  fastify.delete<{ Params: { clanId: string; userId: string } }>(
    '/:clanId/admins/:userId',
    {
      schema: {
        description: 'Remove an admin from clan',
        tags: ['Clans'],
        security: [{ bearerAuth: [] }],
        params: clanUserParamsSchema,
        response: {
          200: successMessageSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { clanId: string; userId: string } }>,
      reply: FastifyReply
    ) => {
      const token = request.cookies.access_token;
      if (!token) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const clanId = parseInt(request.params.clanId, 10);
      const targetUserId = request.params.userId;

      if (isNaN(clanId)) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid clan ID',
        });
      }

      try {
        const decoded = fastify.jwt.decode(token) as {
          sub: string;
          realm_access?: { roles: string[] };
        };
        const actorId = decoded.sub;
        const userRoles = decoded.realm_access?.roles || [];
        const isSuperadmin = userRoles.includes('superadmin');

        // Get actor and target users
        const [actor, targetUser] = await Promise.all([
          fastify.prisma.user.findUnique({ where: { userId: actorId } }),
          fastify.prisma.user.findUnique({ where: { userId: targetUserId } }),
        ]);

        if (!actor) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'User not found',
          });
        }

        if (!targetUser) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Target user not found',
          });
        }

        // Check authorization - must be owner or superadmin
        const isOwner = actor.owner && actor.clanId === clanId;
        if (!isOwner && !isSuperadmin) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'Only clan owner or superadmin can remove admins',
          });
        }

        // Check that target user is a member of this clan
        if (targetUser.clanId !== clanId) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Target user is not a member of this clan',
          });
        }

        // Cannot remove owner
        if (targetUser.owner) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Cannot remove clan owner. Transfer ownership first.',
          });
        }

        // Cannot remove yourself
        if (targetUserId === actorId) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Cannot remove yourself. Transfer ownership first if you are the owner.',
          });
        }

        // Remove user's clan association
        await fastify.prisma.user.update({
          where: { userId: targetUserId },
          data: {
            clanId: null,
            owner: false,
          },
        });

        // Note: In full implementation, would also remove Keycloak roles
        // and create audit log entry

        fastify.log.info({ clanId, targetUserId, actorId }, 'Admin removed from clan');

        return {
          message: 'Admin removed from clan successfully',
        };
      } catch (error) {
        fastify.log.error(error, 'Failed to remove admin');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to remove admin',
        });
      }
    }
  );

  /**
   * POST /api/clans/:clanId/deactivate
   * Story 2.15: Deactivate a clan
   *
   * Marks the clan as inactive (soft delete)
   * Only owner or superadmin can deactivate
   */
  fastify.post<{ Params: { clanId: string } }>(
    '/:clanId/deactivate',
    {
      schema: {
        description: 'Deactivate a clan',
        tags: ['Clans'],
        security: [{ bearerAuth: [] }],
        params: clanIdParamSchema,
        response: {
          200: successMessageSchema,
        },
      },
    },
    async (request: FastifyRequest<{ Params: { clanId: string } }>, reply: FastifyReply) => {
      const token = request.cookies.access_token;
      if (!token) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const clanId = parseInt(request.params.clanId, 10);

      if (isNaN(clanId)) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid clan ID',
        });
      }

      try {
        const decoded = fastify.jwt.decode(token) as {
          sub: string;
          realm_access?: { roles: string[] };
        };
        const userId = decoded.sub;
        const userRoles = decoded.realm_access?.roles || [];
        const isSuperadmin = userRoles.includes('superadmin');

        // Get user
        const user = await fastify.prisma.user.findUnique({
          where: { userId },
        });

        if (!user) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'User not found',
          });
        }

        // Check if clan exists
        const clan = await fastify.prisma.clan.findUnique({
          where: { clanId },
        });

        if (!clan) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Clan not found',
          });
        }

        // Check if already inactive
        if (!clan.active) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Clan is already inactive',
          });
        }

        // Check authorization - must be owner or superadmin
        const isOwner = user.owner && user.clanId === clanId;
        if (!isOwner && !isSuperadmin) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'Only clan owner or superadmin can deactivate clan',
          });
        }

        // Deactivate clan
        await fastify.prisma.clan.update({
          where: { clanId },
          data: {
            active: false,
          },
        });

        // Note: In full implementation, would create audit log entry

        fastify.log.info({ clanId, userId }, 'Clan deactivated');

        return {
          message: 'Clan deactivated successfully',
        };
      } catch (error) {
        fastify.log.error(error, 'Failed to deactivate clan');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to deactivate clan',
        });
      }
    }
  );

  done();
}
