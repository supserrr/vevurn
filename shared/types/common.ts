// Common utility types and enums used across the application

// Base Entity Interface
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Generic ID type
export type ID = string;

// Status types
export enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

// Currency types
export enum Currency {
  RWF = 'RWF',
  USD = 'USD',
  EUR = 'EUR',
}

export interface Money {
  amount: number;
  currency: Currency;
}

// Address types
export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

// Contact information
export interface ContactInfo {
  email?: string;
  phone?: string;
  website?: string;
}

// File upload types
export interface FileUpload {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

export interface UploadProgress {
  filename: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

// Audit trail
export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
  timestamp: string;
  
  // Relations
  user?: any; // User type from auth
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
}

// System settings
export interface Setting {
  id: string;
  key: string;
  value: string;
  type: SettingType;
  category: string;
  description?: string;
  isSystem: boolean;
  validation?: SettingValidation;
  createdAt: string;
  updatedAt: string;
}

export enum SettingType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  JSON = 'JSON',
  EMAIL = 'EMAIL',
  URL = 'URL',
  PASSWORD = 'PASSWORD',
}

export interface SettingValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  options?: string[];
}

export interface UpdateSettingRequest {
  value: string;
}

// Notification types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  userId?: string;
  isRead: boolean;
  readAt?: string;
  data?: Record<string, any>;
  expiresAt?: string;
  createdAt: string;
}

export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  LOW_STOCK = 'LOW_STOCK',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  SALE_COMPLETED = 'SALE_COMPLETED',
  SYSTEM_UPDATE = 'SYSTEM_UPDATE',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// Export/Import types
export interface ExportRequest {
  format: ExportFormat;
  entityType: string;
  filters?: Record<string, any>;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  columns?: string[];
}

export enum ExportFormat {
  CSV = 'CSV',
  XLSX = 'XLSX',
  PDF = 'PDF',
  JSON = 'JSON',
}

export interface ExportJob {
  id: string;
  status: JobStatus;
  progress: number;
  fileUrl?: string;
  error?: string;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

export interface ImportRequest {
  file: File | string;
  entityType: string;
  mapping?: Record<string, string>;
  options?: ImportOptions;
}

export interface ImportOptions {
  skipDuplicates?: boolean;
  updateExisting?: boolean;
  validateOnly?: boolean;
}

export interface ImportJob {
  id: string;
  status: JobStatus;
  progress: number;
  totalRows: number;
  processedRows: number;
  successRows: number;
  errorRows: number;
  errors?: ImportError[];
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  data?: any;
}

export enum JobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// Time and date utilities
export interface TimeRange {
  startTime: string;
  endTime: string;
}

export interface DateTimeRange {
  startDateTime: string;
  endDateTime: string;
}

// Comparison operators
export enum ComparisonOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  GREATER_THAN = 'GREATER_THAN',
  GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
  LESS_THAN = 'LESS_THAN',
  LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL',
  CONTAINS = 'CONTAINS',
  NOT_CONTAINS = 'NOT_CONTAINS',
  STARTS_WITH = 'STARTS_WITH',
  ENDS_WITH = 'ENDS_WITH',
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  IS_NULL = 'IS_NULL',
  IS_NOT_NULL = 'IS_NOT_NULL',
}

// Filter condition
export interface FilterCondition {
  field: string;
  operator: ComparisonOperator;
  value: any;
}

// Generic filter
export interface Filter {
  conditions: FilterCondition[];
  logic: 'AND' | 'OR';
}

// Health check
export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  services: ServiceHealth[];
  version: string;
  uptime: number;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
  lastCheck: string;
}
