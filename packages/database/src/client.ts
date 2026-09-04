import { PrismaClient } from '@prisma/client';

const DEFAULT_DIRECT_URL = "postgresql://postgres:%3CAsad2723%403%3E@db.ljltqeiorczfxkclbltb.supabase.co:5432/postgres?sslmode=require&connect_timeout=30";

function getStableDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL;
  if (!envUrl || !envUrl.startsWith('postgresql')) {
    return DEFAULT_DIRECT_URL;
  }
  try {
    const parsed = new URL(envUrl);
    parsed.searchParams.delete('channel_binding');
    parsed.searchParams.set('sslmode', 'require');
    parsed.searchParams.set('connect_timeout', '30');
    return parsed.toString();
  } catch {
    return envUrl;
  }
}

const datasourceUrl = getStableDatabaseUrl();
process.env.DATABASE_URL = datasourceUrl;

export const prisma = new PrismaClient({
  datasourceUrl,
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export * from '@prisma/client';
