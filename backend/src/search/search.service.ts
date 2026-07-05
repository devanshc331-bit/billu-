import { prisma } from '../storage/database.js';

export interface SearchFilters {
  query?: string; // matches senderName, senderEmail, subject, body, snippet
  category?: string;
  minConfidence?: number;
  maxConfidence?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  isRead?: boolean;
  isStarred?: boolean;
}

export const SearchService = {
  /**
   * Search and filter emails.
   */
  async searchEmails(filters: SearchFilters) {
    const whereClause: any = {};

    // 1. Text Query Filter (OR subject, body, sender, snippet)
    if (filters.query) {
      const q = filters.query.toLowerCase();
      whereClause.OR = [
        { subject: { contains: q } },
        { body: { contains: q } },
        { snippet: { contains: q } },
        { senderName: { contains: q } },
        { senderEmail: { contains: q } },
      ];
    }

    // 2. Category Filter
    if (filters.category && filters.category !== 'All') {
      whereClause.classifications = {
        some: {
          category: filters.category,
        },
      };
    }

    // 3. Confidence range filter
    if (filters.minConfidence !== undefined || filters.maxConfidence !== undefined) {
      whereClause.classifications = {
        ...whereClause.classifications,
        some: {
          ...whereClause.classifications?.some,
          confidenceScore: {
            gte: filters.minConfidence ?? 0,
            lte: filters.maxConfidence ?? 100,
          },
        },
      };
    }

    // 4. Date Range Filter
    if (filters.startDate || filters.endDate) {
      whereClause.receivedAt = {};
      if (filters.startDate) {
        whereClause.receivedAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        whereClause.receivedAt.lte = new Date(filters.endDate);
      }
    }

    // 5. Read/Starred Status
    if (filters.isRead !== undefined) {
      whereClause.isRead = filters.isRead;
    }
    if (filters.isStarred !== undefined) {
      whereClause.isStarred = filters.isStarred;
    }

    // 6. Action status
    if (filters.status) {
      whereClause.status = filters.status;
    }

    // Execute query with classifications included
    return await prisma.email.findMany({
      where: whereClause,
      include: {
        classifications: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { receivedAt: 'desc' },
    });
  }
};
