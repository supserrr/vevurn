/**
 * Production Environment Configuration
 * Optimized for performance, security, and monitoring
 */

// Production-only environment variables validation
const requiredEnvVars = [
  'DATABASE_URL',
  'REDIS_URL',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
  'JWT_SECRET',
  'NODE_ENV'
];

// Validate all required environment variables are present
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

// Production configuration with optimizations
export const productionConfig = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '8080', 10),
    host: process.env.HOST || '0.0.0.0',
    requestTimeout: 30000,
    keepAliveTimeout: 61000,
    headersTimeout: 62000,
  },

  // Database configuration
  database: {
    connectionLimit: 20,
    connectionTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000,
    log: ['error'],
    errorFormat: 'minimal' as const,
  },

  // Redis configuration
  redis: {
    connectTimeout: 10000,
    commandTimeout: 5000,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 2,
    lazyConnect: true,
    enableOfflineQueue: false,
    family: 4, // Force IPv4
    keepAlive: 30000,
  },

  // Rate limiting
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // CORS configuration
  cors: {
    origin: process.env.FRONTEND_URL || 'https://vevurn.vercel.app',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200,
  },

  // Security headers
  security: {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          fontSrc: ["'self'", "https:", "data:"],
          connectSrc: ["'self'", "wss:", "https:"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: true,
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      referrerPolicy: { policy: 'same-origin' },
    },
  },

  // Compression settings
  compression: {
    level: 6,
    threshold: 1024,
    chunkSize: 1024,
    windowBits: 15,
    memLevel: 8,
  },

  // Logging configuration
  logging: {
    level: 'error',
    silent: false,
    format: 'json',
    timestamp: true,
    colorize: false,
  },

  // Health check configuration
  healthCheck: {
    timeout: 5000,
    interval: 30000,
    threshold: 3,
  },

  // WebSocket configuration
  websocket: {
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket'],
    allowEIO3: false,
    serveClient: false,
    maxHttpBufferSize: 1e6, // 1MB
    httpCompression: true,
    perMessageDeflate: {
      threshold: 1024,
      zlibInflateOptions: {
        chunkSize: 1024,
        windowBits: 15,
        memLevel: 8,
      },
    },
  },

  // Performance monitoring
  monitoring: {
    enabled: true,
    sampleRate: 1.0,
    includeUserAgent: false,
    includeHostname: true,
    customTags: {
      service: 'vevurn-pos-backend',
      version: process.env.npm_package_version || '1.0.0',
    },
  },
};

// Export environment-specific configurations
export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    return productionConfig;
  }
  
  // Development configuration with more relaxed settings
  return {
    ...productionConfig,
    database: {
      ...productionConfig.database,
      log: ['query', 'info', 'warn', 'error'],
      errorFormat: 'pretty' as const,
    },
    logging: {
      ...productionConfig.logging,
      level: 'debug',
      colorize: true,
    },
    websocket: {
      ...productionConfig.websocket,
      transports: ['polling', 'websocket'],
      serveClient: true,
    },
  };
};
