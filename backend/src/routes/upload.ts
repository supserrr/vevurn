// backend/src/routes/upload.ts
import { Router } from 'express'
import { UploadController, upload } from '../controllers/UploadController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// All upload routes require authentication
router.use(authMiddleware as any)

// Single file upload
router.post('/single', (req: any, res: any, next: any) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) return next(err)
    UploadController.uploadSingle(req, res).catch(next)
  })
})

// Multiple files upload  
router.post('/multiple', (req: any, res: any, next: any) => {
  upload.array('files', 10)(req, res, (err: any) => {
    if (err) return next(err)
    UploadController.uploadMultiple(req, res).catch(next)
  })
})

// Get signed URL for file access
router.get('/signed-url/:key(*)', (req: any, res: any, next: any) => {
  UploadController.getSignedUrl(req, res).catch(next)
})

// Delete file
router.delete('/:key(*)', (req: any, res: any, next: any) => {
  UploadController.deleteFile(req, res).catch(next)
})

// Get file metadata
router.get('/metadata/:key(*)', (req: any, res: any, next: any) => {
  UploadController.getFileMetadata(req, res).catch(next)
})

// Generate presigned upload URL for direct client uploads
router.post('/presigned-upload', (req: any, res: any, next: any) => {
  UploadController.getPresignedUploadUrl(req, res).catch(next)
})

export default router
