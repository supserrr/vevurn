# S3 Service Documentation

Complete AWS S3 integration for the Vevurn POS system, providing secure file upload, management, and access capabilities.

## Overview

The S3Service provides a comprehensive solution for handling file uploads in your POS system, including product images, receipts, reports, and other documents.

## Features

- ✅ **Secure File Upload**: Direct upload to AWS S3 with validation
- ✅ **Multiple Upload Methods**: Single files, multiple files, direct client uploads
- ✅ **File Management**: Delete, check existence, get metadata
- ✅ **Signed URLs**: Secure file access with expiration
- ✅ **Validation**: File type, size, and security validation
- ✅ **Error Handling**: Comprehensive error logging and handling
- ✅ **Authentication**: All endpoints protected with JWT authentication

## Setup

### 1. Environment Variables

Add these to your `.env` file:

```env
# AWS S3 Configuration
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-s3-bucket-name"
AWS_ACCESS_KEY_ID="your-access-key-id"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"
```

### 2. Install Dependencies

The following packages are installed:
- `@aws-sdk/client-s3` - S3 client
- `@aws-sdk/s3-request-presigner` - Signed URLs
- `@aws-sdk/lib-storage` - Large file uploads
- `multer` - File upload middleware
- `express` - Web framework

### 3. AWS S3 Bucket Setup

1. Create an S3 bucket in your AWS account
2. Configure bucket permissions:
   - Block public access (recommended)
   - Enable versioning (optional)
   - Set up CORS if needed for direct client uploads

3. Create IAM user with S3 permissions:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket",
                "s3:GetObjectMetadata"
            ],
            "Resource": [
                "arn:aws:s3:::your-bucket-name",
                "arn:aws:s3:::your-bucket-name/*"
            ]
        }
    ]
}
```

## API Endpoints

### Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### 1. Upload Single File
```http
POST /api/upload/single
Content-Type: multipart/form-data

Form data:
- file: File to upload
- folder: (optional) Folder name (default: 'uploads')
```

**Example Response:**
```json
{
  "message": "File uploaded successfully",
  "file": {
    "key": "uploads/1691491200000-abc123.jpg",
    "url": "https://your-bucket.s3.us-east-1.amazonaws.com/uploads/1691491200000-abc123.jpg",
    "bucket": "your-bucket-name",
    "location": "https://your-bucket.s3.us-east-1.amazonaws.com/uploads/1691491200000-abc123.jpg",
    "etag": "\"d41d8cd98f00b204e9800998ecf8427e\"",
    "size": 15360
  }
}
```

### 2. Upload Multiple Files
```http
POST /api/upload/multiple
Content-Type: multipart/form-data

Form data:
- files[]: Array of files (max 10)
- folder: (optional) Folder name
```

### 3. Get Signed URL
```http
GET /api/upload/signed-url/:key?expiresIn=3600
```

**Example Response:**
```json
{
  "signedUrl": "https://your-bucket.s3.amazonaws.com/uploads/file.jpg?AWSAccessKeyId=...",
  "expiresIn": 3600
}
```

### 4. Delete File
```http
DELETE /api/upload/:key
```

### 5. Get File Metadata
```http
GET /api/upload/metadata/:key
```

**Example Response:**
```json
{
  "metadata": {
    "size": 15360,
    "lastModified": "2025-08-08T10:30:00.000Z",
    "contentType": "image/jpeg",
    "metadata": {
      "originalName": "product-image.jpg",
      "uploadDate": "2025-08-08T10:30:00.000Z"
    },
    "etag": "\"d41d8cd98f00b204e9800998ecf8427e\""
  }
}
```

### 6. Get Presigned Upload URL (for direct client uploads)
```http
POST /api/upload/presigned-upload
Content-Type: application/json

{
  "fileName": "product-image.jpg",
  "contentType": "image/jpeg",
  "folder": "products"
}
```

## Usage Examples

### Frontend Upload (React)
```typescript
import React, { useState } from 'react'

const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'products')

    try {
      const response = await fetch('/api/upload/single', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      const result = await response.json()
      console.log('Upload successful:', result)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input 
        type="file" 
        onChange={(e) => setFile(e.target.files?.[0] || null)} 
        accept="image/*"
      />
      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  )
}
```

### Backend Service Usage
```typescript
import { s3Service } from '../services/S3Service'

// Upload from backend
const uploadProductImage = async (imageBuffer: Buffer, fileName: string) => {
  try {
    const result = await s3Service.uploadFile(
      imageBuffer,
      fileName,
      {
        folder: 'products',
        contentType: 'image/jpeg',
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
      }
    )
    
    return result.url
  } catch (error) {
    console.error('Upload failed:', error)
    throw error
  }
}

// Get signed URL for protected file access
const getProductImageUrl = async (imageKey: string) => {
  return await s3Service.getSignedUrl(imageKey, 3600) // 1 hour expiry
}
```

## File Organization

Files are organized in folders:
- `uploads/` - General uploads
- `products/` - Product images
- `receipts/` - Receipt images/PDFs
- `reports/` - Generated reports
- `temp/` - Temporary files

## Security Features

1. **File Type Validation**: Only allows specified MIME types
2. **File Size Limits**: Configurable maximum file size
3. **Authentication Required**: All endpoints require valid JWT
4. **Signed URLs**: Time-limited access to files
5. **Metadata Tracking**: Original filename and upload date stored

## Error Handling

The service includes comprehensive error handling:
- File too large
- Invalid file type
- AWS S3 errors
- Network issues
- Authentication failures

## Monitoring and Logging

All operations are logged with appropriate levels:
- Info: Successful uploads/deletions
- Error: Failed operations with stack traces
- Debug: Detailed operation information

## Best Practices

1. **Use appropriate folders** for different file types
2. **Set reasonable file size limits** (default 10MB)
3. **Restrict file types** to only what's needed
4. **Use signed URLs** for sensitive files
5. **Clean up unused files** regularly
6. **Monitor S3 costs** and usage

## Integration with POS System

Common use cases in the Vevurn POS:

1. **Product Images**: Upload and display product photos
2. **Receipt Storage**: Store receipt images for returns/exchanges
3. **Report Generation**: Store generated PDF reports
4. **User Avatars**: Profile pictures for staff
5. **Backup Files**: Database backups and exports

The S3Service is now ready for production use and provides all the functionality needed for comprehensive file management in your POS system!
