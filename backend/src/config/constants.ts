export const CATEGORIES = [
  'Ignore',
  'Newsletter',
  'Promotion',
  'Receipt',
  'Finance',
  'Travel',
  'School',
  'Work',
  'Urgent',
  'Needs Reply',
  'Reminder',
  'Meeting',
  'Invoice',
  'Follow Up',
  'Spam',
  'Candidate',
  'Read Later',
  'Unknown'
] as const;

export type EmailCategory = typeof CATEGORIES[number];

export const EMAIL_STATUS = {
  FETCHED: 'fetched',
  NORMALIZED: 'normalized',
  CLASSIFIED: 'classified',
  QUEUED: 'queued',
  APPROVED: 'approved',
  EXECUTED: 'executed',
  COMPLETED: 'completed'
} as const;

export const JOB_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  RETRYING: 'retrying',
  DEAD: 'dead'
} as const;

export const JOB_TYPES = {
  SYNC: 'sync',
  CLASSIFY: 'classify',
  CREATE_TASK: 'create_task',
  CREATE_REMINDER: 'create_reminder',
  APPLY_LABEL: 'apply_label',
  DIGEST: 'digest',
  RETRY: 'retry',
  CLEANUP: 'cleanup'
} as const;
