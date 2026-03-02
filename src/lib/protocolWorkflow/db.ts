import path from 'path';
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __protocolWorkflowPrisma: PrismaClient | undefined;
}

function resolveDatasourceUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    return `file:${path.resolve(process.cwd(), 'prisma/dev.db')}`;
  }
  if (raw.startsWith('file:./')) {
    return `file:${path.resolve(process.cwd(), raw.slice('file:./'.length))}`;
  }
  return raw;
}

export const prisma =
  global.__protocolWorkflowPrisma ||
  new PrismaClient({
    datasourceUrl: resolveDatasourceUrl(),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  global.__protocolWorkflowPrisma = prisma;
}

export const db = prisma;
