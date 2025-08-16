import { Product, Customer, Sale, SalesAnalytics, User } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vevurn.onrender.com';

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include', // Include cookies for authentication
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Product API methods
  async getProducts(): Promise<Product[]> {
    return this.request<Product[]>('/products');
  }

  async getProduct(id: string): Promise<Product> {
    return this.request<Product>(`/products/${id}`);
  }

  async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    return this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    return this.request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  }

  async deleteProduct(id: string): Promise<void> {
    return this.request<void>(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Customer API methods
  async getCustomers(): Promise<Customer[]> {
    return this.request<Customer[]>('/customers');
  }

  async getCustomer(id: string): Promise<Customer> {
    return this.request<Customer>(`/customers/${id}`);
  }

  async createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    return this.request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  }

  async updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer> {
    return this.request<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    });
  }

  async deleteCustomer(id: string): Promise<void> {
    return this.request<void>(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  // Sales API methods
  async getSales(): Promise<Sale[]> {
    return this.request<Sale[]>('/sales');
  }

  async getSale(id: string): Promise<Sale> {
    return this.request<Sale>(`/sales/${id}`);
  }

  async createSale(sale: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>): Promise<Sale> {
    return this.request<Sale>('/sales', {
      method: 'POST',
      body: JSON.stringify(sale),
    });
  }

  // Analytics API methods
  async getAnalytics(dateRange?: string): Promise<SalesAnalytics> {
    const queryParam = dateRange ? `?range=${dateRange}` : '';
    return this.request<SalesAnalytics>(`/analytics${queryParam}`);
  }

  // Auth API methods
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    return this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout(): Promise<void> {
    return this.request<void>('/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Search API methods
  async searchProducts(query: string): Promise<Product[]> {
    return this.request<Product[]>(`/products/search?q=${encodeURIComponent(query)}`);
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    return this.request<Customer[]>(`/customers/search?q=${encodeURIComponent(query)}`);
  }

  // Inventory API methods
  async getLowStockProducts(): Promise<Product[]> {
    return this.request<Product[]>('/inventory/low-stock');
  }

  async updateStock(productId: string, quantity: number): Promise<Product> {
    return this.request<Product>(`/inventory/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
  }
}

export const apiService = new ApiService();
