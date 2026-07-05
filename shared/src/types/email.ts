export interface Email {
  id: string;
  messageId: string;
  threadId: string | null;
  senderName: string | null;
  senderEmail: string;
  recipients: string | null;
  subject: string | null;
  snippet: string | null;
  body: string | null;
  receivedAt: Date | string;
  labels: string | null; // JSON array stored as string
  attachments: string | null; // JSON array stored as string
  importance: string | null;
  isRead: boolean;
  isStarred: boolean;
  headers: string | null; // JSON object stored as string

  // Derived fields
  containsDeadline: boolean;
  containsInvoice: boolean;
  containsMeeting: boolean;
  containsAttachment: boolean;
  containsActionItem: boolean;
  urgencyScore: number;
  priorityScore: number;
  senderReputation: string | null; // 'known', 'unknown', 'important'
  threadLength: number;

  status: string; // 'fetched', 'normalized', 'classified', 'queued', 'approved', 'executed', 'completed'
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type EmailCategory =
  | 'Ignore'
  | 'Newsletter'
  | 'Promotion'
  | 'Receipt'
  | 'Finance'
  | 'Travel'
  | 'School'
  | 'Work'
  | 'Urgent'
  | 'Needs Reply'
  | 'Reminder'
  | 'Meeting'
  | 'Invoice'
  | 'Follow Up'
  | 'Spam'
  | 'Candidate'
  | 'Read Later'
  | 'Unknown';
