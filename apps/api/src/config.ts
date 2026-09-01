import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev_jwt_super_secret_key_securechat_2026_x7a9q',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_super_secret_key_securechat_2026_z8m3k',
  jwtAccessExpiry: '15m',
  jwtRefreshExpiryDays: 7,
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_5ts1CrEKRASh@ep-wandering-breeze-ae8wdpd3-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require',
  corsOrigins: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['*'],
};
