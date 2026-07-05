export interface RuleCondition {
  field: 'sender' | 'subject' | 'body' | 'label' | 'attachment' | 'date' | 'domain' | 'priority';
  operator: 'contains' | 'starts_with' | 'ends_with' | 'regex' | 'exists' | 'equals';
  value: string;
}

export interface RuleAction {
  type: 'ignore' | 'label' | 'create_task' | 'create_reminder' | 'mark_review' | 'star' | 'archive_suggestion';
  config?: {
    labelName?: string;
    taskPriority?: 'low' | 'medium' | 'high' | 'urgent';
    reminderMinutes?: number;
    [key: string]: any;
  };
}

export interface Rule {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  priority: number;
  conditions: string; // JSON: RuleCondition[]
  actions: string; // JSON: RuleAction[]
  createdAt: Date | string;
  updatedAt: Date | string;
}
