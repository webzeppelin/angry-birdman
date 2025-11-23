/**
 * Reporting and Analytics Routes
 * Handles trend analysis and advanced reporting for clan performance
 *
 * Stories covered: 7.1-7.4 (Epic 7: Performance Trend Reports)
 */

import { getMonthIdFromBattleId } from '@angrybirdman/common';
import { z } from 'zod';

import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';

// Validation schemas
const clanIdParamSchema = z.object({
  clanId: z.string().regex(/^\d+$/),
});

const trendQuerySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{8}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{8}$/)
    .optional(),
  aggregation: z.enum(['battle', 'monthly']).default('battle'),
});

const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
});

// Type definitions for trend data
interface FlockPowerDataPoint {
  date: string;
  battleId: string;
  totalFp: number;
  baselineFp: number;
  monthId?: string;
}

interface RatioDataPoint {
  date: string;
  battleId: string;
  ratio: number;
  averageRatio: number;
  monthId?: string;
}

interface ParticipationDataPoint {
  date: string;
  battleId: string;
  nonplayingFpRatio: number;
  reserveFpRatio: number;
  participationRate: number;
  playerCount: number;
  nonplayingCount: number;
  monthId?: string;
}

interface MarginDataPoint {
  date: string;
  battleId: string;
  marginRatio: number;
  result: number;
  isWin: boolean;
  isLoss: boolean;
  isTie: boolean;
  score: number;
  opponentScore: number;
  monthId?: string;
}

interface TrendSummary {
  battleCount: number;
  dateRange: {
    start: string;
    end: string;
  };
  fpTrend: {
    start: number;
    end: number;
    change: number;
    changePercent: number;
  };
  ratioTrend: {
    average: number;
    min: number;
    max: number;
  };
  participationTrend: {
    average: number;
    min: number;
    max: number;
  };
  winLossSummary: {
    wins: number;
    losses: number;
    ties: number;
    winRate: number;
    avgWinMargin: number;
    avgLossMargin: number;
  };
}

interface TrendResponse {
  flockPower: FlockPowerDataPoint[];
  ratio: RatioDataPoint[];
  participation: ParticipationDataPoint[];
  margin: MarginDataPoint[];
  summary: TrendSummary;
}

const reportsRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/clans/:clanId/reports/trends
   * Get trend analysis data for various metrics
   * Stories: 7.1-7.4 (FP, Ratio, Participation, Margin trends)
   */
  fastify.get<{
    Params: { clanId: string };
    Querystring: z.infer<typeof trendQuerySchema>;
  }>(
    '/:clanId/reports/trends',
    {
      schema: {
        description:
          'Get trend analysis data including FP, ratio, participation, and margin trends',
        tags: ['Reports', 'Analytics'],
        params: clanIdParamSchema,
        querystring: trendQuerySchema,
        response: {
          200: z.object({
            flockPower: z.array(z.any()),
            ratio: z.array(z.any()),
            participation: z.array(z.any()),
            margin: z.array(z.any()),
            summary: z.any(),
          }),
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { clanId: string };
        Querystring: z.infer<typeof trendQuerySchema>;
      }>,
      reply: FastifyReply
    ) => {
      const clanId = parseInt(request.params.clanId, 10);
      const { startDate, endDate, aggregation } = request.query;

      if (isNaN(clanId)) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid clan ID',
        });
      }

      try {
        // Verify clan exists
        const clan = await fastify.prisma.clan.findUnique({
          where: { clanId },
        });

        if (!clan) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Clan not found',
          });
        }

        // Build date filter
        const dateFilter: Record<string, string | { gte?: string; lte?: string }> = {};
        if (startDate || endDate) {
          dateFilter.battleId = {};
          if (startDate) {
            (dateFilter.battleId as { gte?: string }).gte = startDate;
          }
          if (endDate) {
            (dateFilter.battleId as { lte?: string }).lte = endDate;
          }
        }

        // Fetch all battles for the clan within date range
        const battles = await fastify.prisma.clanBattle.findMany({
          where: {
            clanId,
            ...dateFilter,
          },
          orderBy: {
            startDate: 'asc',
          },
          include: {
            playerStats: {
              select: {
                playerId: true,
              },
            },
            nonplayerStats: {
              select: {
                playerId: true,
                reserve: true,
              },
            },
          },
        });

        if (battles.length === 0) {
          // Return empty response structure
          return {
            flockPower: [],
            ratio: [],
            participation: [],
            margin: [],
            summary: {
              battleCount: 0,
              dateRange: { start: '', end: '' },
              fpTrend: { start: 0, end: 0, change: 0, changePercent: 0 },
              ratioTrend: { average: 0, min: 0, max: 0 },
              participationTrend: { average: 0, min: 0, max: 0 },
              winLossSummary: {
                wins: 0,
                losses: 0,
                ties: 0,
                winRate: 0,
                avgWinMargin: 0,
                avgLossMargin: 0,
              },
            },
          };
        }

        // Process battles into data points
        const flockPowerData: FlockPowerDataPoint[] = [];
        const ratioData: RatioDataPoint[] = [];
        const participationData: ParticipationDataPoint[] = [];
        const marginData: MarginDataPoint[] = [];

        for (const battle of battles) {
          const monthId = getMonthIdFromBattleId(battle.battleId);
          if (!monthId) continue; // Skip battles with invalid date format

          const dateStr = battle.startDate.toISOString().split('T')[0] || '';
          if (!dateStr) continue; // Skip if date extraction fails

          // Calculate player and nonplayer counts
          const playerCount = battle.playerStats?.length || 0;
          const nonReserveNonplayerCount =
            battle.nonplayerStats?.filter((np: { reserve: boolean }) => !np.reserve).length || 0;
          const totalActiveMembers = playerCount + nonReserveNonplayerCount;
          const participationRate =
            totalActiveMembers > 0 ? (playerCount / totalActiveMembers) * 100 : 0;

          // Flock Power data point
          flockPowerData.push({
            date: dateStr,
            battleId: battle.battleId,
            totalFp: battle.fp,
            baselineFp: battle.baselineFp,
            monthId,
          });

          // Ratio data point
          ratioData.push({
            date: dateStr,
            battleId: battle.battleId,
            ratio: battle.ratio,
            averageRatio: battle.averageRatio,
            monthId,
          });

          // Participation data point
          participationData.push({
            date: dateStr,
            battleId: battle.battleId,
            nonplayingFpRatio: battle.nonplayingFpRatio,
            reserveFpRatio: battle.reserveFpRatio,
            participationRate,
            playerCount,
            nonplayingCount: nonReserveNonplayerCount,
            monthId,
          });

          // Margin data point
          marginData.push({
            date: dateStr,
            battleId: battle.battleId,
            marginRatio: battle.marginRatio,
            result: battle.result,
            isWin: battle.result === 1,
            isLoss: battle.result === -1,
            isTie: battle.result === 0,
            score: battle.score,
            opponentScore: battle.opponentScore,
            monthId,
          });
        }

        // If monthly aggregation is requested, compute monthly averages
        let processedFlockPowerData = flockPowerData;
        let processedRatioData = ratioData;
        let processedParticipationData = participationData;
        let processedMarginData = marginData;

        if (aggregation === 'monthly') {
          // Group by month and calculate averages
          const monthlyGroups = new Map<
            string,
            {
              fp: FlockPowerDataPoint[];
              ratio: RatioDataPoint[];
              participation: ParticipationDataPoint[];
              margin: MarginDataPoint[];
            }
          >();

          for (let i = 0; i < flockPowerData.length; i++) {
            const fpDataPoint = flockPowerData[i];
            if (!fpDataPoint?.monthId) continue;

            const monthId = fpDataPoint.monthId;
            if (!monthlyGroups.has(monthId)) {
              monthlyGroups.set(monthId, {
                fp: [],
                ratio: [],
                participation: [],
                margin: [],
              });
            }
            const group = monthlyGroups.get(monthId);
            if (!group) continue;
            const ratioDataPoint = ratioData[i];
            const participationDataPoint = participationData[i];
            const marginDataPoint = marginData[i];
            if (fpDataPoint) group.fp.push(fpDataPoint);
            if (ratioDataPoint) group.ratio.push(ratioDataPoint);
            if (participationDataPoint) group.participation.push(participationDataPoint);
            if (marginDataPoint) group.margin.push(marginDataPoint);
          }

          // Calculate monthly averages
          processedFlockPowerData = [];
          processedRatioData = [];
          processedParticipationData = [];
          processedMarginData = [];

          for (const [monthId, group] of monthlyGroups.entries()) {
            const count = group.fp.length;
            if (count === 0) continue;
            const firstDate = group.fp[0]?.date;
            if (!firstDate) continue;

            // Average FP
            const avgTotalFp = group.fp.reduce((sum, d) => sum + d.totalFp, 0) / count;
            const avgBaselineFp = group.fp.reduce((sum, d) => sum + d.baselineFp, 0) / count;
            processedFlockPowerData.push({
              date: firstDate,
              battleId: monthId,
              totalFp: Math.round(avgTotalFp),
              baselineFp: Math.round(avgBaselineFp),
              monthId,
            });

            // Average Ratio
            const avgRatio = group.ratio.reduce((sum, d) => sum + d.ratio, 0) / count;
            const avgAverageRatio = group.ratio.reduce((sum, d) => sum + d.averageRatio, 0) / count;
            processedRatioData.push({
              date: firstDate,
              battleId: monthId,
              ratio: parseFloat(avgRatio.toFixed(2)),
              averageRatio: parseFloat(avgAverageRatio.toFixed(2)),
              monthId,
            });

            // Average Participation
            const avgNonplayingFpRatio =
              group.participation.reduce((sum, d) => sum + d.nonplayingFpRatio, 0) / count;
            const avgReserveFpRatio =
              group.participation.reduce((sum, d) => sum + d.reserveFpRatio, 0) / count;
            const avgParticipationRate =
              group.participation.reduce((sum, d) => sum + d.participationRate, 0) / count;
            processedParticipationData.push({
              date: firstDate,
              battleId: monthId,
              nonplayingFpRatio: parseFloat(avgNonplayingFpRatio.toFixed(2)),
              reserveFpRatio: parseFloat(avgReserveFpRatio.toFixed(2)),
              participationRate: parseFloat(avgParticipationRate.toFixed(2)),
              playerCount: Math.round(
                group.participation.reduce((sum, d) => sum + d.playerCount, 0) / count
              ),
              nonplayingCount: Math.round(
                group.participation.reduce((sum, d) => sum + d.nonplayingCount, 0) / count
              ),
              monthId,
            });

            // Average Margin (weighted by wins/losses)
            const wins = group.margin.filter((d) => d.isWin);
            const losses = group.margin.filter((d) => d.isLoss);
            const ties = group.margin.filter((d) => d.isTie);
            const avgMarginRatio = group.margin.reduce((sum, d) => sum + d.marginRatio, 0) / count;

            processedMarginData.push({
              date: firstDate,
              battleId: monthId,
              marginRatio: parseFloat(avgMarginRatio.toFixed(2)),
              result: wins.length > losses.length ? 1 : losses.length > wins.length ? -1 : 0,
              isWin: wins.length > 0,
              isLoss: losses.length > 0,
              isTie: ties.length > 0,
              score: Math.round(group.margin.reduce((sum, d) => sum + d.score, 0) / count),
              opponentScore: Math.round(
                group.margin.reduce((sum, d) => sum + d.opponentScore, 0) / count
              ),
              monthId,
            });
          }
        }

        // Calculate summary statistics
        const firstBattle = battles[0];
        const lastBattle = battles[battles.length - 1];
        if (!firstBattle || !lastBattle) {
          return reply
            .status(500)
            .send({ error: 'Internal Server Error', message: 'Invalid battle data' });
        }
        const startFp = firstBattle.baselineFp;
        const endFp = lastBattle.baselineFp;
        const fpChange = endFp - startFp;
        const fpChangePercent = startFp > 0 ? (fpChange / startFp) * 100 : 0;

        const ratios = battles.map((b) => b.ratio);
        const avgRatio = ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
        const minRatio = Math.min(...ratios);
        const maxRatio = Math.max(...ratios);

        const participationRates = participationData.map((p) => p.participationRate);
        const avgParticipation =
          participationRates.reduce((sum, r) => sum + r, 0) / participationRates.length;
        const minParticipation = Math.min(...participationRates);
        const maxParticipation = Math.max(...participationRates);

        const wins = battles.filter((b) => b.result === 1);
        const losses = battles.filter((b) => b.result === -1);
        const ties = battles.filter((b) => b.result === 0);
        const winRate = (wins.length / battles.length) * 100;

        const avgWinMargin =
          wins.length > 0 ? wins.reduce((sum, b) => sum + b.marginRatio, 0) / wins.length : 0;
        const avgLossMargin =
          losses.length > 0 ? losses.reduce((sum, b) => sum + b.marginRatio, 0) / losses.length : 0;

        const summary: TrendSummary = {
          battleCount: battles.length,
          dateRange: {
            start: firstBattle.startDate.toISOString().split('T')[0] || '',
            end: lastBattle.startDate.toISOString().split('T')[0] || '',
          },
          fpTrend: {
            start: startFp,
            end: endFp,
            change: fpChange,
            changePercent: parseFloat(fpChangePercent.toFixed(2)),
          },
          ratioTrend: {
            average: parseFloat(avgRatio.toFixed(2)),
            min: parseFloat(minRatio.toFixed(2)),
            max: parseFloat(maxRatio.toFixed(2)),
          },
          participationTrend: {
            average: parseFloat(avgParticipation.toFixed(2)),
            min: parseFloat(minParticipation.toFixed(2)),
            max: parseFloat(maxParticipation.toFixed(2)),
          },
          winLossSummary: {
            wins: wins.length,
            losses: losses.length,
            ties: ties.length,
            winRate: parseFloat(winRate.toFixed(2)),
            avgWinMargin: parseFloat(avgWinMargin.toFixed(2)),
            avgLossMargin: parseFloat(avgLossMargin.toFixed(2)),
          },
        };

        const response: TrendResponse = {
          flockPower: processedFlockPowerData,
          ratio: processedRatioData,
          participation: processedParticipationData,
          margin: processedMarginData,
          summary,
        };

        return response;
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch trend data',
        });
      }
    }
  );

  /**
   * GET /api/clans/:clanId/reports/player/:playerId
   * Story 7.6: View Player Performance Over Time
   * Get individual player performance trends with comparison to clan average
   */
  fastify.get(
    '/:clanId/reports/player/:playerId',
    {
      schema: {
        params: z.object({
          clanId: z.string().regex(/^\d+$/),
          playerId: z.string().regex(/^\d+$/),
        }),
        querystring: z.object({
          startDate: z
            .string()
            .regex(/^\d{8}$/)
            .optional(),
          endDate: z
            .string()
            .regex(/^\d{8}$/)
            .optional(),
        }),
        response: {
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { clanId: string; playerId: string };
        Querystring: { startDate?: string; endDate?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const clanId = parseInt(request.params.clanId);
        const playerId = parseInt(request.params.playerId);
        const { startDate, endDate } = request.query;

        // Verify clan exists
        const clan = await fastify.prisma.clan.findUnique({
          where: { clanId },
        });
        if (!clan) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Clan not found',
          });
        }

        // Verify player exists and belongs to clan
        const player = await fastify.prisma.rosterMember.findUnique({
          where: { playerId },
        });
        if (!player || player.clanId !== clanId) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Player not found or does not belong to this clan',
          });
        }

        // Build date filter
        const dateFilter: { gte?: Date; lte?: Date } = {};
        if (startDate) {
          const year = parseInt(startDate.substring(0, 4));
          const month = parseInt(startDate.substring(4, 6)) - 1;
          const day = parseInt(startDate.substring(6, 8));
          dateFilter.gte = new Date(year, month, day);
        }
        if (endDate) {
          const year = parseInt(endDate.substring(0, 4));
          const month = parseInt(endDate.substring(4, 6)) - 1;
          const day = parseInt(endDate.substring(6, 8));
          dateFilter.lte = new Date(year, month, day, 23, 59, 59);
        }

        // Fetch player's battle stats
        const playerStats = await fastify.prisma.clanBattlePlayerStats.findMany({
          where: {
            playerId,
            clanId,
            ...(startDate || endDate
              ? {
                  battle: {
                    startDate: dateFilter,
                  },
                }
              : {}),
          },
          include: {
            battle: {
              select: {
                battleId: true,
                startDate: true,
                opponentName: true,
                result: true,
                ratio: true,
                averageRatio: true,
              },
            },
          },
          orderBy: {
            battleId: 'asc',
          },
        });

        // Fetch clan averages for same time period
        const battles = await fastify.prisma.clanBattle.findMany({
          where: {
            clanId,
            ...(startDate || endDate ? { startDate: dateFilter } : {}),
          },
          select: {
            battleId: true,
            startDate: true,
            ratio: true,
            averageRatio: true,
          },
          orderBy: {
            startDate: 'asc',
          },
        });

        // Build response data
        const performanceData = playerStats.map((stat) => ({
          date: stat.battle.startDate.toISOString().split('T')[0] || '',
          battleId: stat.battle.battleId,
          opponentName: stat.battle.opponentName,
          playerRatio: stat.ratio,
          clanRatio: stat.battle.ratio,
          clanAverageRatio: stat.battle.averageRatio,
          rank: stat.rank,
          ratioRank: stat.ratioRank,
          score: stat.score,
          fp: stat.fp,
          played: true,
        }));

        // Calculate summary statistics
        const totalBattles = battles.length;
        const battlesPlayed = playerStats.length;
        const participationRate = totalBattles > 0 ? (battlesPlayed / totalBattles) * 100 : 0;

        const ratios = playerStats.map((s) => s.ratio);
        const avgRatio =
          ratios.length > 0 ? ratios.reduce((sum, r) => sum + r, 0) / ratios.length : 0;
        const minRatio = ratios.length > 0 ? Math.min(...ratios) : 0;
        const maxRatio = ratios.length > 0 ? Math.max(...ratios) : 0;

        const clanAvgRatio =
          battles.length > 0 ? battles.reduce((sum, b) => sum + b.ratio, 0) / battles.length : 0;

        // Calculate trend (improvement/decline)
        let trend = 'stable';
        if (ratios.length >= 3) {
          const firstThird = ratios.slice(0, Math.floor(ratios.length / 3));
          const lastThird = ratios.slice(-Math.floor(ratios.length / 3));
          const firstAvg = firstThird.reduce((sum, r) => sum + r, 0) / firstThird.length;
          const lastAvg = lastThird.reduce((sum, r) => sum + r, 0) / lastThird.length;
          const change = ((lastAvg - firstAvg) / firstAvg) * 100;

          if (change > 5) trend = 'improving';
          else if (change < -5) trend = 'declining';
        }

        const response = {
          player: {
            playerId: player.playerId,
            name: player.playerName,
            active: player.active,
          },
          performance: performanceData,
          summary: {
            totalBattles,
            battlesPlayed,
            participationRate: parseFloat(participationRate.toFixed(2)),
            avgRatio: parseFloat(avgRatio.toFixed(2)),
            minRatio: parseFloat(minRatio.toFixed(2)),
            maxRatio: parseFloat(maxRatio.toFixed(2)),
            clanAvgRatio: parseFloat(clanAvgRatio.toFixed(2)),
            comparisonToClan: parseFloat(((avgRatio / clanAvgRatio - 1) * 100).toFixed(2)),
            trend,
          },
        };

        return response;
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch player performance data',
        });
      }
    }
  );

  /**
   * GET /api/clans/:clanId/reports/matchups
   * Story 7.7: View Matchup Analysis
   * Get aggregated opponent statistics and matchup history
   */
  fastify.get(
    '/:clanId/reports/matchups',
    {
      schema: {
        params: clanIdParamSchema,
        querystring: z.object({
          startDate: z
            .string()
            .regex(/^\d{8}$/)
            .optional(),
          endDate: z
            .string()
            .regex(/^\d{8}$/)
            .optional(),
        }),
        response: {
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { clanId: string };
        Querystring: { startDate?: string; endDate?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const clanId = parseInt(request.params.clanId);
        const { startDate, endDate } = request.query;

        // Verify clan exists
        const clan = await fastify.prisma.clan.findUnique({
          where: { clanId },
        });
        if (!clan) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Clan not found',
          });
        }

        // Build date filter
        const dateFilter: { gte?: Date; lte?: Date } = {};
        if (startDate) {
          const year = parseInt(startDate.substring(0, 4));
          const month = parseInt(startDate.substring(4, 6)) - 1;
          const day = parseInt(startDate.substring(6, 8));
          dateFilter.gte = new Date(year, month, day);
        }
        if (endDate) {
          const year = parseInt(endDate.substring(0, 4));
          const month = parseInt(endDate.substring(4, 6)) - 1;
          const day = parseInt(endDate.substring(6, 8));
          dateFilter.lte = new Date(year, month, day, 23, 59, 59);
        }

        // Fetch all battles with opponents
        const battles = await fastify.prisma.clanBattle.findMany({
          where: {
            clanId,
            ...(startDate || endDate ? { startDate: dateFilter } : {}),
          },
          select: {
            battleId: true,
            startDate: true,
            opponentName: true,
            opponentRovioId: true,
            opponentCountry: true,
            score: true,
            opponentScore: true,
            baselineFp: true,
            opponentFp: true,
            result: true,
          },
          orderBy: {
            startDate: 'desc',
          },
        });

        // Aggregate by opponent
        const opponentMap = new Map<
          string,
          {
            name: string;
            rovioId: string;
            country: string;
            battles: number;
            wins: number;
            losses: number;
            ties: number;
            totalFpDiff: number;
            recentBattles: Array<{
              battleId: string;
              date: string;
              result: number;
              score: number;
              opponentScore: number;
              fpDiff: number;
            }>;
          }
        >();

        for (const battle of battles) {
          const key = battle.opponentName;
          const existing = opponentMap.get(key);
          const fpDiff = battle.baselineFp - battle.opponentFp;

          if (existing) {
            existing.battles += 1;
            if (battle.result === 1) existing.wins += 1;
            else if (battle.result === -1) existing.losses += 1;
            else existing.ties += 1;
            existing.totalFpDiff += fpDiff;
            existing.recentBattles.push({
              battleId: battle.battleId,
              date: battle.startDate.toISOString().split('T')[0] || '',
              result: battle.result,
              score: battle.score,
              opponentScore: battle.opponentScore,
              fpDiff,
            });
          } else {
            opponentMap.set(key, {
              name: battle.opponentName,
              rovioId: battle.opponentRovioId.toString(),
              country: battle.opponentCountry,
              battles: 1,
              wins: battle.result === 1 ? 1 : 0,
              losses: battle.result === -1 ? 1 : 0,
              ties: battle.result === 0 ? 1 : 0,
              totalFpDiff: fpDiff,
              recentBattles: [
                {
                  battleId: battle.battleId,
                  date: battle.startDate.toISOString().split('T')[0] || '',
                  result: battle.result,
                  score: battle.score,
                  opponentScore: battle.opponentScore,
                  fpDiff,
                },
              ],
            });
          }
        }

        // Convert to array and calculate averages
        const opponents = Array.from(opponentMap.values()).map((opp) => ({
          name: opp.name,
          rovioId: opp.rovioId,
          country: opp.country,
          battles: opp.battles,
          wins: opp.wins,
          losses: opp.losses,
          ties: opp.ties,
          winRate: parseFloat(((opp.wins / opp.battles) * 100).toFixed(2)),
          avgFpDiff: parseFloat((opp.totalFpDiff / opp.battles).toFixed(0)),
          isRival: opp.battles >= 3, // Consider opponents faced 3+ times as rivals
          recentBattles: opp.recentBattles.slice(0, 5), // Last 5 battles only
        }));

        // Sort by number of battles (rivals first)
        opponents.sort((a, b) => b.battles - a.battles);

        // Aggregate by country
        const countryMap = new Map<
          string,
          {
            country: string;
            battles: number;
            wins: number;
            losses: number;
            ties: number;
          }
        >();

        for (const battle of battles) {
          const country = battle.opponentCountry;
          const existing = countryMap.get(country);

          if (existing) {
            existing.battles += 1;
            if (battle.result === 1) existing.wins += 1;
            else if (battle.result === -1) existing.losses += 1;
            else existing.ties += 1;
          } else {
            countryMap.set(country, {
              country,
              battles: 1,
              wins: battle.result === 1 ? 1 : 0,
              losses: battle.result === -1 ? 1 : 0,
              ties: battle.result === 0 ? 1 : 0,
            });
          }
        }

        const countries = Array.from(countryMap.values())
          .map((c) => ({
            country: c.country,
            battles: c.battles,
            wins: c.wins,
            losses: c.losses,
            ties: c.ties,
            winRate: parseFloat(((c.wins / c.battles) * 100).toFixed(2)),
            percentage: parseFloat(((c.battles / battles.length) * 100).toFixed(2)),
          }))
          .sort((a, b) => b.battles - a.battles);

        const response = {
          opponents,
          countries,
          summary: {
            totalBattles: battles.length,
            uniqueOpponents: opponents.length,
            uniqueCountries: countries.length,
            rivals: opponents.filter((o) => o.isRival).length,
          },
        };

        return response;
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch matchup data',
        });
      }
    }
  );

  /**
   * GET /api/clans/:clanId/reports/roster-churn
   * Get roster churn analysis (joins, departures, kicks by month)
   * Story: 7.8 (View Roster Churn Report)
   */
  fastify.get<{
    Params: z.infer<typeof clanIdParamSchema>;
    Querystring: z.infer<typeof trendQuerySchema>;
  }>(
    '/:clanId/reports/roster-churn',
    {
      schema: {
        description: 'Get roster churn analysis with retention metrics',
        tags: ['Reports', 'Roster'],
        params: clanIdParamSchema,
        querystring: trendQuerySchema,
        response: {
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { clanId } = clanIdParamSchema.parse(request.params);
        const { startDate, endDate } = trendQuerySchema.parse(request.query);
        const clanIdNum = parseInt(clanId, 10);

        // Verify clan exists
        const clan = await fastify.prisma.clan.findUnique({
          where: { clanId: clanIdNum },
        });

        if (!clan) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Clan not found',
          });
        }

        // Build date filter for roster members
        let dateFilter = {};
        if (startDate || endDate) {
          const startDateStr = startDate
            ? startDate.slice(0, 4) + '-' + startDate.slice(4, 6) + '-' + startDate.slice(6, 8)
            : null;
          const endDateStr = endDate
            ? endDate.slice(0, 4) + '-' + endDate.slice(4, 6) + '-' + endDate.slice(6, 8)
            : null;

          dateFilter = {
            OR: [
              // Joined during period
              startDateStr && endDateStr
                ? {
                    joinedDate: {
                      gte: new Date(startDateStr),
                      lte: new Date(endDateStr),
                    },
                  }
                : startDateStr
                  ? {
                      joinedDate: {
                        gte: new Date(startDateStr),
                      },
                    }
                  : endDateStr
                    ? {
                        joinedDate: {
                          lte: new Date(endDateStr),
                        },
                      }
                    : {},
              // Left during period
              startDateStr && endDateStr
                ? {
                    leftDate: {
                      gte: new Date(startDateStr),
                      lte: new Date(endDateStr),
                    },
                  }
                : startDateStr
                  ? {
                      leftDate: {
                        gte: new Date(startDateStr),
                      },
                    }
                  : endDateStr
                    ? {
                        leftDate: {
                          lte: new Date(endDateStr),
                        },
                      }
                    : {},
              // Kicked during period
              startDateStr && endDateStr
                ? {
                    kickedDate: {
                      gte: new Date(startDateStr),
                      lte: new Date(endDateStr),
                    },
                  }
                : startDateStr
                  ? {
                      kickedDate: {
                        gte: new Date(startDateStr),
                      },
                    }
                  : endDateStr
                    ? {
                        kickedDate: {
                          lte: new Date(endDateStr),
                        },
                      }
                    : {},
            ].filter((f) => Object.keys(f).length > 0), // Remove empty filters
          };
        }

        // Fetch all roster members
        const rosterMembers = await fastify.prisma.rosterMember.findMany({
          where: {
            clanId: clanIdNum,
            ...dateFilter,
          },
          select: {
            playerId: true,
            playerName: true,
            joinedDate: true,
            leftDate: true,
            kickedDate: true,
            active: true,
          },
          orderBy: {
            joinedDate: 'asc',
          },
        });

        // Fetch battles for action code analysis
        const battles = await fastify.prisma.clanBattle.findMany({
          where: {
            clanId: clanIdNum,
            ...(startDate || endDate
              ? {
                  battleId: {
                    ...(startDate ? { gte: startDate } : {}),
                    ...(endDate ? { lte: endDate } : {}),
                  },
                }
              : {}),
          },
          include: {
            playerStats: {
              select: {
                actionCode: true,
              },
            },
            nonplayerStats: {
              select: {
                actionCode: true,
              },
            },
          },
          orderBy: {
            battleId: 'asc',
          },
        });

        // Calculate monthly aggregates
        const monthlyData = new Map<
          string,
          { joined: number; left: number; kicked: number; month: string }
        >();

        // Process joined dates
        for (const member of rosterMembers) {
          const monthId = member.joinedDate.toISOString().slice(0, 7).replace('-', '');
          if (!monthlyData.has(monthId)) {
            monthlyData.set(monthId, { joined: 0, left: 0, kicked: 0, month: monthId });
          }
          monthlyData.get(monthId)!.joined++;
        }

        // Process left dates
        for (const member of rosterMembers) {
          if (member.leftDate) {
            const monthId = member.leftDate.toISOString().slice(0, 7).replace('-', '');
            if (!monthlyData.has(monthId)) {
              monthlyData.set(monthId, { joined: 0, left: 0, kicked: 0, month: monthId });
            }
            monthlyData.get(monthId)!.left++;
          }
        }

        // Process kicked dates
        for (const member of rosterMembers) {
          if (member.kickedDate) {
            const monthId = member.kickedDate.toISOString().slice(0, 7).replace('-', '');
            if (!monthlyData.has(monthId)) {
              monthlyData.set(monthId, { joined: 0, left: 0, kicked: 0, month: monthId });
            }
            monthlyData.get(monthId)!.kicked++;
          }
        }

        const churnByMonth = Array.from(monthlyData.values()).sort((a, b) =>
          a.month.localeCompare(b.month)
        );

        // Calculate action code frequency
        const actionCodeMap = new Map<string, number>();
        for (const battle of battles) {
          for (const stat of battle.playerStats) {
            if (stat.actionCode) {
              actionCodeMap.set(stat.actionCode, (actionCodeMap.get(stat.actionCode) || 0) + 1);
            }
          }
          for (const stat of battle.nonplayerStats) {
            if (stat.actionCode) {
              actionCodeMap.set(stat.actionCode, (actionCodeMap.get(stat.actionCode) || 0) + 1);
            }
          }
        }

        const actionCodeFrequency = Array.from(actionCodeMap.entries())
          .map(([code, count]) => ({
            actionCode: code,
            count,
            percentage: parseFloat(
              (
                (count / Array.from(actionCodeMap.values()).reduce((sum, val) => sum + val, 0)) *
                100
              ).toFixed(2)
            ),
          }))
          .sort((a, b) => b.count - a.count);

        // Calculate retention metrics
        const activeMembers = rosterMembers.filter((m) => m.active);
        const inactiveMembers = rosterMembers.filter((m) => !m.active);
        const totalJoined = rosterMembers.length;
        const totalLeft = rosterMembers.filter((m) => m.leftDate).length;
        const totalKicked = rosterMembers.filter((m) => m.kickedDate).length;
        const retentionRate =
          totalJoined > 0 ? parseFloat(((activeMembers.length / totalJoined) * 100).toFixed(2)) : 0;

        // Calculate average tenure (active members only)
        const now = new Date();
        const tenureDays = activeMembers.map(
          (m) => (now.getTime() - m.joinedDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const avgTenureDays =
          tenureDays.length > 0
            ? Math.round(tenureDays.reduce((sum, days) => sum + days, 0) / tenureDays.length)
            : 0;

        // Get longest-tenured active members (top 10)
        const longestTenured = activeMembers
          .map((m) => ({
            playerId: m.playerId,
            playerName: m.playerName,
            joinedDate: m.joinedDate.toISOString().split('T')[0],
            tenureDays: Math.round(
              (now.getTime() - m.joinedDate.getTime()) / (1000 * 60 * 60 * 24)
            ),
          }))
          .sort((a, b) => b.tenureDays - a.tenureDays)
          .slice(0, 10);

        const response = {
          churnByMonth,
          actionCodeFrequency,
          summary: {
            activeMembers: activeMembers.length,
            inactiveMembers: inactiveMembers.length,
            totalJoined,
            totalLeft,
            totalKicked,
            retentionRate,
            avgTenureDays,
          },
          longestTenured,
        };

        return response;
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch roster churn data',
        });
      }
    }
  );

  /**
   * GET /api/clans/:clanId/dashboard
   * Get dashboard data for clan admins (KPIs, recent battles, alerts)
   * Story: 7.9 (Dashboard Summary View)
   */
  fastify.get<{
    Params: z.infer<typeof clanIdParamSchema>;
  }>(
    '/:clanId/dashboard',
    {
      schema: {
        description: 'Get dashboard data with key metrics and alerts',
        tags: ['Reports', 'Dashboard'],
        params: clanIdParamSchema,
        response: {
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { clanId } = clanIdParamSchema.parse(request.params);
        const clanIdNum = parseInt(clanId, 10);

        // Verify clan exists
        const clan = await fastify.prisma.clan.findUnique({
          where: { clanId: clanIdNum },
          select: {
            clanId: true,
            name: true,
            country: true,
            rovioId: true,
          },
        });

        if (!clan) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Clan not found',
          });
        }

        // Get recent battles (last 5)
        const recentBattles = await fastify.prisma.clanBattle.findMany({
          where: { clanId: clanIdNum },
          select: {
            battleId: true,
            startDate: true,
            endDate: true,
            score: true,
            opponentScore: true,
            opponentName: true,
            result: true,
            ratio: true,
            nonplayingCount: true,
            playerStats: {
              select: {
                playerId: true,
              },
            },
          },
          orderBy: { battleId: 'desc' },
          take: 5,
        });

        // Calculate next battle date (last battle end + 1 day)
        let nextBattleDate: string | null = null;
        if (recentBattles.length > 0 && recentBattles[0]) {
          const lastBattle = recentBattles[0];
          const nextDate = new Date(lastBattle.endDate);
          nextDate.setDate(nextDate.getDate() + 1);
          const dateStr = nextDate.toISOString().split('T')[0];
          nextBattleDate = dateStr || null;
        }

        // Get current month stats
        const now = new Date();
        const currentMonthId =
          now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0');

        const monthBattles = await fastify.prisma.clanBattle.findMany({
          where: {
            clanId: clanIdNum,
            battleId: {
              gte: currentMonthId + '01',
              lte: currentMonthId + '31',
            },
          },
          select: {
            result: true,
            ratio: true,
            nonplayingCount: true,
            playerStats: {
              select: {
                playerId: true,
              },
            },
          },
        });

        const monthWins = monthBattles.filter((b) => b.result === 1).length;
        const monthLosses = monthBattles.filter((b) => b.result === -1).length;
        const monthTies = monthBattles.filter((b) => b.result === 0).length;
        const monthWinRate =
          monthBattles.length > 0
            ? parseFloat(((monthWins / monthBattles.length) * 100).toFixed(2))
            : 0;
        const monthAvgRatio =
          monthBattles.length > 0
            ? parseFloat(
                (monthBattles.reduce((sum, b) => sum + b.ratio, 0) / monthBattles.length).toFixed(2)
              )
            : 0;
        // Calculate participation rate: (playerCount / (playerCount + nonplayingCount)) * 100
        const monthAvgParticipation =
          monthBattles.length > 0
            ? parseFloat(
                (
                  monthBattles.reduce((sum, b) => {
                    const playerCount = b.playerStats.length;
                    const totalMembers = playerCount + b.nonplayingCount;
                    return sum + (totalMembers > 0 ? (playerCount / totalMembers) * 100 : 0);
                  }, 0) / monthBattles.length
                ).toFixed(2)
              )
            : 0;

        // Get current year stats
        const currentYearId = now.getFullYear().toString();

        const yearBattles = await fastify.prisma.clanBattle.findMany({
          where: {
            clanId: clanIdNum,
            battleId: {
              gte: currentYearId + '0101',
              lte: currentYearId + '1231',
            },
          },
          select: {
            result: true,
            ratio: true,
            nonplayingCount: true,
            playerStats: {
              select: {
                playerId: true,
              },
            },
          },
        });

        const yearWins = yearBattles.filter((b) => b.result === 1).length;
        const yearLosses = yearBattles.filter((b) => b.result === -1).length;
        const yearTies = yearBattles.filter((b) => b.result === 0).length;
        const yearWinRate =
          yearBattles.length > 0
            ? parseFloat(((yearWins / yearBattles.length) * 100).toFixed(2))
            : 0;
        const yearAvgRatio =
          yearBattles.length > 0
            ? parseFloat(
                (yearBattles.reduce((sum, b) => sum + b.ratio, 0) / yearBattles.length).toFixed(2)
              )
            : 0;
        // Calculate participation rate: (playerCount / (playerCount + nonplayingCount)) * 100
        const yearAvgParticipation =
          yearBattles.length > 0
            ? parseFloat(
                (
                  yearBattles.reduce((sum, b) => {
                    const playerCount = b.playerStats.length;
                    const totalMembers = playerCount + b.nonplayingCount;
                    return sum + (totalMembers > 0 ? (playerCount / totalMembers) * 100 : 0);
                  }, 0) / yearBattles.length
                ).toFixed(2)
              )
            : 0;

        // Check for pending admin requests (requires authentication context)
        // For now, we'll return 0 since we don't have user context in this endpoint
        // This should be enhanced in the future to check actual admin requests
        const pendingAdminRequests = 0;

        // TODO: Check for incomplete battle drafts (stored in localStorage, not database)
        // This is a client-side concern, not backend

        const response = {
          clan: {
            clanId: clan.clanId,
            name: clan.name,
            country: clan.country,
            rovioId: clan.rovioId,
          },
          recentBattles: recentBattles.map((b) => {
            const playerCount = b.playerStats.length;
            const totalMembers = playerCount + b.nonplayingCount;
            const participationRate =
              totalMembers > 0 ? parseFloat(((playerCount / totalMembers) * 100).toFixed(2)) : 0;
            return {
              battleId: b.battleId,
              date: b.startDate.toISOString().split('T')[0],
              opponent: b.opponentName,
              result: b.result === 1 ? 'Won' : b.result === -1 ? 'Lost' : 'Tied',
              score: b.score,
              opponentScore: b.opponentScore,
              ratio: b.ratio,
              participationRate,
            };
          }),
          nextBattleDate,
          currentMonth: {
            monthId: currentMonthId,
            battles: monthBattles.length,
            wins: monthWins,
            losses: monthLosses,
            ties: monthTies,
            winRate: monthWinRate,
            avgRatio: monthAvgRatio,
            avgParticipation: monthAvgParticipation,
          },
          currentYear: {
            yearId: currentYearId,
            battles: yearBattles.length,
            wins: yearWins,
            losses: yearLosses,
            ties: yearTies,
            winRate: yearWinRate,
            avgRatio: yearAvgRatio,
            avgParticipation: yearAvgParticipation,
          },
          alerts: {
            pendingAdminRequests,
            incompleteBattleDrafts: 0, // Client-side concern
          },
        };

        return response;
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch dashboard data',
        });
      }
    }
  );
};

export default reportsRoutes;
