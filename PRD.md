## **Product Requirements Document (PRD)** 

## **Smart Inbox Triage Dashboard** 

**Version:** 1.0 **Status:** Draft **Product Type:** Local-first Productivity Automation Tool **Target Users:** Professionals, students, freelancers, founders, researchers, and anyone who receives a high volume of email. 

## **1. Executive Summary** 

Smart Inbox Triage Dashboard is a **self-hosted desktop/web application** that intelligently organizes Gmail messages into actionable categories while keeping users fully in control. 

Unlike traditional email clients that only provide filters and folders, this application acts as an **automation assistant** that reviews incoming mail, suggests actions, creates tasks or reminders, and asks for approval before performing sensitive operations. 

The system follows a **human-in-the-loop architecture** , ensuring that no important email is accidentally ignored or acted upon automatically. 

Everything runs locally except API communication with Gmail and optional external integrations like Notion or Google Calendar. 

The primary goal is reducing inbox management time while maintaining complete transparency and auditability. 

## **2. Vision** 

Create a trustworthy local automation system that helps users process email in minutes instead of hours without sacrificing safety. 

## **3. Product Goals** 

The application should: 

- Reduce manual inbox sorting 

- 

- Prevent important emails from being buried 

- 

- Automatically identify actionable messages 

- Convert emails into tasks 

- 

1 

- Create reminders for deadlines 

- Learn user preferences over time 

- Keep complete logs of every automated decision 

- Never perform high-risk actions without approval 

- Work offline whenever possible 

- Store user data locally 

## **4. Success Metrics** 

## **User Metrics** 

- Inbox processing time reduced by 70% 

- 95% of actionable emails detected 

- Less than 1% duplicate task creation 

- Under 5 seconds processing for 100 emails 

- Zero accidental deletion 

## **Technical Metrics** 

OAuth success rate >99% 

Task creation success >98% 

Retry success >90% 

Dashboard load time <2 seconds 

Scheduler reliability >99% 

## **5. Scope** 

## **Included** 

Gmail OAuth 

Inbox synchronization 

Incremental sync 

Classification engine 

Rule engine 

Dashboard 

Review queue 

2 

Task creation 

Calendar reminder creation 

Logging 

Retry system 

Audit trail 

Search 

Run history 

Settings 

Notification center 

Rule editor 

## **Not Included (v1)** 

Multiple Gmail accounts 

AI-generated email replies 

Deleting emails automatically 

Sending emails 

Mobile application 

Shared workspaces 

Cloud synchronization 

## **6. User Personas** 

3 

## **Persona 1** 

## **Busy Professional** 

Receives 

- meetings 

- invoices 

- newsletters 

- HR emails 

- customer emails 

Pain Points 

Important emails disappear among newsletters. 

Needs 

Automatic prioritization. 

## **Persona 2** 

## **University Student** 

Receives 

Assignments 

Exam schedules 

Administrative emails 

Club notifications 

Internship alerts 

Needs 

Assignment reminders. 

## **Persona 3** 

## **Freelancer** 

Receives 

Invoices 

4 

Contracts 

Client requests 

Marketing emails 

Needs 

Every client email becomes a task. 

## **7. User Stories** 

## **Authentication** 

As a user 

I want to connect Gmail securely 

So I don't need passwords inside the app. 

As a user 

I want OAuth tokens refreshed automatically 

So I don't reconnect repeatedly. 

## **Inbox** 

As a user 

I want unread emails synced every 15 minutes 

So my dashboard stays current. 

As a user 

I want duplicate emails ignored 

So processing is reliable. 

## **Classification** 

As a user 

5 

I want emails grouped into meaningful categories 

So I know what requires attention. 

Categories Ignore Newsletter Promotion Receipt Finance Travel School Work Urgent Needs Reply Reminder Meeting Invoice Follow Up Spam Candidate Read Later 

Task Candidate 

Calendar Candidate 

## **Review Queue** 

As a user 

6 

I want suggested actions reviewed first 

So nothing important happens automatically. 

## **Task Creation** 

As a user 

I want one-click approval 

So tasks appear in Notion. 

## **Logging** 

As a user 

I want every decision recorded 

So I understand why something happened. 

## **8. Functional Requirements** 

## **Authentication Module** 

## **Features** 

Google OAuth 2.0 

PKCE Flow 

Refresh tokens 

Secure local token storage 

Disconnect account 

Reconnect 

Expired token detection 

Multiple scopes validation 

7 

## **Required Gmail Scopes** 

gmail.readonly 

gmail.modify 

userinfo.email 

openid 

## **Inbox Synchronization** 

Scheduler interval configurable 

Default 

15 minutes 

Manual sync button 

Incremental sync 

Pagination 

Batch fetch 

Duplicate prevention 

History tracking 

Sync statistics 

Data Retrieved 

Message ID 

Thread ID 

Sender 

Recipients 

Subject 

Snippet 

8 

Body (optional) 

Timestamp Labels Attachments Headers Read status 

Importance 

Starred 

## **9. Message Normalization** 

Raw Gmail messages become 

```
Email
id
thread_id
sender_name
sender_email
subject
snippet
body
received_at
labels
attachments
importance
category
confidence_score
```

9 

`status created_at updated_at` Derived fields 

Contains deadline Contains invoice Contains meeting Contains attachment Contains action item Urgency score 

Priority score Sender reputation 

Thread length 

## **10. Classification Engine** 

Pipeline 

Fetch 

↓ 

Normalize 

↓ 

Feature Extraction 

↓ 

Rule Evaluation 

↓ 

10 

Confidence Scoring 

## ↓ 

Action Recommendation 

↓ 

Human Approval 

↓ 

Execution 

↓ 

Logging 

## **Classification Rules** 

Newsletter 

Sender contains 

newsletter 

digest 

updates 

weekly 

Needs Reply 

Question marks 

Action verbs 

Client emails 

Manager emails 

Meeting 

Google Meet links 

11 

Zoom links 

Calendar invite 

ICS attachment 

Invoice 

Invoice 

Receipt 

Payment 

Amount 

GST 

Tax 

School 

Assignment Exam 

Professor 

Course 

Deadline 

## **11. Rule Engine** 

Users create rules. 

Example 

IF 

sender contains amazon 

THEN 

12 

Category 

Receipt 

AND 

Create Notion Task = false 

Rule Types 

Contains Starts With Ends With Regex Label Exists 

Attachment Exists 

Date 

Sender Domain 

Priority 

Subject 

Body 

Rule Actions 

Ignore 

Label 

Task 

Reminder 

Review 

Star 

13 

Archive Suggestion 

## **12. Confidence Scoring** 

Every prediction gets 

0–100 score 

Example 

Invoice 98% Meeting 91% Needs Reply 

74% Unknown 

43% 

Thresholds 

90+ 

Automatic safe action 

70–90 

Review 

Below 70 

Manual only 

## **13. Dashboard** 

Sections 

Overview 

14 

Today's Activity 

Inbox Status 

Review Queue 

Action Queue 

Run History 

Retry Queue 

Settings 

Rules 

Logs 

Analytics 

Dashboard Cards 

Unread emails 

Processed today 

Tasks created 

Meetings created 

Failed jobs 

Pending approvals 

Average confidence 

Sync duration 

## **14. Review Queue** 

Columns 

Sender 

Subject 

15 

Prediction Confidence Recommended Action 

Created Buttons Approve Reject Edit 

Ignore Open Email Retry 

Bulk Approve 

Bulk Reject 

## **15. Action Engine** 

Possible Actions 

Create Notion Task 

Create Calendar Reminder 

Apply Gmail Label 

Mark Read 

Archive Suggestion 

Reminder Notification 

Approval Required 

Invoices 

16 

Legal 

Medical 

Financial 

Unknown sender 

Low confidence 

Large attachments 

## **16. Notion Integration** 

Capabilities 

Create Task 

Priority 

Due Date 

Tags 

Email Link 

Sender 

Notes 

Database Selection 

Fields 

Title 

Description 

Email URL 

Due Date 

Priority 

Status 

17 

Labels 

## **17. Google Calendar Integration** 

Creates 

Reminder 

Meeting 

Follow-up 

Deadline Event Fields Title 

Description Reminder Time 

Location 

Attendees 

Duration 

Source Email 

## **18. Scheduler** 

Runs 

Startup Sync 

Scheduled Sync 

Manual Sync 

Retry Jobs 

Cleanup 

Backoff Scheduler 

18 

Intervals 

Inbox 

15 min 

Retry 

5 min 

Cleanup 

24 hr 

Digest 

8 PM 

## **19. Retry System** 

Failures 

Network 

Timeout 

Rate Limit 

Server Error 

API Error 

Authentication 

Retry Policy 

Attempt 1 

Immediate 

Attempt 2 

30 sec 

19 

Attempt 3 

2 min 

Attempt 4 

5 min 

Attempt 5 15 min Then 

Dead Letter Queue 

## **20. Logging** 

Structured JSON Logs 

Fields 

Timestamp 

Job ID Email ID Action 

Duration Result 

Retry Count 

Error 

User Decision 

Confidence 

## **21. Audit Trail** 

Every state transition 

20 

Fetched 

## ↓ 

Normalized 

↓ 

Classified 

↓ 

Queued 

↓ 

Approved 

↓ 

Executed 

↓ 

Completed 

## **22. Notifications** 

Desktop notifications 

Task created 

Calendar reminder 

Failed sync 

OAuth expired 

Retry success 

Review pending 

## **23. Search** 

Search by 

21 

Sender Subject Keyword 

Category Confidence Date 

Task Status Email ID 

Thread 

## **24. Analytics** 

Charts 

Daily emails 

Category distribution Average confidence 

Success rate Retry count 

Task creation trend 

Review approval % 

## **25. Settings** 

Scheduler interval 

Default category 

Retry limits 

Notification preferences 

22 

OAuth management 

Theme 

Database 

Export logs 

Reset rules 

## **26. Database Schema** 

Tables 

Users 

OAuthTokens 

Emails 

Rules Classifications Jobs 

JobLogs 

RetryQueue AuditLogs 

NotionTasks 

CalendarEvents 

Settings 

RunHistory 

## **27. API Layer** 

Modules 

OAuth Service 

23 

Gmail Client Rule Engine Classifier Task Service Calendar Service Scheduler 

Logger 

Retry Manager 

Dashboard API 

## **28. Error Handling** 

Scenarios 

Token expired 

Reconnect prompt 

Rate limited 

Retry 

Duplicate task 

Skip 

API unavailable 

Queue retry 

Database locked 

Retry transaction 

## **29. Security Requirements** 

Encrypted tokens 

24 

HTTPS OAuth 

No password storage 

Read-only scopes where possible 

Audit logs immutable 

CSRF protection 

Environment variables 

Secrets never logged 

## **30. Performance Requirements** 

100 emails processed 

<5 sec 

Dashboard load 

<2 sec 

Search 

<500 ms 

Rule evaluation 

<100 ms 

Task creation 

<2 sec 

## **31. Accessibility** 

Keyboard shortcuts 

High contrast 

Screen reader support 

Responsive layout 

25 

Dark mode 

Font scaling 

## **32. Testing** 

Unit Tests 

Classifier 

Rule Engine 

Scheduler 

Retry 

OAuth 

Integration Tests 

Gmail 

Notion 

Calendar 

SQLite 

End-to-End Tests 

Complete workflow 

Failure recovery 

Duplicate detection 

## **33. Stretch Features** 

AI-assisted rule suggestions 

Semantic email clustering 

Receipt OCR 

Expense tracking 

26 

Attachment indexing 

Natural-language dashboard search 

Daily digest email 

Weekly productivity report 

LLM-based classification fallback Voice notifications Slack integration Microsoft To Do 

Todoist 

Outlook support 

Multi-account support 

Learning from approvals 

Automatic smart labels 

Vector search over emails 

## **34. Recommended Tech Stack** 

## **Frontend** 

- React 

- TypeScript • Vite 

- Tailwind CSS 

- shadcn/ui 

- TanStack Query 

- React Router 

- Recharts 

## **Backend** 

- FastAPI (Python) or Node.js with Express/NestJS 

- SQLAlchemy or Prisma 

- APScheduler / Celery (Python) or BullMQ (Node.js) 

27 

## **Database** 

- SQLite (default) 

- PostgreSQL (optional upgrade) 

## **Authentication** 

- Google OAuth 2.0 with PKCE • Local encrypted credential storage 

## **APIs** 

- Gmail API 

- Notion API 

- Google Calendar API 

## **Infrastructure** 

- Docker & Docker Compose 

- Local filesystem for attachments 

- Structured logging with Loguru/Pino 

- Redis (optional for queues) 

## **35. Project Milestones** 

## **Phase 1 (Hours 1–3)** 

- Repository setup 

- Project structure 

- Database schema 

- Dashboard shell 

- Authentication UI 

## **Phase 2 (Hours 4–6)** 

- Google OAuth 

- Gmail API integration 

- Initial email synchronization 

- Pagination 

- Token refresh 

## **Phase 3 (Hours 7–10)** 

- Email normalization 

- Classification engine 

- Rule engine 

- Review queue 

- Confidence scoring 

28 

## **Phase 4 (Hours 11–14)** 

- Notion integration 

- Google Calendar integration 

- Action approval workflow 

- Logging 

- Retry queue 

## **Phase 5 (Hours 15–18)** 

- Analytics 

- Testing 

- Failure simulation 

- Performance optimization 

- Documentation 

- Demo data 

- Final README 

## **36. Portfolio Value** 

This project demonstrates practical software engineering skills beyond a typical CRUD application, including secure OAuth authentication, third-party API integrations, asynchronous job processing, retry and recovery mechanisms, structured logging, human-in-the-loop automation, stateful workflow orchestration, and production-style observability. It showcases an understanding of building resilient automation systems that prioritize user safety, auditability, and maintainability—qualities highly valued in backend, full-stack, platform engineering, and developer tooling roles. 

## **37. Future Roadmap (v2+)** 

- AI-powered semantic classification using local LLMs 

- Adaptive rule recommendations based on approval history 

- Multi-provider email support (Outlook, Yahoo, IMAP) 

- Cross-device synchronization 

- Team workspaces with shared triage rules 

- Plugin architecture for custom automation actions 

- Vector database for semantic email search 

- OCR and document intelligence for attachments 

- Mobile companion application 

- End-to-end encrypted backup and restore 

- Workflow templates and automation marketplace 

- Voice-controlled inbox management 

- Advanced analytics with productivity insights 

- Enterprise SSO and role-based access control 

- Webhook support for external workflow automation (Zapier, n8n, Make) 

29 

## **Acceptance Criteria** 

The MVP will be considered complete when a user can: 

1. Securely authenticate with Gmail using OAuth 2.0. 

2. Synchronize recent emails incrementally without creating duplicates. 

3. View normalized emails categorized into actionable buckets. 

4. Review and approve or reject suggested actions through a dedicated review queue. 

5. Automatically create approved tasks in Notion or reminders/events in Google Calendar. 

- View complete audit logs, job history, and retry status for every processed email. 

6. 

7. Recover gracefully from partial failures (e.g., Gmail fetch succeeds but Notion creation fails) using an automatic retry mechanism with exponential backoff. 

- Configure custom classification rules and scheduler settings without modifying code. 

8. 

9. Operate entirely as a local-first application while securely storing credentials and application data. 

10. Demonstrate reliable, observable, and production-style workflow behavior suitable for showcasing as a professional portfolio project. 

30 

