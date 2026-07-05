import crypto from 'crypto';
import { env } from '../config/env.js';
import { prisma } from '../storage/database.js';
import { logger } from '../logging/logger.js';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(env.ENCRYPTION_KEY, 'hex');

if (KEY.length !== 32) {
  logger.error('ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters) in length.');
}

/**
 * Encrypt a plain-text string using AES-256-GCM.
 */
export function encryptToken(text: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt a cipher-text string back to plain-text.
 */
export function decryptToken(encryptedText: string): string {
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format');
  }
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export const TokenManager = {
  /**
   * Save OAuth access and refresh tokens in database (encrypted).
   */
  async saveTokens(userId: string, accessToken: string, refreshToken: string, scope: string, expiresAt: Date) {
    const encryptedAccess = encryptToken(accessToken);
    const encryptedRefresh = encryptToken(refreshToken);

    try {
      return await prisma.oAuthToken.upsert({
        where: { userId },
        update: {
          accessToken: encryptedAccess,
          refreshToken: encryptedRefresh,
          scope,
          expiresAt,
          updatedAt: new Date(),
        },
        create: {
          userId,
          provider: 'google',
          accessToken: encryptedAccess,
          refreshToken: encryptedRefresh,
          scope,
          expiresAt,
        },
      });
    } catch (err) {
      logger.error('Failed to save OAuth tokens in DB', { error: String(err), userId });
      throw err;
    }
  },

  /**
   * Retrieve OAuth tokens for a user, decrypting them.
   */
  async getTokens(userId: string) {
    try {
      const record = await prisma.oAuthToken.findUnique({
        where: { userId },
      });

      if (!record) return null;

      return {
        ...record,
        accessToken: decryptToken(record.accessToken),
        refreshToken: decryptToken(record.refreshToken),
        isExpired: new Date() >= record.expiresAt,
      };
    } catch (err) {
      logger.error('Failed to get or decrypt OAuth tokens', { error: String(err), userId });
      return null;
    }
  },

  /**
   * Delete user tokens (e.g. disconnect).
   */
  async deleteTokens(userId: string) {
    try {
      await prisma.oAuthToken.deleteMany({
        where: { userId },
      });
      logger.info('OAuth tokens deleted for user', { userId });
    } catch (err) {
      logger.error('Failed to delete OAuth tokens', { error: String(err), userId });
      throw err;
    }
  }
};
