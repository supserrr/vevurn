'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MobileProductManagement } from '@/components/mobile/MobileProductManagement';
import realApiService from '@/lib/real-api';

export default function MobileProductsPage() {
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const result = await realApiService.getProducts();
      return result.data || [];
    }
  });

  // Transform backend data to component format
  const products = productsData?.map((product: any) => ({
    id: product.id,
    name: product.name,
    price: product.retailPrice,
    category: product.category?.name || 'General',
    stock: product.stockQuantity,
    status: product.status?.toLowerCase() === 'active' ? 'active' as const : 'inactive' as const,
    lowStockThreshold: product.minStockLevel || 10,
    image: product.images?.[0]?.url
  })) || [];

  const [productsState, setProducts] = useState(products);

  // Update state when data changes
  useEffect(() => {
    if (products.length > 0) {
      setProducts(products);
    }
  }, [products]);

  const handleProductUpdate = async (updatedProduct: any) => {
    try {
      if (updatedProduct.id === 'new') {
        // Create new product
        await realApiService.createProduct({
          name: updatedProduct.name,
          retailPrice: updatedProduct.price,
          categoryId: updatedProduct.categoryId, // You'll need to map category name to ID
          stockQuantity: updatedProduct.stock,
          minStockLevel: updatedProduct.lowStockThreshold,
          status: updatedProduct.status.toUpperCase()
        });
      } else {
        // Update existing product
        await realApiService.updateProduct(updatedProduct.id, {
          name: updatedProduct.name,
          retailPrice: updatedProduct.price,
          stockQuantity: updatedProduct.stock,
          minStockLevel: updatedProduct.lowStockThreshold,
          status: updatedProduct.status.toUpperCase()
        });
      }
      
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleProductDelete = async (productId: string) => {
    try {
      await realApiService.deleteProduct(productId);
      setProducts(productsState.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  return (
    <MobileProductManagement 
      products={productsState}
      isLoading={isLoading}
      onProductUpdate={handleProductUpdate}
      onProductDelete={handleProductDelete}
    />
  );
}