import { prisma } from '../storage/database.js';
import { FeatureExtractor } from './features.js';
import { RuleEvaluator } from './rules.js';
import { HeuristicScorer } from './scorer.js';
import { logger } from '../logging/logger.js';
import { writeAuditLog } from '../logging/audit.js';
import { ActionEngine } from '../actions/action.engine.js';

export const ClassifierEngine = {
  /**
   * Run the classification pipeline for a single email.
   */
  async classifyEmail(emailId: string) {
    logger.info(`Starting classification pipeline for email: ${emailId}`);

    // 1. Load email
    const email = await prisma.email.findUnique({
      where: { id: emailId },
    });

    if (!email) {
      throw new Error(`Email ${emailId} not found in database for classification`);
    }

    // 2. Feature Extraction
    const features = await FeatureExtractor.extract(emailId);
    
    // Save extracted features directly to the Email model
    const updatedEmail = await prisma.email.update({
      where: { id: emailId },
      data: {
        containsDeadline: features.containsDeadline,
        containsInvoice: features.containsInvoice,
        containsMeeting: features.containsMeeting,
        containsAttachment: features.containsAttachment,
        containsActionItem: features.containsActionItem,
        urgencyScore: features.urgencyScore,
        priorityScore: features.priorityScore,
        senderReputation: features.senderReputation,
        threadLength: features.threadLength,
      },
    });

    // 3. Rule Matching
    const rules = await prisma.rule.findMany({
      where: { isActive: true },
      orderBy: { priority: 'desc' },
    });

    let matchedRule: any = null;
    let category = '';
    let confidenceScore = 0;
    let recommendedAction: string | null = null;
    let ruleActionsConfig: any = {};

    for (const rule of rules) {
      const matches = RuleEvaluator.evaluateRule(rule, updatedEmail, features);
      if (matches) {
        matchedRule = rule;
        confidenceScore = 100; // Rule match is 100% confidence by design
        
        let parsedActions: any[] = [];
        try {
          parsedActions = JSON.parse(rule.actions);
        } catch (_) {}

        // Find primary actions
        const labelAction = parsedActions.find(a => a.type === 'label');
        const taskAction = parsedActions.find(a => a.type === 'create_task');
        const reminderAction = parsedActions.find(a => a.type === 'create_reminder');
        const ignoreAction = parsedActions.find(a => a.type === 'ignore');
        const markReviewAction = parsedActions.find(a => a.type === 'mark_review');

        if (ignoreAction) {
          category = 'Ignore';
          recommendedAction = 'MARK_READ'; // Auto archive/read
        } else if (taskAction) {
          category = 'Work';
          recommendedAction = 'CREATE_NOTION_TASK';
          ruleActionsConfig = taskAction.config || {};
        } else if (reminderAction) {
          category = 'Reminder';
          recommendedAction = 'CREATE_CALENDAR_REMINDER';
          ruleActionsConfig = reminderAction.config || {};
        } else if (labelAction) {
          category = labelAction.config?.labelName || 'Work';
          recommendedAction = 'APPLY_GMAIL_LABEL';
          ruleActionsConfig = labelAction.config || {};
        } else {
          category = 'Work';
          recommendedAction = 'APPLY_GMAIL_LABEL';
        }

        logger.info(`Email matched rule: "${rule.name}" (ID: ${rule.id})`, { emailId });
        break;
      }
    }

    // 4. Heuristic Scoring (if no rule matched)
    if (!matchedRule) {
      const scoringResult = HeuristicScorer.score(updatedEmail, features);
      category = scoringResult.category;
      confidenceScore = scoringResult.confidenceScore;
      recommendedAction = scoringResult.recommendedAction;
      logger.info(`Email classified via heuristics. Category: ${category}, Confidence: ${confidenceScore}%`, { emailId });
    }

    // 5. Determine Human-in-the-loop Approval logic
    // PRD Section 15: Invoices, Legal, Medical, Financial, Unknown sender, low confidence, large attachments ALWAYS require approval.
    // Safe actions (like labeling or marking read newsletters/promotions) can be auto-approved if confidence >= 90%
    const isSafeAction = recommendedAction === 'MARK_READ' || recommendedAction === 'APPLY_GMAIL_LABEL' || recommendedAction === 'IGNORE';
    const isInvoiceCategory = category === 'Invoice' || category === 'Receipt' || features.containsInvoice;
    const isUnknownSender = features.senderReputation === 'unknown';
    const isHighConfidence = confidenceScore >= 90;

    let isApproved = false;
    let approvedBy = null;

    if (isHighConfidence && isSafeAction && !isInvoiceCategory && !isUnknownSender) {
      isApproved = true;
      approvedBy = 'auto';
    }

    // 6. Save Classification
    const classification = await prisma.classification.create({
      data: {
        emailId,
        category,
        confidenceScore,
        ruleId: matchedRule?.id || null,
        isApproved,
        approvedBy,
        approvedAt: isApproved ? new Date() : null,
        recommendedAction,
        features: JSON.stringify(features),
      },
    });

    // Update email status
    const targetStatus = isApproved ? 'approved' : 'classified';
    await prisma.email.update({
      where: { id: emailId },
      data: { status: targetStatus },
    });

    // Write audit log
    await writeAuditLog({
      emailId,
      action: 'classify',
      fromState: 'normalized',
      toState: targetStatus,
      actor: 'system',
      confidence: confidenceScore,
      details: {
        category,
        confidenceScore,
        ruleMatched: matchedRule?.name || null,
        isApproved,
        approvedBy,
        recommendedAction,
      },
    });

    // 7. Auto Execute if Approved
    if (isApproved && recommendedAction) {
      logger.info(`Auto-executing approved classification action: ${recommendedAction}`, { emailId });
      try {
        await ActionEngine.executeApprovedAction(emailId, recommendedAction, ruleActionsConfig);
      } catch (err) {
        logger.error(`Failed during classification auto-execution`, { error: String(err), emailId });
      }
    }

    return classification;
  }
};
