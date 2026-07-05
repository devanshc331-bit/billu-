import { prisma } from '../storage/database.js';
import { logger } from './logger.js';

export interface AuditLogOptions {
  emailId?: string | null;
  jobId?: string | null;
  action: string;
  fromState?: string | null;
  toState?: string | null;
  actor: 'system' | 'user' | 'auto';
  details?: any;
  confidence?: number | null;
  userDecision?: 'approved' | 'rejected' | 'edited' | 'ignored' | null;
}

export async function writeAuditLog(options: AuditLogOptions) {
  const detailsStr = options.details ? JSON.stringify(options.details) : null;
  
  try {
    const log = await prisma.auditLog.create({
      data: {
        emailId: options.emailId ?? null,
        jobId: options.jobId ?? null,
        action: options.action,
        fromState: options.fromState ?? null,
        toState: options.toState ?? null,
        actor: options.actor,
        details: detailsStr,
        confidence: options.confidence ?? null,
        userDecision: options.userDecision ?? null,
      },
    });

    // Write to audit JSON file
    logger.audit(
      options.action,
      options.fromState ?? null,
      options.toState ?? null,
      options.actor,
      options.details,
      {
        emailId: options.emailId ?? undefined,
        jobId: options.jobId ?? undefined,
        confidence: options.confidence ?? undefined,
        userDecision: options.userDecision ?? undefined,
      }
    );

    return log;
  } catch (error) {
    logger.error('Failed to write database audit log', { error: String(error) });
  }
}
