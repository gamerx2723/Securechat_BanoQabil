import { PrismaClient } from '@prisma/client';

const NEON_DEFAULT_URL = "postgresql://neondb_owner:npg_5ts1CrEKRASh@ep-wandering-breeze-ae8wdpd3-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";

const datasourceUrl = process.env.DATABASE_URL || NEON_DEFAULT_URL;

export const prisma = new PrismaClient({
  datasourceUrl,
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export * from '@prisma/client';
