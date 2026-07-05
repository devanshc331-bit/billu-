import { google } from 'googleapis';
import { env } from '../config/env.js';
import { RawGmailMessage } from './types.js';
import { logger } from '../logging/logger.js';

// Global counter to generate unique message IDs on successive sync queries in Sandbox Mode
let sandboxMessageCounter = 1;

export class GmailClient {
  private authClient?: any;

  constructor(accessToken?: string) {
    if (!env.MOCK_MODE && accessToken && !accessToken.startsWith('mock_')) {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });
      this.authClient = oauth2Client;
    }
  }

  /**
   * List message headers / summary list.
   */
  async listMessages(options: { maxResults?: number; pageToken?: string; q?: string } = {}): Promise<{ messages: Array<{ id: string; threadId: string }>; nextPageToken?: string; historyId?: string }> {
    if (env.MOCK_MODE || !this.authClient) {
      logger.info('List Gmail messages from API (MOCK MODE).');
      
      // Every time we run, we simulate finding 1-3 new messages for sync simulation
      const count = Math.floor(Math.random() * 3) + 1;
      const messages = [];

      for (let i = 0; i < count; i++) {
        const idNum = sandboxMessageCounter++;
        messages.push({
          id: `msg_sandbox_${idNum}`,
          threadId: `th_sandbox_${idNum}`,
        });
      }

      return {
        messages,
        nextPageToken: undefined,
        historyId: String(1000 + sandboxMessageCounter),
      };
    }

    const gmail = google.gmail({ version: 'v1', auth: this.authClient });

    try {
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: options.maxResults || 20,
        pageToken: options.pageToken,
        q: options.q || 'is:unread',
      });

      return {
        messages: (response.data.messages || []).map(m => ({ id: m.id || '', threadId: m.threadId || '' })),
        nextPageToken: response.data.nextPageToken || undefined,
        historyId: response.data.messages?.[0]?.id ? 'hist_' + response.data.messages[0].id : '1000',
      };
    } catch (err) {
      logger.error('Failed to list Gmail messages from API', { error: String(err) });
      throw err;
    }
  }

  /**
   * Fetch full message content (including payload, parts, and headers).
   */
  async getMessage(messageId: string): Promise<RawGmailMessage> {
    if (env.MOCK_MODE || !this.authClient || messageId.startsWith('msg_sandbox_')) {
      logger.info(`Fetch full Gmail message detail from API (MOCK MODE)`, { messageId });
      
      // Return a mock message depending on id index to test various categories
      const idIndex = parseInt(messageId.split('_').pop() || '1');
      
      const mocks = [
        {
          subject: 'Weekly Hosting Invoice #INV-87162',
          from: 'billing@digitalocean.com',
          body: 'Hello Demo, your monthly droplet hosting invoice is attached. The total amount due is $14.50. This invoice will be auto-charged to your card by Monday, July 15, 2026. View invoice PDF attachment in panel.',
          snippet: 'Your droplet hosting invoice total is $14.50...',
          category: 'Invoice',
          labels: ['UNREAD', 'INBOX'],
          hasAttachment: true,
        },
        {
          subject: 'Draft Proposal & Client Brief for Q3',
          from: 'sarah.smith@company.com',
          body: 'Hi team, please review this draft proposal for our client presentation. We need your feedback ASAP by Friday morning so we can submit the finalize draft. Can you please check the document attached and add notes?',
          snippet: 'Please check the document attached and add notes for presentation...',
          category: 'Needs Reply',
          labels: ['UNREAD', 'INBOX', 'IMPORTANT'],
          hasAttachment: true,
        },
        {
          subject: 'Project Kickoff Meeting Invitation',
          from: 'organizer@zoom-invites.com',
          body: 'You are invited to a project kickoff meeting on Tuesday, July 14 at 2:00 PM. Please click this link to join the meeting room: https://zoom.us/j/9812731923. An ICS invite file is attached to sync your client schedules.',
          snippet: 'Kickoff meeting on Tuesday, July 14 at 2:00 PM via Zoom...',
          category: 'Meeting',
          labels: ['UNREAD', 'INBOX'],
          hasAttachment: true,
        },
        {
          subject: 'Unbelievable flight deals this summer!',
          from: 'marketing@traveldeals.com',
          body: 'Hey explorer! Check out these amazing flight deals for summer vacations. Save up to 40% on round trips if you book before tomorrow! To manage your alerts or unsubscribe, click here.',
          snippet: 'Check out flight deals and save up to 40% off round trips...',
          category: 'Newsletter',
          labels: ['UNREAD', 'INBOX'],
          hasAttachment: false,
        }
      ];

      const mock = mocks[idIndex % mocks.length];

      return {
        id: messageId,
        threadId: `th_${messageId.split('_').pop()}`,
        snippet: mock.snippet,
        labelIds: mock.labels,
        internalDate: String(Date.now() - 60000 * idIndex),
        payload: {
          mimeType: 'multipart/mixed',
          headers: [
            { name: 'From', value: mock.from },
            { name: 'To', value: 'demo.user@gmail.com' },
            { name: 'Subject', value: mock.subject },
            { name: 'Date', value: new Date(Date.now() - 60000 * idIndex).toUTCString() },
            { name: 'Message-ID', value: `<${messageId}@google.com>` }
          ],
          parts: [
            {
              mimeType: 'text/plain',
              body: {
                size: mock.body.length,
                data: Buffer.from(mock.body, 'utf8').toString('base64url'),
              }
            },
            ...(mock.hasAttachment ? [{
              mimeType: 'application/pdf',
              filename: 'invoice_details.pdf',
              body: {
                size: 2048,
                attachmentId: 'att_id_123',
              }
            }] : [])
          ]
        }
      };
    }

    const gmail = google.gmail({ version: 'v1', auth: this.authClient });

    try {
      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });
      return response.data as RawGmailMessage;
    } catch (err) {
      logger.error(`Failed to fetch Google Gmail message detail: ${messageId}`, { error: String(err) });
      throw err;
    }
  }
}
