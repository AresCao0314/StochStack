import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __protocolOsPrisma: PrismaClient | undefined;
}

const fallbackUrl = 'postgresql://postgres:postgres@localhost:5432/stochstack?schema=public';

export const protocolOsDb =
  global.__protocolOsPrisma ||
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL || fallbackUrl,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  global.__protocolOsPrisma = protocolOsDb;
}
