import { apiClient } from './api-client';

// Real API service to replace mock data
export const realApiService = {
  // Products
  getProducts: async (params?: any) => {
    const searchParams = new URLSearchParams(params);
    const response = await apiClient.get(`/api/products?${searchParams}`);
    return response.data;
  },
  
  getProduct: async (id: string) => {
    const response = await apiClient.get(`/api/products/${id}`);
    return response.data;
  },
  
  searchProducts: async (query: string) => {
    const response = await apiClient.get(`/api/products/search?q=${query}`);
    return response.data;
  },
  
  createProduct: async (data: any) => {
    const response = await apiClient.post('/api/products', data);
    return response.data;
  },
  
  updateProduct: async (id: string, data: any) => {
    const response = await apiClient.put(`/api/products/${id}`, data);
    return response.data;
  },
  
  deleteProduct: async (id: string) => {
    const response = await apiClient.delete(`/api/products/${id}`);
    return response.data;
  },

  getLowStockProducts: async () => {
    const response = await apiClient.get('/api/products/low-stock');
    return response.data;
  },

  // Categories
  getCategories: async () => {
    const response = await apiClient.get('/api/categories');
    return response.data;
  },
  
  // Customers  
  getCustomers: async (params?: any) => {
    const searchParams = new URLSearchParams(params);
    const response = await apiClient.get(`/api/customers?${searchParams}`);
    return response.data;
  },
  
  getCustomer: async (id: string) => {
    const response = await apiClient.get(`/api/customers/${id}`);
    return response.data;
  },

  searchCustomers: async (query: string) => {
    const response = await apiClient.get(`/api/customers/search?q=${query}`);
    return response.data;
  },
  
  createCustomer: async (data: any) => {
    const response = await apiClient.post('/api/customers', data);
    return response.data;
  },

  updateCustomer: async (id: string, data: any) => {
    const response = await apiClient.put(`/api/customers/${id}`, data);
    return response.data;
  },

  deleteCustomer: async (id: string) => {
    const response = await apiClient.delete(`/api/customers/${id}`);
    return response.data;
  },
  
  // Sales
  getSales: async (params?: any) => {
    const searchParams = new URLSearchParams(params);
    const response = await apiClient.get(`/api/sales?${searchParams}`);
    return response.data;
  },

  getSale: async (id: string) => {
    const response = await apiClient.get(`/api/sales/${id}`);
    return response.data;
  },
  
  createSale: async (data: any) => {
    const response = await apiClient.post('/api/sales', data);
    return response.data;
  },

  // Invoices
  getInvoices: async (params?: any) => {
    const searchParams = new URLSearchParams(params);
    const response = await apiClient.get(`/api/invoices?${searchParams}`);
    return response.data;
  },

  sendInvoiceEmail: async (id: string, options?: { email?: string; includePdf?: boolean }) => {
    const response = await apiClient.post(`/api/invoices/${id}/send-email`, options);
    return response.data;
  },

  sendInvoiceSms: async (id: string, options?: { phoneNumber?: string }) => {
    const response = await apiClient.post(`/api/invoices/${id}/send-sms`, options);
    return response.data;
  },

  generateInvoicePdf: async (id: string) => {
    const response = await apiClient.get(`/api/invoices/${id}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Dashboard Analytics
  getDashboardStats: async () => {
    const response = await apiClient.get('/api/dashboard/stats');
    return response.data;
  },

  getSalesAnalytics: async (dateRange?: { from: string; to: string }) => {
    const params = dateRange ? `?from=${dateRange.from}&to=${dateRange.to}` : '';
    const response = await apiClient.get(`/api/dashboard/sales-analytics${params}`);
    return response.data;
  },

  getAnalytics: async (dateRange?: any) => {
    return this.getSalesAnalytics(dateRange);
  }
};

export default realApiService;
