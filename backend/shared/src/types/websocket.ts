// WebSocket event types and real-time communication
export interface WebSocketEvent<T = any> {
  type: string
  data: T
  timestamp: Date
  userId?: string
  sessionId?: string
}

// Real-time events
export enum WebSocketEventType {
  // Connection events
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  AUTHENTICATE = 'authenticate',
  AUTHENTICATED = 'authenticated',
  UNAUTHORIZED = 'unauthorized',
  
  // Inventory events
  STOCK_UPDATED = 'stock_updated',
  LOW_STOCK_ALERT = 'low_stock_alert',
  OUT_OF_STOCK_ALERT = 'out_of_stock_alert',
  PRODUCT_ADDED = 'product_added',
  PRODUCT_UPDATED = 'product_updated',
  
  // Sales events
  SALE_CREATED = 'sale_created',
  SALE_COMPLETED = 'sale_completed',
  SALE_VOIDED = 'sale_voided',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_FAILED = 'payment_failed',
  
  // Customer events
  CUSTOMER_REGISTERED = 'customer_registered',
  CUSTOMER_UPDATED = 'customer_updated',
  
  // Staff events
  STAFF_LOGGED_IN = 'staff_logged_in',
  STAFF_LOGGED_OUT = 'staff_logged_out',
  STAFF_PERFORMANCE_UPDATE = 'staff_performance_update',
  
  // System events
  SYSTEM_ALERT = 'system_alert',
  BACKUP_COMPLETED = 'backup_completed',
  MAINTENANCE_MODE = 'maintenance_mode',
  
  // Notifications
  NOTIFICATION = 'notification',
  BROADCAST = 'broadcast'
}

// Event payload types
export interface StockUpdateEvent {
  productId: string
  productName: string
  oldStock: number
  newStock: number
  movement: 'IN' | 'OUT' | 'ADJUSTMENT'
  reason?: string
}

export interface LowStockAlertEvent {
  productId: string
  productName: string
  currentStock: number
  minStock: number
  category: string
}

export interface SaleCompletedEvent {
  saleId: string
  saleNumber: string
  customerId?: string
  customerName?: string
  total: number
  currency: string
  paymentMethod: string
  cashierId: string
  cashierName: string
  itemCount: number
}

export interface PaymentReceivedEvent {
  paymentId: string
  saleId: string
  amount: number
  currency: string
  method: string
  status: string
  transactionId?: string
}

export interface SystemAlertEvent {
  level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  title: string
  message: string
  component?: string
  action?: string
}

export interface NotificationEvent {
  id: string
  title: string
  message: string
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  targetUsers?: string[]
  targetRoles?: string[]
  persistent: boolean
  actionUrl?: string
  actionLabel?: string
}

// WebSocket session management
export interface WebSocketSession {
  id: string
  userId: string
  socketId: string
  connectedAt: Date
  lastSeen: Date
  userAgent?: string
  ipAddress?: string
  subscriptions: string[]
}

export interface WebSocketSubscription {
  sessionId: string
  eventType: string
  filters?: Record<string, any>
  createdAt: Date
}

// Real-time dashboard data
export interface RealTimeDashboard {
  activeSessions: number
  todaysSales: {
    count: number
    revenue: number
    lastSale?: Date
  }
  inventory: {
    lowStockItems: number
    recentMovements: number
  }
  staff: {
    activeUsers: number
    topPerformer?: {
      name: string
      sales: number
    }
  }
  system: {
    uptime: number
    lastBackup?: Date
    pendingAlerts: number
  }
}

// Subscription management
export interface SubscriptionRequest {
  eventTypes: string[]
  filters?: Record<string, any>
}

export interface UnsubscriptionRequest {
  eventTypes: string[]
}
