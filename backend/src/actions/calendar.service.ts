import { google } from 'googleapis';
import { env } from '../config/env.js';
import { logger } from '../logging/logger.js';

export interface CalendarEventInput {
  title: string;
  description: string;
  startTime: Date;
  durationMinutes?: number; // default e.g. 30 mins
  attendees?: string[];
  location?: string;
  emailLink?: string;
}

export const CalendarService = {
  /**
   * Create a Google Calendar event.
   */
  async createEvent(accessToken: string | null, input: CalendarEventInput) {
    if (env.MOCK_MODE || !accessToken || accessToken.startsWith('mock_')) {
      logger.info('Create Google Calendar Event (MOCK MODE).', { input });
      // Simulate network request duration
      await new Promise(resolve => setTimeout(resolve, 600));
      return {
        id: `mock_calendar_event_${Math.random().toString(36).substring(2, 10)}`,
        htmlLink: 'https://calendar.google.com/mock-event-link',
      };
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const duration = input.durationMinutes || 30;
    const endTime = new Date(input.startTime.getTime() + duration * 60 * 1000);

    const eventBody: any = {
      summary: input.title,
      description: `${input.description}\n\nSource Email: ${input.emailLink || 'Linked Inbox Email'}`,
      start: {
        dateTime: input.startTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'UTC',
      },
    };

    if (input.location) {
      eventBody.location = input.location;
    }

    if (input.attendees && input.attendees.length > 0) {
      eventBody.attendees = input.attendees.map(email => ({ email }));
    }

    try {
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: eventBody,
      });

      logger.info('Google Calendar event successfully created', { eventId: response.data.id });
      return {
        id: response.data.id,
        htmlLink: response.data.htmlLink || 'https://calendar.google.com',
      };
    } catch (err) {
      logger.error('Failed to create event in Google Calendar API', { error: String(err) });
      throw err;
    }
  }
};
