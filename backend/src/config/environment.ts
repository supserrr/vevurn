/**
 * Environment Configuration and Validation
 * 
 * This file ensures all required environment variables are properly configured
 * for production deployment and provides sensible defaults for development.
 */

export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  HOST: string;
  
  // Database
  DATABASE_URL: string;
  
  // Redis
  REDIS_URL: string;
  
  // Better Auth
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  
  // Frontend
  FRONTEND_URL: string;
  
  // Email (optional for development)
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_SECURE?: boolean;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
}

/**
 * Validates and returns the environment configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const env = process.env;
  const NODE_ENV = (env.NODE_ENV as any) || 'development';
  
  // Required variables for production
  if (NODE_ENV === 'production') {
    const requiredVars = [
      'DATABASE_URL',
      'REDIS_URL',
      'BETTER_AUTH_SECRET',
      'BETTER_AUTH_URL'
    ];
    
    for (const varName of requiredVars) {
      if (!env[varName]) {
        throw new Error(`Missing required environment variable: ${varName}`);
      }
    }
  }
  
  return {
    NODE_ENV,
    PORT: parseInt(env.PORT || '8000', 10),
    HOST: env.HOST || '0.0.0.0',
    
    // Database
    DATABASE_URL: env.DATABASE_URL || (() => {
      if (NODE_ENV === 'production') {
        throw new Error('DATABASE_URL is required in production');
      }
      return 'postgresql://localhost:5432/vevurn_dev';
    })(),
    
    // Redis
    REDIS_URL: env.REDIS_URL || (() => {
      if (NODE_ENV === 'production') {
        throw new Error('REDIS_URL is required in production');
      }
      return 'redis://localhost:6379';
    })(),
    
    // Better Auth
    BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET || (() => {
      if (NODE_ENV === 'production') {
        throw new Error('BETTER_AUTH_SECRET is required in production');
      }
      return 'dev-secret-key-not-for-production';
    })(),
    
    BETTER_AUTH_URL: env.BETTER_AUTH_URL || (() => {
      if (NODE_ENV === 'production') {
        return 'https://vevurn-backend.onrender.com';
      }
      return 'http://localhost:8000';
    })(),
    
    // Frontend
    FRONTEND_URL: env.FRONTEND_URL || (() => {
      if (NODE_ENV === 'production') {
        return 'https://vevurn-frontend.vercel.app';
      }
      return 'http://localhost:3000';
    })(),
    
    // Email (optional)
    SMTP_HOST: env.SMTP_HOST,
    SMTP_PORT: env.SMTP_PORT ? parseInt(env.SMTP_PORT, 10) : undefined,
    SMTP_SECURE: env.SMTP_SECURE === 'true',
    SMTP_USER: env.SMTP_USER,
    SMTP_PASSWORD: env.SMTP_PASSWORD,
  };
}

/**
 * Get the current environment configuration
 */
export const config = getEnvironmentConfig();

/**
 * Utility functions for environment checks
 */
export const isDevelopment = () => config.NODE_ENV === 'development';
export const isProduction = () => config.NODE_ENV === 'production';
export const isTest = () => config.NODE_ENV === 'test';

/**
 * Get the base URL for the current environment
 */
export const getBaseUrl = () => {
  if (isProduction()) {
    return config.BETTER_AUTH_URL;
  }
  return `http://${config.HOST}:${config.PORT}`;
};

/**
 * Get allowed origins for CORS
 */
export const getAllowedOrigins = () => {
  if (isProduction()) {
    return [
      config.FRONTEND_URL,
      'https://vevurn-frontend.vercel.app',
      'https://vevurn.vercel.app'
    ];
  }
  return [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    config.FRONTEND_URL
  ];
};
