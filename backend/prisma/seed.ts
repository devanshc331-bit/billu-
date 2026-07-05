import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Clean existing records to avoid duplicates
  await prisma.runHistory.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.classification.deleteMany();
  await prisma.jobLog.deleteMany();
  await prisma.retryQueue.deleteMany();
  await prisma.job.deleteMany();
  await prisma.notionTask.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.email.deleteMany();
  await prisma.rule.deleteMany();
  await prisma.oAuthToken.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create default user
  const user = await prisma.user.create({
    data: {
      id: 'usr_default',
      email: 'demo.user@gmail.com',
      name: 'Demo Professional',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80',
    },
  });

  // 3. Create settings for user
  const settings = await prisma.settings.create({
    data: {
      id: 'set_default',
      userId: user.id,
      syncInterval: 15,
      retryInterval: 5,
      cleanupInterval: 1440,
      digestTime: '20:00',
      defaultCategory: 'read_later',
      retryLimit: 5,
      confidenceThresholdAuto: 90,
      confidenceThresholdReview: 70,
      notificationsEnabled: true,
      theme: 'dark',
      fontSize: 16,
      notionApiKey: '',
      notionDatabaseId: '',
      calendarEnabled: false,
    },
  });

  // 4. Create default matching rules
  const rule1 = await prisma.rule.create({
    data: {
      id: 'rul_amazon',
      name: 'Amazon Invoice Categorization',
      description: 'Route Amazon order details directly to Receipts and mark review',
      isActive: true,
      priority: 10,
      conditions: JSON.stringify([
        { field: 'sender', operator: 'contains', value: 'amazon.com' },
      ]),
      actions: JSON.stringify([
        { type: 'label', config: { labelName: 'Receipts' } },
        { type: 'mark_review' }
      ]),
    },
  });

  const rule2 = await prisma.rule.create({
    data: {
      id: 'rul_urgent_manager',
      name: 'Urgent Client/Manager Emails',
      description: 'Prioritize messages with urgent action items from manager',
      isActive: true,
      priority: 20,
      conditions: JSON.stringify([
        { field: 'subject', operator: 'contains', value: 'urgent' },
        { field: 'body', operator: 'contains', value: 'action required' }
      ]),
      actions: JSON.stringify([
        { type: 'star' },
        { type: 'create_task', config: { taskPriority: 'urgent' } }
      ]),
    },
  });

  const rule3 = await prisma.rule.create({
    data: {
      id: 'rul_newsletter',
      name: 'Filter Newsletters & Subscriptions',
      description: 'Mark emails containing unsubscribe links as Read Later',
      isActive: true,
      priority: 5,
      conditions: JSON.stringify([
        { field: 'body', operator: 'contains', value: 'unsubscribe' }
      ]),
      actions: JSON.stringify([
        { type: 'label', config: { labelName: 'Newsletters' } }
      ]),
    },
  });

  // 5. Create demo emails with classifications
  const emailsData = [
    {
      id: 'em_1',
      messageId: 'msg_001',
      threadId: 'th_001',
      senderName: 'Amazon Services',
      senderEmail: 'auto-confirm@amazon.com',
      recipients: 'demo.user@gmail.com',
      subject: 'Your Amazon.com order #114-8927318 confirmation',
      snippet: 'Thank you for shopping. Your order of $45.99 has been confirmed...',
      body: 'Hello Demo, thank you for shopping with us. Your order #114-8927318 containing "Ergonomic Office Chair" for a total of $45.99 (including $3.50 tax) has been successfully paid and will ship tomorrow. View details inside your account.',
      receivedAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
      labels: JSON.stringify(['Inbox']),
      attachments: JSON.stringify([]),
      importance: 'normal',
      isRead: false,
      isStarred: false,
      headers: JSON.stringify({ From: 'auto-confirm@amazon.com', To: 'demo.user@gmail.com', Date: new Date().toISOString() }),
      containsDeadline: false,
      containsInvoice: true,
      containsMeeting: false,
      containsAttachment: false,
      containsActionItem: false,
      urgencyScore: 10,
      priorityScore: 50,
      senderReputation: 'known',
      threadLength: 1,
      status: 'classified',
      category: 'Receipt',
      confidence: 98,
      isApproved: false,
      recommendedAction: 'APPLY_GMAIL_LABEL',
      ruleId: rule1.id
    },
    {
      id: 'em_2',
      messageId: 'msg_002',
      threadId: 'th_002',
      senderName: 'Sarah Jenkins',
      senderEmail: 'sarah.jenkins@company.com',
      recipients: 'demo.user@gmail.com',
      subject: 'URGENT: Project alignment meeting scheduling',
      snippet: 'We need to align on client deliverables. Please select a time for our meeting...',
      body: 'Hi Demo, we have a tight deadline for the client delivery on Friday. Can you please review this draft agenda and book a slot on my calendar? Here is the Google Meet link: https://meet.google.com/abc-defg-hij. Let me know by end of day Monday.',
      receivedAt: new Date(Date.now() - 3600000 * 5), // 5 hours ago
      labels: JSON.stringify(['Inbox', 'Starred']),
      attachments: JSON.stringify([]),
      importance: 'high',
      isRead: false,
      isStarred: true,
      headers: JSON.stringify({ From: 'sarah.jenkins@company.com', To: 'demo.user@gmail.com', Date: new Date().toISOString() }),
      containsDeadline: true,
      containsInvoice: false,
      containsMeeting: true,
      containsAttachment: false,
      containsActionItem: true,
      urgencyScore: 85,
      priorityScore: 90,
      senderReputation: 'important',
      threadLength: 2,
      status: 'classified',
      category: 'Meeting',
      confidence: 92,
      isApproved: false,
      recommendedAction: 'CREATE_CALENDAR_REMINDER',
      ruleId: rule2.id
    },
    {
      id: 'em_3',
      messageId: 'msg_003',
      threadId: 'th_003',
      senderName: 'Medium Daily',
      senderEmail: 'noreply@medium.com',
      recipients: 'demo.user@gmail.com',
      subject: 'Medium Daily Digest: Top 5 stories in Software Engineering',
      snippet: 'Inside: Why simple code is better, design patterns, and Web3 trends...',
      body: 'Welcome to Medium. Here is your daily digest of stories you follow. 1. Simple Code Wins by Karpathy. 2. TypeScript Best Practices. To manage your subscriptions or unsubscribe, click here.',
      receivedAt: new Date(Date.now() - 3600000 * 18), // 18 hours ago
      labels: JSON.stringify(['Inbox']),
      attachments: JSON.stringify([]),
      importance: 'low',
      isRead: true,
      isStarred: false,
      headers: JSON.stringify({ From: 'noreply@medium.com', To: 'demo.user@gmail.com', Date: new Date().toISOString() }),
      containsDeadline: false,
      containsInvoice: false,
      containsMeeting: false,
      containsAttachment: false,
      containsActionItem: false,
      urgencyScore: 0,
      priorityScore: 10,
      senderReputation: 'known',
      threadLength: 1,
      status: 'completed',
      category: 'Newsletter',
      confidence: 95,
      isApproved: true,
      approvedBy: 'auto',
      recommendedAction: 'MARK_READ',
      ruleId: rule3.id
    },
    {
      id: 'em_4',
      messageId: 'msg_004',
      threadId: 'th_004',
      senderName: 'Acme Invoice Corp',
      senderEmail: 'billing@acme.corp',
      recipients: 'demo.user@gmail.com',
      subject: 'Invoice #INV-2026-9081 from Acme Corp',
      snippet: 'Your monthly hosting services invoice is ready. Amount due: $250.00...',
      body: 'Hi Customer, your hosting invoice for the month of June is attached. The total amount due is $250.00 due by July 15, 2026. Please click the payment link to process.',
      receivedAt: new Date(Date.now() - 3600000 * 24), // 24 hours ago
      labels: JSON.stringify(['Inbox']),
      attachments: JSON.stringify(['invoice_inv2026.pdf']),
      importance: 'high',
      isRead: false,
      isStarred: false,
      headers: JSON.stringify({ From: 'billing@acme.corp', To: 'demo.user@gmail.com', Date: new Date().toISOString() }),
      containsDeadline: true,
      containsInvoice: true,
      containsMeeting: false,
      containsAttachment: true,
      containsActionItem: true,
      urgencyScore: 75,
      priorityScore: 85,
      senderReputation: 'unknown',
      threadLength: 1,
      status: 'classified',
      category: 'Invoice',
      confidence: 96,
      isApproved: false,
      recommendedAction: 'CREATE_NOTION_TASK',
      ruleId: null
    }
  ];

  for (const emailData of emailsData) {
    const { category, confidence, isApproved, approvedBy, recommendedAction, ruleId, ...emailFields } = emailData;
    
    const email = await prisma.email.create({
      data: emailFields,
    });

    await prisma.classification.create({
      data: {
        emailId: email.id,
        category,
        confidenceScore: confidence,
        ruleId,
        isApproved,
        approvedBy,
        approvedAt: isApproved ? new Date() : null,
        recommendedAction,
        features: JSON.stringify({
          containsDeadline: emailFields.containsDeadline,
          containsInvoice: emailFields.containsInvoice,
          containsMeeting: emailFields.containsMeeting,
          containsAttachment: emailFields.containsAttachment,
          containsActionItem: emailFields.containsActionItem,
          urgencyScore: emailFields.urgencyScore,
          priorityScore: emailFields.priorityScore,
          senderReputation: emailFields.senderReputation,
          threadLength: emailFields.threadLength,
          detectedDates: emailFields.containsDeadline ? ['2026-07-15'] : [],
          meetingLinks: emailFields.containsMeeting ? ['https://meet.google.com/abc-defg-hij'] : []
        })
      }
    });

    // Write audit records
    await prisma.auditLog.create({
      data: {
        emailId: email.id,
        action: 'fetch',
        fromState: null,
        toState: 'fetched',
        actor: 'system',
        details: JSON.stringify({ message: 'Successfully fetched message from Gmail API' })
      }
    });
    
    await prisma.auditLog.create({
      data: {
        emailId: email.id,
        action: 'normalize',
        fromState: 'fetched',
        toState: 'normalized',
        actor: 'system',
        details: JSON.stringify({ message: 'Normalized sender headers and body plain text' })
      }
    });

    await prisma.auditLog.create({
      data: {
        emailId: email.id,
        action: 'classify',
        fromState: 'normalized',
        toState: 'classified',
        actor: 'system',
        confidence,
        details: JSON.stringify({ message: `Classified as ${category} with confidence ${confidence}%`, ruleId })
      }
    });

    if (isApproved) {
      await prisma.auditLog.create({
        data: {
          emailId: email.id,
          action: 'approve',
          fromState: 'classified',
          toState: 'approved',
          actor: approvedBy === 'auto' ? 'auto' : 'user',
          details: JSON.stringify({ message: `Approved recommended action: ${recommendedAction}` })
        }
      });
      await prisma.email.update({
        where: { id: email.id },
        data: { status: 'completed' }
      });
    }
  }

  // 6. Seed run history
  await prisma.runHistory.create({
    data: {
      id: 'run_1',
      runType: 'sync',
      status: 'completed',
      startedAt: new Date(Date.now() - 3600000 * 3), // 3 hours ago
      completedAt: new Date(Date.now() - 3600000 * 3 + 2400),
      emailsProcessed: 12,
      tasksCreated: 1,
      eventsCreated: 0,
      errors: 0,
      duration: 2400,
      details: JSON.stringify({ message: 'Sync cycle completed successfully' })
    }
  });

  await prisma.runHistory.create({
    data: {
      id: 'run_2',
      runType: 'sync',
      status: 'completed',
      startedAt: new Date(Date.now() - 15 * 60000), // 15 mins ago
      completedAt: new Date(Date.now() - 15 * 60000 + 1800),
      emailsProcessed: 4,
      tasksCreated: 0,
      eventsCreated: 1,
      errors: 0,
      duration: 1800,
      details: JSON.stringify({ message: 'Sync cycle completed successfully' })
    }
  });

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
