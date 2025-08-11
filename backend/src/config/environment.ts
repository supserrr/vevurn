import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('10000'),
  HOST: z.string().default('0.0.0.0'),
  
  // Database
  DATABASE_URL: z.string(),
  
  // Redis
  REDIS_URL: z.string(),
  
  // Authentication
  BETTER_AUTH_SECRET: z.string(),
  BETTER_AUTH_URL: z.string().default('https://vevurn.onrender.com'),
  
  // URLs - CORRECTED for your requirements
  FRONTEND_URL: z.string().default('https://vevurn.vercel.app'),
  
  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  
  // File Upload
  UPLOAD_MAX_SIZE: z.string().default('10485760'),
  UPLOAD_ALLOWED_TYPES: z.string().default('image/jpeg,image/png,image/gif,application/pdf'),
  
  // AWS S3
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  
  // Email SMTP
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_SECURE: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  
  // Mobile Money
  MOMO_BASE_URL: z.string().optional(),
  MOMO_SUBSCRIPTION_KEY: z.string().optional(),
  MOMO_API_USER: z.string().optional(),
  MOMO_API_KEY: z.string().optional(),
});

/**
 * Parse and validate environment variables
 */
function getEnvironmentConfig() {
  const env = process.env;
  
  try {
    return {
      NODE_ENV: env.NODE_ENV || 'development',
      PORT: parseInt(env.PORT || '10000', 10),
      HOST: env.HOST || '0.0.0.0',
      DATABASE_URL: env.DATABASE_URL!,
      REDIS_URL: env.REDIS_URL!,
      BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET!,
      BETTER_AUTH_URL: env.BETTER_AUTH_URL || (env.NODE_ENV === 'production' ? 'https://vevurn.onrender.com' : 'http://localhost:10000'),
      FRONTEND_URL: env.FRONTEND_URL || 'https://vevurn.vercel.app',
      
      // OAuth
      GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
      MICROSOFT_CLIENT_ID: env.MICROSOFT_CLIENT_ID,
      MICROSOFT_CLIENT_SECRET: env.MICROSOFT_CLIENT_SECRET,
      GITHUB_CLIENT_ID: env.GITHUB_CLIENT_ID,
      GITHUB_CLIENT_SECRET: env.GITHUB_CLIENT_SECRET,
      
      // File Upload
      UPLOAD_MAX_SIZE: parseInt(env.UPLOAD_MAX_SIZE || '10485760', 10),
      UPLOAD_ALLOWED_TYPES: (env.UPLOAD_ALLOWED_TYPES || 'image/jpeg,image/png,image/gif,application/pdf').split(','),
      
      // AWS S3
      AWS_ACCESS_KEY_ID: env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: env.AWS_SECRET_ACCESS_KEY,
      AWS_REGION: env.AWS_REGION,
      AWS_S3_BUCKET: env.AWS_S3_BUCKET,
      
      // Email SMTP
      SMTP_HOST: env.SMTP_HOST,
      SMTP_PORT: env.SMTP_PORT ? parseInt(env.SMTP_PORT, 10) : undefined,
      SMTP_SECURE: env.SMTP_SECURE === 'true',
      SMTP_USER: env.SMTP_USER,
      SMTP_PASSWORD: env.SMTP_PASSWORD,
      
      // Mobile Money
      MOMO_BASE_URL: env.MOMO_BASE_URL,
      MOMO_SUBSCRIPTION_KEY: env.MOMO_SUBSCRIPTION_KEY,
      MOMO_API_USER: env.MOMO_API_USER,
      MOMO_API_KEY: env.MOMO_API_KEY,
    };
  } catch (error) {
    console.error('❌ Invalid environment configuration:', error);
    process.exit(1);
  }
}

export const config = getEnvironmentConfig();

export const isDevelopment = () => config.NODE_ENV === 'development';
export const isProduction = () => config.NODE_ENV === 'production';
export const isTest = () => config.NODE_ENV === 'test';

export const getBaseUrl = () => {
  if (isProduction()) {
    return config.BETTER_AUTH_URL;
  }
  return `http://${config.HOST}:${config.PORT}`;
};

/**
 * CORRECTED: Get allowed origins for CORS - ONLY the two required URLs
 */
export const getAllowedOrigins = () => {
  if (isProduction()) {
    return [
      'https://vevurn.vercel.app'  // ONLY this URL as requested
    ];
  }
  return [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002'
  ];
};
