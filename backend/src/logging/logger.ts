import fs from 'fs';
import path from 'path';

const LOGS_DIR = process.cwd();
const APP_LOG_PATH = path.join(LOGS_DIR, 'app.log');
const ERROR_LOG_PATH = path.join(LOGS_DIR, 'error.log');
const AUDIT_LOG_PATH = path.join(LOGS_DIR, 'audit.log');

export interface LogPayload {
  jobId?: string;
  emailId?: string;
  action?: string;
  duration?: number;
  result?: any;
  retryCount?: number;
  error?: string;
  userDecision?: string;
  confidence?: number;
  [key: string]: any;
}

function writeLog(filePath: string, level: string, message: string, payload?: LogPayload) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...payload,
  };
  const jsonLine = JSON.stringify(logEntry) + '\n';
  try {
    fs.appendFileSync(filePath, jsonLine, 'utf8');
  } catch (err) {
    console.error(`Failed to write log to ${filePath}:`, err);
  }

  // Print to stdout in a clean readable way
  const color = level === 'error' ? '\x1b[31m' : level === 'warn' ? '\x1b[33m' : '\x1b[32m';
  const reset = '\x1b[0m';
  console.log(`[${logEntry.timestamp}] ${color}${level.toUpperCase()}${reset}: ${message}`, payload ? JSON.stringify(payload) : '');
}

export const logger = {
  trace(message: string, payload?: LogPayload) {
    writeLog(APP_LOG_PATH, 'trace', message, payload);
  },
  debug(message: string, payload?: LogPayload) {
    writeLog(APP_LOG_PATH, 'debug', message, payload);
  },
  info(message: string, payload?: LogPayload) {
    writeLog(APP_LOG_PATH, 'info', message, payload);
  },
  warn(message: string, payload?: LogPayload) {
    writeLog(APP_LOG_PATH, 'warn', message, payload);
    writeLog(ERROR_LOG_PATH, 'warn', message, payload);
  },
  error(message: string, payload?: LogPayload) {
    writeLog(APP_LOG_PATH, 'error', message, payload);
    writeLog(ERROR_LOG_PATH, 'error', message, payload);
  },
  fatal(message: string, payload?: LogPayload) {
    writeLog(APP_LOG_PATH, 'fatal', message, payload);
    writeLog(ERROR_LOG_PATH, 'fatal', message, payload);
  },
  audit(action: string, fromState: string | null, toState: string | null, actor: 'system' | 'user' | 'auto', details: any, payload?: LogPayload) {
    const auditPayload = {
      action,
      fromState,
      toState,
      actor,
      details,
      ...payload,
    };
    writeLog(AUDIT_LOG_PATH, 'audit', `Audit trail: ${action}`, auditPayload);
  }
};
