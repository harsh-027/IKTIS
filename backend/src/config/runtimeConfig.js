import dotenv from 'dotenv';

dotenv.config();

const SUPPORTED_NODE_ENVS = new Set(['development', 'test', 'production']);
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

function requireValue(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} must be configured.`);
  }
  return value;
}

function validateTestDatabaseUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('TEST_DATABASE_URL must be a valid MySQL connection URL.');
  }

  if (!['mysql:', 'mysqls:'].includes(url.protocol) || !url.hostname) {
    throw new Error('TEST_DATABASE_URL must be a valid MySQL connection URL.');
  }

  const developmentDatabaseUrl = process.env.DATABASE_URL?.trim();
  if (developmentDatabaseUrl && value === developmentDatabaseUrl) {
    throw new Error('TEST_DATABASE_URL must not match DATABASE_URL.');
  }

  return value;
}

function validateFrontendOrigin(value) {
  let origin;
  try {
    origin = new URL(value);
  } catch {
    throw new Error('FRONTEND_URL must be a valid HTTPS origin in production.');
  }

  if (
    origin.protocol !== 'https:' ||
    LOCAL_HOSTNAMES.has(origin.hostname) ||
    origin.pathname !== '/' ||
    origin.search ||
    origin.hash
  ) {
    throw new Error('FRONTEND_URL must be a non-local HTTPS origin in production.');
  }

  return origin.origin;
}

const nodeEnv = process.env.NODE_ENV?.trim() || 'development';

if (!SUPPORTED_NODE_ENVS.has(nodeEnv)) {
  throw new Error(`NODE_ENV must be one of: ${[...SUPPORTED_NODE_ENVS].join(', ')}.`);
}

export const isProduction = nodeEnv === 'production';

const databaseUrl = nodeEnv === 'test'
  ? validateTestDatabaseUrl(requireValue('TEST_DATABASE_URL'))
  : undefined;
const resendApiKey = process.env.RESEND_API_KEY?.trim();
const resendFromEmail = process.env.RESEND_FROM_EMAIL?.trim();
const passwordRecoveryEnabled = process.env.PASSWORD_RECOVERY_ENABLED?.trim().toLowerCase() === 'true';

export const runtimeConfig = {
  nodeEnv,
  isProduction,
  databaseUrl,
  resendApiKey,
  resendFromEmail,
  passwordRecoveryEnabled,
  frontendUrl: isProduction
    ? validateFrontendOrigin(requireValue('FRONTEND_URL'))
    : (process.env.FRONTEND_URL?.trim() || 'http://localhost:5173'),
};

if (isProduction) {
  requireValue('DATABASE_URL');
}

if (passwordRecoveryEnabled) {
  requireValue('RESEND_API_KEY');
  requireValue('RESEND_FROM_EMAIL');
}

export function getCookieSecurityOptions() {
  return isProduction
    ? { secure: true, sameSite: 'none' }
    : { secure: false, sameSite: 'lax' };
}
