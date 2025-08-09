// API request and response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: ApiError
  pagination?: PaginationMeta
}

export interface ApiError {
  code: string
  message: string
  details?: any
  stack?: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface SearchParams extends PaginationParams {
  search?: string
  filters?: Record<string, any>
}

// Standard CRUD operations
export interface CreateRequest<T> {
  data: T
}

export interface UpdateRequest<T> {
  id: string
  data: Partial<T>
}

export interface DeleteRequest {
  id: string
}

export interface BulkDeleteRequest {
  ids: string[]
}

// Health check response
export interface HealthCheck {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  uptime: number
  version: string
  environment: string
  database: {
    status: 'connected' | 'disconnected'
    latency?: number
  }
  redis: {
    status: 'connected' | 'disconnected'
    latency?: number
  }
  external_services: {
    [key: string]: {
      status: 'up' | 'down'
      latency?: number
    }
  }
}

// File upload types
export interface FileUpload {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  size: number
  destination: string
  filename: string
  path: string
  buffer: Buffer
}

export interface UploadResponse {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  publicUrl: string
  uploadedAt: Date
}
