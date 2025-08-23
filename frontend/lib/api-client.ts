// frontend/lib/api-client.ts
import { authClient } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ApiError {
  success: false;
  message: string;
  error?: string;
  statusCode?: number;
}

export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  message?: string;
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError;

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const session = await authClient.getSession();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Better Auth handles cookies automatically, but we can add the session token if needed
    if (session?.data?.user) {
      // The session is maintained via httpOnly cookies by Better Auth
      // No need to manually add Authorization header
    }

    return headers;
  }

  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const headers = await this.getHeaders();

      const config: RequestInit = {
        headers: {
          ...headers,
          ...options.headers,
        },
        credentials: 'include', // Important for Better Auth cookies
        ...options,
      };

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || `HTTP Error: ${response.status}`,
          error: data.error,
          statusCode: response.status,
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error occurred',
        error: 'NETWORK_ERROR',
      };
    }
  }

  // Convenience methods
  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Products API
  async getProducts(params: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    categoryId?: string;
    status?: string;
  } = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.set(key, value.toString());
      }
    });
    
    return this.get(`/api/products?${query.toString()}`);
  }

  async getProductById(id: string) {
    return this.get(`/api/products/${id}`);
  }

  async createProduct(data: any) {
    return this.post('/api/products', data);
  }

  async updateProduct(id: string, data: any) {
    return this.put(`/api/products/${id}`, data);
  }

  async deleteProduct(id: string) {
    return this.delete(`/api/products/${id}`);
  }

  // Sales API
  async getSales(params: { 
    page?: number; 
    limit?: number; 
    status?: string; 
    dateFrom?: string; 
    dateTo?: string;
    customerId?: string;
  } = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.set(key, value.toString());
      }
    });
    
    return this.get(`/api/sales?${query.toString()}`);
  }

  async getSaleById(id: string) {
    return this.get(`/api/sales/${id}`);
  }

  async createSale(data: any) {
    return this.post('/api/sales', data);
  }

  async completeSale(id: string) {
    return this.put(`/api/sales/${id}/complete`);
  }

  async getDailySalesStats(date?: string) {
    const query = date ? `?date=${date}` : '';
    return this.get(`/api/sales/stats/daily${query}`);
  }

  // Reports API
  async getProfitReport(dateFrom?: string, dateTo?: string) {
    const params = new URLSearchParams();
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    
    return this.get(`/api/reports/profit?${params.toString()}`);
  }

  async getInventoryReport() {
    return this.get('/api/reports/inventory');
  }

  async getSalesReport(dateFrom?: string, dateTo?: string) {
    const params = new URLSearchParams();
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    
    return this.get(`/api/reports/sales?${params.toString()}`);
  }

  // Dashboard API
  async getDashboardStats() {
    return this.get('/api/dashboard/stats');
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE);

// Export class for custom instances if needed
export { ApiClient };
