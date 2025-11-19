/**
 * Battle Management Routes
 * Handles CRUD operations for clan battles and battle statistics
 *
 * Stories covered: 4.1-4.11 (Epic 4: Battle Data Recording)
 */

import { battleQuerySchema } from '@angrybirdman/common';
import { z } from 'zod';

import { authenticate } from '../middleware/auth.js';
import { BattleService } from '../services/battle.service.js';

import type { BattleEntry, BattleUpdate, BattleQuery } from '@angrybirdman/common';
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';

// We use a simplified version of the schemas for route params
const clanIdParamSchema = z.object({
  clanId: z.string().regex(/^\d+$/),
});

const battleIdParamSchema = z.object({
  clanId: z.string().regex(/^\d+$/),
  battleId: z.string().regex(/^\d{8}$/),
});

const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
});

const battlesRoutes: FastifyPluginAsync = async (fastify) => {
  const battleService = new BattleService(fastify.prisma);

  /**
   * GET /api/action-codes
   * Get list of all available action codes
   * Story: 4.6, 4.7 (action code assignment)
   */
  fastify.get(
    '/action-codes',
    {
      schema: {
        description: 'Get list of all available action codes',
        tags: ['Battles', 'Action Codes'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                actionCode: { type: 'string' },
                displayName: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async () => {
      return fastify.prisma.actionCode.findMany({
        select: {
          actionCode: true,
          displayName: true,
        },
      });
    }
  );

  /**
   * GET /api/clans/:clanId/battles
   * List battles for a clan with optional filtering
   * Story: 4.10 (battle viewing)
   */
  fastify.get<{
    Params: { clanId: string };
    Querystring: BattleQuery;
  }>(
    '/:clanId/battles',
    {
      schema: {
        description: 'List battles for a clan with optional filtering and pagination',
        tags: ['Battles'],
        params: clanIdParamSchema,
        querystring: battleQuerySchema,
        response: {
          200: z.object({
            battles: z.array(z.any()),
            total: z.number(),
            page: z.number(),
            limit: z.number(),
          }),
        },
      },
    },
    async (request: FastifyRequest<{ Params: { clanId: string }; Querystring: BattleQuery }>) => {
      const clanId = parseInt(request.params.clanId, 10);

      if (isNaN(clanId)) {
        throw new Error('Invalid clan ID');
      }

      // Query params are automatically validated and coerced by battleQuerySchema
      return battleService.getBattles(clanId, request.query);
    }
  );

  /**
   * GET /api/clans/:clanId/battles/:battleId
   * Get detailed information about a specific battle
   * Story: 4.10 (battle viewing)
   */
  fastify.get<{
    Params: { clanId: string; battleId: string };
  }>(
    '/:clanId/battles/:battleId',
    {
      schema: {
        description: 'Get detailed information about a specific battle',
        tags: ['Battles'],
        params: battleIdParamSchema,
        response: {
          200: z.any(),
          404: errorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { clanId: string; battleId: string } }>,
      reply: FastifyReply
    ) => {
      const clanId = parseInt(request.params.clanId, 10);
      const battleId = request.params.battleId;

      if (isNaN(clanId)) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid clan ID',
        });
      }

      try {
        return await battleService.getBattleById(clanId, battleId);
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
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
   * POST /api/clans/:clanId/battles
   * Create a new battle record with all statistics
   * Stories: 4.1-4.9 (complete battle entry workflow)
   */
  fastify.post<{
    Params: { clanId: string };
    Body: BattleEntry;
  }>(
    '/:clanId/battles',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Create a new battle record with all statistics',
        tags: ['Battles'],
        security: [{ bearerAuth: [] }],
        params: clanIdParamSchema,
        response: {
          201: z.any(),
          400: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { clanId: string }; Body: BattleEntry }>,
      reply: FastifyReply
    ) => {
      const authUser = request.authUser;
      if (!authUser) {
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

      // Check authorization
      const isSuperadmin = authUser.roles.includes('superadmin');
      const isClanMember = authUser.clanId === clanId;

      if (!isSuperadmin && !isClanMember) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have access to this clan',
        });
      }

      try {
        const battle = await battleService.createBattle(clanId, request.body);
        return reply.status(201).send(battle);
      } catch (error) {
        if (error instanceof Error && error.message.includes('already exists')) {
          return reply.status(409).send({
            error: 'Conflict',
            message: error.message,
          });
        }
        throw error;
      }
    }
  );

  /**
   * PUT /api/clans/:clanId/battles/:battleId
   * Update an existing battle record
   * Story: 4.11 (battle editing)
   */
  fastify.put<{
    Params: { clanId: string; battleId: string };
    Body: BattleUpdate;
  }>(
    '/:clanId/battles/:battleId',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Update an existing battle record',
        tags: ['Battles'],
        security: [{ bearerAuth: [] }],
        params: battleIdParamSchema,
        response: {
          200: z.any(),
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { clanId: string; battleId: string }; Body: BattleUpdate }>,
      reply: FastifyReply
    ) => {
      const authUser = request.authUser;
      if (!authUser) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const clanId = parseInt(request.params.clanId, 10);
      const battleId = request.params.battleId;

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

      try {
        return await battleService.updateBattle(clanId, battleId, request.body);
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
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
   * DELETE /api/clans/:clanId/battles/:battleId
   * Delete a battle and update summaries
   */
  fastify.delete<{
    Params: { clanId: string; battleId: string };
  }>(
    '/:clanId/battles/:battleId',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Delete a battle and update summaries',
        tags: ['Battles'],
        security: [{ bearerAuth: [] }],
        params: battleIdParamSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
            },
          },
          404: errorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { clanId: string; battleId: string } }>,
      reply: FastifyReply
    ) => {
      const authUser = request.authUser;
      if (!authUser) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const clanId = parseInt(request.params.clanId, 10);
      const battleId = request.params.battleId;

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

      try {
        await battleService.deleteBattle(clanId, battleId);
        return { success: true };
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({
            error: 'Not Found',
            message: error.message,
          });
        }
        throw error;
      }
    }
  );
};

export default battlesRoutes;
