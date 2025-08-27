import { config } from 'dotenv';
import { z } from 'zod';

// Load environment variables - try .env.local first, then .env
config({ path: '.env.local', override: false });
config({ path: '.env', override: false });

// Environment schema validation
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default(8000),
  FRONTEND_URL: z.string().url(),
  BACKEND_URL: z.string().url(),
  HOSTNAME: z.string().default('localhost'),

  // Database
  DATABASE_URL: z.string(),
  POSTGRES_HOST: z.string(),
  POSTGRES_PORT: z.string().transform(Number),
  POSTGRES_DB: z.string(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),

  // Authentication
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Security
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRE: z.string().default('24h'),
  JWT_REFRESH_SECRET: z.string().min(16),
  REFRESH_TOKEN_EXPIRE: z.string().default('7d'),
  SESSION_SECRET: z.string().min(16),
  ENCRYPTION_KEY: z.string().min(32),
  DEVICE_SECRET: z.string().min(16),
  BCRYPT_ROUNDS: z.string().transform(Number).default(12),
  TRUSTED_PROXIES: z.string().default('127.0.0.1,::1'),

  // CORS
  CORS_ORIGINS: z.string(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default(100),

  // File Upload
  MAX_FILE_SIZE: z.string().transform(Number).default(10485760),
  UPLOAD_DIR: z.string().default('./uploads'),
  ALLOWED_FILE_TYPES: z.string().default('jpg,jpeg,png,pdf,csv,xlsx'),

  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_SECURE: z.string().transform(Boolean).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  // SMS Service (Twilio)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  SMS_DEFAULT_SENDER: z.string().optional(),

  // Mobile Money
  MOMO_MERCHANT_NUMBER: z.string().optional(),
  AIRTEL_MERCHANT_NUMBER: z.string().optional(),

  // Redis
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().transform(Number).optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).optional(),

  // Payment - MTN Mobile Money
  MOMO_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),
  MOMO_TARGET_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),
  MOMO_API_USER: z.string().optional(),
  MOMO_SUBSCRIPTION_KEY: z.string().optional(),
  MOMO_SUBSCRIPTION_KEY_BACKUP: z.string().optional(),
  MOMO_BASE_URL: z.string().url().optional(),
  MOMO_CALLBACK_URL: z.string().url().optional(),
  MOMO_CURRENCY: z.string().default('RWF'),

  // AWS S3
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),

  // Logging & Monitoring
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_TO_FILE: z.string().transform(Boolean).default(false),
  ENABLE_METRICS: z.string().transform(Boolean).default(false),
  PROMETHEUS_PORT: z.string().transform(Number).optional(),

  // Additional Services
  NOTIFICATION_SERVICE_KEY: z.string().optional(),
  PAYMENT_GATEWAY_KEY: z.string().optional(),

  // Development Flags
  DEBUG_MODE: z.string().transform(Boolean).optional(),
  ENABLE_API_DOCS: z.string().transform(Boolean).optional(),
  ENABLE_CORS_CREDENTIALS: z.string().transform(Boolean).optional(),
});

// Validate and export environment variables
export const env = envSchema.parse(process.env);

// Helper functions
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Database configuration
export const dbConfig = {
  url: env.DATABASE_URL,
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  database: env.POSTGRES_DB,
  username: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
};

// Redis configuration
export const redisConfig = env.REDIS_URL ? {
  url: env.REDIS_URL,
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  db: env.REDIS_DB,
} : null;

// CORS configuration
export const corsConfig = {
  origins: env.CORS_ORIGINS.split(',').map((origin: string) => origin.trim()),
  credentials: env.ENABLE_CORS_CREDENTIALS || false,
};

// Rate limiting configuration
export const rateLimitConfig = {
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
};

// File upload configuration
export const uploadConfig = {
  maxFileSize: env.MAX_FILE_SIZE,
  uploadDir: env.UPLOAD_DIR,
  allowedTypes: env.ALLOWED_FILE_TYPES.split(',').map((type: string) => type.trim()),
};

// Email configuration
export const emailConfig = env.SMTP_HOST ? {
  host: env.SMTP_HOST,
  port: env.SMTP_PORT!,
  secure: env.SMTP_SECURE || false,
  auth: {
    user: env.SMTP_USER!,
    pass: env.SMTP_PASS!,
  },
  from: env.SMTP_FROM!,
} : null;

// Payment configuration
export const paymentConfig = {
  momo: {
    environment: env.MOMO_ENVIRONMENT,
    targetEnvironment: env.MOMO_TARGET_ENVIRONMENT,
    apiUser: env.MOMO_API_USER,
    subscriptionKey: env.MOMO_SUBSCRIPTION_KEY,
    subscriptionKeyBackup: env.MOMO_SUBSCRIPTION_KEY_BACKUP,
    baseUrl: env.MOMO_BASE_URL,
    callbackUrl: env.MOMO_CALLBACK_URL,
    currency: env.MOMO_CURRENCY,
  },
};

// AWS configuration
export const awsConfig = env.AWS_ACCESS_KEY_ID ? {
  accessKeyId: env.AWS_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
  region: env.AWS_REGION!,
  bucket: env.AWS_S3_BUCKET!,
} : null;

// Logging configuration
export const loggingConfig = {
  level: env.LOG_LEVEL,
  toFile: env.LOG_TO_FILE,
  enableMetrics: env.ENABLE_METRICS,
  prometheusPort: env.PROMETHEUS_PORT,
};

// Export for use in other modules
export default env;
