# Vevurn POS System - Deployment Configuration

This repository contains the complete deployment infrastructure for the Vevurn POS System, a production-ready mobile accessories point-of-sale solution.

## 🚀 **Deployment Architecture**

### **Infrastructure Stack**
- **Frontend**: Next.js 14 with React 18
- **Backend**: Node.js with Express-like API routes
- **Database**: PostgreSQL 15 with Prisma ORM
- **Cache**: Redis 7 for sessions and rate limiting
- **Authentication**: Clerk integration
- **Reverse Proxy**: Nginx with SSL termination
- **Monitoring**: Prometheus + Grafana
- **Containerization**: Docker & Docker Compose

### **Deployment Environments**
- **Development**: Local Docker Compose setup
- **Staging**: Automated deployment on push to `staging` branch
- **Production**: Automated deployment on push to `main` branch with manual approval

## 📦 **Quick Start**

### **Local Development**
```bash
# Clone repository
git clone https://github.com/supserrr/vevurn.git
cd vevurn

# Copy environment file
cp .env.example .env

# Start services with Docker Compose
docker-compose up -d

# Initialize database
npm run db:migrate
npm run db:seed

# Access the application
open http://localhost:3000
```

### **Manual Deployment**
```bash
# Build Docker image
docker build -t vevurn-pos .

# Run with environment variables
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="your_database_url" \
  -e REDIS_URL="your_redis_url" \
  vevurn-pos
```

## ⚙️ **Configuration**

### **Environment Variables**
Key environment variables required for deployment:

```bash
# Application
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/vevurn
REDIS_URL=redis://host:6379

# Authentication
CLERK_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx

# Security
ENCRYPTION_KEY=your-32-char-encryption-key
JWT_SECRET=your-jwt-secret

# Monitoring
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
```

### **SSL Certificate Setup**
Place SSL certificates in the `ssl/` directory:
- `ssl/cert.pem` - SSL certificate
- `ssl/key.pem` - Private key

## 🔄 **CI/CD Pipeline**

### **Automated Testing**
The pipeline includes comprehensive testing:
- **Type Checking**: TypeScript validation
- **Linting**: ESLint code quality checks
- **Unit Tests**: Component and service testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full application workflow testing
- **Security Scanning**: Vulnerability detection

### **Deployment Stages**
1. **Test Stage**: Run all tests and security scans
2. **Build Stage**: Create optimized Docker image
3. **Deploy Stage**: Deploy to staging/production
4. **Verification**: Health checks and smoke tests
5. **Notification**: Slack alerts on success/failure

### **GitHub Secrets Required**
```
RENDER_STAGING_SERVICE_ID
RENDER_PRODUCTION_SERVICE_ID
RENDER_API_KEY
SLACK_WEBHOOK
SNYK_TOKEN
BACKUP_WEBHOOK_URL
BACKUP_API_KEY
ROLLBACK_WEBHOOK_URL
ROLLBACK_API_KEY
```

## 📊 **Monitoring & Observability**

### **Health Checks**
- **Application**: `/api/health` endpoint
- **Database**: Connection and query performance
- **Redis**: Cache availability and latency
- **Dependencies**: External service connectivity

### **Metrics & Alerting**
- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **Alert Rules**: Automated alert conditions
- **Slack Integration**: Real-time notifications

### **Key Metrics Monitored**
- **Performance**: Response times, throughput
- **Availability**: Uptime, error rates
- **Resources**: CPU, memory, disk usage
- **Business**: Sales, transactions, user activity

## 🛡️ **Security Features**

### **Network Security**
- **SSL/TLS**: HTTPS enforced with modern ciphers
- **Rate Limiting**: API and authentication protection
- **CORS**: Cross-origin request controls
- **Security Headers**: XSS, CSRF, and clickjacking protection

### **Application Security**
- **Authentication**: Clerk-based user management
- **Authorization**: Role-based access control
- **Input Validation**: Zod schema validation
- **SQL Injection**: Prisma ORM protection
- **Audit Logging**: Comprehensive activity tracking

### **Infrastructure Security**
- **Container Hardening**: Non-root user execution
- **Secret Management**: Environment-based configuration
- **Access Controls**: Network and firewall restrictions
- **Backup Encryption**: AES-256 encrypted backups

## 🔧 **Maintenance**

### **Backup & Recovery**
```bash
# Manual backup
npm run backup

# Scheduled backups (cron)
0 2 * * * /app/scripts/backup.sh daily
0 3 * * 0 /app/scripts/backup.sh weekly
```

### **Database Maintenance**
```bash
# Check data consistency
psql $DATABASE_URL -c "SELECT * FROM check_data_consistency();"

# Clean up old data
psql $DATABASE_URL -c "SELECT cleanup_old_data();"
```

### **Log Management**
```bash
# View application logs
docker-compose logs -f app

# View Nginx logs
docker-compose logs -f nginx

# View database logs
docker-compose logs -f db
```

## 📈 **Scaling Considerations**

### **Horizontal Scaling**
- Load balancer configuration for multiple app instances
- Database read replicas for query distribution
- Redis clustering for cache scaling

### **Performance Optimization**
- CDN integration for static assets
- Database query optimization
- Caching strategies for frequently accessed data

### **Resource Planning**
- **CPU**: 2+ cores recommended
- **Memory**: 4GB+ for full stack
- **Storage**: 50GB+ for database and backups
- **Network**: 100Mbps+ for real-time features

## 🆘 **Troubleshooting**

### **Common Issues**
1. **Database Connection**: Check DATABASE_URL format
2. **Redis Connection**: Verify Redis service is running
3. **SSL Certificate**: Ensure certificates are properly configured
4. **Port Conflicts**: Check if ports 3000, 5432, 6379 are available

### **Debugging Commands**
```bash
# Check service health
curl -f http://localhost:3000/api/health

# Verify database connection
psql $DATABASE_URL -c "SELECT NOW();"

# Test Redis connection
redis-cli -u $REDIS_URL ping

# View container status
docker-compose ps
```

## 📞 **Support**

For deployment issues or questions:
- **GitHub Issues**: [Create an issue](https://github.com/supserrr/vevurn/issues)
- **Documentation**: Check inline code comments
- **Monitoring**: Review Grafana dashboards for insights

---

**🏪 Vevurn POS System** - *Empowering mobile accessories retail with modern technology*
