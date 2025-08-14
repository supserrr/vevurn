import { Router } from 'express';
import productRoutes from './products.routes';

const router: Router = Router();

// Mount routes
router.use('/products', productRoutes);

// Base routes
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Vevurn API is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API info route  
router.get('/info', (req, res) => {
  res.json({
    success: true,
    message: 'Vevurn POS API',
    version: '1.0.0',
    description: 'Point of Sale system for phone accessories in Rwanda'
  });
});

export default router;
