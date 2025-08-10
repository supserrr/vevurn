import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import our route handlers
import categoryRoutes from './routes/categories';
import supplierRoutes from './routes/suppliers';
import userRoutes from './routes/users';
import loanRoutes from './routes/loans';
import settingRoutes from './routes/settings';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' 
      ? 'https://vevurn-frontend.vercel.app' 
      : "http://localhost:3001"),
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(compression() as unknown as express.RequestHandler);
app.use(cors({
  origin: process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' 
    ? 'https://vevurn-frontend.vercel.app' 
    : "http://localhost:3001"),
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    message: '✅ Vevurn POS Backend is running!'
  });
});

// API routes
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// Mount our route handlers
app.use('/api/categories', categoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/users', userRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/settings', settingRoutes);

// Mock authentication endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simple mock authentication
  if (email && password) {
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: '1',
          email: email,
          name: 'Demo User',
          role: 'admin'
        },
        token: 'demo-jwt-token',
        expiresIn: '24h'
      }
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Email and password required'
    });
  }
});

// Mock products endpoint
app.get('/api/products', (_req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        name: 'Sample Product 1',
        price: 29.99,
        stock: 100,
        category: 'Electronics'
      },
      {
        id: '2',
        name: 'Sample Product 2', 
        price: 19.99,
        stock: 50,
        category: 'Clothing'
      }
    ]
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.emit('welcome', {
    message: 'Connected to Vevurn POS WebSocket',
    timestamp: new Date().toISOString()
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Start server
httpServer.listen(PORT, () => {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://vevurn-backend.onrender.com' 
    : `http://localhost:${PORT}`;
    
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check available at ${baseUrl}/health`);
  console.log(`🔗 API endpoints at ${baseUrl}/api`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('✅ Ready to accept connections!');
});

export { app, httpServer, io };
