import { SESSION_COOKIE_NAME } from '../utils/cookies.js';
import { validateSession } from '../services/authService.js';

/**
 * Authentication middleware that verifies the HTTP-only database-backed session cookie
 */
export async function requireAuth(req, res, next) {
  try {
    const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required. Please sign in.',
          code: 'UNAUTHORIZED',
        },
      });
    }

    const authResult = await validateSession(sessionToken);

    if (!authResult) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Session is invalid or has expired. Please sign in again.',
          code: 'UNAUTHORIZED',
        },
      });
    }

    // Attach authenticated user and session metadata to request
    req.user = authResult.user;
    req.session = authResult.session;

    next();
  } catch (error) {
    next(error);
  }
}
