import { PrismaClient } from '@prisma/client';
import { runtimeConfig } from './runtimeConfig.js';

export function withConnectionLimit(databaseUrl, connectionLimit) {
  const url = new URL(databaseUrl);
  if (!url.searchParams.has('connection_limit')) {
    url.searchParams.set('connection_limit', String(connectionLimit));
  }
  if (!url.searchParams.has('pool_timeout')) {
    url.searchParams.set('pool_timeout', '10');
  }
  return url.toString();
}

const globalForPrisma = globalThis;
const datasourceUrl = runtimeConfig.nodeEnv === 'test'
  ? runtimeConfig.databaseUrl
  : withConnectionLimit(process.env.DATABASE_URL, runtimeConfig.databaseConnectionLimit);

const prisma = globalForPrisma.__iktisPrisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasourceUrl: withConnectionLimit(datasourceUrl, runtimeConfig.databaseConnectionLimit),
});

if (runtimeConfig.nodeEnv !== 'production') {
  globalForPrisma.__iktisPrisma = prisma;
}

export default prisma;
