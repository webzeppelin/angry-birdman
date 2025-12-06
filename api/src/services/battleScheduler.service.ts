/**
 * Battle Scheduler Service
 *
 * Automatically creates new Master Battle entries when current time
 * passes the scheduled next battle start date.
 *
 * This service runs hourly via node-cron and ensures all clans have
 * consistent Battle IDs for the same events.
 *
 * @module services/battleScheduler
 */

import { estToGmt, generateBattleIdFromEst, getCurrentAngryBirdsTime } from '@angrybirdman/common';

import type { PrismaClient } from '@angrybirdman/database';
import type { FastifyBaseLogger } from 'fastify';

/**
 * Battle Scheduler Service
 *
 * Manages automatic creation of Master Battle entries based on schedule
 */
export class BattleSchedulerService {
  constructor(
    private prisma: PrismaClient,
    private logger: FastifyBaseLogger
  ) {}

  /**
   * Check if new battle should be created and create it if needed
   * This is the main method called by the cron job
   *
   * Process:
   * 1. Get current time in Official Angry Birds Time (EST)
   * 2. Get nextBattleStartDate from system settings
   * 3. If current time >= next battle start:
   *    a. Create new MasterBattle entry
   *    b. Update nextBattleStartDate to +3 days
   *    c. Log to audit log
   * 4. Handle errors gracefully with logging
   */
  async checkAndCreateBattle(): Promise<void> {
    try {
      // Get current time in EST
      const currentTime = getCurrentAngryBirdsTime();
      this.logger.debug(
        { currentTime: currentTime.toISOString() },
        'Checking if new battle should be created'
      );

      // Get next battle start date from system settings
      const nextBattleStartDate = await this.getNextBattleStartDate();

      if (!nextBattleStartDate) {
        this.logger.warn('No nextBattleStartDate found in system settings');
        return;
      }

      this.logger.debug(
        { nextBattleStartDate: nextBattleStartDate.toISOString() },
        'Next battle start date retrieved'
      );

      // Check if it's time to create a new battle
      if (currentTime >= nextBattleStartDate) {
        this.logger.info(
          {
            currentTime: currentTime.toISOString(),
            nextBattleStartDate: nextBattleStartDate.toISOString(),
          },
          'Current time has passed next battle start date - creating new battle'
        );

        await this.createMasterBattle(nextBattleStartDate);

        // Update next battle date to +3 days
        const newNextBattleDate = new Date(nextBattleStartDate);
        newNextBattleDate.setUTCDate(newNextBattleDate.getUTCDate() + 3);

        await this.updateNextBattleDate(newNextBattleDate);

        this.logger.info(
          { newNextBattleDate: newNextBattleDate.toISOString() },
          'Next battle date updated'
        );
      } else {
        this.logger.debug(
          {
            currentTime: currentTime.toISOString(),
            nextBattleStartDate: nextBattleStartDate.toISOString(),
            hoursUntilNextBattle: (
              (nextBattleStartDate.getTime() - currentTime.getTime()) /
              (1000 * 60 * 60)
            ).toFixed(2),
          },
          'Not yet time to create new battle'
        );
      }
    } catch (error) {
      this.logger.error({ error }, 'Error in battle scheduler check');
      // Don't throw - we want the scheduler to continue running
      // The next scheduled run will try again
    }
  }

  /**
   * Create a new Master Battle entry
   *
   * @param startDate - Battle start date in EST
   * @private
   */
  private async createMasterBattle(startDate: Date): Promise<void> {
    // Generate Battle ID from EST start date
    const battleId = generateBattleIdFromEst(startDate);

    // Check if battle already exists
    const existingBattle = await this.prisma.masterBattle.findUnique({
      where: { battleId },
    });

    if (existingBattle) {
      this.logger.warn({ battleId }, 'Master Battle already exists - skipping creation');
      return;
    }

    // Calculate end timestamp (start + 2 days - 1 millisecond)
    // Battles last for 2 days (48 hours), ending at 23:59:59.999 on the second day
    // If start is Dec 15 00:00:00, end is Dec 16 23:59:59.999
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 1); // Go to second day
    endDate.setUTCHours(23, 59, 59, 999); // End of second day

    // Convert EST times to GMT for storage
    const startTimestampGmt = estToGmt(startDate);
    const endTimestampGmt = estToGmt(endDate);

    // Insert into MasterBattle table
    await this.prisma.masterBattle.create({
      data: {
        battleId,
        startTimestamp: startTimestampGmt,
        endTimestamp: endTimestampGmt,
        createdBy: null, // null indicates automatic creation
        notes: 'Automatically created by scheduler',
      },
    });

    this.logger.info(
      {
        battleId,
        startTimestamp: startTimestampGmt.toISOString(),
        endTimestamp: endTimestampGmt.toISOString(),
      },
      'Master Battle created successfully'
    );
  }

  /**
   * Update next battle start date in system settings
   *
   * @param newDate - New next battle start date (in EST)
   * @private
   */
  private async updateNextBattleDate(newDate: Date): Promise<void> {
    await this.prisma.systemSetting.upsert({
      where: { key: 'nextBattleStartDate' },
      update: {
        value: newDate.toISOString(),
        updatedAt: new Date(),
      },
      create: {
        key: 'nextBattleStartDate',
        value: newDate.toISOString(),
        description: 'Next scheduled battle start date (EST)',
        dataType: 'date',
      },
    });

    this.logger.debug({ newDate: newDate.toISOString() }, 'Next battle date updated in database');
  }

  /**
   * Get next battle start date from system settings
   *
   * @returns Next battle start date in EST, or null if not set
   * @private
   */
  private async getNextBattleStartDate(): Promise<Date | null> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: 'nextBattleStartDate' },
    });

    if (!setting || !setting.value) {
      return null;
    }

    return new Date(setting.value);
  }

  /**
   * Manually trigger battle creation (for testing or admin use)
   * This bypasses the time check and creates a battle for the given date
   *
   * @param startDate - Battle start date in EST
   * @returns The created battle ID
   */
  async manuallyCreateBattle(startDate: Date): Promise<string> {
    await this.createMasterBattle(startDate);
    const battleId = generateBattleIdFromEst(startDate);
    return battleId;
  }

  /**
   * Check if scheduler is enabled via system settings
   *
   * @returns true if scheduler should run, false otherwise
   */
  async isSchedulerEnabled(): Promise<boolean> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: 'schedulerEnabled' },
    });

    if (!setting || !setting.value) {
      // Default to true if setting not found
      return true;
    }

    return setting.value === 'true';
  }
}
