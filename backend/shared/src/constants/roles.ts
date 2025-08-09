// User roles and permissions
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  SUPERVISOR = 'SUPERVISOR', 
  CASHIER = 'CASHIER'
}

export const ROLE_HIERARCHY = {
  [UserRole.ADMIN]: 4,
  [UserRole.MANAGER]: 3,
  [UserRole.SUPERVISOR]: 2,
  [UserRole.CASHIER]: 1
} as const

export const PERMISSIONS = {
  // Product management
  PRODUCT_CREATE: 'product:create',
  PRODUCT_READ: 'product:read',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',
  
  // Inventory management
  INVENTORY_READ: 'inventory:read',
  INVENTORY_ADJUST: 'inventory:adjust',
  INVENTORY_TRANSFER: 'inventory:transfer',
  
  // Sales management
  SALE_CREATE: 'sale:create',
  SALE_READ: 'sale:read',
  SALE_VOID: 'sale:void',
  SALE_RETURN: 'sale:return',
  SALE_DISCOUNT: 'sale:discount',
  
  // Customer management
  CUSTOMER_CREATE: 'customer:create',
  CUSTOMER_READ: 'customer:read',
  CUSTOMER_UPDATE: 'customer:update',
  CUSTOMER_DELETE: 'customer:delete',
  
  // Loan management
  LOAN_CREATE: 'loan:create',
  LOAN_READ: 'loan:read',
  LOAN_UPDATE: 'loan:update',
  LOAN_DELETE: 'loan:delete',
  
  // Staff management
  STAFF_CREATE: 'staff:create',
  STAFF_READ: 'staff:read',
  STAFF_UPDATE: 'staff:update',
  STAFF_DELETE: 'staff:delete',
  
  // Reports and analytics
  REPORT_SALES: 'report:sales',
  REPORT_INVENTORY: 'report:inventory',
  REPORT_FINANCIAL: 'report:financial',
  REPORT_STAFF: 'report:staff',
  
  // System administration
  SYSTEM_CONFIG: 'system:config',
  SYSTEM_BACKUP: 'system:backup',
  SYSTEM_LOGS: 'system:logs',
  SYSTEM_MONITOR: 'system:monitor'
} as const

export const ROLE_PERMISSIONS = {
  [UserRole.ADMIN]: Object.values(PERMISSIONS),
  [UserRole.MANAGER]: [
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.SALE_CREATE,
    PERMISSIONS.SALE_READ,
    PERMISSIONS.SALE_VOID,
    PERMISSIONS.SALE_RETURN,
    PERMISSIONS.SALE_DISCOUNT,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.CUSTOMER_UPDATE,
    PERMISSIONS.LOAN_CREATE,
    PERMISSIONS.LOAN_READ,
    PERMISSIONS.LOAN_UPDATE,
    PERMISSIONS.STAFF_READ,
    PERMISSIONS.REPORT_SALES,
    PERMISSIONS.REPORT_INVENTORY,
    PERMISSIONS.REPORT_FINANCIAL,
    PERMISSIONS.REPORT_STAFF
  ],
  [UserRole.SUPERVISOR]: [
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.SALE_CREATE,
    PERMISSIONS.SALE_READ,
    PERMISSIONS.SALE_VOID,
    PERMISSIONS.SALE_RETURN,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.CUSTOMER_UPDATE,
    PERMISSIONS.LOAN_CREATE,
    PERMISSIONS.LOAN_READ,
    PERMISSIONS.LOAN_UPDATE,
    PERMISSIONS.REPORT_SALES,
    PERMISSIONS.REPORT_INVENTORY
  ],
  [UserRole.CASHIER]: [
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.SALE_CREATE,
    PERMISSIONS.SALE_READ,
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.LOAN_READ
  ]
} as const
