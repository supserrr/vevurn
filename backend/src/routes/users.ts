import { Router } from 'express';
import { Request, Response } from 'express';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'users' });
});

router.get('/', async (_req: Request, res: Response) => {
  res.json({ 
    success: true, 
    message: 'Users endpoint - Implementation pending'
  });
});

export default router;
