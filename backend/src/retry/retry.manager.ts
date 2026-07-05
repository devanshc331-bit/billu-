import { prisma } from '../storage/database.js';
import { logger } from '../logging/logger.js';
import { ActionEngine } from '../actions/action.engine.js';

const BACKOFF_TIMINGS_MS = [
  0,             // Attempt 1: Immediate
  30000,         // Attempt 2: 30 sec
  120000,        // Attempt 3: 2 min
  300000,        // Attempt 4: 5 min
  900000,        // Attempt 5: 15 min
];

export const RetryManager = {
  /**
   * Determine failure category based on error message content.
   */
  categorizeError(errorMessage: string): 'network' | 'timeout' | 'rate_limit' | 'server_error' | 'api_error' | 'auth' {
    const msg = errorMessage.toLowerCase();
    if (msg.includes('auth') || msg.includes('token') || msg.includes('credentials') || msg.includes('401')) {
      return 'auth';
    }
    if (msg.includes('rate limit') || msg.includes('429') || msg.includes('too many requests')) {
      return 'rate_limit';
    }
    if (msg.includes('timeout') || msg.includes('deadline exceeded')) {
      return 'timeout';
    }
    if (msg.includes('network') || msg.includes('dns') || msg.includes('econnrefused') || msg.includes('fetch failed')) {
      return 'network';
    }
    if (msg.includes('500') || msg.includes('server error') || msg.includes('502') || msg.includes('503')) {
      return 'server_error';
    }
    return 'api_error';
  },

  /**
   * Log job failure and queue it for retry.
   */
  async queueJobFailure(jobId: string, reason: string) {
    try {
      const job = await prisma.job.findUnique({ where: { id: jobId } });
      if (!job) return;

      const nextAttempt = job.retryCount + 1;
      const category = this.categorizeError(reason);

      if (nextAttempt >= job.maxRetries) {
        // Exceeded retries, mark job as dead
        await prisma.job.update({
          where: { id: jobId },
          data: { status: 'dead' },
        });

        await prisma.retryQueue.upsert({
          where: { jobId },
          update: {
            failureReason: reason,
            failureCategory: category,
            attemptNumber: nextAttempt,
            isDead: true,
            updatedAt: new Date(),
          },
          create: {
            jobId,
            failureReason: reason,
            failureCategory: category,
            attemptNumber: nextAttempt,
            nextRetryAt: new Date(),
            backoffMs: 0,
            isDead: true,
          },
        });

        logger.warn(`Job ${jobId} failed maximum attempts (${job.maxRetries}). Sent to Dead Letter Queue.`, { jobId, reason });
        return;
      }

      // Calculate exponential backoff
      const backoffMs = BACKOFF_TIMINGS_MS[nextAttempt] || 900000;
      const nextRetryAt = new Date(Date.now() + backoffMs);

      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'retrying',
          retryCount: nextAttempt,
          nextRetryAt,
        },
      });

      await prisma.retryQueue.upsert({
        where: { jobId },
        update: {
          failureReason: reason,
          failureCategory: category,
          attemptNumber: nextAttempt,
          nextRetryAt,
          backoffMs,
          updatedAt: new Date(),
        },
        create: {
          jobId,
          failureReason: reason,
          failureCategory: category,
          attemptNumber: nextAttempt,
          nextRetryAt,
          backoffMs,
        },
      });

      logger.info(`Job ${jobId} queued for retry #${nextAttempt} at ${nextRetryAt.toISOString()}`, { jobId, backoffMs });
    } catch (err) {
      logger.error('Failed to log job failure and queue retry', { error: String(err), jobId });
    }
  },

  /**
   * Run polling cycle to execute pending retries.
   */
  async processRetryQueue() {
    const now = new Date();
    
    try {
      const pendingRetries = await prisma.retryQueue.findMany({
        where: {
          isDead: false,
          nextRetryAt: { lte: now },
        },
        include: { job: true },
      });

      if (pendingRetries.length === 0) return;

      logger.info(`Discovered ${pendingRetries.length} pending retries in queue polling.`);

      for (const item of pendingRetries) {
        const job = item.job;
        if (!job) continue;

        logger.info(`Attempting retry execution for job: ${job.id} (Attempt #${item.attemptNumber})`);

        // Update status to running
        await prisma.job.update({
          where: { id: job.id },
          data: { status: 'running', startedAt: new Date() },
        });

        let customConfig = {};
        try {
          const payloadParsed = JSON.parse(job.payload || '{}');
          customConfig = payloadParsed.customConfig || {};
        } catch (_) {}

        // Remove from retry queue temporarily or we will delete upon completion/update on failure.
        // We trigger execution in action engine
        try {
          if (!job.emailId) {
            throw new Error('Email association missing on retry job');
          }
          await ActionEngine.executeApprovedAction(job.emailId, job.type, customConfig);
          
          // Successful, delete retry record
          await prisma.retryQueue.delete({ where: { id: item.id } });
          logger.info(`Retry succeeded for job ${job.id}. Removed from queue.`);
        } catch (err) {
          // If fail again, queueJobFailure will compute next backoff & increment attempt
          logger.warn(`Retry attempt #${item.attemptNumber} failed for job ${job.id}`);
        }
      }
    } catch (err) {
      logger.error('Error processing retry queue polling cycle', { error: String(err) });
    }
  }
};
