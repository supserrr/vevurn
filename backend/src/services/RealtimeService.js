// =============================================
// WEBSOCKET REAL-TIME SERVICE
// =============================================

import { Server as SocketIOServer } from 'socket.io';
import crypto from 'crypto';
import { db } from '../database/database.js';
import { ErrorService } from '../monitoring/errorService.js';

export class RealtimeService {
  constructor(server) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        credentials: true
      }
    });

    this.setupEventHandlers();
    this.connectedUsers = new Map();
  }

  setupEventHandlers() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        const user = await this.authenticateSocket(token);
        
        if (!user) {
          return next(new Error('Authentication failed'));
        }

        socket.userId = user.id;
        socket.userRole = user.role;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  async handleConnection(socket) {
    try {
      // Store connection info
      await db.prisma.websocketSessions.create({
        data: {
          connection_id: socket.id,
          socket_id: socket.id,
          staff_id: socket.userId,
          ip_address: socket.handshake.address,
          user_agent: socket.handshake.headers['user-agent'],
          origin: socket.handshake.headers.origin,
          subscribed_channels: [],
          status: 'connected'
        }
      });

      this.connectedUsers.set(socket.id, {
        userId: socket.userId,
        role: socket.userRole,
        connectedAt: new Date()
      });

      // Join role-based rooms
      socket.join(`role_${socket.userRole}`);
      socket.join(`user_${socket.userId}`);

      this.setupSocketEventHandlers(socket);
      await this.sendInitialData(socket);

      console.log(`User ${socket.userId} connected with socket ${socket.id}`);

    } catch (error) {
      console.error('Connection handling error:', error);
      await ErrorService.logError(error, {
        component: 'websocket',
        operation: 'connection_handling',
        user_id: socket.userId
      });
    }
  }

  setupSocketEventHandlers(socket) {
    // Subscribe to channels
    socket.on('subscribe', async (channels) => {
      for (const channel of channels) {
        if (this.canSubscribeToChannel(socket.userRole, channel)) {
          socket.join(channel);
          await this.updateSubscribedChannels(socket.id, channel, 'add');
        }
      }
    });

    // Stock check requests
    socket.on('check_stock', async (productId) => {
      try {
        const product = await db.prisma.products.findUnique({
          where: { id: productId },
          select: { id: true, name: true, stock_quantity: true, low_stock_threshold: true }
        });

        socket.emit('stock_update', {
          productId: productId,
          stock: product?.stock_quantity || 0,
          isLowStock: product && product.stock_quantity <= product.low_stock_threshold
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to check stock' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      await this.handleDisconnection(socket);
    });

    // Ping for connection health
    socket.on('ping', () => {
      socket.emit('pong');
      this.updateLastActivity(socket.id);
    });
  }

  async handleDisconnection(socket) {
    try {
      await db.prisma.websocketSessions.update({
        where: { connection_id: socket.id },
        data: {
          status: 'disconnected',
          disconnected_at: new Date()
        }
      });

      this.connectedUsers.delete(socket.id);
      console.log(`User ${socket.userId} disconnected`);
    } catch (error) {
      console.error('Disconnection handling error:', error);
    }
  }

  async broadcastStockUpdate(productId, newStock, updatedBy) {
    const updateData = {
      type: 'STOCK_UPDATE',
      productId,
      newStock,
      updatedBy,
      timestamp: new Date().toISOString()
    };

    this.io.to('stock_updates').emit('stock_update', updateData);

    await this.logWebSocketMessage({
      message_type: 'stock_update',
      direction: 'outbound',
      payload: updateData,
      recipients: await this.getChannelSubscribers('stock_updates')
    });
  }

  async broadcastPaymentUpdate(saleId, paymentStatus, momoData = null) {
    const updateData = {
      type: 'PAYMENT_UPDATE',
      saleId,
      paymentStatus,
      momoData,
      timestamp: new Date().toISOString()
    };

    if (momoData?.staffId) {
      this.io.to(`user_${momoData.staffId}`).emit('payment_status', updateData);
    }

    this.io.to('role_supervisor').to('role_manager').to('role_admin').emit('payment_status', updateData);
  }

  async sendNotification(userId, notification) {
    const notificationData = {
      type: 'NOTIFICATION',
      id: crypto.randomUUID(),
      title: notification.title,
      message: notification.message,
      severity: notification.severity || 'info',
      timestamp: new Date().toISOString(),
      actionRequired: notification.actionRequired || false
    };

    if (userId) {
      this.io.to(`user_${userId}`).emit('notification', notificationData);
    } else {
      this.io.emit('notification', notificationData);
    }

    // Store notification for offline users
    await db.prisma.notifications.create({
      data: {
        user_id: userId,
        title: notification.title,
        message: notification.message,
        severity: notification.severity,
        action_required: notification.actionRequired,
        delivered: userId ? false : true
      }
    });
  }

  canSubscribeToChannel(userRole, channel) {
    const rolePermissions = {
      cashier: ['stock_updates', 'payment_updates', 'notifications'],
      supervisor: ['stock_updates', 'payment_updates', 'notifications', 'sales_updates'],
      manager: ['stock_updates', 'payment_updates', 'notifications', 'sales_updates', 'system_alerts'],
      admin: '*'
    };

    if (rolePermissions[userRole] === '*') return true;
    return rolePermissions[userRole]?.includes(channel) || false;
  }

  async updateLastActivity(socketId) {
    try {
      await db.prisma.websocketSessions.update({
        where: { connection_id: socketId },
        data: { 
          last_activity_at: new Date(),
          messages_received: { increment: 1 }
        }
      });
    } catch (error) {
      console.error('Failed to update last activity:', error);
    }
  }

  async authenticateSocket(token) {
    // Implement your socket authentication logic here
    // This should verify the JWT token and return user data
    try {
      // Mock implementation - replace with actual JWT verification
      if (!token) return null;
      
      // Decode and verify token, then get user from database
      const userId = 'extracted-from-token';
      return await db.prisma.staff.findUnique({
        where: { id: userId }
      });
    } catch (error) {
      return null;
    }
  }

  async sendInitialData(socket) {
    // Send initial system status, notifications, etc.
    const systemStatus = {
      type: 'SYSTEM_STATUS',
      status: 'online',
      timestamp: new Date().toISOString()
    };
    
    socket.emit('system_status', systemStatus);
  }

  async updateSubscribedChannels(socketId, channel, action) {
    try {
      const session = await db.prisma.websocketSessions.findUnique({
        where: { connection_id: socketId }
      });

      if (session) {
        const channels = session.subscribed_channels || [];
        const updatedChannels = action === 'add' 
          ? [...channels, channel]
          : channels.filter(c => c !== channel);

        await db.prisma.websocketSessions.update({
          where: { connection_id: socketId },
          data: { subscribed_channels: updatedChannels }
        });
      }
    } catch (error) {
      console.error('Failed to update subscribed channels:', error);
    }
  }

  async logWebSocketMessage(messageData) {
    try {
      await db.prisma.websocketMessageLogs.create({
        data: {
          message_type: messageData.message_type,
          direction: messageData.direction,
          payload: messageData.payload,
          delivery_status: 'sent',
          created_at: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to log WebSocket message:', error);
    }
  }

  async getChannelSubscribers(channel) {
    return await db.prisma.websocketSessions.count({
      where: {
        subscribed_channels: {
          has: channel
        },
        status: 'connected'
      }
    });
  }
}
