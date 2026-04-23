import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'fallback-dev-secret-DO-NOT-USE-IN-PROD',
  accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshSecret:
    process.env.JWT_REFRESH_SECRET ||
    'fallback-refresh-secret-DO-NOT-USE-IN-PROD',
  refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
}));
