# Redis Configuration for Production

## Your Redis Cloud Details
- **Host**: redis-XXXXX.cXXX.us-east-1-4.ec2.redns.redis-cloud.com
- **Port**: XXXXX
- **Username**: default
- **Password**: YOUR_REDIS_PASSWORD_HERE
- **Database ID**: XXXXXXXX

## Environment Variable for Render

Add this environment variable to your Render backend service:

```
REDIS_URL=redis://default:YOUR_REDIS_PASSWORD@redis-XXXXX.cXXX.us-east-1-4.ec2.redns.redis-cloud.com:XXXXX
```

## How to Add to Render:

1. Go to your Render dashboard
2. Select your backend service (vevurn backend)
3. Go to "Environment" tab
4. Click "Add Environment Variable"
5. Key: `REDIS_URL`
6. Value: `redis://default:YOUR_REDIS_PASSWORD@redis-XXXXX.cXXX.us-east-1-4.ec2.redns.redis-cloud.com:XXXXX`
7. Click "Save Changes"

This will automatically redeploy your service with Redis connectivity!

## Testing Connection

Once deployed, check your logs for:
```
✅ Redis connection: SUCCESS
```

Your application will now have full Redis functionality for:
- Session management
- Caching
- Rate limiting
- Authentication storage
