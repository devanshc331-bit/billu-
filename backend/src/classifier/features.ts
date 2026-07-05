import { prisma } from '../storage/database.js';
import { ExtractedFeatures } from 'shared';

export const FeatureExtractor = {
  /**
   * Extract features from normalized email body, subject, and metadata.
   */
  async extract(emailId: string): Promise<ExtractedFeatures> {
    const email = await prisma.email.findUnique({
      where: { id: emailId },
    });

    if (!email) {
      throw new Error(`Email not found for feature extraction: ${emailId}`);
    }

    const subject = (email.subject || '').toLowerCase();
    const body = (email.body || '').toLowerCase();
    const snippet = (email.snippet || '').toLowerCase();
    const sender = email.senderEmail.toLowerCase();
    const combinedText = `${subject} ${body} ${snippet}`;

    // 1. Detect Meeting links
    const zoomRegex = /https:\/\/[a-z0-9]+\.zoom\.us\/[a-z0-9_=\-\/\?]+/gi;
    const meetRegex = /https:\/\/meet\.google\.com\/[a-z\-]+/gi;
    
    const zoomLinks = combinedText.match(zoomRegex) || [];
    const meetLinks = combinedText.match(meetRegex) || [];
    const meetingLinks = [...new Set([...zoomLinks, ...meetLinks])];
    
    const containsMeeting = 
      meetingLinks.length > 0 || 
      subject.includes('calendar invite') || 
      subject.includes('scheduled') || 
      body.includes('.ics') ||
      body.includes('google calendar');

    // 2. Detect Invoices
    const invoiceKeywords = ['invoice', 'receipt', 'payment due', 'bill', 'statement', 'amount due', 'total due', 'charge confirmation', 'purchase receipt'];
    const containsInvoice = invoiceKeywords.some(keyword => combinedText.includes(keyword)) || email.attachments?.includes('.pdf') || false;

    // 3. Detect Deadlines & Dates
    const deadlineKeywords = ['due by', 'deadline', 'by monday', 'by tuesday', 'by wednesday', 'by thursday', 'by friday', 'before end of', 'due date', 'pay by'];
    const containsDeadline = deadlineKeywords.some(keyword => combinedText.includes(keyword)) || subject.includes('due') || false;
    
    // Extract dates using basic regex
    const dateRegex = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{1,2}(?:st|nd|rd|th)?(?:, \d{4})?\b/gi;
    const detectedDates = combinedText.match(dateRegex) || [];

    // 4. Detect Attachments
    let attachmentList: any[] = [];
    try {
      attachmentList = JSON.parse(email.attachments || '[]');
    } catch (_) {}
    const containsAttachment = attachmentList.length > 0;

    // 5. Detect Action Items
    const actionVerbs = ['please review', 'can you', 'need to', 'must check', 'required ASAP', 'action required', 'provide details'];
    const containsActionItem = actionVerbs.some(verb => combinedText.includes(verb));

    // 6. Thread Length
    let threadLength = 1;
    if (email.threadId) {
      threadLength = await prisma.email.count({
        where: { threadId: email.threadId },
      });
    }

    // 7. Sender Reputation
    // Define manager/client domains as important, spam/no-reply as low
    let senderReputation: 'known' | 'unknown' | 'important' = 'unknown';
    if (sender.includes('company.com') || sender.includes('manager') || sender.includes('boss')) {
      senderReputation = 'important';
    } else if (sender.includes('no-reply') || sender.includes('noreply') || sender.includes('newsletter') || sender.includes('alert')) {
      senderReputation = 'known'; // Treated as known alert/newsletter
    }

    // 8. Urgency Score (0 - 100)
    let urgencyScore = 0;
    if (containsDeadline) urgencyScore += 40;
    if (containsActionItem) urgencyScore += 30;
    if (subject.includes('urgent') || subject.includes('asap')) urgencyScore += 20;
    if (senderReputation === 'important') urgencyScore += 10;
    urgencyScore = Math.min(urgencyScore, 100);

    // 9. Priority Score (0 - 100)
    let priorityScore = 0;
    if (senderReputation === 'important') priorityScore += 40;
    if (urgencyScore > 70) priorityScore += 30;
    if (containsInvoice) priorityScore += 20;
    if (threadLength > 3) priorityScore += 10;
    priorityScore = Math.min(priorityScore, 100);

    return {
      containsDeadline,
      containsInvoice,
      containsMeeting,
      containsAttachment,
      containsActionItem,
      urgencyScore,
      priorityScore,
      senderReputation,
      threadLength,
      detectedDates,
      meetingLinks,
    };
  }
};
