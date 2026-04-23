import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  platformDomain: process.env.PLATFORM_DOMAIN || 'bookingplatform.com',
  superAdminEmail: process.env.SUPER_ADMIN_EMAIL || 'admin@bookingplatform.com',
  corsOrigins: process.env.CORS_ORIGINS || '',
}));
