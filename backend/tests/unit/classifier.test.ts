import { describe, it, expect } from 'vitest';
import { RuleEvaluator } from '../../src/classifier/rules.js';
import { HeuristicScorer } from '../../src/classifier/scorer.js';
import { Email, Rule } from 'shared';

describe('Classifier Rule Evaluator', () => {
  it('should successfully match email with contains condition', () => {
    const mockEmail: Email = {
      id: 'em_test',
      messageId: 'msg_test',
      threadId: 'th_test',
      senderName: 'Amazon Confirmation',
      senderEmail: 'auto-confirm@amazon.com',
      recipients: 'user@test.com',
      subject: 'Order details',
      snippet: 'Your order is confirmed',
      body: 'Your total amount was $100.00',
      receivedAt: new Date(),
      labels: '[]',
      attachments: '[]',
      importance: 'normal',
      isRead: false,
      isStarred: false,
      headers: '{}',
      containsDeadline: false,
      containsInvoice: true,
      containsMeeting: false,
      containsAttachment: false,
      containsActionItem: false,
      urgencyScore: 10,
      priorityScore: 30,
      senderReputation: 'known',
      threadLength: 1,
      status: 'fetched',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockRule: Rule = {
      id: 'rul_test',
      name: 'Amazon receipts Rule',
      description: 'Route Amazon details',
      isActive: true,
      priority: 10,
      conditions: JSON.stringify([{ field: 'sender', operator: 'contains', value: 'amazon.com' }]),
      actions: JSON.stringify([{ type: 'label', config: { labelName: 'Receipts' } }]),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const matches = RuleEvaluator.evaluateRule(mockRule, mockEmail, {});
    expect(matches).toBe(true);
  });
});

describe('Heuristic Scorer', () => {
  it('should classify newsletters with high confidence', () => {
    const mockEmail: Email = {
      id: 'em_test2',
      messageId: 'msg_test2',
      threadId: 'th_test2',
      senderName: 'Newsletter Builder',
      senderEmail: 'newsletter@news.com',
      recipients: 'user@test.com',
      subject: 'Engineering newsletter digest #12',
      snippet: 'Welcome to this week edition. Click here to unsubscribe',
      body: 'Welcome to this week edition. To manage settings click unsubscribe.',
      receivedAt: new Date(),
      labels: '[]',
      attachments: '[]',
      importance: 'low',
      isRead: false,
      isStarred: false,
      headers: '{}',
      containsDeadline: false,
      containsInvoice: false,
      containsMeeting: false,
      containsAttachment: false,
      containsActionItem: false,
      urgencyScore: 0,
      priorityScore: 10,
      senderReputation: 'known',
      threadLength: 1,
      status: 'fetched',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = HeuristicScorer.score(mockEmail, { containsInvoice: false, containsMeeting: false });
    expect(result.category).toBe('Newsletter');
    expect(result.confidenceScore).toBeGreaterThanOrEqual(90);
  });
});
