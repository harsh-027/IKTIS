export const SESSION_COOKIE_NAME = 'iktis_session';
export const CSRF_COOKIE_NAME = 'iktis_csrf';

const isProduction = process.env.NODE_ENV === 'production';
const sameSite = isProduction ? 'none' : 'lax';
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Standard cookie options for the HTTP-only session token
 */
export function getSessionCookieOptions(expiresAt) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    path: '/',
    expires: expiresAt || new Date(Date.now() + SESSION_MAX_AGE_MS),
  };
}

/**
 * Cookie options for the CSRF token (accessible to frontend JS for double-submit header)
 */
export function getCsrfCookieOptions() {
  return {
    httpOnly: false,
    secure: isProduction,
    sameSite,
    path: '/',
    maxAge: SESSION_MAX_AGE_MS,
  };
}

/**
 * Clear the session cookie
 */
export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    path: '/',
  });
}
