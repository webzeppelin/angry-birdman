/**
 * Fastify plugin for battle scheduler
 *
 * Initializes and manages the cron job for automatic battle creation.
 * Runs hourly to check if new battles need to be created.
 *
 * The scheduler:
 * - Checks current time against next scheduled battle date
 * - Creates new MasterBattle entries when due
 * - Updates the next battle date automatically
 * - Respects the BATTLE_SCHEDULER_ENABLED environment variable
 *
 * @module plugins/scheduler
 */

import fp from 'fastify-plugin';
import cron from 'node-cron';

import { BattleSchedulerService } from '../services/battleScheduler.service.js';

import type { FastifyPluginAsync } from 'fastify';

/**
 * Scheduler plugin configuration
 */
const schedulerPlugin: FastifyPluginAsync = async (fastify) => {
  // Check if scheduler is enabled via environment variable
  const schedulerEnabled = process.env.BATTLE_SCHEDULER_ENABLED !== 'false';

  if (!schedulerEnabled) {
    fastify.log.info(
      'Battle scheduler is disabled via BATTLE_SCHEDULER_ENABLED environment variable'
    );
    return;
  }

  // Initialize scheduler service
  const schedulerService = new BattleSchedulerService(fastify.prisma, fastify.log);

  // Check database setting for scheduler enabled status
  const isEnabled = await schedulerService.isSchedulerEnabled();

  if (!isEnabled) {
    fastify.log.info('Battle scheduler is disabled in system settings');
    return;
  }

  // Define cron schedule: run every hour at minute 0
  // Format: minute hour day month dayOfWeek
  // '0 * * * *' = At minute 0 of every hour
  const cronSchedule = '0 * * * *';

  fastify.log.info({ cronSchedule }, 'Initializing battle scheduler');

  // Create scheduled task
  const task = cron.schedule(
    cronSchedule,
    async () => {
      try {
        fastify.log.info('Battle scheduler: Starting scheduled check');
        await schedulerService.checkAndCreateBattle();
        fastify.log.info('Battle scheduler: Scheduled check completed');
      } catch (error) {
        fastify.log.error({ error }, 'Battle scheduler: Error during scheduled check');
        // Don't throw - we want the scheduler to continue running
        // The next scheduled run will try again
      }
    },
    {
      timezone: 'America/New_York', // EST/EDT timezone for cron scheduling
    }
  );

  // Start the scheduled task (returns void, but eslint thinks it might return a promise)
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  task.start();

  // Graceful shutdown
  fastify.addHook('onClose', () => {
    fastify.log.info('Stopping battle scheduler');
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    task.stop();
  });

  // Run once on startup in development mode
  // This helps with testing and ensures immediate execution
  if (process.env.NODE_ENV === 'development') {
    fastify.log.info('Development mode: Running battle scheduler check immediately');
    // Intentionally fire-and-forget - we don't want to block plugin initialization
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      try {
        await schedulerService.checkAndCreateBattle();
        fastify.log.info('Development mode: Initial scheduler check completed');
      } catch (error) {
        fastify.log.error({ error }, 'Development mode: Error in initial scheduler check');
      }
    })();
  }

  // Decorate fastify instance with scheduler service for manual operations if needed
  fastify.decorate('battleScheduler', schedulerService);

  fastify.log.info(
    {
      cronSchedule,
      timezone: 'America/New_York',
    },
    'Battle scheduler initialized and running'
  );
};

// Extend Fastify's type system to include battleScheduler
declare module 'fastify' {
  interface FastifyInstance {
    battleScheduler: BattleSchedulerService;
  }
}

// Export plugin with fastify-plugin for proper encapsulation
export default fp(schedulerPlugin, {
  name: 'scheduler',
  dependencies: ['database'], // Requires database plugin to be registered first
});
