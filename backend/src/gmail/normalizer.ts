import { RawGmailMessage, RawGmailMessagePart } from './types.js';

/**
 * Decode Base64url encoded strings (standard Gmail API payload formatting).
 */
export function decodeBodyData(data: string): string {
  try {
    return Buffer.from(data, 'base64url').toString('utf8');
  } catch (err) {
    return '';
  }
}

/**
 * Recursively find plain text body in message parts.
 */
export function extractBodyText(part: RawGmailMessagePart | any): string {
  if (!part) return '';

  if (part.mimeType === 'text/plain' && part.body?.data) {
    return decodeBodyData(part.body.data);
  }

  let body = '';
  if (part.parts && Array.isArray(part.parts)) {
    for (const subPart of part.parts) {
      body += extractBodyText(subPart);
    }
  }

  return body;
}

/**
 * Recursively scan for attachments in the message.
 */
export function extractAttachments(part: RawGmailMessagePart | any): Array<{ filename: string; mimeType: string; size: number }> {
  const attachments: Array<{ filename: string; mimeType: string; size: number }> = [];
  if (!part) return attachments;

  if (part.filename && part.body?.attachmentId) {
    attachments.push({
      filename: part.filename,
      mimeType: part.mimeType || 'application/octet-stream',
      size: part.body.size || 0,
    });
  }

  if (part.parts && Array.isArray(part.parts)) {
    for (const subPart of part.parts) {
      attachments.push(...extractAttachments(subPart));
    }
  }

  return attachments;
}

export const MessageNormalizer = {
  /**
   * Normalize raw Gmail message into standard DB schema.
   */
  normalize(raw: RawGmailMessage) {
    const headers = raw.payload?.headers || [];
    
    // Find header helpers
    const getHeader = (name: string): string => {
      const match = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
      return match ? match.value : '';
    };

    const fromHeader = getHeader('from'); // "John Doe <john.doe@example.com>" or "john.doe@example.com"
    let senderName = '';
    let senderEmail = '';

    const emailRegex = /<([^>]+)>/;
    const match = fromHeader.match(emailRegex);
    if (match) {
      senderEmail = match[1].trim();
      senderName = fromHeader.replace(emailRegex, '').replace(/"/g, '').trim();
    } else {
      senderEmail = fromHeader.trim();
      senderName = fromHeader.trim();
    }

    const recipients = getHeader('to');
    const subject = getHeader('subject') || '(No Subject)';
    const dateHeader = getHeader('date');
    const receivedAt = dateHeader ? new Date(dateHeader) : new Date(parseInt(raw.internalDate || String(Date.now())));

    // Parse plain text body
    let body = '';
    if (raw.payload?.body?.data) {
      body = decodeBodyData(raw.payload.body.data);
    } else if (raw.payload?.parts) {
      body = extractBodyText(raw.payload);
    }

    // Fallback snippet
    const snippet = raw.snippet || body.substring(0, 150) || '';

    // Attachments
    const attachments = extractAttachments(raw.payload);

    // Gmail custom labels list
    const labels = raw.labelIds || [];
    const isStarred = labels.includes('STARRED');
    const isRead = !labels.includes('UNREAD');

    // Parse headers map for database representation
    const headersMap: Record<string, string> = {};
    headers.forEach(h => {
      headersMap[h.name] = h.value;
    });

    return {
      messageId: raw.id,
      threadId: raw.threadId,
      senderName: senderName || null,
      senderEmail: senderEmail || 'unknown@unknown.com',
      recipients: recipients || null,
      subject,
      snippet,
      body,
      receivedAt,
      labels: JSON.stringify(labels),
      attachments: JSON.stringify(attachments),
      importance: labels.includes('IMPORTANT') ? 'high' : 'normal',
      isRead,
      isStarred,
      headers: JSON.stringify(headersMap),
      status: 'normalized',
    };
  }
};
