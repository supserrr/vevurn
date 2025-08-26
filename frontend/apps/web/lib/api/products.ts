import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
  status: 'active' | 'inactive';
  lowStockThreshold: number;
  description?: string;
  barcode?: string;
  sku?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSearchParams {
  search?: string;
  page?: number;
  limit?: number;
  category?: string;
}

export const useProducts = (params?: ProductSearchParams) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => api.products.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => api.products.getById(id),
    enabled: !!id,
  });
};

export const useProductSearch = (query: string) => {
  return useQuery({
    queryKey: ['products', 'search', query],
    queryFn: () => api.products.search(query),
    enabled: !!query && query.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (product: Partial<Product>) => api.products.create(product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...product }: Partial<Product> & { id: string }) => 
      api.products.update(id, product),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', variables.id] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.products.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
