# Vevurn Scripts

This directory contains automation scripts for the Vevurn POS system. All scripts are designed to be run from the project root directory.

## 📁 Directory Structure

```
scripts/
├── database/           # Database management scripts
│   ├── backup.sh      # Database backup automation
│   └── restore.sh     # Database restore automation
├── deployment/        # Deployment automation scripts
│   ├── deploy-staging.sh     # Deploy to staging environment
│   └── deploy-production.sh  # Deploy to production environment
├── maintenance/       # System maintenance scripts
│   └── health-check.sh       # Comprehensive system health check
└── utilities/         # Utility scripts
    ├── security-scan.sh      # Security vulnerability scanning
    └── performance-test.sh   # Performance testing automation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL client tools (for database scripts)
- Redis client tools (for health checks)

### Using Package.json Scripts
All scripts are integrated into the root `package.json` and can be run using pnpm:

```bash
# Development
pnpm dev                    # Start all services
pnpm backend:dev           # Start only backend
pnpm frontend:dev          # Start only frontend

# Building
pnpm build                 # Build all packages
pnpm backend:build         # Build backend only
pnpm frontend:build        # Build frontend only

# Testing
pnpm test                  # Test all packages
pnpm test:e2e             # Run E2E tests
pnpm backend:test         # Backend tests only
pnpm frontend:test        # Frontend tests only

# Database
pnpm db:migrate           # Run migrations
pnpm db:seed              # Seed database
pnpm db:studio            # Open Prisma Studio
pnpm db:backup            # Backup database
pnpm db:restore           # Restore database

# Docker
pnpm docker:up            # Start all services
pnpm docker:build         # Build containers
pnpm monitoring:up        # Start monitoring stack

# Deployment
pnpm deploy:staging       # Deploy to staging
pnpm deploy:production    # Deploy to production

# Maintenance
pnpm health-check         # Run system health check
pnpm security:scan        # Run security scan
pnpm performance-test     # Run performance tests
```

## 📄 Script Documentation

### Database Scripts

#### `backup.sh`
Creates compressed backups of the PostgreSQL database.

**Usage:**
```bash
# Using package.json script (recommended)
pnpm db:backup

# Direct usage
./scripts/database/backup.sh
```

**Environment Variables:**
- `DATABASE_URL`: PostgreSQL connection string
- `BACKUP_DIR`: Backup directory (default: `./backups`)

**Features:**
- Creates timestamped backups
- Compresses backup files with gzip
- Automatically cleans up old backups (7+ days)
- Provides detailed logging

#### `restore.sh`
Restores database from backup files.

**Usage:**
```bash
# Using package.json script
pnpm db:restore

# Direct usage with backup file
./scripts/database/restore.sh vevurn_backup_20240101_120000.sql.gz
```

**Features:**
- Interactive confirmation prompts
- Automatic decompression of gzip files
- Runs migrations after restore
- Regenerates Prisma client

### Deployment Scripts

#### `deploy-staging.sh`
Automated deployment to staging environment.

**Usage:**
```bash
pnpm deploy:staging
```

**Features:**
- Builds and pushes Docker images
- Creates staging-specific Kubernetes manifests
- Deploys to staging namespace
- Runs integration tests
- Sends Slack notifications

#### `deploy-production.sh`
Automated deployment to production environment.

**Usage:**
```bash
pnpm deploy:production
```

**Features:**
- Comprehensive pre-deployment checks
- Blue-green deployment strategy
- Automated rollback on failure
- Performance validation
- Production health checks

### Maintenance Scripts

#### `health-check.sh`
Comprehensive system health monitoring.

**Usage:**
```bash
pnpm health-check
```

**Checks:**
- Backend/Frontend service availability
- Database connectivity and performance
- Redis connectivity and memory usage
- System resources (disk, memory)
- Process status
- Log file analysis
- Environment configuration

**Output:**
- Console status report
- JSON health report file
- Exit code (0 = healthy, 1 = issues found)

### Utility Scripts

#### `security-scan.sh`
Multi-layer security vulnerability scanning.

**Usage:**
```bash
pnpm security:scan
```

**Scans:**
- NPM/pnpm dependency vulnerabilities
- Docker image vulnerabilities
- Source code secret detection
- File permission analysis
- Environment file security
- OWASP dependency check (if available)

#### `performance-test.sh`
Comprehensive performance testing suite.

**Usage:**
```bash
pnpm performance-test
```

**Tests:**
- k6 load testing
- Artillery load testing (alternative)
- Lighthouse web performance
- Database performance
- Service availability checks

**Requirements:**
- k6 (recommended): `brew install k6`
- Artillery (alternative): `npm install -g artillery`
- Lighthouse: `npm install -g lighthouse`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root with required configuration:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/vevurn

# Redis
REDIS_URL=redis://localhost:6379

# Services
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

# Deployment
DOCKER_REGISTRY=your-registry.com
STAGING_API_URL=https://api-staging.vevurn.com
PRODUCTION_API_URL=https://api.vevurn.com

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Security
GITHUB_TOKEN=ghp_xxx...
```

### Docker Configuration

Scripts expect the following Docker Compose files:
- `docker-compose.yml` - Development environment
- `docker-compose.prod.yml` - Production environment with monitoring

### Kubernetes Configuration

Deployment scripts expect Kubernetes manifests in:
- `infrastructure/kubernetes/application.yaml`
- `infrastructure/kubernetes/secrets.yaml`

## 🐛 Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   chmod +x scripts/**/*.sh
   ```

2. **Missing Environment Variables**
   - Check `.env` file exists and is properly configured
   - Source environment variables: `source .env`

3. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Ensure PostgreSQL is running
   - Check firewall/network connectivity

4. **Docker Issues**
   - Ensure Docker daemon is running
   - Check Docker Compose files exist
   - Verify image registry access

### Debug Mode

Run any script with debug output:
```bash
bash -x ./scripts/database/backup.sh
```

### Logs and Reports

Scripts generate reports in:
- `./backups/` - Database backups
- `./health-reports/` - Health check reports
- `./performance-reports/` - Performance test results
- `./security-reports/` - Security scan reports

## 🤝 Contributing

When adding new scripts:

1. Place in appropriate subdirectory
2. Make executable: `chmod +x script.sh`
3. Add error handling: `set -e`
4. Include colored output functions
5. Add comprehensive logging
6. Update package.json scripts
7. Document in this README

### Script Template

```bash
#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

main() {
    print_status "Starting script..."
    # Script logic here
    print_status "Script completed ✅"
}

main "$@"
```

## 📞 Support

For script issues or questions:
1. Check the troubleshooting section above
2. Review script logs and error messages
3. Ensure all prerequisites are installed
4. Verify environment configuration

## 🔒 Security Notes

- Never commit sensitive environment variables
- Use secrets management for production deployments
- Regularly update and patch all tools
- Review security scan results
- Monitor access logs and deployment activities
