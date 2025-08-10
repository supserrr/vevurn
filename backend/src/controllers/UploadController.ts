// backend/src/controllers/UploadController.ts
import { Request, Response } from 'express'
import { s3Service } from '../services/S3Service'
import { logger } from '../utils/logger'
import multer from 'multer'

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Allow images and PDFs
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`))
    }
  },
})

export class UploadController {
  /**
   * Upload single file
   */
  static async uploadSingle(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file provided' })
        return
      }

      const { folder } = req.body
      const result = await s3Service.uploadFile(
        req.file.buffer,
        req.file.originalname,
        {
          folder: folder || 'uploads',
          contentType: req.file.mimetype,
        }
      )

      res.json({
        message: 'File uploaded successfully',
        file: result,
      })
    } catch (error) {
      logger.error('Upload error:', error)
      res.status(500).json({ error: 'Upload failed' })
    }
  }

  /**
   * Upload multiple files
   */
  static async uploadMultiple(req: Request, res: Response): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[]
      if (!files || files.length === 0) {
        res.status(400).json({ error: 'No files provided' })
        return
      }

      const { folder } = req.body
      const fileData = files.map(file => ({
        file: file.buffer,
        name: file.originalname,
        contentType: file.mimetype,
      }))

      const results = await s3Service.uploadMultipleFiles(fileData, {
        folder: folder || 'uploads',
      })

      res.json({
        message: `${results.length} files uploaded successfully`,
        files: results,
      })
    } catch (error) {
      logger.error('Multiple upload error:', error)
      res.status(500).json({ error: 'Upload failed' })
    }
  }

  /**
   * Get signed URL for file access
   */
  static async getSignedUrl(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params
      const { expiresIn } = req.query

      const signedUrl = await s3Service.getSignedUrl(
        key,
        expiresIn ? parseInt(expiresIn as string) : 3600
      )

      res.json({
        signedUrl,
        expiresIn: expiresIn || 3600,
      })
    } catch (error) {
      logger.error('Signed URL error:', error)
      res.status(500).json({ error: 'Failed to generate signed URL' })
    }
  }

  /**
   * Delete file
   */
  static async deleteFile(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params

      // Check if file exists first
      const exists = await s3Service.fileExists(key)
      if (!exists) {
        res.status(404).json({ error: 'File not found' })
        return
      }

      const success = await s3Service.deleteFile(key)
      
      if (success) {
        res.json({ message: 'File deleted successfully' })
      } else {
        res.status(500).json({ error: 'Failed to delete file' })
      }
    } catch (error) {
      logger.error('Delete error:', error)
      res.status(500).json({ error: 'Delete failed' })
    }
  }

  /**
   * Get file metadata
   */
  static async getFileMetadata(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params

      const metadata = await s3Service.getFileMetadata(key)
      res.json({ metadata })
    } catch (error) {
      logger.error('Metadata error:', error)
      res.status(404).json({ error: 'File not found or metadata unavailable' })
    }
  }

  /**
   * Generate presigned upload URL for direct client uploads
   */
  static async getPresignedUploadUrl(req: Request, res: Response): Promise<void> {
    try {
      const { fileName, contentType, folder } = req.body

      if (!fileName || !contentType) {
        res.status(400).json({ error: 'fileName and contentType are required' })
        return
      }

      // Generate unique key
      const timestamp = Date.now()
      const key = `${folder || 'uploads'}/${timestamp}-${fileName}`

      const presignedUrl = await s3Service.getPresignedUploadUrl(key, contentType)

      res.json({
        presignedUrl,
        key,
        expiresIn: 3600,
        instructions: 'Use PUT request with the presigned URL to upload directly to S3'
      })
    } catch (error) {
      logger.error('Presigned upload URL error:', error)
      res.status(500).json({ error: 'Failed to generate presigned upload URL' })
    }
  }
}

// Export multer upload middleware for use in routes
export { upload }
