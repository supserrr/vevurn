// Example integration of enhanced authentication middleware
// File: backend/src/app-with-enhanced-auth.ts

import express from 'express';
// import cookieParser from 'cookie-parser'; // Install with: npm install cookie-parser @types/cookie-parser
import { enhancedAuthMiddleware, adminOnly, managerOrAbove } from './middleware/enhancedAuth';
// import enhancedAuthTestRoutes from './routes/enhanced-auth-test';

const app = express();

// Middleware setup
app.use(express.json());
// app.use(cookieParser()); // Uncomment when cookie-parser is installed

// Mount the enhanced auth test routes
// app.use('/api/enhanced-auth', enhancedAuthTestRoutes); // Uncomment when routes are properly exported

// Example of protecting existing routes with enhanced authentication

// Protect admin routes
app.use('/api/admin/*', enhancedAuthMiddleware, adminOnly);

// Protect manager routes
app.use('/api/manager/*', enhancedAuthMiddleware, managerOrAbove);

// Example protected routes
app.get('/api/admin/dashboard', (_req, res) => {
  res.json({ message: 'Admin dashboard access granted' });
});

app.get('/api/manager/reports', (_req, res) => {
  res.json({ message: 'Manager reports access granted' });
});

// Health check (no auth required)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default app;

// Example usage in main server file:
/*
import app from './app-with-enhanced-auth';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Enhanced authentication system active');
  console.log('Test routes available at /api/enhanced-auth/*');
});
*/
