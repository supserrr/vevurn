# BackupService Implementation Guide

## Overview

The BackupService provides comprehensive backup and restore functionality for the Vevurn POS system, including automated scheduling, encryption, compression, and multiple storage destinations.

## Features

### Core Backup Types
- **Database Backup**: PostgreSQL database dumps with pg_dump
- **Files Backup**: Application files, uploads, reports, and configurations  
- **Full Backup**: Combined database and files backup

### Security & Compliance
- **AES-256-CBC Encryption**: All backups encrypted with configurable keys
- **Checksum Verification**: SHA-256 integrity verification
- **Secure Storage**: S3 integration with signed URLs
- **Access Control**: Role-based backup management

### Automation & Scheduling
- **Cron-based Scheduling**: Flexible backup scheduling
- **Retention Policies**: Automatic cleanup based on age
- **Background Processing**: Non-blocking backup operations
- **Email Notifications**: Success/failure alerts

### Storage Options
- **Amazon S3**: Cloud storage with encryption
- **Local Storage**: On-server backup storage
- **Multi-destination**: Backup to multiple locations

## Installation & Setup

### 1. Environment Variables

Add to your `.env` file:

```bash
# Backup Configuration
BACKUP_ENCRYPTION_KEY=your-32-byte-hex-key
DATABASE_URL=postgresql://user:password@host:port/database

# S3 Configuration (if using S3 storage)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-backup-bucket

# File Directories
UPLOAD_DIR=./uploads
REPORTS_DIR=./reports
EXPORTS_DIR=./exports
```

### 2. Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Dependencies

The service requires these system dependencies:

```bash
# PostgreSQL client tools
sudo apt-get install postgresql-client

# Compression tools
sudo apt-get install gzip bzip2
```

## API Endpoints

### Authentication Required
All backup endpoints require authentication and appropriate role permissions.

### Create Backup
```http
POST /api/backup/create
Content-Type: application/json

{
  "configId": "daily-db-backup",
  "type": "database"
}
```

### Get Backup Configurations
```http
GET /api/backup/configs
```

### Save Backup Configuration
```http
POST /api/backup/configs
Content-Type: application/json

{
  "id": "custom-backup",
  "name": "Custom Backup",
  "type": "full",
  "schedule": "0 2 * * *",
  "retention": {
    "daily": 7,
    "weekly": 4,
    "monthly": 6
  },
  "compression": "gzip",
  "encryption": true,
  "destinations": [
    {
      "type": "s3",
      "config": {
        "bucket": "my-backups",
        "folder": "database"
      }
    }
  ],
  "notifications": {
    "onSuccess": ["admin@company.com"],
    "onFailure": ["admin@company.com"]
  },
  "enabled": true
}
```

### Get Backup History
```http
GET /api/backup/history/daily-db-backup?page=1&limit=20
```

### Verify Backup
```http
POST /api/backup/verify/backup-id-123
```

### Restore from Backup
```http
POST /api/backup/restore/backup-id-123
Content-Type: application/json

{
  "targetEnvironment": "production"
}
```

### Create Restore Point
```http
POST /api/backup/restore-point
Content-Type: application/json

{
  "description": "Before major update"
}
```

### Get Backup Statistics
```http
GET /api/backup/stats
```

## CLI Usage

### Installation
The backup CLI is available at `src/scripts/backup-cli.ts`:

```bash
# Compile TypeScript
npx tsc src/scripts/backup-cli.ts --outDir dist --module commonjs

# Make executable
chmod +x dist/scripts/backup-cli.js

# Create alias (optional)
alias backup-cli='node /path/to/dist/scripts/backup-cli.js'
```

### Commands

#### Create Backup
```bash
# Manual backup with temporary config
./backup-cli create --type database --name "Emergency DB Backup"

# Using existing configuration
./backup-cli create --config daily-db-backup

# Full backup
./backup-cli create --type full --name "Pre-deployment Backup"
```

#### List Backups
```bash
# Show all configurations and recent backups
./backup-cli list

# Show only configurations
./backup-cli list --configs

# Show backups for specific configuration
./backup-cli list --config daily-db-backup --limit 10
```

#### Restore from Backup
```bash
# Restore with verification
./backup-cli restore --backup backup-id-123 --verify

# Restore to specific environment
./backup-cli restore --backup backup-id-123 --environment staging
```

#### Verify Backup
```bash
./backup-cli verify --backup backup-id-123
```

#### Schedule Backup
```bash
./backup-cli schedule --file configs/backup-daily-db.json
```

#### View Statistics
```bash
./backup-cli stats
```

#### Cleanup Old Backups
```bash
# Apply retention policies
./backup-cli cleanup

# Dry run (show what would be deleted)
./backup-cli cleanup --dry-run
```

## Configuration Files

### Example Daily Database Backup
```json
{
  "id": "daily-db-backup",
  "name": "Daily Database Backup",
  "type": "database",
  "schedule": "0 2 * * *",
  "retention": {
    "daily": 7,
    "weekly": 4,
    "monthly": 6
  },
  "compression": "gzip",
  "encryption": true,
  "destinations": [
    {
      "type": "s3",
      "config": {
        "bucket": "vevurn-backups",
        "folder": "database"
      }
    }
  ],
  "notifications": {
    "onSuccess": ["admin@vevurn.com"],
    "onFailure": ["admin@vevurn.com", "tech@vevurn.com"]
  },
  "enabled": true
}
```

### Example Weekly Full Backup
```json
{
  "id": "weekly-full-backup",
  "name": "Weekly Full Backup",
  "type": "full",
  "schedule": "0 1 * * 0",
  "retention": {
    "daily": 1,
    "weekly": 8,
    "monthly": 12
  },
  "compression": "gzip",
  "encryption": true,
  "destinations": [
    {
      "type": "s3",
      "config": {
        "bucket": "vevurn-backups",
        "folder": "full-backups"
      }
    },
    {
      "type": "local",
      "config": {
        "path": "/backup/local/weekly"
      }
    }
  ],
  "notifications": {
    "onSuccess": ["admin@vevurn.com"],
    "onFailure": ["admin@vevurn.com", "tech@vevurn.com"]
  },
  "enabled": true
}
```

## Cron Schedule Examples

```bash
# Every day at 2:00 AM
"0 2 * * *"

# Every Sunday at 1:00 AM
"0 1 * * 0"

# Every 6 hours
"0 */6 * * *"

# Every weekday at 3:00 AM
"0 3 * * 1-5"

# First day of every month at midnight
"0 0 1 * *"
```

## Retention Policy Logic

The service implements intelligent retention policies:

1. **Daily Retention**: Keep all backups within the daily retention period
2. **Weekly Retention**: After daily period, keep only first backup of each week
3. **Monthly Retention**: After weekly period, keep only first backup of each month
4. **Automatic Cleanup**: Old backups are automatically deleted based on policies

## Security Considerations

### Encryption
- All backups are encrypted using AES-256-CBC
- Encryption keys should be stored securely
- IV (Initialization Vector) is prepended to encrypted files

### Access Control
- Only admin and super_admin roles can create/restore backups
- Manager role can view backup history and statistics
- All backup operations are logged for audit purposes

### Network Security
- S3 uploads use SSL/TLS encryption in transit
- Signed URLs for secure file access
- IP-based access restrictions supported

## Monitoring & Alerting

### Email Notifications
Configure email notifications for:
- Backup success
- Backup failure
- Verification failures
- Storage quota warnings

### Logging
All backup operations are logged with:
- Operation type and status
- Duration and file sizes
- Error messages and stack traces
- User information for audit trails

### Metrics
Track important metrics:
- Backup success rate
- Average backup duration
- Storage usage by type
- Failed backup trends

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Test database connection
psql $DATABASE_URL -c "SELECT version();"
```

#### Permission Errors
```bash
# Check file permissions
ls -la /backup/directory

# Fix permissions
sudo chown -R app:app /backup/directory
sudo chmod 755 /backup/directory
```

#### S3 Upload Failures
```bash
# Test AWS credentials
aws s3 ls s3://your-bucket-name

# Check bucket permissions
aws s3api get-bucket-policy --bucket your-bucket-name
```

#### Encryption Key Issues
```bash
# Generate new encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Verify key format (should be 64 hex characters)
echo $BACKUP_ENCRYPTION_KEY | wc -c
```

### Debug Mode
Enable debug logging:

```bash
DEBUG=backup:* node your-app.js
```

### Performance Optimization

#### Large Database Backups
- Use `--jobs=4` for parallel pg_dump
- Enable compression for faster transfers
- Schedule during low-usage periods

#### Network Optimization
- Use S3 multipart uploads for large files
- Enable S3 Transfer Acceleration
- Consider regional S3 buckets

#### Storage Optimization
- Regular cleanup of old backups
- Compress backups before upload
- Use incremental backups when possible

## Integration Examples

### Cron Job Setup
```bash
# Add to crontab
0 2 * * * cd /app && node dist/scripts/backup-cli.js create --config daily-db-backup

# Weekly cleanup
0 4 * * 1 cd /app && node dist/scripts/backup-cli.js cleanup
```

### Docker Integration
```dockerfile
# Install system dependencies
RUN apt-get update && apt-get install -y postgresql-client gzip bzip2

# Copy backup scripts
COPY src/scripts/backup-cli.ts /app/scripts/

# Set up cron job
RUN echo "0 2 * * * cd /app && node dist/scripts/backup-cli.js create --config daily-db-backup" >> /var/spool/cron/crontabs/root
```

### Kubernetes CronJob
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: database-backup
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: vevurn/pos-backend:latest
            command:
            - node
            - dist/scripts/backup-cli.js
            - create
            - --config
            - daily-db-backup
            env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: url
          restartPolicy: OnFailure
```

## Best Practices

### Backup Strategy
1. **3-2-1 Rule**: 3 copies, 2 different media, 1 offsite
2. **Regular Testing**: Verify backups can be restored
3. **Multiple Schedules**: Different frequencies for different data types
4. **Monitoring**: Set up alerts for backup failures

### Security
1. **Encrypt Everything**: Enable encryption for all backups
2. **Rotate Keys**: Regularly update encryption keys
3. **Access Control**: Limit backup access to necessary personnel
4. **Audit Logs**: Monitor all backup operations

### Performance
1. **Schedule Wisely**: Avoid peak usage times
2. **Incremental Backups**: Use when appropriate
3. **Compression**: Balance compression ratio vs time
4. **Network**: Use appropriate bandwidth limits

## Support & Maintenance

### Regular Tasks
- Monitor backup success rates
- Review and update retention policies
- Test restore procedures quarterly
- Update backup configurations as needed

### Capacity Planning
- Monitor storage usage trends
- Plan for data growth
- Review retention policies regularly
- Optimize backup schedules

### Documentation
- Keep backup procedures documented
- Train team members on restore procedures
- Document recovery time objectives (RTO)
- Maintain disaster recovery plans
