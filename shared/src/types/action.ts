export interface NotionTask {
  id: string;
  emailId: string;
  notionPageId: string | null;
  title: string;
  description: string | null;
  emailUrl: string | null;
  dueDate: Date | string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent' | null;
  status: 'todo' | 'in_progress' | 'done';
  labels: string | null; // JSON string array
  sender: string | null;
  notes: string | null;
  databaseId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CalendarEvent {
  id: string;
  emailId: string;
  googleEventId: string | null;
  type: 'reminder' | 'meeting' | 'follow_up' | 'deadline';
  title: string;
  description: string | null;
  reminderTime: Date | string | null;
  location: string | null;
  attendees: string | null; // JSON string array
  duration: number | null; // minutes
  sourceEmail: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}
