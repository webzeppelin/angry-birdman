/**
 * Monthly Statistics Routes
 * Handles monthly clan and individual performance summaries
 *
 * Stories covered: Epic 7 (Monthly/Yearly Rollups)
 */

import {
  parseMonthId,
  getMonthIdFromBattleId,
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

const monthIdParamSchema = z.object({
  clanId: z.string(),
  monthId: z.string().length(6),
});

const monthCompleteSchema = z.object({
  complete: z.boolean(),
});

const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
});

const monthlyStatsRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/clans/:clanId/stats/months
   * List all months with battles for a clan
   */
  fastify.get<{ Params: { clanId: string } }>(
    '/:clanId/stats/months',
    {
      schema: {
        description: 'Get all months with battles for a clan',
        tags: ['Monthly Stats'],
        params: clanIdParamSchema,
        response: {
          200: z.array(
            z.object({
              monthId: z.string(),
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

        // Group by month
        const monthMap = new Map<string, { battleCount: number; isComplete: boolean }>();

        for (const battle of battles) {
          const monthId = getMonthIdFromBattleId(battle.battleId);
          const existing = monthMap.get(monthId) || {
            battleCount: 0,
            isComplete: false,
          };
          existing.battleCount++;
          monthMap.set(monthId, existing);
        }

        // Get completion status from MonthlyClanPerformance
        const completionStatuses = await fastify.prisma.monthlyClanPerformance.findMany({
          where: {
            clanId,
            monthId: { in: Array.from(monthMap.keys()) },
          },
          select: {
            monthId: true,
            monthComplete: true,
          },
        });

        // Update completion status
        for (const status of completionStatuses) {
          const existing = monthMap.get(status.monthId);
          if (existing) {
            existing.isComplete = status.monthComplete;
          }
        }

        // Convert to array and sort by monthId descending
        const months = Array.from(monthMap.entries())
          .map(([monthId, data]) => ({
            monthId,
            battleCount: data.battleCount,
            isComplete: data.isComplete,
          }))
          .sort((a, b) => b.monthId.localeCompare(a.monthId));

        return reply.status(200).send(months);
      } catch (error) {
        console.error('Error fetching monthly stats list:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch monthly stats',
        });
      }
    }
  );

  /**
   * GET /api/clans/:clanId/stats/months/:monthId
   * Get monthly clan summary
   */
  fastify.get<{ Params: { clanId: string; monthId: string } }>(
    '/:clanId/stats/months/:monthId',
    {
      schema: {
        description: 'Get monthly clan performance summary',
        tags: ['Monthly Stats'],
        params: monthIdParamSchema,
        response: {
          200: z.object({
            clanId: z.number(),
            monthId: z.string(),
            battleCount: z.number(),
            wonCount: z.number(),
            lostCount: z.number(),
            tiedCount: z.number(),
            monthComplete: z.boolean(),
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
      request: FastifyRequest<{ Params: { clanId: string; monthId: string } }>,
      reply: FastifyReply
    ) => {
      const clanId = parseInt(request.params.clanId, 10);
      const { monthId } = request.params;

      if (isNaN(clanId)) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid clan ID',
        });
      }

      // Validate month
      try {
        parseMonthId(monthId);
      } catch (_error) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid month ID format',
        });
      }

      try {
        // Check if summary exists
        let summary = await fastify.prisma.monthlyClanPerformance.findUnique({
          where: {
            clanId_monthId: {
              clanId,
              monthId,
            },
          },
        });

        // If not exists, calculate from battles
        if (!summary) {
          // Get all battles for this month
          const monthDate = parseMonthId(monthId);
          const year = monthDate.getFullYear();
          const month = monthDate.getMonth();
          const nextMonth = new Date(year, month + 1, 1);

          const battles = await fastify.prisma.clanBattle.findMany({
            where: {
              clanId,
              startDate: {
                gte: monthDate,
                lt: nextMonth,
              },
            },
          });

          if (battles.length === 0) {
            return reply.status(404).send({
              error: 'Not Found',
              message: 'No battles found for this month',
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
          summary = await fastify.prisma.monthlyClanPerformance.create({
            data: {
              clanId,
              monthId,
              battleCount: performance.battleCount,
              wonCount: performance.wonCount,
              lostCount: performance.lostCount,
              tiedCount: performance.tiedCount,
              monthComplete: false,
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
        console.error('Error fetching monthly clan summary:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch monthly clan summary',
        });
      }
    }
  );

  /**
   * GET /api/clans/:clanId/stats/months/:monthId/players
   * Get monthly individual stats
   */
  fastify.get<{ Params: { clanId: string; monthId: string } }>(
    '/:clanId/stats/months/:monthId/players',
    {
      schema: {
        description: 'Get monthly individual player performance summaries',
        tags: ['Monthly Stats'],
        params: monthIdParamSchema,
        response: {
          200: z.array(
            z.object({
              clanId: z.number(),
              year: z.number(),
              month: z.number(),
              playerId: z.number(),
              playerName: z.string(),
              battleCount: z.number(),
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
      request: FastifyRequest<{ Params: { clanId: string; monthId: string } }>,
      reply: FastifyReply
    ) => {
      const clanId = parseInt(request.params.clanId, 10);
      const { monthId } = request.params;

      if (isNaN(clanId)) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid clan ID',
        });
      }

      // Validate month ID
      try {
        parseMonthId(monthId);
      } catch (_error) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: `Invalid month ID: ${monthId}`,
        });
      }

      try {
        // Check if summaries exist
        let summaries = await fastify.prisma.monthlyIndividualPerformance.findMany({
          where: {
            clanId,
            monthId,
          },
          include: {
            player: {
              select: {
                playerName: true,
              },
            },
          },
          orderBy: {
            averageRatio: 'desc',
          },
        });

        // If not exists, calculate from player stats
        if (summaries.length === 0) {
          // Get all battles for this month
          const monthDate = parseMonthId(monthId);
          const year = monthDate.getFullYear();
          const month = monthDate.getMonth();
          const nextMonth = new Date(year, month + 1, 1);

          const playerStats = await fastify.prisma.clanBattlePlayerStats.findMany({
            where: {
              clanId,
              battle: {
                startDate: {
                  gte: monthDate,
                  lt: nextMonth,
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
              message: 'No player stats found for this month',
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
            await fastify.prisma.monthlyIndividualPerformance.createMany({
              data: performances.map((p) => ({
                clanId,
                monthId,
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
            summaries = await fastify.prisma.monthlyIndividualPerformance.findMany({
              where: {
                clanId,
                monthId,
              },
              include: {
                player: {
                  select: {
                    playerName: true,
                  },
                },
              },
              orderBy: {
                averageRatio: 'desc',
              },
            });
          }
        }

        const monthDate = parseMonthId(monthId);
        return reply.status(200).send(
          summaries.map((s) => ({
            clanId: s.clanId,
            year: monthDate.getFullYear(),
            month: monthDate.getMonth() + 1,
            playerId: s.playerId,
            playerName: s.player.playerName,
            battleCount: s.battlesPlayed,
            averageScore: s.averageScore,
            averageFp: s.averageFp,
            averageRatio: s.averageRatio,
            averageRank: s.averageRank,
            averageRatioRank: s.averageRatioRank,
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
          }))
        );
      } catch (error) {
        console.error('Error fetching monthly individual stats:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch monthly individual stats',
        });
      }
    }
  );

  /**
   * POST /api/clans/:clanId/stats/months/:monthId/complete
   * Mark month complete or reopen
   */
  fastify.post<{
    Params: { clanId: string; monthId: string };
    Body: { complete: boolean };
  }>(
    '/:clanId/stats/months/:monthId/complete',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Mark a month as complete or reopen it',
        tags: ['Monthly Stats'],
        security: [{ bearerAuth: [] }],
        params: monthIdParamSchema,
        body: monthCompleteSchema,
        response: {
          200: z.object({
            clanId: z.number(),
            monthId: z.string(),
            monthComplete: z.boolean(),
          }),
          404: errorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { clanId: string; monthId: string };
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
      const { monthId } = request.params;

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

      // Validate month ID format
      try {
        parseMonthId(monthId);
      } catch (_error) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: `Invalid month ID: ${monthId}`,
        });
      }

      const { complete } = request.body;
      const audit = createAuditService(fastify.prisma);

      try {
        // Check if summary exists
        const existing = await fastify.prisma.monthlyClanPerformance.findUnique({
          where: {
            clanId_monthId: {
              clanId,
              monthId,
            },
          },
        });

        if (!existing) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Monthly summary not found. Generate it first by viewing the month.',
          });
        }

        // Update completion status
        const updated = await fastify.prisma.monthlyClanPerformance.update({
          where: {
            clanId_monthId: {
              clanId,
              monthId,
            },
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
          entityId: monthId,
          clanId,
          details: JSON.stringify({
            action: complete ? 'month_completed' : 'month_reopened',
            monthId,
          }),
          result: AuditResult.SUCCESS,
        });

        return reply.status(200).send({
          clanId: updated.clanId,
          monthId: updated.monthId,
          monthComplete: updated.monthComplete,
        });
      } catch (error) {
        console.error('Error updating month completion status:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to update month completion status',
        });
      }
    }
  );

  /**
   * POST /api/clans/:clanId/stats/months/:monthId/recalculate
   * Admin recalculation utility
   */
  fastify.post<{ Params: { clanId: string; monthId: string } }>(
    '/:clanId/stats/months/:monthId/recalculate',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Recalculate monthly summaries from battle data',
        tags: ['Monthly Stats'],
        security: [{ bearerAuth: [] }],
        params: monthIdParamSchema,
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
      request: FastifyRequest<{ Params: { clanId: string; monthId: string } }>,
      reply: FastifyReply
    ) => {
      const authUser = request.authUser;
      if (!authUser) {
        return reply
          .status(401)
          .send({ error: 'Unauthorized', message: 'Authentication required' });
      }

      const clanId = parseInt(request.params.clanId, 10);
      const { monthId } = request.params;

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

      // Validate month ID format
      try {
        parseMonthId(monthId);
      } catch (_error) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: `Invalid month ID: ${monthId}`,
        });
      }

      const audit = createAuditService(fastify.prisma);

      try {
        // Delete existing summaries
        await fastify.prisma.monthlyClanPerformance.deleteMany({
          where: { clanId, monthId },
        });

        await fastify.prisma.monthlyIndividualPerformance.deleteMany({
          where: { clanId, monthId },
        });

        // Get all battles for this month
        const monthDate = parseMonthId(monthId);
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();
        const nextMonth = new Date(year, month + 1, 1);

        const battles = await fastify.prisma.clanBattle.findMany({
          where: {
            clanId,
            startDate: {
              gte: monthDate,
              lt: nextMonth,
            },
          },
        });

        if (battles.length === 0) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'No battles found for this month',
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
        await fastify.prisma.monthlyClanPerformance.create({
          data: {
            clanId,
            monthId,
            battleCount: performance.battleCount,
            wonCount: performance.wonCount,
            lostCount: performance.lostCount,
            tiedCount: performance.tiedCount,
            monthComplete: false,
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
                gte: monthDate,
                lt: nextMonth,
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
          await fastify.prisma.monthlyIndividualPerformance.createMany({
            data: performances.map((p) => ({
              clanId,
              monthId,
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
          entityId: monthId,
          clanId,
          details: JSON.stringify({
            action: 'recalculate',
            monthId,
            battles: battles.length,
            playerSummaries: performances.length,
          }),
          result: AuditResult.SUCCESS,
        });

        return reply.status(200).send({
          message: 'Monthly summaries recalculated successfully',
          clanSummary: true,
          playerSummaries: performances.length,
        });
      } catch (error) {
        console.error('Error recalculating monthly summaries:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to recalculate monthly summaries',
        });
      }
    }
  );
};

export default monthlyStatsRoutes;
