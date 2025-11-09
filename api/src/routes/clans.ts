/**
 * Clan Routes
 *
 * API routes for clan operations including:
 * - Public clan directory browsing
 * - Clan profile viewing
 * - Clan registration and management (requires authentication)
 */

import { z } from 'zod';

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

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

type ClanQueryParams = z.infer<typeof clanQuerySchema>;
type ClanCreateBody = z.infer<typeof clanCreateSchema>;
type ClanUpdateBody = z.infer<typeof clanUpdateSchema>;

export default function clanRoutes(fastify: FastifyInstance, _opts: unknown, done: () => void) {
  /**
   * GET /api/clans
   * Get list of all clans with filtering and pagination (public endpoint)
   */
  fastify.get<{ Querystring: ClanQueryParams }>(
    '/api/clans',
    {
      schema: {
        description: 'Get list of clans with optional filtering and pagination',
        tags: ['Clans'],
        querystring: {
          type: 'object',
          properties: {
            search: { type: 'string', description: 'Search by clan name' },
            country: { type: 'string', description: 'Filter by country' },
            active: { type: 'string', enum: ['true', 'false', 'all'], default: 'true' },
            page: { type: 'integer', minimum: 1, default: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            sortBy: {
              type: 'string',
              enum: ['name', 'country', 'registrationDate'],
              default: 'name',
            },
            sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              clans: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    clanId: { type: 'integer' },
                    rovioId: { type: 'integer' },
                    name: { type: 'string' },
                    country: { type: 'string' },
                    registrationDate: { type: 'string', format: 'date' },
                    active: { type: 'boolean' },
                    battleCount: { type: 'integer' },
                  },
                },
              },
              pagination: {
                type: 'object',
                properties: {
                  total: { type: 'integer' },
                  page: { type: 'integer' },
                  limit: { type: 'integer' },
                  totalPages: { type: 'integer' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: ClanQueryParams }>, reply: FastifyReply) => {
      const queryResult = clanQuerySchema.safeParse(request.query);

      if (!queryResult.success) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid query parameters',
          details: queryResult.error.errors,
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

        return {
          clans: clans.map((clan) => ({
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
    '/api/clans/:clanId',
    {
      schema: {
        description: 'Get detailed information about a specific clan',
        tags: ['Clans'],
        params: {
          type: 'object',
          required: ['clanId'],
          properties: {
            clanId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              clanId: { type: 'integer' },
              rovioId: { type: 'integer' },
              name: { type: 'string' },
              country: { type: 'string' },
              registrationDate: { type: 'string', format: 'date' },
              active: { type: 'boolean' },
              stats: {
                type: 'object',
                properties: {
                  totalBattles: { type: 'integer' },
                  activePlayers: { type: 'integer' },
                  totalPlayers: { type: 'integer' },
                },
              },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
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
    '/api/clans',
    {
      schema: {
        description: 'Register a new clan',
        tags: ['Clans'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['rovioId', 'name', 'country'],
          properties: {
            rovioId: { type: 'integer', minimum: 1 },
            name: { type: 'string', minLength: 1, maxLength: 100 },
            country: { type: 'string', minLength: 1, maxLength: 100 },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              clanId: { type: 'integer' },
              rovioId: { type: 'integer' },
              name: { type: 'string' },
              country: { type: 'string' },
              registrationDate: { type: 'string', format: 'date' },
            },
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          401: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          409: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
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
          details: bodyResult.error.errors,
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
        const clan = await fastify.prisma.$transaction(async (tx) => {
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
    '/api/clans/:clanId',
    {
      schema: {
        description: 'Update clan information',
        tags: ['Clans'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['clanId'],
          properties: {
            clanId: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100 },
            country: { type: 'string', minLength: 1, maxLength: 100 },
            active: { type: 'boolean' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              clanId: { type: 'integer' },
              rovioId: { type: 'integer' },
              name: { type: 'string' },
              country: { type: 'string' },
              active: { type: 'boolean' },
            },
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          401: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          403: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
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
          details: bodyResult.error.errors,
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

  done();
}
