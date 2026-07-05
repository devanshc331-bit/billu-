export interface ExtractedFeatures {
  containsDeadline: boolean;
  containsInvoice: boolean;
  containsMeeting: boolean;
  containsAttachment: boolean;
  containsActionItem: boolean;
  urgencyScore: number;
  priorityScore: number;
  senderReputation: 'known' | 'unknown' | 'important';
  threadLength: number;
  detectedDates: string[];
  detectedAmount?: number;
  detectedCurrency?: string;
  meetingLinks: string[];
}

export interface Classification {
  id: string;
  emailId: string;
  category: string;
  confidenceScore: number;
  features: string | null; // JSON: ExtractedFeatures
  ruleId: string | null;
  isApproved: boolean;
  approvedBy: string | null; // 'user', 'auto', or null
  approvedAt: Date | string | null;
  recommendedAction: string | null;
  createdAt: Date | string;
}
