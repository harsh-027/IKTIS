import crypto from 'crypto';
import { CSRF_COOKIE_NAME, getCsrfCookieOptions } from '../utils/cookies.js';
import { generateCsrfToken } from '../utils/crypto.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF Protection Middleware using Double-Submit Cookie Pattern
 * 1. Automatically ensures a CSRF cookie exists on incoming safe requests.
 * 2. Enforces valid matching X-CSRF-Token header on all state-changing requests.
 */
export function csrfProtection(req, res, next) {
  // Ensure every client has a CSRF cookie
  let csrfCookie = req.cookies?.[CSRF_COOKIE_NAME];
  if (!csrfCookie) {
    csrfCookie = generateCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, csrfCookie, getCsrfCookieOptions());
    if (!req.cookies) req.cookies = {};
    req.cookies[CSRF_COOKIE_NAME] = csrfCookie;
  }
  req.csrfToken = csrfCookie;

  // Safe HTTP methods do not mutate state and are exempt
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // Mutating requests must supply the matching CSRF token in the X-CSRF-Token header
  const headerToken = req.headers['x-csrf-token'];

  if (!headerToken || !csrfCookie || typeof headerToken !== 'string') {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Invalid or missing CSRF token. Please refresh and try again.',
        code: 'CSRF_TOKEN_MISSING',
      },
    });
  }

  // Timing-safe comparison to prevent side-channel timing attacks
  const headerBuffer = Buffer.from(headerToken, 'utf-8');
  const cookieBuffer = Buffer.from(csrfCookie, 'utf-8');

  if (headerBuffer.length !== cookieBuffer.length || !crypto.timingSafeEqual(headerBuffer, cookieBuffer)) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'CSRF token mismatch. Request rejected.',
        code: 'CSRF_TOKEN_MISMATCH',
      },
    });
  }

  next();
}
