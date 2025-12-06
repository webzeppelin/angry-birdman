/**
 * Master Battle Routes
 *
 * API routes for centralized battle schedule management:
 * - Public endpoints for viewing battle schedule and selecting battles
 * - Superadmin endpoints for managing the schedule
 *
 * Related to Epic 4: Battle Data Recording - Master Battle Schedule
 */

import {
  createMasterBattleSchema,
  updateNextBattleDateSchema,
  masterBattleQuerySchema,
} from '@angrybirdman/common';
import { z } from 'zod';

import { authenticate, authorize } from '../middleware/auth.js';
import {
  createAuditService,
  AuditAction,
  EntityType,
  AuditResult,
} from '../services/audit.service.js';
import { MasterBattleService } from '../services/masterBattle.service.js';

import type {
  CreateMasterBattleInput,
  UpdateNextBattleDateInput,
  MasterBattleQueryOptions,
} from '@angrybirdman/common';
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';

// Response schemas for documentation
// Note: Dates are serialized as strings in JSON
const masterBattleSchema = z.object({
  battleId: z.string(),
  startTimestamp: z.coerce.string(),
  endTimestamp: z.coerce.string(),
  createdBy: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.coerce.string(),
  updatedAt: z.coerce.string(),
});

const masterBattlePageSchema = z.object({
  battles: z.array(masterBattleSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

const battleScheduleInfoSchema = z.object({
  currentBattle: masterBattleSchema.nullable(),
  nextBattle: masterBattleSchema.nullable(),
  nextBattleStartDate: z.coerce.string(),
  availableBattles: z.array(masterBattleSchema),
});

const nextBattleDateResponseSchema = z.object({
  nextBattleStartDate: z.coerce.string(),
});

const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
});

const successMessageSchema = z.object({
  message: z.string(),
});

const masterBattlesRoutes: FastifyPluginAsync = async (fastify) => {
  const service = new MasterBattleService(fastify.prisma);
  const audit = createAuditService(fastify.prisma);

  /**
   * GET /api/master-battles
   * List all master battles with optional filtering and pagination (public)
   */
  fastify.get<{
    Querystring: MasterBattleQueryOptions;
  }>(
    '/',
    {
      schema: {
        description: 'List all master battles with optional filtering and pagination',
        tags: ['Master Battles'],
        querystring: masterBattleQuerySchema,
        response: {
          200: masterBattlePageSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: MasterBattleQueryOptions }>) => {
      return service.getAllBattles(request.query);
    }
  );

  /**
   * GET /api/master-battles/available
   * Get available battles for selection in battle entry form (public)
   */
  fastify.get(
    '/available',
    {
      schema: {
        description: 'Get available battles for selection (started battles only)',
        tags: ['Master Battles'],
        response: {
          200: z.array(masterBattleSchema),
        },
      },
    },
    async () => {
      return service.getAvailableBattles();
    }
  );

  /**
   * GET /api/master-battles/schedule-info
   * Get comprehensive schedule information (public)
   */
  fastify.get(
    '/schedule-info',
    {
      schema: {
        description:
          'Get battle schedule information including current, next, and available battles',
        tags: ['Master Battles'],
        response: {
          200: battleScheduleInfoSchema,
        },
      },
    },
    async () => {
      return service.getBattleScheduleInfo();
    }
  );

  /**
   * GET /api/master-battles/next-battle-date
   * Get next scheduled battle date (Superadmin only)
   */
  fastify.get(
    '/next-battle-date',
    {
      onRequest: [authenticate, authorize(['superadmin'])],
      schema: {
        description: 'Get next scheduled battle start date',
        tags: ['Master Battles', 'Superadmin'],
        security: [{ bearerAuth: [] }],
        response: {
          200: nextBattleDateResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const nextBattleStartDate = await service.getNextBattleDate();
        return {
          nextBattleStartDate: nextBattleStartDate.toISOString(),
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes('not configured')) {
          return reply.status(404).send({
            error: 'Not Found',
            message: error.message,
          });
        }
        throw error;
      }
    }
  );

  /**
   * PUT /api/master-battles/next-battle-date
   * Update next scheduled battle date (Superadmin only)
   */
  fastify.put<{
    Body: UpdateNextBattleDateInput;
  }>(
    '/next-battle-date',
    {
      onRequest: [authenticate, authorize(['superadmin'])],
      schema: {
        description: 'Update next scheduled battle start date',
        tags: ['Master Battles', 'Superadmin'],
        security: [{ bearerAuth: [] }],
        body: updateNextBattleDateSchema,
        response: {
          200: successMessageSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    async (request: FastifyRequest<{ Body: UpdateNextBattleDateInput }>, reply: FastifyReply) => {
      const userId = request.authUser?.userId;

      if (!userId) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'User ID not found in token',
        });
      }

      try {
        // Get old value for audit log
        let oldValue: string | null = null;
        try {
          const oldDate = await service.getNextBattleDate();
          oldValue = oldDate.toISOString();
        } catch {
          // Setting doesn't exist yet, that's okay
        }

        // Update the setting
        await service.updateNextBattleDate(request.body, userId);

        // Log the change
        await audit.log({
          actorId: userId,
          actionType: AuditAction.SYSTEM_SETTING_UPDATED,
          entityType: EntityType.SYSTEM_SETTING,
          entityId: 'nextBattleStartDate',
          details: {
            oldValue,
            newValue: request.body.nextBattleStartDate,
            description: 'Updated next battle start date',
          },
          result: AuditResult.SUCCESS,
        });

        return {
          message: 'Next battle date updated successfully',
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes('must be in the future')) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: error.message,
          });
        }
        throw error;
      }
    }
  );

  /**
   * POST /api/master-battles
   * Manually create a master battle entry (Superadmin only)
   */
  fastify.post<{
    Body: CreateMasterBattleInput;
  }>(
    '/',
    {
      onRequest: [authenticate, authorize(['superadmin'])],
      schema: {
        description: 'Manually create a master battle (for corrections or historical data)',
        tags: ['Master Battles', 'Superadmin'],
        security: [{ bearerAuth: [] }],
        body: createMasterBattleSchema,
        response: {
          201: masterBattleSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    async (request: FastifyRequest<{ Body: CreateMasterBattleInput }>, reply: FastifyReply) => {
      const userId = request.authUser?.userId;

      if (!userId) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'User ID not found in token',
        });
      }

      try {
        const battle = await service.createMasterBattle(request.body, userId);

        // Log the creation
        await audit.log({
          actorId: userId,
          actionType: AuditAction.MASTER_BATTLE_CREATED,
          entityType: EntityType.MASTER_BATTLE,
          entityId: battle.battleId,
          details: {
            battle,
            description: `Manually created master battle ${battle.battleId}`,
          },
          result: AuditResult.SUCCESS,
        });

        return reply.status(201).send(battle);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('already exists')) {
            return reply.status(409).send({
              error: 'Conflict',
              message: error.message,
            });
          }
        }
        throw error;
      }
    }
  );

  /**
   * GET /api/master-battles/:battleId
   * Get a specific master battle by ID (public)
   */
  fastify.get<{
    Params: { battleId: string };
  }>(
    '/:battleId',
    {
      schema: {
        description: 'Get a specific master battle by ID',
        tags: ['Master Battles'],
        params: z.object({
          battleId: z.string().regex(/^\d{8}$/, 'Battle ID must be YYYYMMDD format'),
        }),
        response: {
          200: masterBattleSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request: FastifyRequest<{ Params: { battleId: string } }>, reply: FastifyReply) => {
      const battle = await service.getBattleById(request.params.battleId);

      if (!battle) {
        return reply.status(404).send({
          error: 'Not Found',
          message: `Battle ${request.params.battleId} not found`,
        });
      }

      return battle;
    }
  );
};

export default masterBattlesRoutes;
