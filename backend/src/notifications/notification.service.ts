import { logger } from '../logging/logger.js';

export const NotificationService = {
  /**
   * Helper simulating backend notification broadcast.
   */
  notify(title: string, message: string, type: 'task' | 'calendar' | 'sync_fail' | 'oauth_expired' | 'success' | 'review') {
    logger.info(`[NOTIFICATION BROADCAST] Title: "${title}", Message: "${message}", Type: "${type}"`);
    // Local-first Web App uses polling or SSE to show actual web UI notifications
    return { success: true, timestamp: new Date() };
  }
};
