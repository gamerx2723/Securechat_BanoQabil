import { PrismaClient } from '@prisma/client';

const NEON_DIRECT_URL = "postgresql://neondb_owner:npg_5ts1CrEKRASh@ep-wandering-breeze-ae8wdpd3.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&connect_timeout=30";

function getStableDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL;
  if (!envUrl || !envUrl.startsWith('postgresql')) {
    return NEON_DIRECT_URL;
  }
  try {
    const parsed = new URL(envUrl);
    parsed.hostname = parsed.hostname.replace('-pooler.', '.');
    parsed.searchParams.delete('channel_binding');
    parsed.searchParams.set('sslmode', 'require');
    parsed.searchParams.set('connect_timeout', '30');
    return parsed.toString();
  } catch {
    return NEON_DIRECT_URL;
  }
}

const datasourceUrl = getStableDatabaseUrl();
process.env.DATABASE_URL = datasourceUrl;

export const prisma = new PrismaClient({
  datasourceUrl,
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export * from '@prisma/client';
