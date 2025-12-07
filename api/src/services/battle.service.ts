/**
 * Battle Service
 * Business logic for clan battle data management
 */

import {
  calculateBattleResult,
  calculateClanRatio,
  calculateAverageRatio,
  calculateProjectedScore,
  calculateMarginRatio,
  calculateFpMargin,
  calculateNonplayingFpRatio,
  calculateReserveFpRatio,
  calculatePlayerRatio,
  calculatePlayerRatioRanks,
  calculateTotalFp,
  calculateNonplayingCount,
  calculateReserveCount,
  calculateNonplayingFp,
  calculateReserveFp,
  type PlayerStatsWithRatio,
  type BattleEntry,
  type BattleUpdate,
  type BattleQuery,
  type BattleDetailResponse,
} from '@angrybirdman/common';
import { generateMonthId, generateYearId } from '@angrybirdman/common';
import { type Prisma, type PrismaClient } from '@angrybirdman/database';

export class BattleService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new battle with all player and nonplayer stats
   * Now uses battleId from MasterBattle table instead of generating from startDate
   */
  async createBattle(clanId: number, data: BattleEntry): Promise<BattleDetailResponse> {
    const { battleId } = data;

    // Validate battleId exists in MasterBattle table
    const masterBattle = await this.prisma.masterBattle.findUnique({
      where: { battleId },
    });

    if (!masterBattle) {
      throw new Error(`Battle ${battleId} does not exist in the master schedule`);
    }

    // Check for duplicate battle (clan already recorded this battle)
    const existing = await this.prisma.clanBattle.findUnique({
      where: {
        clanId_battleId: { clanId, battleId },
      },
    });

    if (existing) {
      throw new Error(`Battle ${battleId} has already been recorded for this clan`);
    }

    // Get start/end dates from MasterBattle for denormalization
    const startDate = masterBattle.startTimestamp;
    const endDate = masterBattle.endTimestamp;

    // Calculate player ratios and add to stats
    const playerStatsWithRatios: PlayerStatsWithRatio[] = data.playerStats.map((player) => ({
      playerId: player.playerId,
      score: player.score,
      fp: player.fp,
      rank: player.rank,
      ratio: calculatePlayerRatio(player.score, player.fp),
    }));

    // Calculate ratio ranks
    const playerStatsWithRanks = calculatePlayerRatioRanks(playerStatsWithRatios);

    // Calculate total FP (players + nonplayers excluding reserves)
    const totalFp = calculateTotalFp(data.playerStats, data.nonplayerStats);

    // Calculate nonplaying statistics
    const nonplayingFp = calculateNonplayingFp(data.nonplayerStats);
    const nonplayingCount = calculateNonplayingCount(data.nonplayerStats);
    const nonplayingFpRatio = calculateNonplayingFpRatio(nonplayingFp, totalFp);

    // Calculate reserve statistics
    const reserveFp = calculateReserveFp(data.nonplayerStats);
    const reserveCount = calculateReserveCount(data.nonplayerStats);
    const reserveFpRatio = calculateReserveFpRatio(reserveFp, totalFp);

    // Calculate battle-level statistics
    const result = calculateBattleResult(data.score, data.opponentScore);
    const ratio = calculateClanRatio(data.score, data.baselineFp);
    const averageRatio = calculateAverageRatio(data.score, totalFp);
    const projectedScore = calculateProjectedScore(data.score, nonplayingFpRatio);
    const marginRatio = calculateMarginRatio(data.score, data.opponentScore);
    const fpMargin = calculateFpMargin(data.baselineFp, data.opponentFp);

    // Create battle with all stats in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Create the battle record with dates from MasterBattle
      const createdBattle = await tx.clanBattle.create({
        data: {
          clanId,
          battleId,
          startDate, // From MasterBattle (denormalized)
          endDate, // From MasterBattle (denormalized)
          result,
          score: data.score,
          fp: totalFp,
          baselineFp: data.baselineFp,
          ratio,
          averageRatio,
          projectedScore,
          opponentName: data.opponentName,
          opponentRovioId: data.opponentRovioId,
          opponentCountry: data.opponentCountry,
          opponentScore: data.opponentScore,
          opponentFp: data.opponentFp,
          marginRatio,
          fpMargin,
          nonplayingCount,
          nonplayingFpRatio,
          reserveCount,
          reserveFpRatio,
        },
      });

      // Create player stats
      await tx.clanBattlePlayerStats.createMany({
        data: playerStatsWithRanks.map((player) => ({
          clanId,
          battleId,
          playerId: player.playerId,
          rank: player.rank,
          score: player.score,
          fp: player.fp,
          ratio: player.ratio,
          ratioRank: player.ratioRank,
          actionCode:
            data.playerStats.find((p) => p.playerId === player.playerId)?.actionCode || 'HOLD',
          actionReason:
            data.playerStats.find((p) => p.playerId === player.playerId)?.actionReason || null,
        })),
      });

      // Create nonplayer stats if any
      if (data.nonplayerStats.length > 0) {
        await tx.clanBattleNonplayerStats.createMany({
          data: data.nonplayerStats.map((nonplayer) => ({
            clanId,
            battleId,
            playerId: nonplayer.playerId,
            fp: nonplayer.fp,
            reserve: nonplayer.reserve,
            actionCode: nonplayer.actionCode,
            actionReason: nonplayer.actionReason || null,
          })),
        });
      }

      // Execute action codes (update roster based on actions)
      await this.executeActionCodes(tx, clanId, battleId, data);

      return createdBattle;
    });

    // Update monthly and yearly summaries (outside transaction for performance)
    await this.updateMonthlySummary(clanId, startDate);
    await this.updateYearlySummary(clanId, startDate);

    // Fetch and return complete battle data
    return this.getBattleById(clanId, battleId);
  }

  /**
   * Get a list of battles for a clan with filtering and pagination
   */
  async getBattles(
    clanId: number,
    query: BattleQuery
  ): Promise<{ battles: BattleDetailResponse[]; total: number; page: number; limit: number }> {
    const {
      startDate,
      endDate,
      opponentName,
      opponentCountry,
      result,
      limit,
      page,
      sortBy,
      sortOrder,
    } = query;

    // Build where clause
    const where: Prisma.ClanBattleWhereInput = {
      clanId,
      ...(startDate || endDate
        ? {
            startDate: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {}),
      ...(opponentName ? { opponentName: { contains: opponentName, mode: 'insensitive' } } : {}),
      ...(opponentCountry
        ? { opponentCountry: { contains: opponentCountry, mode: 'insensitive' } }
        : {}),
      ...(result !== undefined ? { result: parseInt(result) } : {}),
    };

    // Build order by clause
    const orderBy: Prisma.ClanBattleOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    // Get total count
    const total = await this.prisma.clanBattle.count({ where });

    // Get paginated battles
    const battles = await this.prisma.clanBattle.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        playerStats: {
          include: {
            player: true,
          },
          orderBy: { ratioRank: 'asc' },
        },
        nonplayerStats: {
          include: {
            player: true,
          },
          orderBy: { reserve: 'asc' },
        },
      },
    });

    // Transform to response format
    const battleResponses: BattleDetailResponse[] = battles.map((battle) => ({
      clanId: battle.clanId,
      battleId: battle.battleId,
      startDate: battle.startDate,
      endDate: battle.endDate,
      result: battle.result,
      score: battle.score,
      fp: battle.fp,
      baselineFp: battle.baselineFp,
      ratio: battle.ratio,
      averageRatio: battle.averageRatio,
      projectedScore: battle.projectedScore,
      opponentName: battle.opponentName,
      opponentRovioId: battle.opponentRovioId,
      opponentCountry: battle.opponentCountry,
      opponentScore: battle.opponentScore,
      opponentFp: battle.opponentFp,
      marginRatio: battle.marginRatio,
      fpMargin: battle.fpMargin,
      nonplayingCount: battle.nonplayingCount,
      nonplayingFpRatio: battle.nonplayingFpRatio,
      reserveCount: battle.reserveCount,
      reserveFpRatio: battle.reserveFpRatio,
      createdAt: battle.createdAt,
      updatedAt: battle.updatedAt,
      playerStats: battle.playerStats.map((ps) => ({
        clanId: ps.clanId,
        battleId: ps.battleId,
        playerId: ps.playerId,
        playerName: ps.player.playerName,
        rank: ps.rank,
        score: ps.score,
        fp: ps.fp,
        ratio: ps.ratio,
        ratioRank: ps.ratioRank,
        actionCode: ps.actionCode,
        actionReason: ps.actionReason,
        createdAt: ps.createdAt,
        updatedAt: ps.updatedAt,
      })),
      nonplayerStats: battle.nonplayerStats.map((nps) => ({
        clanId: nps.clanId,
        battleId: nps.battleId,
        playerId: nps.playerId,
        playerName: nps.player.playerName,
        fp: nps.fp,
        reserve: nps.reserve,
        actionCode: nps.actionCode,
        actionReason: nps.actionReason,
        createdAt: nps.createdAt,
        updatedAt: nps.updatedAt,
      })),
    }));

    return {
      battles: battleResponses,
      total,
      page,
      limit,
    };
  }

  /**
   * Get a single battle by ID with all stats
   */
  async getBattleById(clanId: number, battleId: string): Promise<BattleDetailResponse> {
    const battle = await this.prisma.clanBattle.findUnique({
      where: {
        clanId_battleId: { clanId, battleId },
      },
      include: {
        playerStats: {
          include: {
            player: true,
          },
          orderBy: { ratioRank: 'asc' },
        },
        nonplayerStats: {
          include: {
            player: true,
          },
          orderBy: { reserve: 'asc' },
        },
      },
    });

    if (!battle) {
      throw new Error(`Battle ${battleId} not found for clan ${clanId}`);
    }

    return {
      clanId: battle.clanId,
      battleId: battle.battleId,
      startDate: battle.startDate,
      endDate: battle.endDate,
      result: battle.result,
      score: battle.score,
      fp: battle.fp,
      baselineFp: battle.baselineFp,
      ratio: battle.ratio,
      averageRatio: battle.averageRatio,
      projectedScore: battle.projectedScore,
      opponentName: battle.opponentName,
      opponentRovioId: battle.opponentRovioId,
      opponentCountry: battle.opponentCountry,
      opponentScore: battle.opponentScore,
      opponentFp: battle.opponentFp,
      marginRatio: battle.marginRatio,
      fpMargin: battle.fpMargin,
      nonplayingCount: battle.nonplayingCount,
      nonplayingFpRatio: battle.nonplayingFpRatio,
      reserveCount: battle.reserveCount,
      reserveFpRatio: battle.reserveFpRatio,
      createdAt: battle.createdAt,
      updatedAt: battle.updatedAt,
      playerStats: battle.playerStats.map((ps) => ({
        clanId: ps.clanId,
        battleId: ps.battleId,
        playerId: ps.playerId,
        playerName: ps.player.playerName,
        rank: ps.rank,
        score: ps.score,
        fp: ps.fp,
        ratio: ps.ratio,
        ratioRank: ps.ratioRank,
        actionCode: ps.actionCode,
        actionReason: ps.actionReason,
        createdAt: ps.createdAt,
        updatedAt: ps.updatedAt,
      })),
      nonplayerStats: battle.nonplayerStats.map((nps) => ({
        clanId: nps.clanId,
        battleId: nps.battleId,
        playerId: nps.playerId,
        playerName: nps.player.playerName,
        fp: nps.fp,
        reserve: nps.reserve,
        actionCode: nps.actionCode,
        actionReason: nps.actionReason,
        createdAt: nps.createdAt,
        updatedAt: nps.updatedAt,
      })),
    };
  }

  /**
   * Update an existing battle
   * Note: battleId cannot be changed - it identifies the battle
   * Note: startDate and endDate cannot be changed - they come from MasterBattle
   */
  async updateBattle(
    clanId: number,
    battleId: string,
    data: BattleUpdate
  ): Promise<BattleDetailResponse> {
    // Check if battle exists
    const existing = await this.prisma.clanBattle.findUnique({
      where: { clanId_battleId: { clanId, battleId } },
    });

    if (!existing) {
      throw new Error(`Battle ${battleId} not found for clan ${clanId}`);
    }

    // Get existing player and nonplayer stats to merge if not provided
    const existingBattleWithStats = await this.prisma.clanBattle.findUnique({
      where: { clanId_battleId: { clanId, battleId } },
      include: {
        playerStats: true,
        nonplayerStats: true,
      },
    });

    if (!existingBattleWithStats) {
      throw new Error(`Battle ${battleId} not found for clan ${clanId}`);
    }

    // If updating battle data, recalculate everything
    // For simplicity, we'll delete and recreate (transaction ensures atomicity)
    await this.prisma.$transaction(async (tx) => {
      // Delete existing stats
      await tx.clanBattlePlayerStats.deleteMany({
        where: { clanId, battleId },
      });
      await tx.clanBattleNonplayerStats.deleteMany({
        where: { clanId, battleId },
      });
      await tx.clanBattle.delete({
        where: { clanId_battleId: { clanId, battleId } },
      });
    });

    // Recreate with updated data (merge existing and updates)
    // Note: battleId stays the same, dates come from MasterBattle
    const mergedData: BattleEntry = {
      battleId, // battleId cannot be changed
      // startDate and endDate removed - they come from MasterBattle
      opponentRovioId: data.opponentRovioId || existing.opponentRovioId,
      opponentName: data.opponentName || existing.opponentName,
      opponentCountry: data.opponentCountry || existing.opponentCountry,
      score: data.score !== undefined ? data.score : existing.score,
      baselineFp: data.baselineFp || existing.baselineFp,
      opponentScore: data.opponentScore !== undefined ? data.opponentScore : existing.opponentScore,
      opponentFp: data.opponentFp || existing.opponentFp,
      playerStats:
        data.playerStats ||
        existingBattleWithStats.playerStats.map((ps) => ({
          playerId: ps.playerId,
          rank: ps.rank,
          score: ps.score,
          fp: ps.fp,
          actionCode: ps.actionCode,
          actionReason: ps.actionReason,
        })),
      nonplayerStats:
        data.nonplayerStats ||
        existingBattleWithStats.nonplayerStats.map((nps) => ({
          playerId: nps.playerId,
          fp: nps.fp,
          reserve: nps.reserve,
          actionCode: nps.actionCode,
          actionReason: nps.actionReason,
        })),
    };

    return this.createBattle(clanId, mergedData);
  }

  /**
   * Delete a battle
   */
  async deleteBattle(clanId: number, battleId: string): Promise<void> {
    const battle = await this.prisma.clanBattle.findUnique({
      where: { clanId_battleId: { clanId, battleId } },
    });

    if (!battle) {
      throw new Error(`Battle ${battleId} not found for clan ${clanId}`);
    }

    // Delete battle (cascade will handle stats)
    await this.prisma.clanBattle.delete({
      where: { clanId_battleId: { clanId, battleId } },
    });

    // Update monthly and yearly summaries
    await this.updateMonthlySummary(clanId, battle.startDate);
    await this.updateYearlySummary(clanId, battle.startDate);
  }

  /**
   * Execute action codes on roster members
   */
  private async executeActionCodes(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: any,
    _clanId: number,
    _battleId: string,
    data: BattleEntry
  ): Promise<void> {
    // Process player action codes

    for (const player of data.playerStats) {
      if (player.actionCode === 'KICK') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await tx.rosterMember.update({
          where: { playerId: player.playerId },
          data: {
            active: false,
            kickedDate: new Date(),
          },
        });
      } else if (player.actionCode === 'RESERVE') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await tx.rosterMember.update({
          where: { playerId: player.playerId },
          data: {
            active: false,
          },
        });
      }
    }

    // Process nonplayer action codes
    for (const nonplayer of data.nonplayerStats) {
      if (nonplayer.actionCode === 'KICK') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await tx.rosterMember.update({
          where: { playerId: nonplayer.playerId },
          data: {
            active: false,
            kickedDate: new Date(),
          },
        });
      } else if (nonplayer.actionCode === 'RESERVE') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await tx.rosterMember.update({
          where: { playerId: nonplayer.playerId },
          data: {
            active: false,
          },
        });
      }
    }
  }

  /**
   * Update or create monthly clan performance summary
   */
  private async updateMonthlySummary(clanId: number, date: Date): Promise<void> {
    const monthId = generateMonthId(date);

    // Get all battles for this month
    const battles = await this.prisma.clanBattle.findMany({
      where: {
        clanId,
        battleId: {
          startsWith: monthId,
        },
      },
    });

    if (battles.length === 0) {
      // No battles in month, delete summary if exists
      await this.prisma.monthlyClanPerformance.deleteMany({
        where: { clanId, monthId },
      });
      return;
    }

    // Calculate summary statistics
    const battleCount = battles.length;
    const wonCount = battles.filter((b) => b.result === 1).length;
    const lostCount = battles.filter((b) => b.result === -1).length;
    const tiedCount = battles.filter((b) => b.result === 0).length;

    const averageFp = battles.reduce((sum, b) => sum + b.fp, 0) / battleCount;
    const averageBaselineFp = battles.reduce((sum, b) => sum + b.baselineFp, 0) / battleCount;
    const averageRatio = battles.reduce((sum, b) => sum + b.ratio, 0) / battleCount;
    const averageMarginRatio = battles.reduce((sum, b) => sum + b.marginRatio, 0) / battleCount;
    const averageFpMargin = battles.reduce((sum, b) => sum + b.fpMargin, 0) / battleCount;
    const averageNonplayingCount =
      battles.reduce((sum, b) => sum + b.nonplayingCount, 0) / battleCount;
    const averageNonplayingFpRatio =
      battles.reduce((sum, b) => sum + b.nonplayingFpRatio, 0) / battleCount;
    const averageReserveCount = battles.reduce((sum, b) => sum + b.reserveCount, 0) / battleCount;
    const averageReserveFpRatio =
      battles.reduce((sum, b) => sum + b.reserveFpRatio, 0) / battleCount;

    // Upsert monthly summary
    await this.prisma.monthlyClanPerformance.upsert({
      where: {
        clanId_monthId: { clanId, monthId },
      },
      create: {
        clanId,
        monthId,
        battleCount,
        wonCount,
        lostCount,
        tiedCount,
        monthComplete: false,
        averageFp,
        averageBaselineFp,
        averageRatio,
        averageMarginRatio,
        averageFpMargin,
        averageNonplayingCount,
        averageNonplayingFpRatio,
        averageReserveCount,
        averageReserveFpRatio,
      },
      update: {
        battleCount,
        wonCount,
        lostCount,
        tiedCount,
        averageFp,
        averageBaselineFp,
        averageRatio,
        averageMarginRatio,
        averageFpMargin,
        averageNonplayingCount,
        averageNonplayingFpRatio,
        averageReserveCount,
        averageReserveFpRatio,
      },
    });

    // TODO: Update monthly individual performance stats (players with >= 3 battles)
  }

  /**
   * Update or create yearly clan performance summary
   */
  private async updateYearlySummary(clanId: number, date: Date): Promise<void> {
    const yearId = generateYearId(date);

    // Get all battles for this year
    const battles = await this.prisma.clanBattle.findMany({
      where: {
        clanId,
        battleId: {
          startsWith: yearId,
        },
      },
    });

    if (battles.length === 0) {
      // No battles in year, delete summary if exists
      await this.prisma.yearlyClanPerformance.deleteMany({
        where: { clanId, yearId },
      });
      return;
    }

    // Calculate summary statistics
    const battleCount = battles.length;
    const wonCount = battles.filter((b) => b.result === 1).length;
    const lostCount = battles.filter((b) => b.result === -1).length;
    const tiedCount = battles.filter((b) => b.result === 0).length;

    const averageFp = battles.reduce((sum, b) => sum + b.fp, 0) / battleCount;
    const averageBaselineFp = battles.reduce((sum, b) => sum + b.baselineFp, 0) / battleCount;
    const averageRatio = battles.reduce((sum, b) => sum + b.ratio, 0) / battleCount;
    const averageMarginRatio = battles.reduce((sum, b) => sum + b.marginRatio, 0) / battleCount;
    const averageFpMargin = battles.reduce((sum, b) => sum + b.fpMargin, 0) / battleCount;
    const averageNonplayingCount =
      battles.reduce((sum, b) => sum + b.nonplayingCount, 0) / battleCount;
    const averageNonplayingFpRatio =
      battles.reduce((sum, b) => sum + b.nonplayingFpRatio, 0) / battleCount;
    const averageReserveCount = battles.reduce((sum, b) => sum + b.reserveCount, 0) / battleCount;
    const averageReserveFpRatio =
      battles.reduce((sum, b) => sum + b.reserveFpRatio, 0) / battleCount;

    // Upsert yearly summary
    await this.prisma.yearlyClanPerformance.upsert({
      where: {
        clanId_yearId: { clanId, yearId },
      },
      create: {
        clanId,
        yearId,
        battleCount,
        wonCount,
        lostCount,
        tiedCount,
        yearComplete: false,
        averageFp,
        averageBaselineFp,
        averageRatio,
        averageMarginRatio,
        averageFpMargin,
        averageNonplayingCount,
        averageNonplayingFpRatio,
        averageReserveCount,
        averageReserveFpRatio,
      },
      update: {
        battleCount,
        wonCount,
        lostCount,
        tiedCount,
        averageFp,
        averageBaselineFp,
        averageRatio,
        averageMarginRatio,
        averageFpMargin,
        averageNonplayingCount,
        averageNonplayingFpRatio,
        averageReserveCount,
        averageReserveFpRatio,
      },
    });

    // TODO: Update yearly individual performance stats (players with >= 3 battles)
  }
}
