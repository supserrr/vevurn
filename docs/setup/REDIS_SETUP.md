# Redis Setup for Production

Your Vevurn POS application uses Redis extensively for session management, caching, and rate limiting. Here's how to set up Redis for production deployment.

## Recommended: Upstash Redis (Serverless)

Upstash is perfect for Render deployments with a generous free tier.

### 1. Create Upstash Account
1. Go to [https://upstash.com/](https://upstash.com/)
2. Sign up with GitHub (recommended)
3. Create a new Redis database

### 2. Database Configuration
- **Name**: `vevurn-redis-production`
- **Region**: Choose closest to your Render region (e.g., `us-east-1` if Render is US East)
- **Plan**: Start with **Free** (25k requests/day, 256MB storage)

### 3. Get Connection Details
After creating the database, you'll get:
- **UPSTASH_REDIS_REST_URL**: `https://your-db-name.upstash.io`
- **UPSTASH_REDIS_REST_TOKEN**: `your-token-here`

### 4. Add to Render Environment Variables
In your Render dashboard for the backend service:

```env
REDIS_URL=rediss://default:YOUR_UPSTASH_TOKEN@your-db-name.upstash.io:6380
```

### 5. Alternative Redis Providers

#### Redis Cloud
- Free tier: 30MB, 10k ops/sec
- URL format: `redis://user:password@host:port`

#### Railway Redis
- Simple setup with Railway account
- URL format: `redis://user:password@host:port`

## Environment Variable Format

Your `REDIS_URL` should be in one of these formats:

```bash
# Standard Redis
redis://username:password@host:port

# Redis with SSL (recommended for production)
rediss://username:password@host:port

# Upstash format
rediss://default:TOKEN@hostname:6380
```

## Testing the Connection

Once configured, your application will automatically connect to Redis. Check your Render logs for:

```
✅ Redis connection: SUCCESS
```

## Usage in Application

Redis is used for:
- **Session Management**: User sessions and authentication
- **Rate Limiting**: API request throttling
- **Caching**: Product and user data caching
- **Token Management**: JWT token blacklisting

## Monitoring

- **Upstash**: Built-in dashboard shows usage metrics
- **Application**: Health check endpoint shows Redis status at `/health`
