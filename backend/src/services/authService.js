// =============================================
// AUTHENTICATION SERVICE
// =============================================

import { clerkClient } from '@clerk/nextjs/server';
import { auth, currentUser } from '@clerk/nextjs';
import { db } from '../database/database.js';

export class AuthService {
  static async validateAndEnrichUser() {
    try {
      const { userId } = auth();
      if (!userId) return null;

      const user = await currentUser();
      if (!user) return null;

      // Get or create staff record
      let staff = await db.prisma.staff.findUnique({
        where: { clerk_user_id: userId },
        include: {
          permissions: true
        }
      });

      if (!staff) {
        staff = await db.prisma.staff.create({
          data: {
            clerk_user_id: userId,
            employee_id: await this.generateEmployeeId(),
            first_name: user.firstName || '',
            last_name: user.lastName || '',
            email: user.primaryEmailAddress?.emailAddress || '',
            profile_image_url: user.imageUrl,
            role: 'cashier',
            hire_date: new Date(),
            is_active: true
          }
        });

        await this.logAuthEvent({
          staff_id: staff.id,
          event_type: 'user_created',
          success: true,
          metadata: { source: 'clerk_sync' }
        });
      }

      // Update session info
      await this.updateUserSession(staff.id, userId);

      return staff;
    } catch (error) {
      console.error('Auth validation error:', error);
      await ErrorService.logError(error, { component: 'auth', operation: 'validation' });
      return null;
    }
  }

  static async checkPermission(staffId, resource, action) {
    try {
      const staff = await db.prisma.staff.findUnique({
        where: { id: staffId },
        include: { permissions: true }
      });

      if (!staff || !staff.is_active) return false;
      if (staff.role === 'admin') return true;

      const rolePermissions = this.getRolePermissions(staff.role);
      if (rolePermissions[resource]?.includes(action)) return true;

      const customPermission = staff.permissions.find(p => 
        p.resource === resource && 
        p.actions.includes(action) &&
        (!p.expires_at || new Date(p.expires_at) > new Date())
      );

      return !!customPermission;
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }

  static getRolePermissions(role) {
    const permissions = {
      cashier: {
        sales: ['create', 'read'],
        products: ['read'],
        customers: ['create', 'read', 'update'],
        inventory: ['read']
      },
      supervisor: {
        sales: ['create', 'read', 'update', 'delete'],
        products: ['create', 'read', 'update'],
        customers: ['create', 'read', 'update', 'delete'],
        inventory: ['create', 'read', 'update'],
        reports: ['read']
      },
      manager: {
        sales: ['create', 'read', 'update', 'delete'],
        products: ['create', 'read', 'update', 'delete'],
        customers: ['create', 'read', 'update', 'delete'],
        inventory: ['create', 'read', 'update', 'delete'],
        staff: ['create', 'read', 'update'],
        reports: ['create', 'read'],
        loans: ['create', 'read', 'update', 'delete']
      }
    };

    return permissions[role] || {};
  }

  static async generateEmployeeId() {
    const count = await db.prisma.staff.count();
    return `EMP${String(count + 1).padStart(4, '0')}`;
  }

  static async updateUserSession(staffId, sessionId) {
    await db.prisma.staff.update({
      where: { id: staffId },
      data: {
        last_login_at: new Date(),
        login_count: { increment: 1 },
        current_session_id: sessionId
      }
    });
  }

  static async logAuthEvent(eventData) {
    return db.prisma.authEvents.create({
      data: {
        ...eventData,
        created_at: new Date()
      }
    });
  }
}
