import { prisma } from '../storage/database.js';
import { GmailClient } from './client.js';
import { MessageNormalizer } from './normalizer.js';
import { logger } from '../logging/logger.js';
import { writeAuditLog } from '../logging/audit.js';
import { ClassifierEngine } from '../classifier/engine.js';

export const SyncService = {
  /**
   * Synchronize unread emails.
   */
  async syncEmails(userId: string = 'usr_default', isManual: boolean = false) {
    const startedAt = new Date();
    
    // Create a run history record to mark start
    const runHistory = await prisma.runHistory.create({
      data: {
        runType: 'sync',
        status: 'running',
        startedAt,
      },
    });

    logger.info('Starting email sync cycle...', { runId: runHistory.id, userId });

    let emailsProcessed = 0;
    let tasksCreated = 0;
    let eventsCreated = 0;
    let errorsCount = 0;
    const errorsList: string[] = [];

    try {
      // 1. Get tokens
      const tokenRecord = await prisma.oAuthToken.findUnique({
        where: { userId },
      });

      if (!tokenRecord) {
        throw new Error('Sync cancelled: Google account is not connected. Connect OAuth credentials.');
      }

      // Check if expired and refresh is done inside GmailClient / validateToken flow.
      // For simplicity, decrypt token here.
      // Wait, we can use TokenManager.getTokens(userId) which auto-refreshes or decrypts.
      // To bypass middleware in scheduler, let's load tokens using TokenManager
      const { TokenManager } = await import('../auth/token.manager.js');
      const tokens = await TokenManager.getTokens(userId);
      if (!tokens) {
        throw new Error('Sync cancelled: OAuth token record could not be parsed.');
      }

      const client = new GmailClient(tokens.accessToken);

      // 2. Fetch recent messages
      // We search for is:unread messages
      const listResult = await client.listMessages({ q: 'is:unread', maxResults: 50 });
      const messages = listResult.messages;

      logger.info(`Discovered ${messages.length} messages in Gmail fetch`, { runId: runHistory.id });

      // 3. Process each message
      for (const msg of messages) {
        try {
          // Check for duplicate in DB
          const existing = await prisma.email.findUnique({
            where: { messageId: msg.id },
          });

          if (existing) {
            // Already synced, skip to prevent duplicates
            continue;
          }

          // Fetch full body
          const rawMessage = await client.getMessage(msg.id);
          
          // Normalize
          const normalized = MessageNormalizer.normalize(rawMessage);

          // Save Email record in DB
          const savedEmail = await prisma.email.create({
            data: {
              ...normalized,
              status: 'normalized',
            },
          });

          emailsProcessed++;

          // Write initial audit log
          await writeAuditLog({
            emailId: savedEmail.id,
            action: 'fetch',
            fromState: null,
            toState: 'fetched',
            actor: 'system',
            details: { message: 'Fetched raw message from Gmail API' },
          });

          await writeAuditLog({
            emailId: savedEmail.id,
            action: 'normalize',
            fromState: 'fetched',
            toState: 'normalized',
            actor: 'system',
            details: { message: 'Normalized message headers and body parts' },
          });

          // Trigger classification
          const classificationResult = await ClassifierEngine.classifyEmail(savedEmail.id);
          
          if (classificationResult.recommendedAction === 'CREATE_NOTION_TASK' && classificationResult.isApproved) {
            tasksCreated++;
          } else if (classificationResult.recommendedAction === 'CREATE_CALENDAR_REMINDER' && classificationResult.isApproved) {
            eventsCreated++;
          }

        } catch (err) {
          errorsCount++;
          const errMsg = `Error syncing message ${msg.id}: ${String(err)}`;
          logger.error(errMsg);
          errorsList.push(errMsg);
        }
      }

      // Update RunHistory as completed
      const completedAt = new Date();
      const duration = completedAt.getTime() - startedAt.getTime();

      await prisma.runHistory.update({
        where: { id: runHistory.id },
        data: {
          status: errorsCount > 0 && emailsProcessed === 0 ? 'failed' : 'completed',
          completedAt,
          emailsProcessed,
          tasksCreated,
          eventsCreated,
          errors: errorsCount,
          duration,
          details: JSON.stringify({
            message: `Sync cycle completed. Processed ${emailsProcessed} emails.`,
            errors: errorsList,
          }),
        },
      });

      logger.info(`Sync cycle completed successfully in ${duration}ms.`, {
        runId: runHistory.id,
        emailsProcessed,
        errorsCount,
      });

      return {
        success: true,
        emailsProcessed,
        tasksCreated,
        eventsCreated,
        errors: errorsCount,
      };

    } catch (error) {
      errorsCount++;
      const errMsg = `Sync failure: ${String(error)}`;
      logger.error(errMsg);
      errorsList.push(errMsg);

      const completedAt = new Date();
      const duration = completedAt.getTime() - startedAt.getTime();

      await prisma.runHistory.update({
        where: { id: runHistory.id },
        data: {
          status: 'failed',
          completedAt,
          errors: errorsCount,
          duration,
          details: JSON.stringify({
            message: 'Sync run crashed.',
            errors: errorsList,
          }),
        },
      });

      return {
        success: false,
        error: String(error),
      };
    }
  }
};
