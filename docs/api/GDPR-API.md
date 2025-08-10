# GDPR Compliance API Documentation

The GDPR Compliance API provides comprehensive data protection and privacy compliance features for the Vevurn POS System, implementing the requirements of the EU General Data Protection Regulation (GDPR) and similar privacy laws.

## Base URL
```
/api/gdpr
```

## Authentication
All GDPR endpoints require authentication. User authorization varies by endpoint based on data ownership and administrative privileges.

## GDPR Rights Supported

### Article 15 - Right of Access
Users can request access to their personal data.

### Article 17 - Right to Erasure ("Right to be Forgotten")
Users can request deletion of their personal data.

### Article 20 - Right to Data Portability
Users can request their data in a structured, machine-readable format.

### Article 21 - Right to Object
Users can object to processing of their data and manage consent preferences.

## Endpoints

### 1. Request Data Export (Article 20)
Request a complete export of user's personal data.

**Endpoint:** `POST /api/gdpr/export/request`

**Access:** Self or Admin

**Request Body:**
```json
{
  "userId": "user-uuid",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Data export request created successfully",
  "data": {
    "requestId": "export-request-uuid",
    "status": "pending",
    "requestedAt": "2024-08-10T14:30:00Z"
  }
}
```

**Export Content:**
- User profile information
- Purchase history (CSV format)
- Customer interactions (JSON format)
- Consent records (JSON format)  
- Audit logs (JSON format)

**Security Features:**
- Files are encrypted with AES-256-CBC
- Stored securely in AWS S3 with time-limited access
- Download links expire after 48 hours
- Email notification with secure download link

### 2. Get Data Export Status
Check the status of a data export request.

**Endpoint:** `GET /api/gdpr/export/:requestId`

**Access:** Self or Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "export-request-uuid",
    "userId": "user-uuid",
    "requestedAt": "2024-08-10T14:30:00Z",
    "status": "completed",
    "completedAt": "2024-08-10T14:45:00Z",
    "downloadUrl": "https://signed-s3-url",
    "expiresAt": "2024-08-12T14:45:00Z"
  }
}
```

**Status Values:**
- `pending` - Request received, processing not started
- `processing` - Data export in progress
- `completed` - Export ready for download
- `failed` - Export failed (check logs)

### 3. Request Data Deletion (Article 17)
Request deletion or anonymization of user's personal data.

**Endpoint:** `POST /api/gdpr/deletion/request`

**Access:** Self or Admin

**Request Body:**
```json
{
  "userId": "user-uuid",
  "reason": "User requested account deletion",
  "immediate": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Data deletion request created successfully",
  "data": {
    "requestId": "deletion-request-uuid",
    "status": "pending",
    "requestedAt": "2024-08-10T14:30:00Z",
    "scheduledFor": "2024-09-09T14:30:00Z"
  }
}
```

**Deletion Process:**
- Standard: 30-day waiting period for user to cancel
- Immediate: Admin-only, executes immediately
- Financial data: Anonymized rather than deleted (legal compliance)
- Audit trails: Maintained with anonymized identifiers

### 4. Cancel Data Deletion
Cancel a pending data deletion request within the 30-day period.

**Endpoint:** `DELETE /api/gdpr/deletion/:requestId/cancel`

**Access:** Self only (users can only cancel their own requests)

**Response:**
```json
{
  "success": true,
  "message": "Data deletion request cancelled successfully"
}
```

**Error Cases:**
- Request not found (404)
- Already completed (409)
- Unauthorized (403)

### 5. Get Data Deletion Status
Check the status of a data deletion request.

**Endpoint:** `GET /api/gdpr/deletion/:requestId`

**Access:** Self or Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "deletion-request-uuid",
    "userId": "user-uuid",
    "requestedAt": "2024-08-10T14:30:00Z",
    "scheduledFor": "2024-09-09T14:30:00Z",
    "status": "pending",
    "reason": "User requested account deletion"
  }
}
```

**Status Values:**
- `pending` - Waiting for 30-day period
- `scheduled` - Approved, awaiting execution
- `completed` - Data deleted/anonymized
- `cancelled` - Request cancelled by user

### 6. Record User Consent (Article 21)
Record user consent for various data processing activities.

**Endpoint:** `POST /api/gdpr/consent`

**Access:** Self only

**Request Body:**
```json
{
  "type": "marketing",
  "granted": true
}
```

**Consent Types:**
- `marketing` - Marketing communications
- `analytics` - Usage analytics and tracking
- `cookies` - Non-essential cookies
- `data_processing` - Extended data processing

**Response:**
```json
{
  "success": true,
  "message": "Consent recorded successfully",
  "data": {
    "id": "consent-record-uuid",
    "userId": "user-uuid",
    "type": "marketing",
    "granted": true,
    "timestamp": "2024-08-10T14:30:00Z",
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "version": "1.0"
  }
}
```

**Audit Trail:**
- All consent changes are logged
- IP address and user agent recorded
- Version tracking for policy changes
- Immutable consent history

### 7. Get User Consents
Retrieve all consent records for a user.

**Endpoint:** `GET /api/gdpr/consent/:userId`

**Access:** Self or Admin

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "consent-1-uuid",
      "userId": "user-uuid",
      "type": "marketing",
      "granted": true,
      "timestamp": "2024-08-10T14:30:00Z",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "version": "1.0"
    },
    {
      "id": "consent-2-uuid",
      "userId": "user-uuid", 
      "type": "analytics",
      "granted": false,
      "timestamp": "2024-08-10T14:31:00Z",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "version": "1.0"
    }
  ]
}
```

### 8. Set Retention Policy (Admin Only)
Configure data retention policies for different data categories.

**Endpoint:** `POST /api/gdpr/retention-policy`

**Access:** Admin only

**Request Body:**
```json
{
  "category": "audit_logs",
  "retentionDays": 2555,
  "autoDelete": true,
  "compressAfterDays": 90,
  "archiveLocation": "audit-archive"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Retention policy set successfully"
}
```

**Policy Categories:**
- `audit_logs` - System audit logs
- `user_sessions` - User session data
- `error_logs` - Application error logs
- `security_logs` - Security event logs
- `custom_category` - Custom data categories

### 9. Apply Retention Policies (Admin Only)
Manually trigger retention policy application.

**Endpoint:** `POST /api/gdpr/retention-policy/apply`

**Access:** Admin only

**Response:**
```json
{
  "success": true,
  "message": "Retention policies applied successfully"
}
```

**Process:**
- Reviews all configured retention policies
- Archives data approaching retention limits
- Deletes expired data automatically
- Creates audit trail of all actions

### 10. Get Compliance Information
Get comprehensive GDPR compliance information.

**Endpoint:** `GET /api/gdpr/compliance-info`

**Access:** All authenticated users

**Response:**
```json
{
  "success": true,
  "data": {
    "gdprCompliance": {
      "version": "1.0",
      "lastUpdated": "2024-08-10",
      "supportedRights": [
        "Right to Information (Article 13-14)",
        "Right of Access (Article 15)",
        "Right to Rectification (Article 16)",
        "Right to Erasure (Article 17)",
        "Right to Restrict Processing (Article 18)",
        "Right to Data Portability (Article 20)",
        "Right to Object (Article 21)"
      ],
      "dataProcessingPurposes": [
        "Transaction processing",
        "Customer service",
        "Legal compliance",
        "Security monitoring",
        "Business analytics (with consent)"
      ],
      "dataRetentionPolicies": {
        "customerData": "7 years (legal requirement)",
        "transactionData": "10 years (tax compliance)",
        "auditLogs": "Configurable per category",
        "consentRecords": "Until withdrawn + 3 years"
      },
      "contactInformation": {
        "dataProtectionOfficer": "dpo@vevurn.com",
        "privacyInquiries": "privacy@vevurn.com",
        "address": "Rwanda"
      }
    }
  }
}
```

## Data Processing and Storage

### Data Categories Processed
1. **Identity Data**: Name, email, phone, address
2. **Transaction Data**: Sales, purchases, payments
3. **Technical Data**: IP addresses, session data, audit logs
4. **Usage Data**: System interactions, preferences
5. **Consent Data**: Permission records, opt-in/opt-out history

### Legal Bases for Processing
- **Contract**: Transaction processing, customer service
- **Legal Obligation**: Tax records, audit compliance
- **Legitimate Interest**: Security monitoring, fraud prevention
- **Consent**: Marketing, analytics, non-essential features

### Data Retention Periods
- **Customer Data**: 7 years after last transaction
- **Financial Records**: 10 years (tax compliance)
- **Audit Logs**: Configurable (default 7 years)
- **Consent Records**: Until withdrawn + 3 years
- **Session Data**: 30 days maximum

### Data Security Measures
- **Encryption at Rest**: AES-256 for sensitive data
- **Encryption in Transit**: TLS 1.3 for all communications
- **Access Controls**: Role-based permissions
- **Audit Logging**: Comprehensive activity tracking
- **Data Anonymization**: Personal identifiers removed when possible

## Automated Processes

### Data Export Process
1. Request validation and authorization
2. Data gathering from multiple sources
3. Archive creation with compression
4. Encryption with unique keys
5. Secure cloud storage upload
6. Email notification with download link
7. Automatic cleanup after 48 hours

### Data Deletion Process
1. Request validation and 30-day waiting period
2. User notification and cancellation option
3. Scheduled execution at specified time
4. Transaction data anonymization
5. Personal data deletion
6. Cache invalidation
7. Audit trail creation

### Retention Policy Automation
1. Daily execution at 2:00 AM
2. Policy evaluation for all categories
3. Data archiving for near-expiry records
4. Automatic deletion of expired data
5. Compression and cloud storage for archives
6. Audit logging of all actions

## Error Handling

### Common Error Codes
- `401` - Authentication required
- `403` - Insufficient permissions or unauthorized action
- `404` - Request/resource not found
- `409` - Conflict (e.g., cannot cancel completed deletion)
- `400` - Validation error or missing required fields
- `500` - Internal server error

### Error Response Format
```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": {
    "code": "ERROR_CODE",
    "timestamp": "2024-08-10T14:30:00Z",
    "details": "Additional error context (development only)"
  }
}
```

## Security Considerations

### Authentication & Authorization
- All endpoints require valid authentication
- User-specific operations restricted to data owner
- Administrative functions require admin role
- IP address and user agent tracking for consent

### Data Protection
- Personal data encrypted at rest and in transit
- Export files encrypted with unique keys
- Time-limited access to sensitive downloads
- Secure deletion with overwriting
- Anonymization rather than deletion for legal compliance

### Audit & Monitoring
- Complete audit trail for all GDPR operations
- Failed access attempts logged
- Data access monitoring and alerts
- Regular compliance reports
- Automated policy enforcement

## Integration Examples

### Request Data Export
```javascript
const exportData = async (userId, email) => {
  const response = await fetch('/api/gdpr/export/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer your-token'
    },
    body: JSON.stringify({ userId, email })
  });
  
  const result = await response.json();
  return result.data.requestId;
};
```

### Check Export Status
```javascript
const checkExportStatus = async (requestId) => {
  const response = await fetch(`/api/gdpr/export/${requestId}`, {
    headers: {
      'Authorization': 'Bearer your-token'
    }
  });
  
  return await response.json();
};
```

### Record User Consent
```javascript
const recordConsent = async (type, granted) => {
  const response = await fetch('/api/gdpr/consent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer your-token'
    },
    body: JSON.stringify({ type, granted })
  });
  
  return await response.json();
};
```

### Request Data Deletion
```javascript
const requestDeletion = async (userId, reason) => {
  const response = await fetch('/api/gdpr/deletion/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer your-token'
    },
    body: JSON.stringify({ 
      userId, 
      reason,
      immediate: false 
    })
  });
  
  return await response.json();
};
```

## Environment Configuration

### Required Environment Variables
```env
# Encryption for GDPR exports
GDPR_ENCRYPTION_KEY=your-256-bit-hex-key

# Privacy policy version tracking
PRIVACY_POLICY_VERSION=1.0

# Contact information
DPO_EMAIL=dpo@vevurn.com
PRIVACY_EMAIL=privacy@vevurn.com
COMPANY_ADDRESS=Rwanda

# AWS S3 for secure file storage
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=vevurn-gdpr-exports
```

## Compliance Checklist

### GDPR Requirements ✅
- [x] Right to Information (Articles 13-14)
- [x] Right of Access (Article 15) 
- [x] Right to Rectification (Article 16)
- [x] Right to Erasure (Article 17)
- [x] Right to Restrict Processing (Article 18)
- [x] Right to Data Portability (Article 20)
- [x] Right to Object (Article 21)
- [x] Data Protection by Design (Article 25)
- [x] Records of Processing Activities (Article 30)
- [x] Data Breach Notification (Article 33-34)

### Technical Implementation ✅
- [x] Encryption at rest and in transit
- [x] Secure data export with time-limited access
- [x] Automated data retention policies
- [x] Comprehensive audit logging
- [x] Consent management system
- [x] Data anonymization procedures
- [x] Secure data deletion
- [x] Role-based access controls

### Operational Procedures ✅
- [x] Data Protection Impact Assessments
- [x] Privacy policy version tracking
- [x] User consent recording and management
- [x] Data breach response procedures
- [x] Regular compliance audits
- [x] Staff training on data protection
- [x] Third-party processor agreements
- [x] Cross-border data transfer safeguards

---

*This GDPR Compliance API provides comprehensive data protection capabilities ensuring full compliance with European data protection regulations and similar privacy laws worldwide.*
