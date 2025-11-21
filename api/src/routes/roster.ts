/**
 * Roster Management Routes
 * Handles CRUD operations for clan roster members
 *
 * Stories covered: 3.1-3.7 (Epic 3: Core Roster Management)
 */

import { z } from 'zod';

import { authenticate } from '../middleware/auth.js';
import {
  createAuditService,
  AuditAction,
  EntityType,
  AuditResult,
} from '../services/audit.service.js';

import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';

// Validation schemas
const rosterListQuerySchema = z.object({
  active: z
    .enum(['true', 'false', 'all'])
    .optional()
    .default('true')
    .transform((val) => (val === 'all' ? undefined : val === 'true')),
  search: z.string().optional(),
  sortBy: z.enum(['playerName', 'joinedDate', 'leftDate', 'kickedDate']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  page: z.coerce.number().int().min(1).optional().default(1),
});

const clanIdParamSchema = z.object({
  clanId: z.string(),
});

const playerIdParamSchema = z.object({
  clanId: z.string(),
  playerId: z.string(),
});

const rosterMemberResponseSchema = z.object({
  playerId: z.number(),
  clanId: z.number(),
  playerName: z.string(),
  active: z.boolean(),
  joinedDate: z.string(), // ISO date string
  leftDate: z.string().nullable(),
  kickedDate: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const rosterListResponseSchema = z.object({
  players: z.array(rosterMemberResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

const addPlayerSchema = z.object({
  playerName: z.string().min(1).max(100),
  joinedDate: z.string().optional(), // ISO string
});

const updatePlayerSchema = z.object({
  playerName: z.string().min(1).max(100).optional(),
  joinedDate: z.string().optional(), // ISO string
});

const playerLeftSchema = z.object({
  leftDate: z.string().optional(),
});

const playerKickedSchema = z.object({
  kickedDate: z.string().optional(),
  reason: z.string().max(500).optional(),
});

const playerReactivateSchema = z.object({
  joinedDate: z.string().optional(),
});

const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
});

type RosterListQuery = z.infer<typeof rosterListQuerySchema>;
type AddPlayerBody = z.infer<typeof addPlayerSchema>;
type UpdatePlayerBody = z.infer<typeof updatePlayerSchema>;
type PlayerLeftBody = z.infer<typeof playerLeftSchema>;
type PlayerKickedBody = z.infer<typeof playerKickedSchema>;
type PlayerReactivateBody = z.infer<typeof playerReactivateSchema>;

const rosterRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/clans/:clanId/roster/:playerId/history
   * Story 3.8: View Player History
   * Get comprehensive player history including battle participation and action codes
   */
  fastify.get<{ Params: { clanId: string; playerId: string } }>(
    '/:clanId/roster/:playerId/history',
    {
      schema: {
        description:
          'Get comprehensive player history including battle participation and statistics',
        tags: ['Roster'],
        params: playerIdParamSchema,
        response: {
          200: z.object({
            player: rosterMemberResponseSchema,
            summary: z.object({
              totalBattles: z.number(),
              totalParticipated: z.number(),
              totalNonparticipated: z.number(),
              averageScore: z.number(),
              averageFp: z.number(),
              averageRatio: z.number(),
              averageRank: z.number(),
              averageRatioRank: z.number(),
              participationRate: z.number(),
            }),
            recentBattles: z.array(
              z.object({
                battleId: z.string(),
                startDate: z.string(),
                endDate: z.string(),
                participated: z.boolean(),
                rank: z.number().nullable(),
                score: z.number().nullable(),
                fp: z.number().nullable(),
                ratio: z.number().nullable(),
                ratioRank: z.number().nullable(),
                actionCode: z.string(),
                actionReason: z.string().nullable(),
              })
            ),
            actionCodeHistory: z.array(
              z.object({
                actionCode: z.string(),
                count: z.number(),
                percentage: z.number(),
              })
            ),
          }),
          404: errorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { clanId: string; playerId: string } }>,
      reply: FastifyReply
    ) => {
      const clanId = parseInt(request.params.clanId, 10);
      const playerId = parseInt(request.params.playerId, 10);

      if (isNaN(clanId) || isNaN(playerId)) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid clan ID or player ID',
        });
      }

      try {
        // Get the player
        const player = await fastify.prisma.rosterMember.findFirst({
          where: {
            playerId,
            clanId,
          },
        });

        if (!player) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Player not found in this clan',
          });
        }

        // Get player participation stats
        const participatedStats = await fastify.prisma.clanBattlePlayerStats.findMany({
          where: {
            playerId,
            clanId,
          },
          include: {
            battle: {
              select: {
                battleId: true,
                startDate: true,
                endDate: true,
              },
            },
          },
          orderBy: {
            battle: {
              startDate: 'desc',
            },
          },
        });

        // Get non-participated stats
        const nonparticipatedStats = await fastify.prisma.clanBattleNonplayerStats.findMany({
          where: {
            playerId,
            clanId,
          },
          include: {
            battle: {
              select: {
                battleId: true,
                startDate: true,
                endDate: true,
              },
            },
          },
          orderBy: {
            battle: {
              startDate: 'desc',
            },
          },
        });

        // Calculate summary statistics
        const totalParticipated = participatedStats.length;
        const totalNonparticipated = nonparticipatedStats.length;
        const totalBattles = totalParticipated + totalNonparticipated;

        const averageScore =
          totalParticipated > 0
            ? participatedStats.reduce((sum, s) => sum + s.score, 0) / totalParticipated
            : 0;

        const averageFp =
          totalParticipated > 0
            ? participatedStats.reduce((sum, s) => sum + s.fp, 0) / totalParticipated
            : 0;

        const averageRatio =
          totalParticipated > 0
            ? participatedStats.reduce((sum, s) => sum + s.ratio, 0) / totalParticipated
            : 0;

        const averageRank =
          totalParticipated > 0
            ? participatedStats.reduce((sum, s) => sum + s.rank, 0) / totalParticipated
            : 0;

        const averageRatioRank =
          totalParticipated > 0
            ? participatedStats.reduce((sum, s) => sum + s.ratioRank, 0) / totalParticipated
            : 0;

        const participationRate = totalBattles > 0 ? (totalParticipated / totalBattles) * 100 : 0;

        // Combine and format recent battles (limit to 20)
        const recentBattles = [
          ...participatedStats.slice(0, 20).map((s) => ({
            battleId: s.battleId,
            startDate: s.battle.startDate.toISOString(),
            endDate: s.battle.endDate.toISOString(),
            participated: true,
            rank: s.rank,
            score: s.score,
            fp: s.fp,
            ratio: s.ratio,
            ratioRank: s.ratioRank,
            actionCode: s.actionCode,
            actionReason: s.actionReason,
          })),
          ...nonparticipatedStats.slice(0, 20).map((s) => ({
            battleId: s.battleId,
            startDate: s.battle.startDate.toISOString(),
            endDate: s.battle.endDate.toISOString(),
            participated: false,
            rank: null,
            score: null,
            fp: s.fp,
            ratio: null,
            ratioRank: null,
            actionCode: s.actionCode,
            actionReason: s.actionReason,
          })),
        ]
          .sort((a, b) => b.startDate.localeCompare(a.startDate))
          .slice(0, 20);

        // Calculate action code frequency
        const allActionCodes = [
          ...participatedStats.map((s) => s.actionCode),
          ...nonparticipatedStats.map((s) => s.actionCode),
        ];

        const actionCodeCounts: Record<string, number> = {};
        allActionCodes.forEach((code) => {
          actionCodeCounts[code] = (actionCodeCounts[code] || 0) + 1;
        });

        const actionCodeHistory = Object.entries(actionCodeCounts)
          .map(([actionCode, count]) => ({
            actionCode,
            count,
            percentage: totalBattles > 0 ? (count / totalBattles) * 100 : 0,
          }))
          .sort((a, b) => b.count - a.count);

        return reply.status(200).send({
          player: {
            ...player,
            joinedDate: player.joinedDate.toISOString(),
            leftDate: player.leftDate ? player.leftDate.toISOString() : null,
            kickedDate: player.kickedDate ? player.kickedDate.toISOString() : null,
            createdAt: player.createdAt.toISOString(),
            updatedAt: player.updatedAt.toISOString(),
          },
          summary: {
            totalBattles,
            totalParticipated,
            totalNonparticipated,
            averageScore,
            averageFp,
            averageRatio,
            averageRank,
            averageRatioRank,
            participationRate,
          },
          recentBattles,
          actionCodeHistory,
        });
      } catch (error) {
        console.error('Error fetching player history:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch player history',
        });
      }
    }
  );

  /**
   * GET /api/clans/:clanId/roster
   * Story 3.1: View Clan Roster (Authenticated Admin)
   * Story 3.2: View Roster (Anonymous)
   * List roster members with filtering
   */
  fastify.get<{ Params: { clanId: string }; Querystring: RosterListQuery }>(
    '/:clanId/roster',
    {
      schema: {
        description: 'Get roster members for a clan with optional filtering',
        tags: ['Roster'],
        params: clanIdParamSchema,
        querystring: rosterListQuerySchema,
        response: {
          200: rosterListResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { clanId: string }; Querystring: RosterListQuery }>,
      reply: FastifyReply
    ) => {
      const clanId = parseInt(request.params.clanId, 10);

      if (isNaN(clanId)) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid clan ID',
        });
      }

      const { active, search, sortBy, sortOrder, limit, page } = request.query;

      // Build where clause
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = { clanId };

      if (active !== undefined) {
        where.active = active;
      }

      if (search) {
        where.playerName = { contains: search, mode: 'insensitive' };
      }

      try {
        // Get total count for pagination
        const total = await fastify.prisma.rosterMember.count({ where });

        // Get paginated roster members
        const players = await fastify.prisma.rosterMember.findMany({
          where,
          orderBy: sortBy ? { [sortBy]: sortOrder } : { playerName: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
        });

        // Format dates as ISO strings
        const formattedPlayers = players.map((player) => ({
          ...player,
          joinedDate: player.joinedDate.toISOString(),
          leftDate: player.leftDate ? player.leftDate.toISOString() : null,
          kickedDate: player.kickedDate ? player.kickedDate.toISOString() : null,
          createdAt: player.createdAt.toISOString(),
          updatedAt: player.updatedAt.toISOString(),
        }));

        return reply.status(200).send({
          players: formattedPlayers,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      } catch (error) {
        console.error('Error fetching roster:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch roster',
        });
      }
    }
  );

  /**
   * POST /api/clans/:clanId/roster
   * Story 3.3: Add Player to Roster
   * Create new roster member
   */
  fastify.post<{ Params: { clanId: string }; Body: AddPlayerBody }>(
    '/:clanId/roster',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Add a new player to the clan roster',
        tags: ['Roster'],
        security: [{ bearerAuth: [] }],
        params: clanIdParamSchema,
        body: addPlayerSchema,
        response: {
          201: rosterMemberResponseSchema,
          400: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { clanId: string }; Body: AddPlayerBody }>,
      reply: FastifyReply
    ) => {
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

      // Check authorization
      const isSuperadmin = authUser.roles.includes('superadmin');
      const isClanMember = authUser.clanId === clanId;

      if (!isSuperadmin && !isClanMember) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have access to this clan',
        });
      }

      const { playerName, joinedDate } = request.body;
      const audit = createAuditService(fastify.prisma);

      try {
        // Check for duplicate player name in clan
        const existingPlayer = await fastify.prisma.rosterMember.findFirst({
          where: {
            clanId,
            playerName,
          },
        });

        if (existingPlayer) {
          return reply.status(409).send({
            error: 'Conflict',
            message: `A player named "${playerName}" already exists in this clan`,
          });
        }

        // Create the roster member
        const player = await fastify.prisma.rosterMember.create({
          data: {
            clanId,
            playerName,
            joinedDate: joinedDate ? new Date(joinedDate) : new Date(),
            active: true,
          },
        });

        // Log the action
        await audit.log({
          actorId: authUser.userId,
          actionType: AuditAction.ROSTER_MEMBER_ADDED,
          entityType: EntityType.ROSTER_MEMBER,
          entityId: player.playerId.toString(),
          clanId,
          details: JSON.stringify({ playerName, joinedDate: player.joinedDate }),
          result: AuditResult.SUCCESS,
        });

        return reply.status(201).send({
          ...player,
          joinedDate: player.joinedDate.toISOString(),
          leftDate: player.leftDate ? player.leftDate.toISOString() : null,
          kickedDate: player.kickedDate ? player.kickedDate.toISOString() : null,
          createdAt: player.createdAt.toISOString(),
          updatedAt: player.updatedAt.toISOString(),
        });
      } catch (error) {
        console.error('Error adding player to roster:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to add player to roster',
        });
      }
    }
  );

  /**
   * PUT /api/clans/:clanId/roster/:playerId
   * Story 3.4: Edit Player Information
   * Update roster member
   */
  fastify.put<{ Params: { clanId: string; playerId: string }; Body: UpdatePlayerBody }>(
    '/:clanId/roster/:playerId',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Update a roster member',
        tags: ['Roster'],
        security: [{ bearerAuth: [] }],
        params: playerIdParamSchema,
        body: updatePlayerSchema,
        response: {
          200: rosterMemberResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { clanId: string; playerId: string };
        Body: UpdatePlayerBody;
      }>,
      reply: FastifyReply
    ) => {
      const authUser = request.authUser;
      if (!authUser) {
        return reply
          .status(401)
          .send({ error: 'Unauthorized', message: 'Authentication required' });
      }

      const clanId = parseInt(request.params.clanId, 10);
      const playerId = parseInt(request.params.playerId, 10);

      if (isNaN(clanId) || isNaN(playerId)) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid clan ID or player ID',
        });
      }

      // Check authorization
      const isSuperadmin = authUser.roles.includes('superadmin');
      const isClanMember = authUser.clanId === clanId;

      if (!isSuperadmin && !isClanMember) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have access to this clan',
        });
      }

      const { playerName, joinedDate } = request.body;
      const audit = createAuditService(fastify.prisma);

      try {
        // Check if player exists and belongs to clan
        const existingPlayer = await fastify.prisma.rosterMember.findFirst({
          where: {
            playerId,
            clanId,
          },
        });

        if (!existingPlayer) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Player not found in this clan',
          });
        }

        // Check for duplicate name if changing name
        if (playerName && playerName !== existingPlayer.playerName) {
          const duplicateName = await fastify.prisma.rosterMember.findFirst({
            where: {
              clanId,
              playerName,
              playerId: { not: playerId },
            },
          });

          if (duplicateName) {
            return reply.status(409).send({
              error: 'Conflict',
              message: `A player named "${playerName}" already exists in this clan`,
            });
          }
        }

        // Build update data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {};

        if (playerName !== undefined) updateData.playerName = playerName;
        if (joinedDate !== undefined) updateData.joinedDate = new Date(joinedDate);

        // Update the player
        const updatedPlayer = await fastify.prisma.rosterMember.update({
          where: { playerId },
          data: updateData,
        });

        // Log the action
        await audit.log({
          actorId: authUser.userId,
          actionType: AuditAction.ROSTER_MEMBER_UPDATED,
          entityType: EntityType.ROSTER_MEMBER,
          entityId: playerId.toString(),
          clanId,
          details: JSON.stringify(updateData),
          result: AuditResult.SUCCESS,
        });

        return reply.status(200).send({
          ...updatedPlayer,
          joinedDate: updatedPlayer.joinedDate.toISOString(),
          leftDate: updatedPlayer.leftDate ? updatedPlayer.leftDate.toISOString() : null,
          kickedDate: updatedPlayer.kickedDate ? updatedPlayer.kickedDate.toISOString() : null,
          createdAt: updatedPlayer.createdAt.toISOString(),
          updatedAt: updatedPlayer.updatedAt.toISOString(),
        });
      } catch (error) {
        console.error('Error updating player:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to update player',
        });
      }
    }
  );

  /**
   * POST /api/clans/:clanId/roster/:playerId/left
   * Story 3.5: Record Player Leaving Clan
   * Mark player as left
   */
  fastify.post<{ Params: { clanId: string; playerId: string }; Body: PlayerLeftBody }>(
    '/:clanId/roster/:playerId/left',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Record a player leaving the clan voluntarily',
        tags: ['Roster'],
        security: [{ bearerAuth: [] }],
        params: playerIdParamSchema,
        body: playerLeftSchema,
        response: {
          200: rosterMemberResponseSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { clanId: string; playerId: string };
        Body: PlayerLeftBody;
      }>,
      reply: FastifyReply
    ) => {
      const authUser = request.authUser;
      if (!authUser) {
        return reply
          .status(401)
          .send({ error: 'Unauthorized', message: 'Authentication required' });
      }

      const clanId = parseInt(request.params.clanId, 10);
      const playerId = parseInt(request.params.playerId, 10);

      if (isNaN(clanId) || isNaN(playerId)) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid clan ID or player ID',
        });
      }

      // Check authorization
      const isSuperadmin = authUser.roles.includes('superadmin');
      const isClanMember = authUser.clanId === clanId;

      if (!isSuperadmin && !isClanMember) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have access to this clan',
        });
      }

      const { leftDate } = request.body;
      const audit = createAuditService(fastify.prisma);

      try {
        // Check if player exists and belongs to clan
        const existingPlayer = await fastify.prisma.rosterMember.findFirst({
          where: {
            playerId,
            clanId,
          },
        });

        if (!existingPlayer) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Player not found in this clan',
          });
        }

        // Check if player is already inactive
        if (!existingPlayer.active) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Player is already inactive',
          });
        }

        // Update player status
        const updatedPlayer = await fastify.prisma.rosterMember.update({
          where: { playerId },
          data: {
            active: false,
            leftDate: leftDate ? new Date(leftDate) : new Date(),
            kickedDate: null, // Clear kicked date if previously kicked
          },
        });

        // Log the action
        await audit.log({
          actorId: authUser.userId,
          actionType: AuditAction.ROSTER_MEMBER_LEFT,
          entityType: EntityType.ROSTER_MEMBER,
          entityId: playerId.toString(),
          clanId,
          details: JSON.stringify({ leftDate: updatedPlayer.leftDate }),
          result: AuditResult.SUCCESS,
        });

        return reply.status(200).send({
          ...updatedPlayer,
          joinedDate: updatedPlayer.joinedDate.toISOString(),
          leftDate: updatedPlayer.leftDate ? updatedPlayer.leftDate.toISOString() : null,
          kickedDate: updatedPlayer.kickedDate ? updatedPlayer.kickedDate.toISOString() : null,
          createdAt: updatedPlayer.createdAt.toISOString(),
          updatedAt: updatedPlayer.updatedAt.toISOString(),
        });
      } catch (error) {
        console.error('Error marking player as left:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to mark player as left',
        });
      }
    }
  );

  /**
   * POST /api/clans/:clanId/roster/:playerId/kicked
   * Story 3.6: Record Player Being Kicked
   * Mark player as kicked
   */
  fastify.post<{ Params: { clanId: string; playerId: string }; Body: PlayerKickedBody }>(
    '/:clanId/roster/:playerId/kicked',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Record a player being kicked from the clan',
        tags: ['Roster'],
        security: [{ bearerAuth: [] }],
        params: playerIdParamSchema,
        body: playerKickedSchema,
        response: {
          200: rosterMemberResponseSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { clanId: string; playerId: string };
        Body: PlayerKickedBody;
      }>,
      reply: FastifyReply
    ) => {
      const authUser = request.authUser;
      if (!authUser) {
        return reply
          .status(401)
          .send({ error: 'Unauthorized', message: 'Authentication required' });
      }

      const clanId = parseInt(request.params.clanId, 10);
      const playerId = parseInt(request.params.playerId, 10);

      if (isNaN(clanId) || isNaN(playerId)) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid clan ID or player ID',
        });
      }

      // Check authorization
      const isSuperadmin = authUser.roles.includes('superadmin');
      const isClanMember = authUser.clanId === clanId;

      if (!isSuperadmin && !isClanMember) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have access to this clan',
        });
      }

      const { kickedDate, reason } = request.body;
      const audit = createAuditService(fastify.prisma);

      try {
        // Check if player exists and belongs to clan
        const existingPlayer = await fastify.prisma.rosterMember.findFirst({
          where: {
            playerId,
            clanId,
          },
        });

        if (!existingPlayer) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Player not found in this clan',
          });
        }

        // Check if player is already inactive
        if (!existingPlayer.active) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Player is already inactive',
          });
        }

        // Update player status
        const updatedPlayer = await fastify.prisma.rosterMember.update({
          where: { playerId },
          data: {
            active: false,
            kickedDate: kickedDate ? new Date(kickedDate) : new Date(),
            leftDate: null, // Clear left date if previously left
          },
        });

        // Log the action
        await audit.log({
          actorId: authUser.userId,
          actionType: AuditAction.ROSTER_MEMBER_KICKED,
          entityType: EntityType.ROSTER_MEMBER,
          entityId: playerId.toString(),
          clanId,
          details: JSON.stringify({ kickedDate: updatedPlayer.kickedDate, reason }),
          result: AuditResult.SUCCESS,
        });

        return reply.status(200).send({
          ...updatedPlayer,
          joinedDate: updatedPlayer.joinedDate.toISOString(),
          leftDate: updatedPlayer.leftDate ? updatedPlayer.leftDate.toISOString() : null,
          kickedDate: updatedPlayer.kickedDate ? updatedPlayer.kickedDate.toISOString() : null,
          createdAt: updatedPlayer.createdAt.toISOString(),
          updatedAt: updatedPlayer.updatedAt.toISOString(),
        });
      } catch (error) {
        console.error('Error kicking player:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to kick player',
        });
      }
    }
  );

  /**
   * POST /api/clans/:clanId/roster/:playerId/reactivate
   * Story 3.7: Reactivate Player
   * Reactivate player
   */
  fastify.post<{ Params: { clanId: string; playerId: string }; Body: PlayerReactivateBody }>(
    '/:clanId/roster/:playerId/reactivate',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Reactivate an inactive player',
        tags: ['Roster'],
        security: [{ bearerAuth: [] }],
        params: playerIdParamSchema,
        body: playerReactivateSchema,
        response: {
          200: rosterMemberResponseSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { clanId: string; playerId: string };
        Body: PlayerReactivateBody;
      }>,
      reply: FastifyReply
    ) => {
      const authUser = request.authUser;
      if (!authUser) {
        return reply
          .status(401)
          .send({ error: 'Unauthorized', message: 'Authentication required' });
      }

      const clanId = parseInt(request.params.clanId, 10);
      const playerId = parseInt(request.params.playerId, 10);

      if (isNaN(clanId) || isNaN(playerId)) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid clan ID or player ID',
        });
      }

      // Check authorization
      const isSuperadmin = authUser.roles.includes('superadmin');
      const isClanMember = authUser.clanId === clanId;

      if (!isSuperadmin && !isClanMember) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have access to this clan',
        });
      }

      const { joinedDate } = request.body;
      const audit = createAuditService(fastify.prisma);

      try {
        // Check if player exists and belongs to clan
        const existingPlayer = await fastify.prisma.rosterMember.findFirst({
          where: {
            playerId,
            clanId,
          },
        });

        if (!existingPlayer) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Player not found in this clan',
          });
        }

        // Check if player is already active
        if (existingPlayer.active) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Player is already active',
          });
        }

        // Reactivate player
        const updatedPlayer = await fastify.prisma.rosterMember.update({
          where: { playerId },
          data: {
            active: true,
            joinedDate: joinedDate ? new Date(joinedDate) : new Date(),
            leftDate: null,
            kickedDate: null,
          },
        });

        // Log the action
        await audit.log({
          actorId: authUser.userId,
          actionType: AuditAction.ROSTER_MEMBER_REACTIVATED,
          entityType: EntityType.ROSTER_MEMBER,
          entityId: playerId.toString(),
          clanId,
          details: JSON.stringify({ joinedDate: updatedPlayer.joinedDate }),
          result: AuditResult.SUCCESS,
        });

        return reply.status(200).send({
          ...updatedPlayer,
          joinedDate: updatedPlayer.joinedDate.toISOString(),
          leftDate: updatedPlayer.leftDate ? updatedPlayer.leftDate.toISOString() : null,
          kickedDate: updatedPlayer.kickedDate ? updatedPlayer.kickedDate.toISOString() : null,
          createdAt: updatedPlayer.createdAt.toISOString(),
          updatedAt: updatedPlayer.updatedAt.toISOString(),
        });
      } catch (error) {
        console.error('Error reactivating player:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to reactivate player',
        });
      }
    }
  );

  /**
   * POST /api/clans/:clanId/roster/import
   * Story 3.9: Bulk Import Roster
   * Import multiple roster members from CSV data
   */
  fastify.post<{
    Params: { clanId: string };
    Body: { players: Array<{ playerName: string; joinedDate?: string }> };
  }>(
    '/:clanId/roster/import',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Import multiple roster members from CSV data',
        tags: ['Roster'],
        security: [{ bearerAuth: [] }],
        params: clanIdParamSchema,
        body: z.object({
          players: z.array(
            z.object({
              playerName: z.string().min(1).max(100),
              joinedDate: z.string().optional(),
            })
          ),
        }),
        response: {
          200: z.object({
            imported: z.number(),
            failed: z.number(),
            errors: z.array(
              z.object({
                playerName: z.string(),
                error: z.string(),
              })
            ),
          }),
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { clanId: string };
        Body: { players: Array<{ playerName: string; joinedDate?: string }> };
      }>,
      reply: FastifyReply
    ) => {
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

      // Check authorization
      const isSuperadmin = authUser.roles.includes('superadmin');
      const isClanMember = authUser.clanId === clanId;

      if (!isSuperadmin && !isClanMember) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have access to this clan',
        });
      }

      const { players } = request.body;
      const audit = createAuditService(fastify.prisma);

      let imported = 0;
      const errors: Array<{ playerName: string; error: string }> = [];

      // Get existing players to check for duplicates
      const existingPlayers = await fastify.prisma.rosterMember.findMany({
        where: { clanId },
        select: { playerName: true },
      });

      const existingNames = new Set(existingPlayers.map((p) => p.playerName.toLowerCase()));

      for (const player of players) {
        try {
          // Check for duplicate
          if (existingNames.has(player.playerName.toLowerCase())) {
            errors.push({
              playerName: player.playerName,
              error: 'Player already exists in roster',
            });
            continue;
          }

          // Check for duplicate within import batch
          if (existingNames.has(player.playerName.toLowerCase())) {
            errors.push({
              playerName: player.playerName,
              error: 'Duplicate player name in import batch',
            });
            continue;
          }

          // Create the roster member
          await fastify.prisma.rosterMember.create({
            data: {
              clanId,
              playerName: player.playerName,
              joinedDate: player.joinedDate ? new Date(player.joinedDate) : new Date(),
              active: true,
            },
          });

          existingNames.add(player.playerName.toLowerCase());
          imported++;
        } catch (error) {
          console.error(`Error importing player ${player.playerName}:`, error);
          errors.push({
            playerName: player.playerName,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Log the bulk import action
      await audit.log({
        actorId: authUser.userId,
        actionType: AuditAction.ROSTER_MEMBER_ADDED,
        entityType: EntityType.ROSTER_MEMBER,
        entityId: 'bulk-import',
        clanId,
        details: JSON.stringify({ imported, failed: errors.length }),
        result: imported > 0 ? AuditResult.SUCCESS : AuditResult.FAILURE,
      });

      return reply.status(200).send({
        imported,
        failed: errors.length,
        errors,
      });
    }
  );

  /**
   * GET /api/clans/:clanId/roster/export
   * Story 3.9: Export Roster
   * Export roster members as CSV data
   */
  fastify.get<{ Params: { clanId: string }; Querystring: { active?: string } }>(
    '/:clanId/roster/export',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Export roster members as CSV data',
        tags: ['Roster'],
        security: [{ bearerAuth: [] }],
        params: clanIdParamSchema,
        querystring: z.object({
          active: z.enum(['true', 'false', 'all']).optional().default('all'),
        }),
        response: {
          200: z.object({
            csv: z.string(),
            filename: z.string(),
          }),
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { clanId: string }; Querystring: { active?: string } }>,
      reply: FastifyReply
    ) => {
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

      // Check authorization
      const isSuperadmin = authUser.roles.includes('superadmin');
      const isClanMember = authUser.clanId === clanId;

      if (!isSuperadmin && !isClanMember) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have access to this clan',
        });
      }

      const { active } = request.query;

      // Build where clause
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = { clanId };

      if (active === 'true') {
        where.active = true;
      } else if (active === 'false') {
        where.active = false;
      }

      try {
        const players = await fastify.prisma.rosterMember.findMany({
          where,
          orderBy: { playerName: 'asc' },
        });

        // Generate CSV
        const header = 'Player Name,Joined Date,Active,Left Date,Kicked Date\n';
        const rows = players
          .map((p) => {
            const joinedDate = p.joinedDate.toISOString().split('T')[0];
            const leftDate = p.leftDate ? p.leftDate.toISOString().split('T')[0] : '';
            const kickedDate = p.kickedDate ? p.kickedDate.toISOString().split('T')[0] : '';
            return `"${p.playerName}",${joinedDate},${p.active},${leftDate},${kickedDate}`;
          })
          .join('\n');

        const csv = header + rows;
        const filename = `roster-export-${clanId}-${new Date().toISOString().split('T')[0]}.csv`;

        return reply.status(200).send({
          csv,
          filename,
        });
      } catch (error) {
        console.error('Error exporting roster:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to export roster',
        });
      }
    }
  );

  /**
   * GET /api/clans/:clanId/roster/template
   * Story 3.9: Download Roster Import Template
   * Get CSV template for roster import
   */
  fastify.get<{ Params: { clanId: string } }>(
    '/:clanId/roster/template',
    {
      schema: {
        description: 'Get CSV template for roster import',
        tags: ['Roster'],
        params: clanIdParamSchema,
        response: {
          200: z.object({
            csv: z.string(),
            filename: z.string(),
          }),
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

      // Generate CSV template with example data
      const csv = `Player Name,Joined Date
Example Player 1,2025-01-01
Example Player 2,2025-01-15
Example Player 3,2025-02-01`;

      const filename = `roster-import-template-${clanId}.csv`;

      return reply.status(200).send({
        csv,
        filename,
      });
    }
  );
};

export default rosterRoutes;
