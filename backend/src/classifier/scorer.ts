import { Email } from 'shared';

export interface ScorerResult {
  category: string;
  confidenceScore: number;
  recommendedAction: string | null;
}

export const HeuristicScorer = {
  /**
   * Run heuristics on email features and text, returning category predictions.
   */
  score(email: Email, features: any): ScorerResult {
    const subject = (email.subject || '').toLowerCase();
    const body = (email.body || '').toLowerCase();
    const combined = `${subject} ${body}`;

    // 1. Invoice detection (Urgent action / Notion task)
    if (features.containsInvoice) {
      let confidence = 70;
      if (body.includes('$') || body.includes('amount') || body.includes('usd') || body.includes('eur')) {
        confidence += 15;
      }
      if (features.containsDeadline || body.includes('due date')) {
        confidence += 10;
      }
      return {
        category: 'Invoice',
        confidenceScore: Math.min(confidence, 100),
        recommendedAction: 'CREATE_NOTION_TASK',
      };
    }

    // 2. Meeting detection (Google Calendar event/reminder)
    if (features.containsMeeting) {
      let confidence = 75;
      if (features.meetingLinks.length > 0) {
        confidence += 15;
      }
      if (subject.includes('invite') || subject.includes('invitation')) {
        confidence += 8;
      }
      return {
        category: 'Meeting',
        confidenceScore: Math.min(confidence, 100),
        recommendedAction: 'CREATE_CALENDAR_REMINDER',
      };
    }

    // 3. Urgent detection (Notion task / notification)
    if (subject.includes('urgent') || subject.includes('immediate attention') || body.includes('asap')) {
      return {
        category: 'Urgent',
        confidenceScore: 85,
        recommendedAction: 'CREATE_NOTION_TASK',
      };
    }

    // 4. Newsletter / Promotion (Safe auto-read / Label)
    if (combined.includes('unsubscribe') || combined.includes('view in browser') || combined.includes('privacy policy') || subject.includes('digest')) {
      let category = 'Newsletter';
      if (subject.includes('newsletter') || subject.includes('digest') || subject.includes('weekly') || subject.includes('daily')) {
        category = 'Newsletter';
      } else {
        category = 'Promotion';
      }

      return {
        category,
        confidenceScore: 92,
        recommendedAction: 'MARK_READ',
      };
    }

    // 5. Needs Reply (Gmail label / notification suggest)
    if (combined.includes('?') && features.containsActionItem) {
      return {
        category: 'Needs Reply',
        confidenceScore: 78,
        recommendedAction: 'APPLY_GMAIL_LABEL',
      };
    }

    // 6. Travel / Flight confirmations
    if (subject.includes('flight') || subject.includes('booking') || subject.includes('reservation') || subject.includes('boarding pass')) {
      return {
        category: 'Travel',
        confidenceScore: 80,
        recommendedAction: 'APPLY_GMAIL_LABEL',
      };
    }

    // Default Fallback
    return {
      category: 'Unknown',
      confidenceScore: 45,
      recommendedAction: 'APPLY_GMAIL_LABEL',
    };
  }
};
