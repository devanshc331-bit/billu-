import { prisma } from '../storage/database.js';
import { SyncService } from '../gmail/sync.service.js';
import { RetryManager } from '../retry/retry.manager.js';
import { logger } from '../logging/logger.js';

let schedulerIntervalId: NodeJS.Timeout | null = null;

// Track last run timestamps
let lastSyncTime = 0;
let lastRetryTime = 0;
let lastCleanupTime = 0;

export const SchedulerService = {
  /**
   * Start the scheduler.
   */
  start() {
    if (schedulerIntervalId) {
      logger.warn('Scheduler is already running.');
      return;
    }

    logger.info('⏰ Scheduler starting...');

    // Run startup jobs immediately in the background
    this.runStartupJobs();

    // Poll every 10 seconds to check if any scheduled job is due
    schedulerIntervalId = setInterval(() => {
      this.checkAndRunJobs();
    }, 10000);
  },

  /**
   * Stop the scheduler.
   */
  stop() {
    if (schedulerIntervalId) {
      clearInterval(schedulerIntervalId);
      schedulerIntervalId = null;
      logger.info('⏰ Scheduler stopped.');
    }
  },

  /**
   * Run initial jobs on startup.
   */
  async runStartupJobs() {
    logger.info('🚀 Running startup jobs...');
    
    // 1. Initial Sync
    try {
      await SyncService.syncEmails('usr_default');
    } catch (err) {
      logger.error('Startup sync failed', { error: String(err) });
    }

    // 2. Initial Retry processing
    try {
      await RetryManager.processRetryQueue();
    } catch (err) {
      logger.error('Startup retry processing failed', { error: String(err) });
    }

    const now = Date.now();
    lastSyncTime = now;
    lastRetryTime = now;
    lastCleanupTime = now;
  },

  /**
   * Poll and execute pending schedules.
   */
  async checkAndRunJobs() {
    const now = Date.now();
    const userId = 'usr_default';

    try {
      // Fetch current settings from database
      const settings = await prisma.settings.findUnique({
        where: { userId },
      });

      const syncIntervalMs = (settings?.syncInterval || 15) * 60000;
      const retryIntervalMs = (settings?.retryInterval || 5) * 60000;
      const cleanupIntervalMs = (settings?.cleanupInterval || 1440) * 60000;

      // 1. Check Inbox Sync
      if (now - lastSyncTime >= syncIntervalMs) {
        lastSyncTime = now;
        logger.info('⏰ Scheduled Sync triggered.');
        SyncService.syncEmails(userId).catch(err => {
          logger.error('Scheduled Sync failed', { error: String(err) });
        });
      }

      // 2. Check Retry processing
      if (now - lastRetryTime >= retryIntervalMs) {
        lastRetryTime = now;
        logger.info('⏰ Scheduled Retry Queue processing triggered.');
        RetryManager.processRetryQueue().catch(err => {
          logger.error('Scheduled Retry Queue failed', { error: String(err) });
        });
      }

      // 3. Check Daily Cleanup
      if (now - lastCleanupTime >= cleanupIntervalMs) {
        lastCleanupTime = now;
        logger.info('⏰ Scheduled database cleanup triggered.');
        this.runCleanup().catch(err => {
          logger.error('Scheduled database cleanup failed', { error: String(err) });
        });
      }

    } catch (err) {
      logger.error('Scheduler checks encountered an error', { error: String(err) });
    }
  },

  /**
   * Periodic database maintenance cleanup.
   */
  async runCleanup() {
    logger.info('Running database cleanup...');
    const startedAt = new Date();

    const runHistory = await prisma.runHistory.create({
      data: {
        runType: 'cleanup',
        status: 'running',
        startedAt,
      },
    });

    try {
      // Delete completed jobs older than 14 days to keep DB clean
      const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      
      const deletedJobs = await prisma.job.deleteMany({
        where: {
          status: 'completed',
          completedAt: { lt: cutoff },
        },
      });

      const deletedHistory = await prisma.runHistory.deleteMany({
        where: {
          status: 'completed',
          completedAt: { lt: cutoff },
        },
      });

      const completedAt = new Date();
      await prisma.runHistory.update({
        where: { id: runHistory.id },
        data: {
          status: 'completed',
          completedAt,
          details: JSON.stringify({
            message: `Cleanup completed. Deleted ${deletedJobs.count} completed jobs and ${deletedHistory.count} run logs older than 14 days.`,
          }),
        },
      });

      logger.info('Database cleanup completed successfully.');
    } catch (err) {
      logger.error('Database cleanup failed', { error: String(err) });
      const completedAt = new Date();
      await prisma.runHistory.update({
        where: { id: runHistory.id },
        data: {
          status: 'failed',
          completedAt,
          errors: 1,
          details: JSON.stringify({ error: String(err) }),
        },
      });
    }
  }
};
