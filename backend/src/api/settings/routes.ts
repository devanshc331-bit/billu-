import { Router, Request, Response } from 'express';
import { prisma } from '../../storage/database.js';
import { logger } from '../../logging/logger.js';
import { env } from '../../config/env.js';

const router = Router();
const userId = 'usr_default';

/**
 * GET /api/settings
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const settings = await prisma.settings.findUnique({
      where: { userId },
    });
    res.json(settings);
  } catch (err) {
    logger.error('Failed to get settings', { error: String(err) });
    res.status(500).json({ error: 'settings_get_error', message: 'Failed to retrieve settings' });
  }
});

/**
 * PUT /api/settings
 */
router.put('/', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    
    // Whitelist settings updates
    const updated = await prisma.settings.update({
      where: { userId },
      data: {
        syncInterval: data.syncInterval !== undefined ? parseInt(data.syncInterval) : undefined,
        retryInterval: data.retryInterval !== undefined ? parseInt(data.retryInterval) : undefined,
        cleanupInterval: data.cleanupInterval !== undefined ? parseInt(data.cleanupInterval) : undefined,
        digestTime: data.digestTime || undefined,
        defaultCategory: data.defaultCategory || undefined,
        retryLimit: data.retryLimit !== undefined ? parseInt(data.retryLimit) : undefined,
        confidenceThresholdAuto: data.confidenceThresholdAuto !== undefined ? parseInt(data.confidenceThresholdAuto) : undefined,
        confidenceThresholdReview: data.confidenceThresholdReview !== undefined ? parseInt(data.confidenceThresholdReview) : undefined,
        notificationsEnabled: data.notificationsEnabled !== undefined ? Boolean(data.notificationsEnabled) : undefined,
        theme: data.theme || undefined,
        fontSize: data.fontSize !== undefined ? parseInt(data.fontSize) : undefined,
        notionApiKey: data.notionApiKey !== undefined ? data.notionApiKey : undefined,
        notionDatabaseId: data.notionDatabaseId !== undefined ? data.notionDatabaseId : undefined,
        calendarEnabled: data.calendarEnabled !== undefined ? Boolean(data.calendarEnabled) : undefined,
      },
    });

    logger.info('Settings updated successfully', { userId });
    res.json(updated);
  } catch (err) {
    logger.error('Failed to update settings', { error: String(err) });
    res.status(500).json({ error: 'settings_update_error', message: 'Failed to update settings' });
  }
});

/**
 * GET /api/settings/integrations/notion/status
 */
router.get('/notion/status', async (req: Request, res: Response) => {
  try {
    const settings = await prisma.settings.findUnique({ where: { userId } });
    const isConfigured = Boolean(settings?.notionApiKey && settings?.notionDatabaseId) || Boolean(env.NOTION_API_KEY && env.NOTION_DATABASE_ID);
    
    res.json({
      connected: isConfigured,
      databaseId: settings?.notionDatabaseId || env.NOTION_DATABASE_ID || null,
      workspaceName: isConfigured ? 'Connected Notion Workspace' : null,
    });
  } catch (err) {
    res.status(500).json({ error: 'notion_status_failed', message: 'Failed to check Notion status.' });
  }
});

/**
 * GET /api/settings/integrations/calendar/status
 */
router.get('/calendar/status', async (req: Request, res: Response) => {
  try {
    const settings = await prisma.settings.findUnique({ where: { userId } });
    const isConfigured = Boolean(settings?.calendarEnabled || env.MOCK_MODE);
    
    res.json({
      connected: isConfigured,
      primaryCalendar: isConfigured ? 'primary' : null,
    });
  } catch (err) {
    res.status(500).json({ error: 'calendar_status_failed', message: 'Failed to check Calendar status.' });
  }
});

export default router;
