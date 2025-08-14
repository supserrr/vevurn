// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ValidationError[];
  meta?: ResponseMeta;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ResponseMeta {
  pagination?: PaginationMeta;
  timestamp: string;
  requestId: string;
  version: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  search?: string;
}

export type SortOrder = 'asc' | 'desc';

export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  dateRange?: DateRange;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

// HTTP Status Codes
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

// API Error Types
export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface ApiRequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

// Webhook Types
export interface WebhookPayload {
  id: string;
  event: string;
  data: any;
  timestamp: string;
  signature: string;
}

export interface WebhookResponse {
  success: boolean;
  message?: string;
  processed: boolean;
}
