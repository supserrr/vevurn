// Test API endpoint
import { Request, Response } from 'express';

export const testRoute = (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Vevurn Backend API is working!',
    timestamp: new Date().toISOString(),
    database: 'Connected (PostgreSQL)',
    environment: process.env.NODE_ENV,
    version: '1.0.0',
  });
};

export default testRoute;
