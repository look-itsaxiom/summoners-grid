/**
 * Environment configuration for the API server
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server configuration
  host: process.env.HOST ?? 'localhost',
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
  nodeEnv: process.env.NODE_ENV ?? 'development',

  // Database configuration
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://postgres:password@localhost:5432/summoners_grid',

  // JWT configuration
  jwtSecret: process.env.JWT_SECRET ?? 'your-super-secret-jwt-key-change-this-in-production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'your-super-secret-refresh-key-change-this-in-production',
  jwtExpiration: process.env.JWT_EXPIRATION ?? '15m',
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION ?? '7d',

  // Security configuration
  bcryptRounds: process.env.BCRYPT_ROUNDS ? Number(process.env.BCRYPT_ROUNDS) : 12,
  rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS ? Number(process.env.RATE_LIMIT_WINDOW_MS) : 15 * 60 * 1000, // 15 minutes
  rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS ? Number(process.env.RATE_LIMIT_MAX_REQUESTS) : 100,

  // CORS configuration
  corsOrigins: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000', 'http://localhost:4200'],

  // Development flags
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const;

// Validate critical environment variables in production
if (config.isProduction) {
  const requiredVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Warn about development defaults
  if (config.jwtSecret.includes('change-this-in-production')) {
    throw new Error('JWT_SECRET must be set to a secure value in production');
  }
  
  if (config.jwtRefreshSecret.includes('change-this-in-production')) {
    throw new Error('JWT_REFRESH_SECRET must be set to a secure value in production');
  }
}