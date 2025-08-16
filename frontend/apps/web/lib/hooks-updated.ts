import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enhancedApiService } from './mock-api';
import { Product, Customer, Sale, SalesAnalytics } from './types';

// Query Keys
export const queryKeys = {
  products: ['products'] as const,
  product: (id: string) => ['products', id] as const,
  customers: ['customers'] as const,
  customer: (id: string) => ['customers', id] as const,
  sales: ['sales'] as const,
  sale: (id: string) => ['sales', id] as const,
  analytics: (range?: string) => ['analytics', range] as const,
  lowStock: ['inventory', 'low-stock'] as const,
} as const;

// Product Hooks
export function useProducts() {
  return useQuery({
    queryKey: queryKeys.products,
    queryFn: enhancedApiService.getProducts,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.product(id),
    queryFn: () => enhancedApiService.getProduct(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: enhancedApiService.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, product }: { id: string; product: Partial<Product> }) =>
      enhancedApiService.updateProduct(id, product),
    onSuccess: (data: Product) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      queryClient.setQueryData(queryKeys.product(data.id), data);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: enhancedApiService.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });
}

export function useSearchProducts(query: string) {
  return useQuery({
    queryKey: ['products', 'search', query],
    queryFn: () => enhancedApiService.searchProducts(query),
    enabled: query.length > 2,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Customer Hooks
export function useCustomers() {
  return useQuery({
    queryKey: queryKeys.customers,
    queryFn: enhancedApiService.getCustomers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: queryKeys.customer(id),
    queryFn: () => enhancedApiService.getCustomer(id),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: enhancedApiService.createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, customer }: { id: string; customer: Partial<Customer> }) =>
      enhancedApiService.updateCustomer(id, customer),
    onSuccess: (data: Customer) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers });
      queryClient.setQueryData(queryKeys.customer(data.id), data);
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: enhancedApiService.deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers });
    },
  });
}

export function useSearchCustomers(query: string) {
  return useQuery({
    queryKey: ['customers', 'search', query],
    queryFn: () => enhancedApiService.searchCustomers(query),
    enabled: query.length > 2,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Sales Hooks
export function useSales() {
  return useQuery({
    queryKey: queryKeys.sales,
    queryFn: enhancedApiService.getSales,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useSale(id: string) {
  return useQuery({
    queryKey: queryKeys.sale(id),
    queryFn: () => enhancedApiService.getProduct(id), // Note: This should be getSale when implemented
    enabled: !!id,
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: enhancedApiService.createSale,
    onSuccess: () => {
      // Invalidate multiple related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.sales });
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

// Analytics Hooks
export function useAnalytics(dateRange?: string) {
  return useQuery({
    queryKey: queryKeys.analytics(dateRange),
    queryFn: () => enhancedApiService.getAnalytics(dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Inventory Hooks
export function useLowStockProducts() {
  return useQuery({
    queryKey: queryKeys.lowStock,
    queryFn: enhancedApiService.getLowStockProducts,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useUpdateStock() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      enhancedApiService.updateStock(productId, quantity),
    onSuccess: (data: Product) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      queryClient.invalidateQueries({ queryKey: queryKeys.lowStock });
      queryClient.setQueryData(queryKeys.product(data.id), data);
    },
  });
}

// Real-time data hooks
export function useRealtimeUpdates() {
  const queryClient = useQueryClient();
  
  // This would typically connect to a WebSocket or Server-Sent Events
  // For now, we'll use periodic refetching
  return useQuery({
    queryKey: ['realtime'],
    queryFn: async () => {
      // Refetch critical data
      queryClient.invalidateQueries({ queryKey: queryKeys.sales });
      queryClient.invalidateQueries({ queryKey: queryKeys.lowStock });
      return { lastUpdate: new Date() };
    },
    refetchInterval: 30 * 1000, // 30 seconds
    refetchIntervalInBackground: true,
  });
}
