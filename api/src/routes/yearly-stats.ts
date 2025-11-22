/**
 * Yearly Statistics Routes
 * Handles yearly clan and individual performance summaries
 *
 * Stories covered: Epic 7 (Monthly/Yearly Rollups)
 */

import {
  parseYearId,
  getYearIdFromBattleId,
  getMonthIdsForYear,
  calculatePeriodClanPerformance,
  calculatePeriodIndividualPerformance,
} from '@angrybirdman/common';
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
const clanIdParamSchema = z.object({
  clanId: z.string(),
});

const yearIdParamSchema = z.object({
  clanId: z.string(),
  yearId: z.string().length(4),
});

const yearCompleteSchema = z.object({
  complete: z.boolean(),
});

const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
});

const yearlyStatsRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/clans/:clanId/stats/years
   * List all years with battles for a clan
   */
  fastify.get<{ Params: { clanId: string } }>(
    '/:clanId/stats/years',
    {
      schema: {
        description: 'Get all years with battles for a clan',
        tags: ['Yearly Stats'],
        params: clanIdParamSchema,
        response: {
          200: z.array(
            z.object({
              yearId: z.string(),
              battleCount: z.number(),
              isComplete: z.boolean(),
            })
          ),
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
        // Get all battles for the clan
        const battles = await fastify.prisma.clanBattle.findMany({
          where: { clanId },
          select: {
            battleId: true,
          },
          orderBy: {
            startDate: 'desc',
          },
        });

        // Group by year
        const yearMap = new Map<string, { battleCount: number; isComplete: boolean }>();

        for (const battle of battles) {
          const yearId = getYearIdFromBattleId(battle.battleId);
          const existing = yearMap.get(yearId) || {
            battleCount: 0,
            isComplete: false,
          };
          existing.battleCount++;
          yearMap.set(yearId, existing);
        }

        // Get completion status from YearlyClanPerformance
        const completionStatuses = await fastify.prisma.yearlyClanPerformance.findMany({
          where: {
            clanId,
            yearId: { in: Array.from(yearMap.keys()) },
          },
          select: {
            yearId: true,
            yearComplete: true,
          },
        });

        // Update completion status
        for (const status of completionStatuses) {
          const existing = yearMap.get(status.yearId);
          if (existing) {
            existing.isComplete = status.yearComplete;
          }
        }

        // Convert to array and sort by yearId descending
        const years = Array.from(yearMap.entries())
          .map(([yearId, data]) => ({
            yearId,
            battleCount: data.battleCount,
            isComplete: data.isComplete,
          }))
          .sort((a, b) => b.yearId.localeCompare(a.yearId));

        return reply.status(200).send(years);
      } catch (error) {
        console.error('Error fetching yearly stats list:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch yearly stats',
        });
      }
    }
  );

  /**
   * GET /api/clans/:clanId/stats/years/:yearId
   * Get yearly clan summary
   */
  fastify.get<{ Params: { clanId: string; yearId: string } }>(
    '/:clanId/stats/years/:yearId',
    {
      schema: {
        description: 'Get yearly clan performance summary',
        tags: ['Yearly Stats'],
        params: yearIdParamSchema,
        response: {
          200: z.object({
            clanId: z.number(),
            yearId: z.string(),
            battleCount: z.number(),
            wonCount: z.number(),
            lostCount: z.number(),
            tiedCount: z.number(),
            yearComplete: z.boolean(),
            averageFp: z.number(),
            averageBaselineFp: z.number(),
            averageRatio: z.number(),
            averageMarginRatio: z.number(),
            averageFpMargin: z.number(),
            averageNonplayingCount: z.number(),
            averageNonplayingFpRatio: z.number(),
            averageReserveCount: z.number(),
            averageReserveFpRatio: z.number(),
            createdAt: z.string(),
            updatedAt: z.string(),
          }),
          404: errorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { clanId: string; yearId: string } }>,
      reply: FastifyReply
    ) => {
      const clanId = parseInt(request.params.clanId, 10);
      const { yearId } = request.params;

      if (isNaN(clanId)) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid clan ID',
        });
      }

      // Validate year ID format
      try {
        parseYearId(yearId);
      } catch (error) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: `Invalid year ID: ${yearId}`,
        });
      }

      try {
        // Check if summary exists
        let summary = await fastify.prisma.yearlyClanPerformance.findUnique({
          where: {
            clanId_yearId: {
              clanId,
              yearId,
            },
          },
        });

        // If not exists, calculate from battles
        if (!summary) {
          // Get all battles for this year
          const yearDate = parseYearId(yearId);
          const year = yearDate.getFullYear();
          const nextYear = new Date(year + 1, 0, 1);

          const battles = await fastify.prisma.clanBattle.findMany({
            where: {
              clanId,
              startDate: {
                gte: yearDate,
                lt: nextYear,
              },
            },
          });

          if (battles.length === 0) {
            return reply.status(404).send({
              error: 'Not Found',
              message: 'No battles found for this year',
            });
          }

          // Calculate performance
          const performance = calculatePeriodClanPerformance(
            battles.map((b) => ({
              result: b.result,
              fp: b.fp,
              baselineFp: b.baselineFp,
              ratio: b.ratio,
              marginRatio: b.marginRatio,
              fpMargin: b.fpMargin,
              nonplayingCount: b.nonplayingCount,
              nonplayingFpRatio: b.nonplayingFpRatio,
              reserveCount: b.reserveCount,
              reserveFpRatio: b.reserveFpRatio,
            }))
          );

          // Save to database
          summary = await fastify.prisma.yearlyClanPerformance.create({
            data: {
              clanId,
              yearId,
              battleCount: performance.battleCount,
              wonCount: performance.wonCount,
              lostCount: performance.lostCount,
              tiedCount: performance.tiedCount,
              yearComplete: false,
              averageFp: performance.averageFp,
              averageBaselineFp: performance.averageBaselineFp,
              averageRatio: performance.averageRatio,
              averageMarginRatio: performance.averageMarginRatio,
              averageFpMargin: performance.averageFpMargin,
              averageNonplayingCount: performance.averageNonplayingCount,
              averageNonplayingFpRatio: performance.averageNonplayingFpRatio,
              averageReserveCount: performance.averageReserveCount,
              averageReserveFpRatio: performance.averageReserveFpRatio,
            },
          });
        }

        return reply.status(200).send({
          ...summary,
          createdAt: summary.createdAt.toISOString(),
          updatedAt: summary.updatedAt.toISOString(),
        });
      } catch (error) {
        console.error('Error fetching yearly clan summary:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch yearly clan summary',
        });
      }
    }
  );

  /**
   * GET /api/clans/:clanId/stats/years/:yearId/players
   * Get yearly individual stats
   */
  fastify.get<{ Params: { clanId: string; yearId: string } }>(
    '/:clanId/stats/years/:yearId/players',
    {
      schema: {
        description: 'Get yearly individual player performance summaries',
        tags: ['Yearly Stats'],
        params: yearIdParamSchema,
        response: {
          200: z.array(
            z.object({
              clanId: z.number(),
              yearId: z.string(),
              playerId: z.number(),
              battlesPlayed: z.number(),
              averageScore: z.number(),
              averageFp: z.number(),
              averageRatio: z.number(),
              averageRank: z.number(),
              averageRatioRank: z.number(),
              createdAt: z.string(),
              updatedAt: z.string(),
            })
          ),
          404: errorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { clanId: string; yearId: string } }>,
      reply: FastifyReply
    ) => {
      const clanId = parseInt(request.params.clanId, 10);
      const { yearId } = request.params;

      if (isNaN(clanId)) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid clan ID',
        });
      }

      // Validate year ID format
      try {
        parseYearId(yearId);
      } catch (error) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: `Invalid year ID: ${yearId}`,
        });
      }

      try {
        // Check if summaries exist
        let summaries = await fastify.prisma.yearlyIndividualPerformance.findMany({
          where: {
            clanId,
            yearId,
          },
          orderBy: {
            averageRatio: 'desc',
          },
        });

        // If not exists, calculate from player stats
        if (summaries.length === 0) {
          // Get all battles for this year
          const yearDate = parseYearId(yearId);
          const year = yearDate.getFullYear();
          const nextYear = new Date(year + 1, 0, 1);

          const playerStats = await fastify.prisma.clanBattlePlayerStats.findMany({
            where: {
              clanId,
              battle: {
                startDate: {
                  gte: yearDate,
                  lt: nextYear,
                },
              },
            },
            select: {
              playerId: true,
              score: true,
              fp: true,
              ratio: true,
              rank: true,
              ratioRank: true,
            },
          });

          if (playerStats.length === 0) {
            return reply.status(404).send({
              error: 'Not Found',
              message: 'No player stats found for this year',
            });
          }

          // Calculate individual performance
          const performances = calculatePeriodIndividualPerformance(
            playerStats.map((s) => ({
              playerId: s.playerId,
              score: s.score,
              fp: s.fp,
              ratio: s.ratio,
              rank: s.rank,
              ratioRank: s.ratioRank,
            }))
          );

          // Save to database
          if (performances.length > 0) {
            await fastify.prisma.yearlyIndividualPerformance.createMany({
              data: performances.map((p) => ({
                clanId,
                yearId,
                playerId: p.playerId,
                battlesPlayed: p.battlesPlayed,
                averageScore: p.averageScore,
                averageFp: p.averageFp,
                averageRatio: p.averageRatio,
                averageRank: p.averageRank,
                averageRatioRank: p.averageRatioRank,
              })),
            });

            // Fetch the newly created records
            summaries = await fastify.prisma.yearlyIndividualPerformance.findMany({
              where: {
                clanId,
                yearId,
              },
              orderBy: {
                averageRatio: 'desc',
              },
            });
          }
        }

        return reply.status(200).send(
          summaries.map((s) => ({
            ...s,
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
          }))
        );
      } catch (error) {
        console.error('Error fetching yearly individual stats:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch yearly individual stats',
        });
      }
    }
  );

  /**
   * POST /api/clans/:clanId/stats/years/:yearId/complete
   * Mark year complete (also marks all months in that year complete)
   */
  fastify.post<{
    Params: { clanId: string; yearId: string };
    Body: { complete: boolean };
  }>(
    '/:clanId/stats/years/:yearId/complete',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Mark a year as complete or reopen it (also affects all months)',
        tags: ['Yearly Stats'],
        security: [{ bearerAuth: [] }],
        params: yearIdParamSchema,
        body: yearCompleteSchema,
        response: {
          200: z.object({
            clanId: z.number(),
            yearId: z.string(),
            yearComplete: z.boolean(),
            monthsUpdated: z.number(),
          }),
          404: errorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { clanId: string; yearId: string };
        Body: { complete: boolean };
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
      const { yearId } = request.params;

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

      // Validate year ID format
      try {
        parseYearId(yearId);
      } catch (error) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: `Invalid year ID: ${yearId}`,
        });
      }

      const { complete } = request.body;
      const audit = createAuditService(fastify.prisma);

      try {
        // Check if summary exists
        const existing = await fastify.prisma.yearlyClanPerformance.findUnique({
          where: {
            clanId_yearId: {
              clanId,
              yearId,
            },
          },
        });

        if (!existing) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Yearly summary not found. Generate it first by viewing the year.',
          });
        }

        // Update year completion status
        const updated = await fastify.prisma.yearlyClanPerformance.update({
          where: {
            clanId_yearId: {
              clanId,
              yearId,
            },
          },
          data: {
            yearComplete: complete,
          },
        });

        // Also update all months in this year
        const monthIds = getMonthIdsForYear(yearId);
        const monthUpdateResult = await fastify.prisma.monthlyClanPerformance.updateMany({
          where: {
            clanId,
            monthId: { in: monthIds },
          },
          data: {
            monthComplete: complete,
          },
        });

        // Log the action
        await audit.log({
          actorId: authUser.userId,
          actionType: complete ? AuditAction.BATTLE_UPDATED : AuditAction.BATTLE_UPDATED,
          entityType: EntityType.BATTLE,
          entityId: yearId,
          clanId,
          details: JSON.stringify({
            action: complete ? 'year_completed' : 'year_reopened',
            yearId,
            monthsUpdated: monthUpdateResult.count,
          }),
          result: AuditResult.SUCCESS,
        });

        return reply.status(200).send({
          clanId: updated.clanId,
          yearId: updated.yearId,
          yearComplete: updated.yearComplete,
          monthsUpdated: monthUpdateResult.count,
        });
      } catch (error) {
        console.error('Error updating year completion status:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to update year completion status',
        });
      }
    }
  );

  /**
   * POST /api/clans/:clanId/stats/years/:yearId/recalculate
   * Admin recalculation utility
   */
  fastify.post<{ Params: { clanId: string; yearId: string } }>(
    '/:clanId/stats/years/:yearId/recalculate',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Recalculate yearly summaries from battle data',
        tags: ['Yearly Stats'],
        security: [{ bearerAuth: [] }],
        params: yearIdParamSchema,
        response: {
          200: z.object({
            message: z.string(),
            clanSummary: z.boolean(),
            playerSummaries: z.number(),
          }),
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { clanId: string; yearId: string } }>,
      reply: FastifyReply
    ) => {
      const authUser = request.authUser;
      if (!authUser) {
        return reply
          .status(401)
          .send({ error: 'Unauthorized', message: 'Authentication required' });
      }

      const clanId = parseInt(request.params.clanId, 10);
      const { yearId } = request.params;

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

      // Validate year ID format
      try {
        parseYearId(yearId);
      } catch (error) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: `Invalid year ID: ${yearId}`,
        });
      }

      const audit = createAuditService(fastify.prisma);

      try {
        // Delete existing summaries
        await fastify.prisma.yearlyClanPerformance.deleteMany({
          where: { clanId, yearId },
        });

        await fastify.prisma.yearlyIndividualPerformance.deleteMany({
          where: { clanId, yearId },
        });

        // Get all battles for this year
        const yearDate = parseYearId(yearId);
        const year = yearDate.getFullYear();
        const nextYear = new Date(year + 1, 0, 1);

        const battles = await fastify.prisma.clanBattle.findMany({
          where: {
            clanId,
            startDate: {
              gte: yearDate,
              lt: nextYear,
            },
          },
        });

        if (battles.length === 0) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'No battles found for this year',
          });
        }

        // Recalculate clan performance
        const performance = calculatePeriodClanPerformance(
          battles.map((b) => ({
            result: b.result,
            fp: b.fp,
            baselineFp: b.baselineFp,
            ratio: b.ratio,
            marginRatio: b.marginRatio,
            fpMargin: b.fpMargin,
            nonplayingCount: b.nonplayingCount,
            nonplayingFpRatio: b.nonplayingFpRatio,
            reserveCount: b.reserveCount,
            reserveFpRatio: b.reserveFpRatio,
          }))
        );

        // Save clan summary
        await fastify.prisma.yearlyClanPerformance.create({
          data: {
            clanId,
            yearId,
            battleCount: performance.battleCount,
            wonCount: performance.wonCount,
            lostCount: performance.lostCount,
            tiedCount: performance.tiedCount,
            yearComplete: false,
            averageFp: performance.averageFp,
            averageBaselineFp: performance.averageBaselineFp,
            averageRatio: performance.averageRatio,
            averageMarginRatio: performance.averageMarginRatio,
            averageFpMargin: performance.averageFpMargin,
            averageNonplayingCount: performance.averageNonplayingCount,
            averageNonplayingFpRatio: performance.averageNonplayingFpRatio,
            averageReserveCount: performance.averageReserveCount,
            averageReserveFpRatio: performance.averageReserveFpRatio,
          },
        });

        // Get player stats
        const playerStats = await fastify.prisma.clanBattlePlayerStats.findMany({
          where: {
            clanId,
            battle: {
              startDate: {
                gte: yearDate,
                lt: nextYear,
              },
            },
          },
          select: {
            playerId: true,
            score: true,
            fp: true,
            ratio: true,
            rank: true,
            ratioRank: true,
          },
        });

        // Recalculate individual performance
        const performances = calculatePeriodIndividualPerformance(
          playerStats.map((s) => ({
            playerId: s.playerId,
            score: s.score,
            fp: s.fp,
            ratio: s.ratio,
            rank: s.rank,
            ratioRank: s.ratioRank,
          }))
        );

        // Save player summaries
        if (performances.length > 0) {
          await fastify.prisma.yearlyIndividualPerformance.createMany({
            data: performances.map((p) => ({
              clanId,
              yearId,
              playerId: p.playerId,
              battlesPlayed: p.battlesPlayed,
              averageScore: p.averageScore,
              averageFp: p.averageFp,
              averageRatio: p.averageRatio,
              averageRank: p.averageRank,
              averageRatioRank: p.averageRatioRank,
            })),
          });
        }

        // Log the action
        await audit.log({
          actorId: authUser.userId,
          actionType: AuditAction.BATTLE_UPDATED,
          entityType: EntityType.BATTLE,
          entityId: yearId,
          clanId,
          details: JSON.stringify({
            action: 'recalculate',
            yearId,
            battles: battles.length,
            playerSummaries: performances.length,
          }),
          result: AuditResult.SUCCESS,
        });

        return reply.status(200).send({
          message: 'Yearly summaries recalculated successfully',
          clanSummary: true,
          playerSummaries: performances.length,
        });
      } catch (error) {
        console.error('Error recalculating yearly summaries:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to recalculate yearly summaries',
        });
      }
    }
  );
};

export default yearlyStatsRoutes;
