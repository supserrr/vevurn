import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export interface UploadConfig {
  destination?: string;
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  generateFilename?: (originalName: string) => string;
}

export interface UploadResult {
  success: boolean;
  filename?: string;
  filepath?: string;
  url?: string;
  size?: number;
  mimetype?: string;
  error?: string;
}

export class FileUploadService {
  private uploadDir: string;
  private baseUrl: string;
  private maxFileSize: number;
  private allowedMimeTypes: string[];

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    this.baseUrl = process.env.BASE_URL || 'http://localhost:8000';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default
    this.allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    this.ensureUploadDirectories();
  }

  /**
   * Create upload directories if they don't exist
   */
  private async ensureUploadDirectories() {
    try {
      const directories = [
        this.uploadDir,
        path.join(this.uploadDir, 'products'),
        path.join(this.uploadDir, 'receipts'),
        path.join(this.uploadDir, 'reports'),
        path.join(this.uploadDir, 'temp')
      ];

      for (const dir of directories) {
        try {
          await fs.access(dir);
        } catch {
          await fs.mkdir(dir, { recursive: true });
          logger.info(`Created upload directory: ${dir}`);
        }
      }
    } catch (error) {
      logger.error('Failed to create upload directories:', error);
    }
  }

  /**
   * Get multer configuration for product images
   */
  getProductImageUpload() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path.join(this.uploadDir, 'products'));
      },
      filename: (req, file, cb) => {
        const uniqueName = this.generateUniqueFilename(file.originalname);
        cb(null, uniqueName);
      }
    });

    return multer({
      storage,
      limits: {
        fileSize: this.maxFileSize,
        files: 5 // Maximum 5 files per product
      },
      fileFilter: (req, file, cb) => {
        if (this.isImageFile(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'));
        }
      }
    });
  }

  /**
   * Get multer configuration for receipt uploads
   */
  getReceiptUpload() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path.join(this.uploadDir, 'receipts'));
      },
      filename: (req, file, cb) => {
        const uniqueName = this.generateUniqueFilename(file.originalname);
        cb(null, uniqueName);
      }
    });

    return multer({
      storage,
      limits: {
        fileSize: this.maxFileSize
      },
      fileFilter: (req, file, cb) => {
        if (this.isPdfOrImageFile(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Only PDF and image files are allowed'));
        }
      }
    });
  }

  /**
   * Get multer configuration for report exports
   */
  getReportUpload() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path.join(this.uploadDir, 'reports'));
      },
      filename: (req, file, cb) => {
        const uniqueName = this.generateUniqueFilename(file.originalname);
        cb(null, uniqueName);
      }
    });

    return multer({
      storage,
      limits: {
        fileSize: this.maxFileSize
      },
      fileFilter: (req, file, cb) => {
        if (this.isSpreadsheetOrPdfFile(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Only Excel, CSV, and PDF files are allowed'));
        }
      }
    });
  }

  /**
   * Upload a single file programmatically
   */
  async uploadFile(
    file: Express.Multer.File | Buffer,
    filename: string,
    subfolder: string = 'temp'
  ): Promise<UploadResult> {
    try {
      const uploadPath = path.join(this.uploadDir, subfolder);
      const uniqueFilename = this.generateUniqueFilename(filename);
      const filepath = path.join(uploadPath, uniqueFilename);

      // Ensure directory exists
      await fs.mkdir(uploadPath, { recursive: true });

      if (Buffer.isBuffer(file)) {
        // Handle buffer input
        await fs.writeFile(filepath, file);
      } else {
        // Handle multer file input
        await fs.copyFile(file.path, filepath);
        // Clean up temporary file
        await fs.unlink(file.path).catch(() => {}); // Ignore errors
      }

      const stats = await fs.stat(filepath);
      const url = `${this.baseUrl}/uploads/${subfolder}/${uniqueFilename}`;

      logger.info(`File uploaded successfully: ${uniqueFilename}`, {
        size: stats.size,
        location: filepath
      });

      return {
        success: true,
        filename: uniqueFilename,
        filepath,
        url,
        size: stats.size,
        mimetype: !Buffer.isBuffer(file) ? file.mimetype : undefined
      };
    } catch (error) {
      logger.error('File upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(filename: string, subfolder: string = 'temp'): Promise<boolean> {
    try {
      const filepath = path.join(this.uploadDir, subfolder, filename);
      await fs.unlink(filepath);
      logger.info(`File deleted successfully: ${filename}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete file ${filename}:`, error);
      return false;
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(filename: string, subfolder: string = 'temp') {
    try {
      const filepath = path.join(this.uploadDir, subfolder, filename);
      const stats = await fs.stat(filepath);
      const url = `${this.baseUrl}/uploads/${subfolder}/${filename}`;

      return {
        filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        url,
        exists: true
      };
    } catch (error) {
      return {
        filename,
        exists: false,
        error: error instanceof Error ? error.message : 'File not found'
      };
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(subfolder: string = 'temp') {
    try {
      const uploadPath = path.join(this.uploadDir, subfolder);
      const files = await fs.readdir(uploadPath);
      
      const fileInfos = await Promise.all(
        files.map(async (filename) => {
          const filepath = path.join(uploadPath, filename);
          const stats = await fs.stat(filepath);
          const url = `${this.baseUrl}/uploads/${subfolder}/${filename}`;

          return {
            filename,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            url
          };
        })
      );

      return fileInfos;
    } catch (error) {
      logger.error(`Failed to list files in ${subfolder}:`, error);
      return [];
    }
  }

  /**
   * Clean up old temporary files
   */
  async cleanupTempFiles(olderThanHours: number = 24) {
    try {
      const tempPath = path.join(this.uploadDir, 'temp');
      const files = await fs.readdir(tempPath);
      const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
      
      let deletedCount = 0;

      for (const filename of files) {
        const filepath = path.join(tempPath, filename);
        const stats = await fs.stat(filepath);

        if (stats.birthtime < cutoffTime) {
          await fs.unlink(filepath);
          deletedCount++;
        }
      }

      logger.info(`Cleaned up ${deletedCount} temporary files older than ${olderThanHours} hours`);
      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup temporary files:', error);
      return 0;
    }
  }

  /**
   * Generate unique filename with timestamp and UUID
   */
  private generateUniqueFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const uuid = uuidv4().split('-')[0]; // Use first part of UUID for brevity
    return `${timestamp}_${uuid}${ext}`;
  }

  /**
   * Check if file is an image
   */
  private isImageFile(mimetype: string): boolean {
    return [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ].includes(mimetype);
  }

  /**
   * Check if file is PDF or image
   */
  private isPdfOrImageFile(mimetype: string): boolean {
    return this.isImageFile(mimetype) || mimetype === 'application/pdf';
  }

  /**
   * Check if file is spreadsheet or PDF
   */
  private isSpreadsheetOrPdfFile(mimetype: string): boolean {
    return [
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ].includes(mimetype);
  }

  /**
   * Get service configuration and status
   */
  getServiceInfo() {
    return {
      uploadDirectory: this.uploadDir,
      maxFileSize: this.maxFileSize,
      maxFileSizeMB: Math.round(this.maxFileSize / 1024 / 1024),
      allowedMimeTypes: this.allowedMimeTypes,
      baseUrl: this.baseUrl,
      subdirectories: ['products', 'receipts', 'reports', 'temp'],
      features: [
        'Product image uploads',
        'Receipt file uploads', 
        'Report exports',
        'Temporary file handling',
        'Automatic cleanup',
        'File validation'
      ]
    };
  }
}

// Export singleton instance
export const fileUploadService = new FileUploadService();
