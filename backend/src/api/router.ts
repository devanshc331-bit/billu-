import { Router } from 'express';
import authRouter from '../auth/routes.js';
import settingsRouter from './settings/routes.js';
import dashboardRouter from './dashboard/routes.js';
import { SyncService } from '../gmail/sync.service.js';
import { logger } from '../logging/logger.js';

const router = Router();

// Mount modules
router.use('/auth', authRouter);
router.use('/settings', settingsRouter);
router.use('/', dashboardRouter); // Maps /emails, /review, /rules, /dashboard/*, etc.

/**
 * POST /api/sync/trigger
 */
router.post('/sync/trigger', async (req, res) => {
  try {
    const result = await SyncService.syncEmails('usr_default', true);
    res.json(result);
  } catch (err) {
    logger.error('Failed manual sync trigger API call', { error: String(err) });
    res.status(500).json({ error: 'sync_trigger_failed', message: String(err) });
  }
});

export default router;
