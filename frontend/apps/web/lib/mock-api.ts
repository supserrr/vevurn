// Mock API service for development
export const enhancedApiService = {
  // Products
  getProducts: async (params?: any) => {
    return [];
  },
  
  getProduct: async (id: string) => {
    return null;
  },
  
  searchProducts: async (query: string) => {
    return [];
  },
  
  createProduct: async (data: any) => {
    return { id: '1', ...data };
  },
  
  updateProduct: async (id: string, data: any) => {
    return { id, ...data };
  },
  
  deleteProduct: async (id: string) => {
    return { success: true };
  },

  getLowStockProducts: async () => {
    return [];
  },

  updateStock: async (productId: string, quantity: number) => {
    return { success: true };
  },
  
  // Categories
  getCategories: async () => {
    return [];
  },
  
  // Customers  
  getCustomers: async (params?: any) => {
    return [];
  },
  
  getCustomer: async (id: string) => {
    return null;
  },

  searchCustomers: async (query: string) => {
    return [];
  },
  
  createCustomer: async (data: any) => {
    return { id: '1', ...data };
  },

  updateCustomer: async (id: string, data: any) => {
    return { id, ...data };
  },

  deleteCustomer: async (id: string) => {
    return { success: true };
  },
  
  // Sales
  getSales: async (params?: any) => {
    return [];
  },
  
  createSale: async (data: any) => {
    return { id: '1', ...data };
  },
  
  // Analytics
  getSalesAnalytics: async (dateRange?: any) => {
    return {
      totalSales: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      topProducts: [],
      salesByCategory: [],
      dailySales: []
    };
  },

  getAnalytics: async (dateRange?: any) => {
    return {
      totalSales: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      topProducts: [],
      salesByCategory: [],
      dailySales: []
    };
  }
};

export default enhancedApiService;
