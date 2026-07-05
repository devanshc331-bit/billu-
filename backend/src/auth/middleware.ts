import { Request, Response, NextFunction } from 'express';
import { TokenManager } from './token.manager.js';
import { OAuthService } from './oauth.service.js';
import { logger } from '../logging/logger.js';

// Extend Express Request types to hold OAuth token info
declare global {
  namespace Express {
    interface Request {
      oauthClient?: any; // Google auth client if authenticated
      userId?: string;
      accessToken?: string;
    }
  }
}

export async function validateToken(req: Request, res: Response, next: NextFunction) {
  const userId = 'usr_default'; // Local-first single user mode
  req.userId = userId;

  try {
    const tokens = await TokenManager.getTokens(userId);
    if (!tokens) {
      return res.status(401).json({ error: 'unauthorized', message: 'No Google account connected.' });
    }

    if (tokens.isExpired) {
      logger.info('OAuth token expired. Attempting automatic token refresh.', { userId });
      try {
        const refreshed = await OAuthService.refreshTokens(tokens.refreshToken);
        await TokenManager.saveTokens(
          userId,
          refreshed.accessToken,
          tokens.refreshToken,
          tokens.scope,
          refreshed.expiresAt
        );
        req.accessToken = refreshed.accessToken;
        logger.info('OAuth token refreshed successfully.', { userId });
      } catch (err) {
        logger.error('Failed to automatically refresh OAuth token. Re-authorization required.', { error: String(err) });
        return res.status(401).json({
          error: 'token_refresh_failed',
          message: 'Failed to refresh Google authorization. Please reconnect your account.'
        });
      }
    } else {
      req.accessToken = tokens.accessToken;
    }

    next();
  } catch (err) {
    logger.error('Auth token validation middleware error:', { error: String(err) });
    res.status(500).json({ error: 'auth_middleware_error', message: 'Internal authentication validation error' });
  }
}
