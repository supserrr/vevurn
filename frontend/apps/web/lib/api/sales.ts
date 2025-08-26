import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface SaleItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Sale {
  id: string;
  customerId?: string | null;
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'momo' | 'card';
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface CreateSaleData {
  customerId?: string | null;
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: string;
  status?: string;
}

export const useSales = () => {
  return useQuery({
    queryKey: ['sales'],
    queryFn: () => api.sales.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSale = (id: string) => {
  return useQuery({
    queryKey: ['sales', id],
    queryFn: () => api.sales.getById(id),
    enabled: !!id,
  });
};

export const useCreateSale = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (sale: CreateSaleData) => api.sales.create(sale),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Refresh products for stock updates
    },
  });
};

// Export object with mutation hooks for easier usage
export const salesApi = {
  useSales,
  useSale,
  createSale: useCreateSale
};
