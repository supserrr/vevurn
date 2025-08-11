import express, { Request, Response } from 'express';

const router = express.Router();

// Health check
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'products' });
});

// Get all products (placeholder)
router.get('/', async (_req: Request, res: Response) => {
  try {
    // TODO: Implement product listing
    res.json({
      success: true,
      data: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 10
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
