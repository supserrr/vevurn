import { Server } from 'socket.io';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

interface NotificationData {
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'NEW_PRODUCT' | 'PRODUCT_UPDATE' | 'SYSTEM_ALERT' | 'SALE_ALERT';
  title: string;
  message: string;
  data?: any;
}

export class NotificationService {
  private static io: Server;

  static initialize(io: Server) {
    this.io = io;
    logger.info('Notification service initialized with Socket.io');
  }

  static async notifyLowStock(businessId: string, product: any) {
    try {
      const cashiers = await prisma.user.findMany({
        where: {
          businessId,
          role: 'CASHIER',
          isActive: true
        }
      });

      const notification: NotificationData = {
        type: 'LOW_STOCK',
        title: 'Low Stock Alert',
        message: `${product.name} is running low (${product.stockQuantity} remaining)`,
        data: { 
          productId: product.id, 
          currentStock: product.stockQuantity,
          minStockLevel: product.minStockLevel
        }
      };

      // Save notifications to database
      const notifications = await prisma.notification.createMany({
        data: cashiers.map(cashier => ({
          userId: cashier.id,
          ...notification
        }))
      });

      // Send real-time notifications
      cashiers.forEach(cashier => {
        this.io.to(`user-${cashier.id}`).emit('notification', notification);
      });

      logger.info('Low stock notification sent', { 
        productId: product.id, 
        businessId, 
        recipientCount: cashiers.length 
      });

    } catch (error) {
      logger.error('Failed to send low stock notification:', error);
    }
  }

  static async notifyOutOfStock(businessId: string, product: any) {
    try {
      const cashiers = await prisma.user.findMany({
        where: { businessId, role: 'CASHIER', isActive: true }
      });

      const notification: NotificationData = {
        type: 'OUT_OF_STOCK',
        title: 'Product Sold Out',
        message: `${product.name} is now out of stock`,
        data: { productId: product.id }
      };

      await prisma.notification.createMany({
        data: cashiers.map(cashier => ({
          userId: cashier.id,
          ...notification
        }))
      });

      cashiers.forEach(cashier => {
        this.io.to(`user-${cashier.id}`).emit('notification', notification);
      });

      logger.info('Out of stock notification sent', { 
        productId: product.id, 
        businessId, 
        recipientCount: cashiers.length 
      });

    } catch (error) {
      logger.error('Failed to send out of stock notification:', error);
    }
  }

  static async notifyNewProduct(businessId: string, product: any) {
    try {
      const cashiers = await prisma.user.findMany({
        where: { businessId, role: 'CASHIER', isActive: true }
      });

      const notification: NotificationData = {
        type: 'NEW_PRODUCT',
        title: 'New Product Added',
        message: `${product.name} has been added to inventory`,
        data: { 
          productId: product.id,
          categoryId: product.categoryId,
          initialStock: product.stockQuantity
        }
      };

      await prisma.notification.createMany({
        data: cashiers.map(cashier => ({
          userId: cashier.id,
          ...notification
        }))
      });

      cashiers.forEach(cashier => {
        this.io.to(`user-${cashier.id}`).emit('notification', notification);
      });

      logger.info('New product notification sent', { 
        productId: product.id, 
        businessId, 
        recipientCount: cashiers.length 
      });

    } catch (error) {
      logger.error('Failed to send new product notification:', error);
    }
  }

  static async notifyProductUpdate(businessId: string, product: any, changes: any) {
    try {
      const cashiers = await prisma.user.findMany({
        where: { businessId, role: 'CASHIER', isActive: true }
      });

      const notification: NotificationData = {
        type: 'PRODUCT_UPDATE',
        title: 'Product Updated',
        message: `${product.name} details have been updated`,
        data: { 
          productId: product.id,
          changes
        }
      };

      await prisma.notification.createMany({
        data: cashiers.map(cashier => ({
          userId: cashier.id,
          ...notification
        }))
      });

      cashiers.forEach(cashier => {
        this.io.to(`user-${cashier.id}`).emit('notification', notification);
      });

      logger.info('Product update notification sent', { 
        productId: product.id, 
        businessId, 
        recipientCount: cashiers.length 
      });

    } catch (error) {
      logger.error('Failed to send product update notification:', error);
    }
  }

  static async notifySystemAlert(businessId: string, alert: {
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
    data?: any;
  }) {
    try {
      const users = await prisma.user.findMany({
        where: { businessId, isActive: true }
      });

      const notification: NotificationData = {
        type: 'SYSTEM_ALERT',
        title: alert.title,
        message: alert.message,
        data: { 
          severity: alert.severity,
          ...alert.data
        }
      };

      await prisma.notification.createMany({
        data: users.map(user => ({
          userId: user.id,
          ...notification
        }))
      });

      users.forEach(user => {
        this.io.to(`user-${user.id}`).emit('notification', notification);
      });

      logger.info('System alert notification sent', { 
        businessId, 
        severity: alert.severity,
        recipientCount: users.length 
      });

    } catch (error) {
      logger.error('Failed to send system alert notification:', error);
    }
  }

  static async notifySaleAlert(businessId: string, sale: any, alertType: 'large_sale' | 'failed_payment' | 'refund') {
    try {
      const managers = await prisma.user.findMany({
        where: { 
          businessId, 
          role: { in: ['MANAGER', 'ADMIN'] },
          isActive: true 
        }
      });

      let message = '';
      switch (alertType) {
        case 'large_sale':
          message = `Large sale completed: RWF ${Number(sale.totalAmount).toLocaleString()}`;
          break;
        case 'failed_payment':
          message = `Payment failed for sale ${sale.saleNumber}`;
          break;
        case 'refund':
          message = `Refund processed for sale ${sale.saleNumber}`;
          break;
      }

      const notification: NotificationData = {
        type: 'SALE_ALERT',
        title: 'Sale Alert',
        message,
        data: { 
          saleId: sale.id,
          saleNumber: sale.saleNumber,
          alertType,
          amount: sale.totalAmount
        }
      };

      await prisma.notification.createMany({
        data: managers.map(manager => ({
          userId: manager.id,
          ...notification
        }))
      });

      managers.forEach(manager => {
        this.io.to(`user-${manager.id}`).emit('notification', notification);
      });

      logger.info('Sale alert notification sent', { 
        saleId: sale.id, 
        businessId, 
        alertType,
        recipientCount: managers.length 
      });

    } catch (error) {
      logger.error('Failed to send sale alert notification:', error);
    }
  }



  static async getUserNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.notification.count({
        where: { userId }
      })
    ]);

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false }
    });

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    };
  }

  static async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.update({
      where: { 
        id: notificationId,
        userId // Ensure user owns the notification
      },
      data: { isRead: true }
    });

    return notification;
  }

  static async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
  }
}
