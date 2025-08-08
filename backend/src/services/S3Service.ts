// backend/src/services/S3Service.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Upload } from '@aws-sdk/lib-storage'
import { logger } from '../utils/logger'
import crypto from 'crypto'
import path from 'path'

interface UploadOptions {
  folder?: string
  contentType?: string
  maxSize?: number
  allowedTypes?: string[]
}

interface UploadResult {
  key: string
  url: string
  bucket: string
  location: string
  etag: string
  size: number
}

export class S3Service {
  private s3Client: S3Client
  private bucket: string
  private region: string
  private baseUrl: string

  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1'
    this.bucket = process.env.AWS_S3_BUCKET || ''
    this.baseUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com`

    if (!this.bucket) {
      throw new Error('AWS_S3_BUCKET environment variable is required')
    }

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    })
  }

  /**
   * Upload file to S3
   */
  async uploadFile(
    file: Buffer | Uint8Array | string,
    originalName: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      const {
        folder = 'uploads',
        contentType,
        maxSize = 10 * 1024 * 1024, // 10MB
        allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      } = options

      // Validate file size
      const fileSize = Buffer.isBuffer(file) ? file.length : Buffer.byteLength(file as string)
      if (fileSize > maxSize) {
        throw new Error(`File size ${fileSize} exceeds maximum allowed size ${maxSize}`)
      }

      // Validate content type
      if (contentType && allowedTypes.length > 0 && !allowedTypes.includes(contentType)) {
        throw new Error(`Content type ${contentType} not allowed. Allowed types: ${allowedTypes.join(', ')}`)
      }

      // Generate unique key
      const fileExtension = path.extname(originalName)
      const timestamp = Date.now()
      const randomString = crypto.randomBytes(8).toString('hex')
      const key = `${folder}/${timestamp}-${randomString}${fileExtension}`

      // Upload to S3
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucket,
          Key: key,
          Body: file,
          ContentType: contentType,
          Metadata: {
            originalName,
            uploadDate: new Date().toISOString(),
          },
        },
      })

      const result = await upload.done()

      logger.info(`File uploaded successfully: ${key}`)

      return {
        key,
        url: `${this.baseUrl}/${key}`,
        bucket: this.bucket,
        location: result.Location || `${this.baseUrl}/${key}`,
        etag: result.ETag || '',
        size: fileSize,
      }
    } catch (error) {
      logger.error('S3 upload error:', error)
      throw error
    }
  }

  /**
   * Get signed URL for secure file access
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })

      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn })
      return signedUrl
    } catch (error) {
      logger.error('Error generating signed URL:', error)
      throw error
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })

      await this.s3Client.send(command)
      logger.info(`File deleted successfully: ${key}`)
      return true
    } catch (error) {
      logger.error('S3 delete error:', error)
      return false
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })

      await this.s3Client.send(command)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(key: string) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })

      const result = await this.s3Client.send(command)
      return {
        size: result.ContentLength,
        lastModified: result.LastModified,
        contentType: result.ContentType,
        metadata: result.Metadata,
        etag: result.ETag,
      }
    } catch (error) {
      logger.error('Error getting file metadata:', error)
      throw error
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: Array<{ file: Buffer; name: string; contentType?: string }>,
    options: UploadOptions = {}
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map(({ file, name, contentType }) =>
      this.uploadFile(file, name, { ...options, ...(contentType && { contentType }) })
    )

    return Promise.all(uploadPromises)
  }

  /**
   * Generate presigned URL for direct upload
   */
  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      })

      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn })
      return signedUrl
    } catch (error) {
      logger.error('Error generating presigned upload URL:', error)
      throw error
    }
  }
}

// Export singleton instance
export const s3Service = new S3Service()
