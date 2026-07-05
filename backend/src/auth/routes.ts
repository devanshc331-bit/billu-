import { Router, Request, Response } from 'express';
import { OAuthService } from './oauth.service.js';
import { TokenManager } from './token.manager.js';
import { prisma } from '../storage/database.js';
import { logger } from '../logging/logger.js';
import { writeAuditLog } from '../logging/audit.js';

const router = Router();

// Store mapping of state -> verifier for PKCE code challenge verification
const stateVerifierMap = new Map<string, string>();

/**
 * Initiates the Google OAuth flow.
 * Returns URL if JSON requested, or redirects directly.
 */
router.get('/google', (req: Request, res: Response) => {
  const state = req.query.state?.toString() || crypto.randomUUID();
  
  try {
    const { url, verifier } = OAuthService.getAuthUrl(state);
    
    // Store verifier for callback checking
    stateVerifierMap.set(state, verifier);
    
    // Clean up state after 10 mins
    setTimeout(() => stateVerifierMap.delete(state), 10 * 60 * 1000);

    if (req.headers.accept?.includes('application/json')) {
      return res.json({ url });
    }
    
    res.redirect(url);
  } catch (err) {
    logger.error('Failed to generate Google OAuth URL', { error: String(err) });
    res.status(500).json({ error: 'oauth_init_error', message: 'Could not generate login URL.' });
  }
});

/**
 * Callback handler for Google OAuth redirect
 */
router.get('/google/callback', async (req: Request, res: Response) => {
  const code = req.query.code?.toString();
  const state = req.query.state?.toString();

  if (!code || !state) {
    logger.warn('OAuth callback missing code or state parameters');
    return res.redirect('/settings?oauth=error&reason=missing_params');
  }

  // Retrieve matching verifier for PKCE
  const verifier = stateVerifierMap.get(state) || OAuthService.getVerifier(state);
  stateVerifierMap.delete(state);

  if (!verifier) {
    logger.warn('OAuth verifier not found or expired for state session', { state });
    return res.redirect('/settings?oauth=error&reason=session_expired');
  }

  try {
    // Exchange authorization code for access/refresh tokens
    const result = await OAuthService.exchangeCode(code, verifier);
    
    const userId = 'usr_default'; // Local-first single user mode

    // 1. Ensure user exists in database
    await prisma.user.upsert({
      where: { id: userId },
      update: { email: result.email },
      create: {
        id: userId,
        email: result.email,
        name: 'Demo Professional',
      },
    });

    // 2. Save tokens securely
    await TokenManager.saveTokens(
      userId,
      result.accessToken,
      result.refreshToken,
      result.scope,
      result.expiresAt
    );

    await writeAuditLog({
      action: 'connect_account',
      actor: 'user',
      fromState: 'disconnected',
      toState: 'connected',
      details: { email: result.email, scope: result.scope }
    });

    logger.info('User Google account linked successfully', { email: result.email });
    
    // Redirect user back to local React app settings page
    res.redirect('/settings?oauth=success');
  } catch (err) {
    logger.error('Failed processing OAuth callback code exchange', { error: String(err) });
    res.redirect(`/settings?oauth=error&reason=exchange_failed`);
  }
});

/**
 * Disconnect Google OAuth account, clean local tokens.
 */
router.post('/disconnect', async (req: Request, res: Response) => {
  const userId = 'usr_default';
  
  try {
    const tokens = await TokenManager.getTokens(userId);
    const email = tokens ? (await prisma.user.findUnique({ where: { id: userId } }))?.email : null;

    await OAuthService.disconnect(userId);

    await writeAuditLog({
      action: 'disconnect_account',
      actor: 'user',
      fromState: 'connected',
      toState: 'disconnected',
      details: { email }
    });

    res.json({ success: true, message: 'Google account disconnected successfully.' });
  } catch (err) {
    logger.error('Failed to disconnect Google account', { error: String(err) });
    res.status(500).json({ error: 'disconnect_failed', message: 'Failed to disconnect account.' });
  }
});

/**
 * Returns OAuth status and details.
 */
router.get('/status', async (req: Request, res: Response) => {
  const userId = 'usr_default';

  try {
    const tokens = await TokenManager.getTokens(userId);
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!tokens || !user) {
      return res.json({ connected: false });
    }

    res.json({
      connected: true,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      scope: tokens.scope,
      expiresAt: tokens.expiresAt,
      isExpired: tokens.isExpired,
    });
  } catch (err) {
    logger.error('Failed fetching auth status info', { error: String(err) });
    res.status(500).json({ error: 'auth_status_failed', message: 'Failed to retrieve auth status.' });
  }
});

export default router;
