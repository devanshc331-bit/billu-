import crypto from 'crypto';
import { google } from 'googleapis';
import { env } from '../config/env.js';
import { TokenManager } from './token.manager.js';
import { logger } from '../logging/logger.js';

// In-memory store for pending PKCE verifiers to keep things local-first and simple
const pendingVerifiers = new Map<string, { verifier: string; expiresAt: number }>();

function generateVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

function generateChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

export const OAuthService = {
  /**
   * Get Google OAuth login URL with PKCE verifier challenge.
   */
  getAuthUrl(state: string = 'default') {
    const verifier = generateVerifier();
    const challenge = generateChallenge(verifier);
    
    // Store verifier with 10 mins expiry
    pendingVerifiers.set(state, {
      verifier,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    if (env.MOCK_MODE) {
      logger.info('Google OAuth Auth URL requested (MOCK MODE).');
      const mockRedirectUri = `${env.GOOGLE_REDIRECT_URI ?? 'http://localhost:3001/api/auth/google/callback'}?code=mock_auth_code&state=${state}`;
      return {
        url: mockRedirectUri,
        verifier,
      };
    }

    const oauth2Client = new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_REDIRECT_URI
    );

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/userinfo.email',
        'openid'
      ],
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256' as any,
    });

    return { url, verifier };
  },

  /**
   * Retrieve the verifier for a state session.
   */
  getVerifier(state: string): string | null {
    const record = pendingVerifiers.get(state);
    if (!record) return null;
    pendingVerifiers.delete(state); // use once
    if (Date.now() > record.expiresAt) return null;
    return record.verifier;
  },

  /**
   * Exchange OAuth auth code for tokens.
   */
  async exchangeCode(code: string, verifier: string) {
    if (env.MOCK_MODE || code === 'mock_auth_code') {
      logger.info('Exchanging OAuth authorization code (MOCK MODE).');
      return {
        accessToken: 'mock_access_token_xyz',
        refreshToken: 'mock_refresh_token_123',
        scope: 'gmail.readonly gmail.modify openid email',
        expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
        email: 'demo.user@gmail.com',
      };
    }

    const oauth2Client = new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_REDIRECT_URI
    );

    try {
      const { tokens } = await oauth2Client.getToken({
        code,
        codeVerifier: verifier,
      });

      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error('OAuth token exchange returned incomplete tokens.');
      }

      oauth2Client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      const email = userInfo.data.email;

      if (!email) {
        throw new Error('OAuth user info does not contain email.');
      }

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        scope: tokens.scope || 'gmail.readonly gmail.modify openid email',
        expiresAt: new Date(tokens.expiry_date || Date.now() + 3600 * 1000),
        email,
      };
    } catch (err) {
      logger.error('Failed exchanging authorization code for tokens', { error: String(err) });
      throw err;
    }
  },

  /**
   * Refresh expired access token.
   */
  async refreshTokens(refreshToken: string) {
    if (env.MOCK_MODE || refreshToken.startsWith('mock_')) {
      logger.info('Refreshing access token (MOCK MODE).');
      return {
        accessToken: 'mock_refreshed_access_token_abc_' + Date.now(),
        expiresAt: new Date(Date.now() + 3600 * 1000),
      };
    }

    const oauth2Client = new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      if (!credentials.access_token) {
        throw new Error('Refresh token flow did not return access_token.');
      }

      return {
        accessToken: credentials.access_token,
        expiresAt: new Date(credentials.expiry_date || Date.now() + 3600 * 1000),
      };
    } catch (err) {
      logger.error('Failed to refresh OAuth access token', { error: String(err) });
      throw err;
    }
  },

  /**
   * Revoke tokens and disconnect account.
   */
  async disconnect(userId: string) {
    const tokens = await TokenManager.getTokens(userId);
    if (!tokens) return;

    if (!env.MOCK_MODE && !tokens.accessToken.startsWith('mock_')) {
      try {
        const oauth2Client = new google.auth.OAuth2();
        await oauth2Client.revokeToken(tokens.accessToken);
        logger.info('Google OAuth token revoked from API server.');
      } catch (err) {
        logger.warn('Failed to revoke Google token during disconnect, deleting locally anyway.', { error: String(err) });
      }
    }

    await TokenManager.deleteTokens(userId);
  }
};
