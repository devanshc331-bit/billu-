import { Email, EmailCategory } from './email.js';
import { Classification } from './classification.js';
import { Job } from './job.js';
import { Rule } from './rule.js';
import { NotionTask, CalendarEvent } from './action.js';

export interface Settings {
  id: string;
  userId: string;
  syncInterval: number; // minutes
  retryInterval: number; // minutes
  cleanupInterval: number; // minutes
  digestTime: string; // "HH:MM"
  defaultCategory: string;
  retryLimit: number;
  confidenceThresholdAuto: number; // 0-100
  confidenceThresholdReview: number; // 0-100
  notificationsEnabled: boolean;
  theme: 'light' | 'dark';
  fontSize: number;
  notionApiKey: string | null;
  notionDatabaseId: string | null;
  calendarEnabled: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface RunHistory {
  id: string;
  runType: 'sync' | 'classify' | 'retry' | 'cleanup' | 'digest';
  status: 'running' | 'completed' | 'failed';
  startedAt: Date | string;
  completedAt: Date | string | null;
  emailsProcessed: number;
  tasksCreated: number;
  eventsCreated: number;
  errors: number;
  duration: number | null; // milliseconds
  details: string | null; // JSON
}

export interface AuditLog {
  id: string;
  emailId: string | null;
  jobId: string | null;
  action: string;
  fromState: string | null;
  toState: string | null;
  actor: 'system' | 'user' | 'auto';
  details: string | null; // JSON
  confidence: number | null;
  userDecision: 'approved' | 'rejected' | 'edited' | 'ignored' | null;
  createdAt: Date | string;
}

export interface DashboardOverview {
  unreadEmailsCount: number;
  unreadEmailsTrend: number; // percent change
  processedTodayCount: number;
  processedTodayHourly: number[]; // 24-hr breakdown
  tasksCreatedCount: number;
  meetingsCreatedCount: number;
  failedJobsCount: number;
  pendingApprovalsCount: number;
  averageConfidenceScore: number;
  syncDurations: number[]; // last 5 runs sync duration in ms
}

export interface ActivityFeedItem {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  iconName: string;
  metadata?: any;
}
