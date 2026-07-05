-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OAuthToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'google',
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "tokenType" TEXT NOT NULL DEFAULT 'Bearer',
    "scope" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OAuthToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Email" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT NOT NULL,
    "threadId" TEXT,
    "senderName" TEXT,
    "senderEmail" TEXT NOT NULL,
    "recipients" TEXT,
    "subject" TEXT,
    "snippet" TEXT,
    "body" TEXT,
    "receivedAt" DATETIME NOT NULL,
    "labels" TEXT,
    "attachments" TEXT,
    "importance" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "headers" TEXT,
    "containsDeadline" BOOLEAN NOT NULL DEFAULT false,
    "containsInvoice" BOOLEAN NOT NULL DEFAULT false,
    "containsMeeting" BOOLEAN NOT NULL DEFAULT false,
    "containsAttachment" BOOLEAN NOT NULL DEFAULT false,
    "containsActionItem" BOOLEAN NOT NULL DEFAULT false,
    "urgencyScore" REAL NOT NULL DEFAULT 0,
    "priorityScore" REAL NOT NULL DEFAULT 0,
    "senderReputation" TEXT,
    "threadLength" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'fetched',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "conditions" TEXT NOT NULL,
    "actions" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Classification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "confidenceScore" REAL NOT NULL,
    "features" TEXT,
    "ruleId" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "recommendedAction" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Classification_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Classification_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "emailId" TEXT,
    "payload" TEXT,
    "result" TEXT,
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 5,
    "nextRetryAt" DATETIME,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Job_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "duration" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RetryQueue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "failureReason" TEXT NOT NULL,
    "failureCategory" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "nextRetryAt" DATETIME NOT NULL,
    "backoffMs" INTEGER NOT NULL,
    "isDead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RetryQueue_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailId" TEXT,
    "jobId" TEXT,
    "action" TEXT NOT NULL,
    "fromState" TEXT,
    "toState" TEXT,
    "actor" TEXT NOT NULL,
    "details" TEXT,
    "confidence" REAL,
    "userDecision" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotionTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailId" TEXT NOT NULL,
    "notionPageId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "emailUrl" TEXT,
    "dueDate" DATETIME,
    "priority" TEXT,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "labels" TEXT,
    "sender" TEXT,
    "notes" TEXT,
    "databaseId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailId" TEXT NOT NULL,
    "googleEventId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "reminderTime" DATETIME,
    "location" TEXT,
    "attendees" TEXT,
    "duration" INTEGER,
    "sourceEmail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "syncInterval" INTEGER NOT NULL DEFAULT 15,
    "retryInterval" INTEGER NOT NULL DEFAULT 5,
    "cleanupInterval" INTEGER NOT NULL DEFAULT 1440,
    "digestTime" TEXT NOT NULL DEFAULT '20:00',
    "defaultCategory" TEXT NOT NULL DEFAULT 'read_later',
    "retryLimit" INTEGER NOT NULL DEFAULT 5,
    "confidenceThresholdAuto" INTEGER NOT NULL DEFAULT 90,
    "confidenceThresholdReview" INTEGER NOT NULL DEFAULT 70,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "fontSize" INTEGER NOT NULL DEFAULT 16,
    "notionApiKey" TEXT,
    "notionDatabaseId" TEXT,
    "calendarEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RunHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "emailsProcessed" INTEGER NOT NULL DEFAULT 0,
    "tasksCreated" INTEGER NOT NULL DEFAULT 0,
    "eventsCreated" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER,
    "details" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthToken_userId_key" ON "OAuthToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Email_messageId_key" ON "Email"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "RetryQueue_jobId_key" ON "RetryQueue"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "NotionTask_emailId_key" ON "NotionTask"("emailId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_emailId_key" ON "CalendarEvent"("emailId");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_userId_key" ON "Settings"("userId");
