export interface Job {
  id: string;
  type: string; // 'sync' | 'classify' | 'create_task' | 'create_reminder' | 'apply_label' | 'digest' | 'retry' | 'cleanup'
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retrying' | 'dead';
  emailId: string | null;
  payload: string | null; // JSON
  result: string | null; // JSON
  error: string | null;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: Date | string | null;
  startedAt: Date | string | null;
  completedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface JobLog {
  id: string;
  jobId: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  data: string | null; // JSON
  duration: number | null;
  createdAt: Date | string;
}

export interface RetryQueueItem {
  id: string;
  jobId: string;
  failureReason: string;
  failureCategory: 'network' | 'timeout' | 'rate_limit' | 'server_error' | 'api_error' | 'auth';
  attemptNumber: number;
  nextRetryAt: Date | string;
  backoffMs: number;
  isDead: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}
