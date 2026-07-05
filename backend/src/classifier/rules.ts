import { Email, Rule, RuleCondition } from 'shared';

export const RuleEvaluator = {
  /**
   * Evaluate a single condition against an email and its features.
   */
  evaluateCondition(condition: RuleCondition, email: Email, features: any): boolean {
    const field = condition.field;
    const operator = condition.operator;
    const value = (condition.value || '').toLowerCase();

    let targetText = '';

    switch (field as string) {
      case 'sender':
        targetText = `${email.senderName || ''} ${email.senderEmail}`.toLowerCase();
        break;
      case 'domain':
      case 'sender_domain':
        targetText = email.senderEmail.split('@')[1] || '';
        targetText = targetText.toLowerCase();
        break;
      case 'subject':
        targetText = (email.subject || '').toLowerCase();
        break;
      case 'body':
        targetText = (email.body || '').toLowerCase();
        break;
      case 'label':
        let labelsList: string[] = [];
        try {
          labelsList = JSON.parse(email.labels || '[]');
        } catch (_) {}
        if (operator === 'exists') {
          return labelsList.length > 0;
        }
        return labelsList.some(l => l.toLowerCase() === value);
      case 'attachment':
        let attsList: any[] = [];
        try {
          attsList = JSON.parse(email.attachments || '[]');
        } catch (_) {}
        if (operator === 'exists') {
          return attsList.length > 0;
        }
        return attsList.some(a => (a.filename || '').toLowerCase().includes(value));
      default:
        // Fallback checks
        targetText = `${email.subject || ''} ${email.body || ''}`.toLowerCase();
    }

    switch (operator) {
      case 'contains':
        return targetText.includes(value);
      case 'starts_with':
        return targetText.startsWith(value);
      case 'ends_with':
        return targetText.endsWith(value);
      case 'equals':
        return targetText === value;
      case 'regex':
        try {
          const regex = new RegExp(value, 'i');
          return regex.test(targetText);
        } catch (_) {
          return false;
        }
      case 'exists':
        return targetText.length > 0;
      default:
        return false;
    }
  },

  /**
   * Evaluate a rule (which has multiple conditions joined by AND logic).
   */
  evaluateRule(rule: Rule, email: Email, features: any): boolean {
    let conditionsList: RuleCondition[] = [];
    try {
      conditionsList = typeof rule.conditions === 'string' ? JSON.parse(rule.conditions) : rule.conditions;
    } catch (_) {
      return false;
    }

    if (conditionsList.length === 0) return false;

    // Standard rule matching: all conditions must match (AND)
    return conditionsList.every(cond => this.evaluateCondition(cond, email, features));
  }
};
