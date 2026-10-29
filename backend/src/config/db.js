import { PrismaClient } from '@prisma/client';
import { runtimeConfig } from './runtimeConfig.js';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  ...(runtimeConfig.nodeEnv === 'test' ? { datasourceUrl: runtimeConfig.databaseUrl } : {}),
});

export default prisma;
