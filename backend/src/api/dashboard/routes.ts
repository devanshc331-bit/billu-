import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../../storage/database.js';
import { logger } from '../../logging/logger.js';
import { writeAuditLog } from '../../logging/audit.js';
import { SearchService } from '../../search/search.service.js';
import { ClassifierEngine } from '../../classifier/engine.js';
import { ActionEngine } from '../../actions/action.engine.js';

const router = Router();
const userId = 'usr_default';

/**
 * GET /api/dashboard/overview
 */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const unreadCount = await prisma.email.count({ where: { isRead: false } });
    
    // Processed today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const processedToday = await prisma.email.count({
      where: {
        status: 'completed',
        updatedAt: { gte: startOfToday },
      },
    });

    const tasksCreated = await prisma.notionTask.count();
    const meetingsCreated = await prisma.calendarEvent.count();
    const failedJobs = await prisma.job.count({ where: { status: { in: ['failed', 'dead'] } } });
    const pendingApprovals = await prisma.email.count({ where: { status: 'classified' } });

    // Average confidence
    const confidenceAggr = await prisma.classification.aggregate({
      _avg: { confidenceScore: true },
    });
    const avgConfidence = Math.round(confidenceAggr._avg.confidenceScore || 0);

    // Sync durations
    const syncRuns = await prisma.runHistory.findMany({
      where: { runType: 'sync', status: 'completed' },
      orderBy: { startedAt: 'desc' },
      take: 5,
    });
    const syncDurations = syncRuns.map(r => r.duration || 0).reverse();

    res.json({
      unreadEmailsCount: unreadCount,
      unreadEmailsTrend: -12, // mock trend
      processedTodayCount: processedToday,
      processedTodayHourly: [2, 4, 3, 5, 8, 12, 6, 8, 4, 3, 2, 5], // mock sparkline
      tasksCreatedCount: tasksCreated,
      meetingsCreatedCount: meetingsCreated,
      failedJobsCount: failedJobs,
      pendingApprovalsCount: pendingApprovals,
      averageConfidenceScore: avgConfidence,
      syncDurations: syncDurations.length > 0 ? syncDurations : [1200, 1800, 1500, 2200, 1900],
    });
  } catch (err) {
    logger.error('Failed to load dashboard overview stats', { error: String(err) });
    res.status(500).json({ error: 'overview_load_failed', message: 'Failed to load stats.' });
  }
});

/**
 * GET /api/dashboard/activity
 */
router.get('/activity', async (req: Request, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const formatted = logs.map(l => {
      let icon = 'Info';
      if (l.action === 'fetch') icon = 'Download';
      if (l.action === 'classify') icon = 'GitBranch';
      if (l.action === 'approve') icon = 'CheckCircle';
      if (l.action === 'execute') icon = 'Zap';
      if (l.action === 'disconnect_account') icon = 'Unlock';
      if (l.action === 'connect_account') icon = 'Lock';

      let detailsParsed = {};
      try {
        detailsParsed = l.details ? JSON.parse(l.details) : {};
      } catch (_) {}

      return {
        id: l.id,
        timestamp: l.createdAt.toISOString(),
        type: l.action,
        message: `${l.action.toUpperCase()} action performed by ${l.actor}.`,
        iconName: icon,
        metadata: detailsParsed,
      };
    });

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'activity_load_failed' });
  }
});

/**
 * GET /api/dashboard/run-history
 */
router.get('/run-history', async (req: Request, res: Response) => {
  try {
    const history = await prisma.runHistory.findMany({
      orderBy: { startedAt: 'desc' },
      take: 10,
    });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'run_history_failed' });
  }
});

/**
 * GET /api/emails (Paginated, filterable)
 */
router.get('/emails', async (req: Request, res: Response) => {
  try {
    const emails = await SearchService.searchEmails({
      query: req.query.query?.toString(),
      category: req.query.category?.toString(),
      status: req.query.status?.toString(),
      isStarred: req.query.isStarred === 'true' ? true : req.query.isStarred === 'false' ? false : undefined,
      isRead: req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined,
    });

    const formatted = emails.map(e => {
      const classification = e.classifications[0] || null;
      return {
        id: e.id,
        senderName: e.senderName,
        senderEmail: e.senderEmail,
        subject: e.subject,
        snippet: e.snippet,
        receivedAt: e.receivedAt,
        importance: e.importance,
        isRead: e.isRead,
        isStarred: e.isStarred,
        status: e.status,
        category: classification?.category || 'Unknown',
        confidenceScore: classification?.confidenceScore || 0,
        recommendedAction: classification?.recommendedAction || null,
      };
    });

    res.json(formatted);
  } catch (err) {
    logger.error('Failed to query emails', { error: String(err) });
    res.status(500).json({ error: 'emails_query_failed' });
  }
});

/**
 * GET /api/emails/:id
 */
router.get('/emails/:id', async (req: Request, res: Response) => {
  try {
    const email = await prisma.email.findUnique({
      where: { id: req.params.id },
      include: {
        classifications: true,
        auditLogs: { orderBy: { createdAt: 'desc' } },
        jobs: { include: { jobLogs: true } },
      },
    });

    if (!email) {
      return res.status(404).json({ error: 'email_not_found', message: 'Email not found.' });
    }

    // Load linked integration tasks
    const notionTask = await prisma.notionTask.findUnique({ where: { emailId: email.id } });
    const calendarEvent = await prisma.calendarEvent.findUnique({ where: { emailId: email.id } });

    res.json({
      ...email,
      notionTask,
      calendarEvent,
    });
  } catch (err) {
    res.status(500).json({ error: 'email_detail_failed' });
  }
});

/**
 * POST /api/emails/:id/classify (manual trigger)
 */
router.post('/emails/:id/classify', async (req: Request, res: Response) => {
  try {
    const classification = await ClassifierEngine.classifyEmail(req.params.id);
    res.json(classification);
  } catch (err) {
    logger.error('Failed manual classification trigger', { error: String(err) });
    res.status(500).json({ error: 'classification_failed', message: String(err) });
  }
});

/**
 * GET /api/review (pending approvals list)
 */
router.get('/review', async (req: Request, res: Response) => {
  try {
    const emails = await prisma.email.findMany({
      where: { status: 'classified' },
      include: {
        classifications: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { receivedAt: 'desc' },
    });

    const formatted = emails.map(e => {
      const classification = e.classifications[0] || null;
      return {
        id: e.id,
        senderName: e.senderName,
        senderEmail: e.senderEmail,
        subject: e.subject,
        snippet: e.snippet,
        receivedAt: e.receivedAt,
        category: classification?.category || 'Unknown',
        confidenceScore: classification?.confidenceScore || 0,
        recommendedAction: classification?.recommendedAction || null,
        isStarred: e.isStarred,
        isRead: e.isRead,
      };
    });

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'review_load_failed' });
  }
});

/**
 * POST /api/review/:id/approve
 */
router.post('/review/:id/approve', async (req: Request, res: Response) => {
  const emailId = req.params.id;

  try {
    const classification = await prisma.classification.findFirst({
      where: { emailId },
      orderBy: { createdAt: 'desc' },
    });

    if (!classification) {
      return res.status(404).json({ error: 'classification_missing', message: 'No classification prediction exists for this email.' });
    }

    // Approve the classification in DB
    await prisma.classification.update({
      where: { id: classification.id },
      data: {
        isApproved: true,
        approvedBy: 'user',
        approvedAt: new Date(),
      },
    });

    await prisma.email.update({
      where: { id: emailId },
      data: { status: 'approved' },
    });

    await writeAuditLog({
      emailId,
      action: 'approve',
      fromState: 'classified',
      toState: 'approved',
      actor: 'user',
      details: { action: classification.recommendedAction },
    });

    // Fire execution job asynchronously
    if (classification.recommendedAction) {
      ActionEngine.executeApprovedAction(emailId, classification.recommendedAction).catch(err => {
        logger.error('Failed approved action execution background flow', { error: String(err) });
      });
    }

    res.json({ success: true, message: 'Action recommendation approved successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'approve_failed', message: String(err) });
  }
});

/**
 * POST /api/review/:id/reject
 */
router.post('/review/:id/reject', async (req: Request, res: Response) => {
  const emailId = req.params.id;

  try {
    const email = await prisma.email.update({
      where: { id: emailId },
      data: { status: 'completed' },
    });

    await writeAuditLog({
      emailId,
      action: 'reject',
      fromState: 'classified',
      toState: 'completed',
      actor: 'user',
      details: { message: 'User rejected the recommendation action' },
    });

    res.json({ success: true, message: 'Triage recommendation dismissed.' });
  } catch (err) {
    res.status(500).json({ error: 'reject_failed' });
  }
});

/**
 * POST /api/review/:id/edit (Modify prediction and action before approval)
 */
router.post('/review/:id/edit', async (req: Request, res: Response) => {
  const emailId = req.params.id;
  const { category, recommendedAction } = req.body;

  try {
    const classification = await prisma.classification.findFirst({
      where: { emailId },
      orderBy: { createdAt: 'desc' },
    });

    if (!classification) {
      return res.status(404).json({ error: 'classification_missing' });
    }

    // Update classification, approve, and execute
    await prisma.classification.update({
      where: { id: classification.id },
      data: {
        category,
        recommendedAction,
        isApproved: true,
        approvedBy: 'user',
        approvedAt: new Date(),
      },
    });

    await prisma.email.update({
      where: { id: emailId },
      data: { status: 'approved' },
    });

    await writeAuditLog({
      emailId,
      action: 'edit_approve',
      fromState: 'classified',
      toState: 'approved',
      actor: 'user',
      details: { originalCategory: classification.category, originalAction: classification.recommendedAction, category, recommendedAction },
    });

    if (recommendedAction) {
      ActionEngine.executeApprovedAction(emailId, recommendedAction).catch(err => {
        logger.error('Failed modified action execution flow', { error: String(err) });
      });
    }

    res.json({ success: true, message: 'Triage action modified and approved successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'edit_approve_failed' });
  }
});

/**
 * POST /api/review/bulk-approve
 */
router.post('/review/bulk-approve', async (req: Request, res: Response) => {
  const { emailIds } = req.body;
  if (!emailIds || !Array.isArray(emailIds)) {
    return res.status(400).json({ error: 'invalid_params' });
  }

  try {
    for (const emailId of emailIds) {
      const classification = await prisma.classification.findFirst({
        where: { emailId },
        orderBy: { createdAt: 'desc' },
      });
      if (classification) {
        await prisma.classification.update({
          where: { id: classification.id },
          data: { isApproved: true, approvedBy: 'user', approvedAt: new Date() },
        });
        await prisma.email.update({
          where: { id: emailId },
          data: { status: 'approved' },
        });
        await writeAuditLog({
          emailId,
          action: 'approve',
          fromState: 'classified',
          toState: 'approved',
          actor: 'user',
          details: { action: classification.recommendedAction, note: 'Bulk approved' },
        });
        if (classification.recommendedAction) {
          ActionEngine.executeApprovedAction(emailId, classification.recommendedAction).catch(() => {});
        }
      }
    }
    res.json({ success: true, count: emailIds.length });
  } catch (err) {
    res.status(500).json({ error: 'bulk_approve_failed' });
  }
});

/**
 * POST /api/review/bulk-reject
 */
router.post('/review/bulk-reject', async (req: Request, res: Response) => {
  const { emailIds } = req.body;
  if (!emailIds || !Array.isArray(emailIds)) {
    return res.status(400).json({ error: 'invalid_params' });
  }

  try {
    for (const emailId of emailIds) {
      await prisma.email.update({
        where: { id: emailId },
        data: { status: 'completed' },
      });
      await writeAuditLog({
        emailId,
        action: 'reject',
        fromState: 'classified',
        toState: 'completed',
        actor: 'user',
        details: { note: 'Bulk rejected' },
      });
    }
    res.json({ success: true, count: emailIds.length });
  } catch (err) {
    res.status(500).json({ error: 'bulk_reject_failed' });
  }
});

/**
 * GET /api/rules
 */
router.get('/rules', async (req: Request, res: Response) => {
  try {
    const rules = await prisma.rule.findMany({ orderBy: { priority: 'desc' } });
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: 'rules_failed' });
  }
});

/**
 * POST /api/rules
 */
router.post('/rules', async (req: Request, res: Response) => {
  const { name, description, priority, conditions, actions, isActive } = req.body;
  try {
    const rule = await prisma.rule.create({
      data: {
        name,
        description,
        priority: priority ? parseInt(priority) : 0,
        conditions: JSON.stringify(conditions),
        actions: JSON.stringify(actions),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });
    res.json(rule);
  } catch (err) {
    res.status(500).json({ error: 'rule_create_failed' });
  }
});

/**
 * PUT /api/rules/:id
 */
router.put('/rules/:id', async (req: Request, res: Response) => {
  const { name, description, priority, conditions, actions, isActive } = req.body;
  try {
    const rule = await prisma.rule.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        priority: priority !== undefined ? parseInt(priority) : undefined,
        conditions: conditions ? JSON.stringify(conditions) : undefined,
        actions: actions ? JSON.stringify(actions) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });
    res.json(rule);
  } catch (err) {
    res.status(500).json({ error: 'rule_update_failed' });
  }
});

/**
 * DELETE /api/rules/:id
 */
router.delete('/rules/:id', async (req: Request, res: Response) => {
  try {
    await prisma.rule.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'rule_delete_failed' });
  }
});

/**
 * GET /api/audit
 */
router.get('/audit', async (req: Request, res: Response) => {
  try {
    const auditLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(auditLogs);
  } catch (err) {
    res.status(500).json({ error: 'audit_load_failed' });
  }
});

/**
 * GET /api/dashboard/retry-queue
 */
router.get('/retry-queue', async (req: Request, res: Response) => {
  try {
    const items = await prisma.retryQueue.findMany({
      include: { job: true },
      orderBy: { nextRetryAt: 'asc' },
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'retry_queue_failed' });
  }
});

/**
 * POST /api/retry/:jobId (manual trigger)
 */
router.post('/retry/:jobId', async (req: Request, res: Response) => {
  const { jobId } = req.params;
  try {
    const queueRecord = await prisma.retryQueue.findUnique({
      where: { jobId },
      include: { job: true },
    });

    if (!queueRecord || !queueRecord.job) {
      return res.status(404).json({ error: 'job_not_found', message: 'Job not found in retry queue.' });
    }

    // Force instant execution by setting nextRetryAt to now and calling processRetryQueue
    await prisma.retryQueue.update({
      where: { jobId },
      data: { nextRetryAt: new Date(Date.now() - 1000) },
    });

    const { RetryManager } = await import('../../retry/retry.manager.js');
    await RetryManager.processRetryQueue();

    res.json({ success: true, message: 'Retry manually triggered.' });
  } catch (err) {
    res.status(500).json({ error: 'manual_retry_failed', message: String(err) });
  }
});

/**
 * GET /api/logs (loads paginated structured logs from local file app.log)
 */
router.get('/logs', async (req: Request, res: Response) => {
  const logFile = path.join(process.cwd(), 'app.log');
  try {
    if (!fs.existsSync(logFile)) {
      return res.json([]);
    }

    const content = fs.readFileSync(logFile, 'utf8');
    const lines = content.trim().split('\n').filter(Boolean);
    const parsed = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (_) {
        return { message: line, level: 'info', timestamp: new Date().toISOString() };
      }
    });

    // Return latest 100 logs
    res.json(parsed.reverse().slice(0, 100));
  } catch (err) {
    res.status(500).json({ error: 'logs_failed' });
  }
});

/**
 * GET /api/analytics/categories (Category distribution)
 */
router.get('/analytics/categories', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.classification.groupBy({
      by: ['category'],
      _count: true,
    });
    
    const formatted = categories.map(c => ({
      name: c.category,
      value: c._count,
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'analytics_categories_failed' });
  }
});

/**
 * GET /api/analytics/confidence (Average confidence by category)
 */
router.get('/analytics/confidence', async (req: Request, res: Response) => {
  try {
    const scores = await prisma.classification.groupBy({
      by: ['category'],
      _avg: { confidenceScore: true },
    });

    const formatted = scores.map(s => ({
      category: s.category,
      avgConfidence: Math.round(s._avg.confidenceScore || 0),
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'analytics_confidence_failed' });
  }
});

/**
 * GET /api/analytics/tasks (Daily tasks created trend)
 */
router.get('/analytics/tasks', async (req: Request, res: Response) => {
  try {
    const startOf7Days = new Date();
    startOf7Days.setDate(startOf7Days.getDate() - 7);

    const tasks = await prisma.notionTask.findMany({
      where: { createdAt: { gte: startOf7Days } },
      select: { createdAt: true },
    });

    // Group by day of week
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts: Record<string, number> = {};
    days.forEach(d => counts[d] = 0);

    tasks.forEach(t => {
      const dName = days[new Date(t.createdAt).getDay()];
      counts[dName] = (counts[dName] || 0) + 1;
    });

    const formatted = days.map(d => ({
      day: d,
      tasksCreated: counts[d],
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'analytics_tasks_failed' });
  }
});

/**
 * GET /api/analytics/reviews (Approval Rate)
 */
router.get('/analytics/reviews', async (req: Request, res: Response) => {
  try {
    const approved = await prisma.classification.count({ where: { isApproved: true } });
    const total = await prisma.classification.count();
    
    res.json({
      approvedCount: approved,
      pendingCount: await prisma.email.count({ where: { status: 'classified' } }),
      rejectedCount: total - approved - await prisma.email.count({ where: { status: 'classified' } }),
    });
  } catch (err) {
    res.status(500).json({ error: 'analytics_reviews_failed' });
  }
});

export default router;
