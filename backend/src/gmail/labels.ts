import { google } from 'googleapis';
import { env } from '../config/env.js';
import { logger } from '../logging/logger.js';

export const LabelService = {
  /**
   * List all user Gmail labels.
   */
  async listLabels(accessToken: string) {
    if (env.MOCK_MODE || accessToken.startsWith('mock_')) {
      logger.info('List Gmail labels (MOCK MODE).');
      return [
        { id: 'INBOX', name: 'INBOX', type: 'system' },
        { id: 'UNREAD', name: 'UNREAD', type: 'system' },
        { id: 'STARRED', name: 'STARRED', type: 'system' },
        { id: 'Receipts', name: 'Receipts', type: 'user' },
        { id: 'Newsletters', name: 'Newsletters', type: 'user' },
      ];
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    try {
      const response = await gmail.users.labels.list({ userId: 'me' });
      return response.data.labels || [];
    } catch (err) {
      logger.error('Failed to list Gmail labels', { error: String(err) });
      throw err;
    }
  },

  /**
   * Apply custom label to message.
   */
  async applyLabel(accessToken: string, messageId: string, labelName: string) {
    if (env.MOCK_MODE || accessToken.startsWith('mock_')) {
      logger.info(`Apply Gmail label "${labelName}" to message ${messageId} (MOCK MODE).`);
      return { success: true, labelName, messageId };
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    try {
      // 1. Check if the label exists, or create it
      const labelsRes = await gmail.users.labels.list({ userId: 'me' });
      const existingLabel = (labelsRes.data.labels || []).find(
        (l) => l.name?.toLowerCase() === labelName.toLowerCase()
      );

      let labelId = existingLabel?.id;

      if (!labelId) {
        logger.info(`Gmail label "${labelName}" not found. Creating it.`, { labelName });
        const createRes = await gmail.users.labels.create({
          userId: 'me',
          requestBody: {
            name: labelName,
            labelListVisibility: 'labelShow',
            messageListVisibility: 'show',
          },
        });
        labelId = createRes.data.id || undefined;
      }

      if (!labelId) {
        throw new Error(`Failed to create or retrieve label "${labelName}"`);
      }

      // 2. Add label to message
      await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: [labelId],
        },
      });

      logger.info(`Gmail label "${labelName}" successfully applied to message`, { messageId, labelId });
      return { success: true, labelId, labelName };
    } catch (err) {
      logger.error(`Failed to apply Gmail label "${labelName}" to message ${messageId}`, { error: String(err) });
      throw err;
    }
  },

  /**
   * Mark message as read (remove UNREAD label).
   */
  async markRead(accessToken: string, messageId: string) {
    if (env.MOCK_MODE || accessToken.startsWith('mock_')) {
      logger.info(`Mark Gmail message ${messageId} as read (MOCK MODE).`);
      return { success: true };
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    try {
      await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD'],
        },
      });
      logger.info(`Gmail message marked read successfully`, { messageId });
      return { success: true };
    } catch (err) {
      logger.error(`Failed to mark Gmail message ${messageId} as read`, { error: String(err) });
      throw err;
    }
  }
};
