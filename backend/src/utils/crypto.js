import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Generate a cryptographically secure opaque token (32 random bytes -> 64 hex characters)
 */
export function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Compute SHA-256 hash of a session token for secure database storage
 */
export function hashToken(token) {
  if (!token || typeof token !== 'string') return '';
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash password with bcryptjs
 */
export async function hashPassword(plainTextPassword) {
  return bcrypt.hash(plainTextPassword, SALT_ROUNDS);
}

/**
 * Compare plaintext password with hashed password
 */
export async function comparePassword(plainTextPassword, passwordHash) {
  if (!plainTextPassword || !passwordHash) return false;
  return bcrypt.compare(plainTextPassword, passwordHash);
}
