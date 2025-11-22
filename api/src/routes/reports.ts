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
};

export default reportsRoutes;
