import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { RedisService } from './RedisService';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  storeId?: string;
}

export class WebSocketService {
  private io: Server;
  private redis: RedisService;
  private connectedClients = new Map<string, AuthenticatedSocket>();

  constructor(io: Server) {
    this.io = io;
    this.redis = new RedisService();
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
        
        if (!token) {
          throw new Error('Authentication token required');
        }

        // Verify token and extract user info
        // In a real implementation, you'd verify the JWT token here
        const cleanToken = token.replace('Bearer ', '');
        
        // Mock authentication for now - replace with actual JWT verification
        if (cleanToken === 'valid-token') {
          socket.userId = 'user-123';
          socket.userRole = 'STAFF';
          socket.storeId = 'store-456';
          next();
        } else {
          throw new Error('Invalid authentication token');
        }
      } catch (error) {
        logger.error('WebSocket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info(`Client connected: ${socket.id}, User: ${socket.userId}`);
      
      // Store connected client
      if (socket.userId) {
        this.connectedClients.set(socket.userId, socket);
      }

      // Join user-specific room
      if (socket.userId) {
        socket.join(`user:${socket.userId}`);
      }

      // Join store-specific room
      if (socket.storeId) {
        socket.join(`store:${socket.storeId}`);
      }

      // Join role-specific room
      if (socket.userRole) {
        socket.join(`role:${socket.userRole}`);
      }

      // Handle real-time events
      this.setupSaleEvents(socket);
      this.setupInventoryEvents(socket);
      this.setupNotificationEvents(socket);
      this.setupSystemEvents(socket);

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        logger.info(`Client disconnected: ${socket.id}, Reason: ${reason}`);
        
        if (socket.userId) {
          this.connectedClients.delete(socket.userId);
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error(`Socket error for ${socket.id}:`, error);
      });

      // Send welcome message
      socket.emit('connected', {
        message: 'Connected to Vevurn POS',
        timestamp: new Date().toISOString(),
        userId: socket.userId,
        socketId: socket.id
      });
    });
  }

  private setupSaleEvents(socket: AuthenticatedSocket): void {
    // Handle new sale creation
    socket.on('sale:create', async (data) => {
      try {
        logger.info(`Sale creation initiated by user ${socket.userId}:`, data);
        
        // Broadcast to store staff
        if (socket.storeId) {
          socket.to(`store:${socket.storeId}`).emit('sale:created', {
            sale: data,
            createdBy: socket.userId,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        logger.error('Error handling sale creation:', error);
        socket.emit('error', { message: 'Failed to create sale' });
      }
    });

    // Handle sale completion
    socket.on('sale:complete', async (data) => {
      try {
        logger.info(`Sale completed by user ${socket.userId}:`, data);
        
        // Update real-time dashboard
        if (socket.storeId) {
          this.io.to(`store:${socket.storeId}`).emit('dashboard:sales-update', {
            saleId: data.saleId,
            amount: data.totalAmount,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        logger.error('Error handling sale completion:', error);
        socket.emit('error', { message: 'Failed to complete sale' });
      }
    });
  }

  private setupInventoryEvents(socket: AuthenticatedSocket): void {
    // Handle stock level updates
    socket.on('inventory:stock-update', async (data) => {
      try {
        logger.info(`Stock update from user ${socket.userId}:`, data);
        
        // Broadcast to all store staff
        if (socket.storeId) {
          socket.to(`store:${socket.storeId}`).emit('inventory:stock-updated', {
            productId: data.productId,
            previousStock: data.previousStock,
            newStock: data.newStock,
            updatedBy: socket.userId,
            timestamp: new Date().toISOString()
          });
        }

        // Check for low stock alerts
        if (data.newStock <= data.reorderPoint) {
          this.io.to(`role:MANAGER`).emit('inventory:low-stock-alert', {
            productId: data.productId,
            productName: data.productName,
            currentStock: data.newStock,
            reorderPoint: data.reorderPoint,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        logger.error('Error handling stock update:', error);
        socket.emit('error', { message: 'Failed to update stock' });
      }
    });
  }

  private setupNotificationEvents(socket: AuthenticatedSocket): void {
    // Handle notification acknowledgment
    socket.on('notification:ack', async (data) => {
      try {
        logger.info(`Notification acknowledged by user ${socket.userId}:`, data);
        
        // Store acknowledgment in cache
        await this.redis.set(
          `notification:ack:${data.notificationId}:${socket.userId}`,
          'acknowledged',
          3600 // 1 hour TTL
        );
      } catch (error) {
        logger.error('Error handling notification acknowledgment:', error);
      }
    });
  }

  private setupSystemEvents(socket: AuthenticatedSocket): void {
    // Handle ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // Handle client status updates
    socket.on('status:update', async (data) => {
      try {
        logger.info(`Status update from user ${socket.userId}:`, data);
        
        // Store user status in cache
        await this.redis.setJSON(
          `user:status:${socket.userId}`,
          {
            status: data.status,
            lastSeen: new Date().toISOString(),
            socketId: socket.id
          },
          300 // 5 minutes TTL
        );

        // Broadcast to relevant users
        if (socket.storeId) {
          socket.to(`store:${socket.storeId}`).emit('user:status-changed', {
            userId: socket.userId,
            status: data.status,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        logger.error('Error handling status update:', error);
      }
    });
  }

  // Public methods for broadcasting events

  // Broadcast to all connected clients
  public broadcastToAll(event: string, data: any): void {
    this.io.emit(event, data);
  }

  // Broadcast to specific user
  public broadcastToUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  // Broadcast to store
  public broadcastToStore(storeId: string, event: string, data: any): void {
    this.io.to(`store:${storeId}`).emit(event, data);
  }

  // Broadcast to role
  public broadcastToRole(role: string, event: string, data: any): void {
    this.io.to(`role:${role}`).emit(event, data);
  }

  // Send notification to user
  public sendNotification(userId: string, notification: {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    data?: any;
  }): void {
    this.broadcastToUser(userId, 'notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  // Send system alert
  public sendSystemAlert(alert: {
    title: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    targetRoles?: string[];
    targetStore?: string;
  }): void {
    const alertData = {
      ...alert,
      id: `alert_${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    if (alert.targetRoles) {
      alert.targetRoles.forEach(role => {
        this.broadcastToRole(role, 'system:alert', alertData);
      });
    } else if (alert.targetStore) {
      this.broadcastToStore(alert.targetStore, 'system:alert', alertData);
    } else {
      this.broadcastToAll('system:alert', alertData);
    }
  }

  // Get connected clients count
  public getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  // Get connected clients for store
  public async getStoreClientCount(storeId: string): Promise<number> {
    const clients = await this.io.in(`store:${storeId}`).fetchSockets();
    return clients.length;
  }

  // Check if user is online
  public isUserOnline(userId: string): boolean {
    return this.connectedClients.has(userId);
  }

  // Force disconnect user
  public disconnectUser(userId: string, reason?: string): void {
    const socket = this.connectedClients.get(userId);
    if (socket) {
      socket.disconnect(true);
      logger.info(`Force disconnected user ${userId}${reason ? `: ${reason}` : ''}`);
    }
  }
}
