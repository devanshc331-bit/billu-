import { Client } from '@notionhq/client';
import { env } from '../config/env.js';
import { logger } from '../logging/logger.js';

export interface NotionTaskInput {
  title: string;
  description: string;
  emailUrl?: string;
  dueDate?: Date | null;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  labels?: string[];
  sender?: string;
  notes?: string;
}

export const NotionService = {
  /**
   * Create a new database entry page in Notion.
   */
  async createTask(apiKey: string | null, databaseId: string | null, input: NotionTaskInput) {
    const key = apiKey || env.NOTION_API_KEY || '';
    const dbId = databaseId || env.NOTION_DATABASE_ID || '';

    if (env.MOCK_MODE || !key || !dbId) {
      logger.info('Create Notion Task (MOCK MODE).', { input, databaseId: dbId });
      // Simulate network request duration
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        id: `mock_notion_page_${Math.random().toString(36).substring(2, 10)}`,
        url: 'https://notion.so/mock-page-id',
      };
    }

    try {
      const notion = new Client({ auth: key });
      const properties: any = {
        Name: {
          title: [
            {
              text: {
                content: input.title,
              },
            },
          ],
        },
      };

      // Add description as text property if database supports it, or we append it to page content
      // For simple database mappings, we add URL, Priority, Due Date
      if (input.emailUrl) {
        properties['Email Link'] = {
          url: input.emailUrl,
        };
      }

      if (input.dueDate) {
        properties['Due Date'] = {
          date: {
            start: input.dueDate.toISOString().split('T')[0],
          },
        };
      }

      if (input.priority) {
        properties['Priority'] = {
          select: {
            name: input.priority.toUpperCase(),
          },
        };
      }

      if (input.sender) {
        properties['Sender'] = {
          email: input.sender,
        };
      }

      if (input.labels && input.labels.length > 0) {
        properties['Tags'] = {
          multi_select: input.labels.map(l => ({ name: l })),
        };
      }

      const response = await notion.pages.create({
        parent: { database_id: dbId },
        properties,
        children: [
          {
            object: 'block',
            type: 'heading_2',
            heading_2: {
              rich_text: [{ type: 'text', text: { content: 'Email Content Snippet' } }],
            },
          },
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ type: 'text', text: { content: input.description.substring(0, 1000) } }],
            },
          },
          ...(input.notes ? [
            {
              object: 'block',
              type: 'heading_3',
              heading_3: {
                rich_text: [{ type: 'text', text: { content: 'Notes / Context' } }],
              },
            },
            {
              object: 'block',
              type: 'paragraph',
              paragraph: {
                rich_text: [{ type: 'text', text: { content: input.notes } }],
              },
            }
          ] : [])
        ] as any
      });

      logger.info('Notion task page successfully created', { pageId: response.id });
      return {
        id: response.id,
        url: (response as any).url || `https://notion.so/${response.id.replace(/-/g, '')}`,
      };
    } catch (err) {
      logger.error('Failed to create page in Notion API database', { error: String(err) });
      throw err;
    }
  }
};
