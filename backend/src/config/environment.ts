import { z } from 'zod';

// Enhanced environment schema with comprehensive validation
const envSchema = z.object({
  // Application environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('10000'),
  HOST: z.string().default('0.0.0.0'),
  
  // Database configuration
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  
  // Redis configuration (optional but recommended for production)
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  
  // Authentication (Better Auth)
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
  BETTER_AUTH_URL: z.string().url().default('https://vevurn.onrender.com'),
  
  // URLs
  FRONTEND_URL: z.string().url().default('https://vevurn.vercel.app'),
  BACKEND_URL: z.string().url().optional(),
  
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
    // Parse and validate environment variables
    const parsed = envSchema.parse(env);
    
    return {
      NODE_ENV: parsed.NODE_ENV,
      PORT: parseInt(parsed.PORT, 10),
      HOST: parsed.HOST,
      DATABASE_URL: parsed.DATABASE_URL,
      REDIS_URL: parsed.REDIS_URL,
      REDIS_HOST: parsed.REDIS_HOST,
      REDIS_PORT: parsed.REDIS_PORT ? parseInt(parsed.REDIS_PORT, 10) : undefined,
      REDIS_PASSWORD: parsed.REDIS_PASSWORD,
      BETTER_AUTH_SECRET: parsed.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: parsed.BETTER_AUTH_URL,
      FRONTEND_URL: parsed.FRONTEND_URL,
      BACKEND_URL: parsed.BACKEND_URL || (parsed.NODE_ENV === 'production' ? 'https://vevurn.onrender.com' : `http://localhost:${parsed.PORT}`),
      
      // OAuth configuration
      GOOGLE_CLIENT_ID: parsed.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: parsed.GOOGLE_CLIENT_SECRET,
      MICROSOFT_CLIENT_ID: parsed.MICROSOFT_CLIENT_ID,
      MICROSOFT_CLIENT_SECRET: parsed.MICROSOFT_CLIENT_SECRET,
      GITHUB_CLIENT_ID: parsed.GITHUB_CLIENT_ID,
      GITHUB_CLIENT_SECRET: parsed.GITHUB_CLIENT_SECRET,
      
      // File Upload configuration
      UPLOAD_MAX_SIZE: parseInt(parsed.UPLOAD_MAX_SIZE || '10485760', 10),
      UPLOAD_ALLOWED_TYPES: (parsed.UPLOAD_ALLOWED_TYPES || 'image/jpeg,image/png,image/gif,application/pdf').split(','),
      
      // AWS S3 configuration
      AWS_ACCESS_KEY_ID: parsed.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: parsed.AWS_SECRET_ACCESS_KEY,
      AWS_REGION: parsed.AWS_REGION,
      AWS_S3_BUCKET: parsed.AWS_S3_BUCKET,
      
      // Email SMTP configuration
      SMTP_HOST: parsed.SMTP_HOST,
      SMTP_PORT: parsed.SMTP_PORT ? parseInt(parsed.SMTP_PORT, 10) : undefined,
      SMTP_SECURE: parsed.SMTP_SECURE === 'true',
      SMTP_USER: parsed.SMTP_USER,
      SMTP_PASSWORD: parsed.SMTP_PASSWORD,
      
      // Mobile Money configuration
      MOMO_BASE_URL: parsed.MOMO_BASE_URL,
      MOMO_SUBSCRIPTION_KEY: parsed.MOMO_SUBSCRIPTION_KEY,
      MOMO_API_USER: parsed.MOMO_API_USER,
      MOMO_API_KEY: parsed.MOMO_API_KEY,
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
