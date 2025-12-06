/**
 * Master Battle Service
 * Business logic for centralized battle schedule management
 *
 * Handles operations related to the Master Battle schedule:
 * - Querying available battles for data entry
 * - Managing next battle schedule
 * - Manual battle creation (for corrections/adjustments)
 * - Battle schedule information for display
 */

import {
  type MasterBattle,
  type BattleScheduleInfo,
  type CreateMasterBattleInput,
  type UpdateNextBattleDateInput,
  type MasterBattleQueryOptions,
  type MasterBattlePage,
  generateBattleId,
  getBattleStartTimestamp,
  getBattleEndTimestamp,
  estToGmt,
  gmtToEst,
  isInFuture,
  getCurrentAngryBirdsTime,
} from '@angrybirdman/common';
import { type PrismaClient } from '@angrybirdman/database';

export class MasterBattleService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all master battles with optional pagination and filtering
   *
   * @param options - Query options (pagination, sorting, filtering)
   * @returns Paginated list of master battles
   */
  async getAllBattles(options: MasterBattleQueryOptions = {}): Promise<MasterBattlePage> {
    const { page = 1, limit = 50, sortOrder = 'desc', startDateFrom, startDateTo } = options;

    // Build where clause
    const where: {
      startTimestamp?: { gte?: Date; lte?: Date };
    } = {};

    if (startDateFrom || startDateTo) {
      where.startTimestamp = {};
      if (startDateFrom) {
        where.startTimestamp.gte = startDateFrom;
      }
      if (startDateTo) {
        where.startTimestamp.lte = startDateTo;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Query with pagination
    const [battles, total] = await Promise.all([
      this.prisma.masterBattle.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          startTimestamp: sortOrder,
        },
      }),
      this.prisma.masterBattle.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;

    return {
      battles: battles as MasterBattle[],
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrevious,
    };
  }

  /**
   * Get available battles for selection in battle entry form
   *
   * Returns battles that have started but excludes future battles.
   * Sorted with most recent first.
   *
   * @returns Array of available master battles
   */
  async getAvailableBattles(): Promise<MasterBattle[]> {
    const now = getCurrentAngryBirdsTime();
    const nowGmt = estToGmt(now);

    const battles = await this.prisma.masterBattle.findMany({
      where: {
        startTimestamp: {
          lte: nowGmt, // Only battles that have started
        },
      },
      orderBy: {
        startTimestamp: 'desc', // Most recent first
      },
      take: 100, // Limit to last 100 battles
    });

    return battles as MasterBattle[];
  }

  /**
   * Get next scheduled battle date from system settings
   *
   * @returns Next battle start date in EST
   * @throws Error if setting not found
   */
  async getNextBattleDate(): Promise<Date> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: 'nextBattleStartDate' },
    });

    if (!setting) {
      throw new Error('Next battle start date not configured in system settings');
    }

    // Value is stored as ISO string in GMT, convert to EST for return
    const gmtDate = new Date(setting.value);
    return gmtToEst(gmtDate);
  }

  /**
   * Update next battle start date (Superadmin only)
   *
   * @param data - New next battle date
   * @param _userId - User ID of superadmin making the change (unused in service, used in route for audit)
   * @throws Error if date is not in future or invalid
   */
  async updateNextBattleDate(data: UpdateNextBattleDateInput, _userId: string): Promise<void> {
    const newDate = new Date(data.nextBattleStartDate);

    // Validate date is in future
    if (!isInFuture(newDate)) {
      throw new Error('Next battle date must be in the future');
    }

    // Convert EST to GMT for storage
    const gmtDate = estToGmt(newDate);

    // Update system setting with upsert pattern
    await this.prisma.systemSetting.upsert({
      where: { key: 'nextBattleStartDate' },
      create: {
        key: 'nextBattleStartDate',
        value: gmtDate.toISOString(),
        description: 'Next scheduled battle start date in Official Angry Birds Time (EST)',
        dataType: 'date',
      },
      update: {
        value: gmtDate.toISOString(),
        updatedAt: new Date(),
      },
    });

    // Note: Audit logging would be handled by the route handler
  }

  /**
   * Manually create a master battle entry
   * Used by superadmin for corrections or historical data
   *
   * @param data - Battle creation data
   * @param userId - User ID of superadmin creating the battle
   * @returns Created master battle
   * @throws Error if battle already exists
   */
  async createMasterBattle(data: CreateMasterBattleInput, userId: string): Promise<MasterBattle> {
    const { startDate, notes } = data;

    // Generate battle ID from start date (in EST)
    const battleId = generateBattleId(startDate);

    // Check if battle already exists
    const existing = await this.prisma.masterBattle.findUnique({
      where: { battleId },
    });

    if (existing) {
      throw new Error(`Battle ${battleId} already exists`);
    }

    // Calculate timestamps
    const startTimestamp = getBattleStartTimestamp(startDate);
    const endTimestamp = getBattleEndTimestamp(startDate);

    // Convert EST to GMT for database storage
    const startGmt = estToGmt(startTimestamp);
    const endGmt = estToGmt(endTimestamp);

    // Create battle
    const battle = await this.prisma.masterBattle.create({
      data: {
        battleId,
        startTimestamp: startGmt,
        endTimestamp: endGmt,
        createdBy: userId,
        notes: notes || null,
      },
    });

    return battle as MasterBattle;
  }

  /**
   * Get battle schedule information for display
   * Includes current battle, next battle, and available battles
   *
   * @returns Complete battle schedule information
   */
  async getBattleScheduleInfo(): Promise<BattleScheduleInfo> {
    const now = getCurrentAngryBirdsTime();
    const nowGmt = estToGmt(now);

    // Get current battle (one that has started but not ended)
    const currentBattle = await this.prisma.masterBattle.findFirst({
      where: {
        startTimestamp: {
          lte: nowGmt,
        },
        endTimestamp: {
          gte: nowGmt,
        },
      },
      orderBy: {
        startTimestamp: 'desc',
      },
    });

    // Get next battle start date from system settings
    let nextBattleStartDate: Date;
    try {
      nextBattleStartDate = await this.getNextBattleDate();
    } catch {
      // If not set, default to 3 days from now
      const defaultDate = new Date(now);
      defaultDate.setDate(defaultDate.getDate() + 3);
      nextBattleStartDate = defaultDate;
    }

    // Check if next battle already exists in master battles
    const nextBattleId = generateBattleId(nextBattleStartDate);
    const battle = await this.prisma.masterBattle.findUnique({
      where: { battleId: nextBattleId },
    });

    // Get available battles (started but not future)
    const availableBattles = await this.getAvailableBattles();

    return {
      currentBattle: currentBattle as MasterBattle | null,
      nextBattle: battle as MasterBattle | null,
      nextBattleStartDate,
      availableBattles,
    };
  }

  /**
   * Get a specific master battle by ID
   *
   * @param battleId - Battle ID in YYYYMMDD format
   * @returns Master battle or null if not found
   */
  async getBattleById(battleId: string): Promise<MasterBattle | null> {
    const battle = await this.prisma.masterBattle.findUnique({
      where: { battleId },
    });

    return battle as MasterBattle | null;
  }

  /**
   * Get recent battles (last N battles)
   *
   * @param count - Number of recent battles to return (default: 10)
   * @returns Array of recent master battles
   */
  async getRecentBattles(count: number = 10): Promise<MasterBattle[]> {
    const battles = await this.prisma.masterBattle.findMany({
      orderBy: {
        startTimestamp: 'desc',
      },
      take: count,
    });

    return battles as MasterBattle[];
  }
}
