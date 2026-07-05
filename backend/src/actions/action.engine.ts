import { prisma } from '../storage/database.js';
import { NotionService } from './notion.service.js';
import { CalendarService } from './calendar.service.js';
import { LabelService } from '../gmail/labels.js';
import { logger } from '../logging/logger.js';
import { writeAuditLog } from '../logging/audit.js';

export const ActionEngine = {
  /**
   * Execute an approved action on an email (e.g. creating Notion page, Google Calendar invite, etc.)
   */
  async executeApprovedAction(emailId: string, actionType: string, customConfig: any = {}) {
    const userId = 'usr_default';
    logger.info(`ActionEngine triggered for action: ${actionType} on email: ${emailId}`);

    // 1. Create a Job entry in the database
    const job = await prisma.job.create({
      data: {
        type: actionType,
        status: 'running',
        emailId,
        payload: JSON.stringify({ customConfig }),
        startedAt: new Date(),
      },
    });

    try {
      // 2. Fetch email data and user settings
      const email = await prisma.email.findUnique({ where: { id: emailId } });
      const settings = await prisma.settings.findUnique({ where: { userId } });
      const tokenRecord = await prisma.oAuthToken.findUnique({ where: { userId } });

      if (!email) throw new Error(`Email not found: ${emailId}`);
      if (!settings) throw new Error(`User settings not found for userId: ${userId}`);

      const { TokenManager } = await import('../auth/token.manager.js');
      const decryptedTokens = tokenRecord ? await TokenManager.getTokens(userId) : null;
      const accessToken = decryptedTokens?.accessToken || null;

      let resultPayload: any = {};

      // 3. Dispatch based on Action type
      switch (actionType) {
        case 'CREATE_NOTION_TASK': {
          const apiKey = settings.notionApiKey || process.env.NOTION_API_KEY || null;
          const databaseId = settings.notionDatabaseId || process.env.NOTION_DATABASE_ID || null;

          if (!apiKey || !databaseId) {
            throw new Error('Notion integration credentials are not configured. Update Settings.');
          }

          // Parse features (deadline, priority, tags)
          let features: any = {};
          try {
            const classification = await prisma.classification.findFirst({
              where: { emailId },
              orderBy: { createdAt: 'desc' },
            });
            if (classification?.features) {
              features = JSON.parse(classification.features);
            }
          } catch (_) {}

          let dueDate: Date | null = null;
          if (features.detectedDates && features.detectedDates.length > 0) {
            dueDate = new Date(features.detectedDates[0]);
            // If date parse invalid, default to null
            if (isNaN(dueDate.getTime())) dueDate = null;
          }

          // Determine priority mapping
          let priorityVal: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
          const rulePriority = customConfig.taskPriority;
          if (rulePriority) {
            priorityVal = rulePriority;
          } else if (email.priorityScore > 75) {
            priorityVal = 'high';
          } else if (email.priorityScore < 30) {
            priorityVal = 'low';
          }

          resultPayload = await NotionService.createTask(apiKey, databaseId, {
            title: email.subject || 'Action Item from Email',
            description: email.snippet || '',
            emailUrl: `https://mail.google.com/mail/u/0/#inbox/${email.threadId || email.messageId}`,
            dueDate,
            priority: priorityVal,
            labels: [email.senderEmail.split('@')[1] || 'Triage', 'Email'],
            sender: email.senderEmail,
            notes: `Sender Name: ${email.senderName || 'Unknown'}\nReceived At: ${new Date(email.receivedAt).toLocaleString()}`,
          });

          // Save Notion task record
          await prisma.notionTask.create({
            data: {
              emailId,
              notionPageId: resultPayload.id,
              title: email.subject || 'Action Item from Email',
              description: email.snippet,
              emailUrl: `https://mail.google.com/mail/u/0/#inbox/${email.threadId || email.messageId}`,
              dueDate,
              priority: priorityVal,
              status: 'todo',
              labels: JSON.stringify(['Email']),
              sender: email.senderEmail,
              notes: resultPayload.url,
              databaseId,
            },
          });
          break;
        }

        case 'CREATE_CALENDAR_REMINDER': {
          if (!settings.calendarEnabled && !process.env.MOCK_MODE) {
            throw new Error('Google Calendar integration is disabled in user Settings.');
          }

          let features: any = {};
          try {
            const classification = await prisma.classification.findFirst({
              where: { emailId },
              orderBy: { createdAt: 'desc' },
            });
            if (classification?.features) {
              features = JSON.parse(classification.features);
            }
          } catch (_) {}

          let startTime = new Date(Date.now() + 3600000 * 24); // default tomorrow
          if (features.detectedDates && features.detectedDates.length > 0) {
            const parsed = new Date(features.detectedDates[0]);
            if (!isNaN(parsed.getTime())) startTime = parsed;
          }

          resultPayload = await CalendarService.createEvent(accessToken, {
            title: `Reminder: ${email.subject || 'Email Follow-up'}`,
            description: email.snippet || '',
            startTime,
            durationMinutes: customConfig.reminderMinutes || 30,
            emailLink: `https://mail.google.com/mail/u/0/#inbox/${email.threadId || email.messageId}`,
          });

          // Save event record
          await prisma.calendarEvent.create({
            data: {
              emailId,
              googleEventId: resultPayload.id,
              type: 'reminder',
              title: `Reminder: ${email.subject || 'Email Follow-up'}`,
              description: email.snippet,
              reminderTime: startTime,
              sourceEmail: email.senderEmail,
            },
          });
          break;
        }

        case 'APPLY_GMAIL_LABEL': {
          const labelName = customConfig.labelName || 'Triaged';
          if (!accessToken) {
            throw new Error('Gmail API credentials unavailable for labeling action.');
          }

          resultPayload = await LabelService.applyLabel(accessToken, email.messageId, labelName);
          break;
        }

        case 'MARK_READ': {
          if (!accessToken) {
            throw new Error('Gmail API credentials unavailable for marking read.');
          }

          resultPayload = await LabelService.markRead(accessToken, email.messageId);
          break;
        }

        default:
          throw new Error(`Unsupported action type: ${actionType}`);
      }

      // 4. Update job as completed
      const now = new Date();
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          result: JSON.stringify(resultPayload),
          completedAt: now,
        },
      });

      // Write JobLog
      await prisma.jobLog.create({
        data: {
          jobId: job.id,
          level: 'info',
          message: `Successfully executed action: ${actionType}`,
          data: JSON.stringify(resultPayload),
          duration: now.getTime() - job.startedAt!.getTime(),
        },
      });

      // Update email status
      await prisma.email.update({
        where: { id: emailId },
        data: { status: 'completed' },
      });

      // Write Audit log
      await writeAuditLog({
        emailId,
        jobId: job.id,
        action: 'execute',
        fromState: 'approved',
        toState: 'completed',
        actor: 'system',
        details: { actionType, result: resultPayload },
      });

      logger.info(`Successfully completed action execution for email ${emailId}`);

    } catch (err) {
      // 5. Handle failure
      const errorMsg = String(err);
      const now = new Date();
      logger.error(`Action execution failed: ${errorMsg}`, { emailId, jobId: job.id });

      // Update Job status
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          error: errorMsg,
          completedAt: now,
        },
      });

      // Write JobLog error
      await prisma.jobLog.create({
        data: {
          jobId: job.id,
          level: 'error',
          message: `Action execution failed: ${errorMsg}`,
          duration: now.getTime() - job.startedAt!.getTime(),
        },
      });

      // Queue in RetryQueue
      const { RetryManager } = await import('../retry/retry.manager.js');
      await RetryManager.queueJobFailure(job.id, errorMsg);
    }
  }
};
