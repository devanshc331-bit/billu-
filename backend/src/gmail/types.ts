export interface RawGmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  historyId?: string;
  internalDate?: string;
  payload?: {
    partId?: string;
    mimeType?: string;
    filename?: string;
    headers?: Array<{ name: string; value: string }>;
    body?: {
      size?: number;
      data?: string;
      attachmentId?: string;
    };
    parts?: RawGmailMessagePart[];
  };
  sizeEstimate?: number;
}

export interface RawGmailMessagePart {
  partId?: string;
  mimeType?: string;
  filename?: string;
  headers?: Array<{ name: string; value: string }>;
  body?: {
    size?: number;
    data?: string;
    attachmentId?: string;
  };
  parts?: RawGmailMessagePart[];
}

export interface SyncStats {
  emailsFetched: number;
  emailsSynced: number;
  timeSpentMs: number;
  startedAt: Date;
  errors: string[];
}
