'use client';

import { useState } from 'react';
import { MobileProductManagement } from '@/components/mobile/MobileProductManagement';

// Mock products data
const mockProducts = [
  {
    id: '1',
    name: 'Coffee',
    price: 1500,
    category: 'Beverages',
    stock: 50,
    status: 'active' as const,
    lowStockThreshold: 10,
    image: undefined
  },
  {
    id: '2',
    name: 'Tea',
    price: 1000,
    category: 'Beverages',
    stock: 8,
    status: 'active' as const,
    lowStockThreshold: 10,
    image: undefined
  },
  {
    id: '3',
    name: 'Sandwich',
    price: 2500,
    category: 'Food',
    stock: 0,
    status: 'active' as const,
    lowStockThreshold: 5,
    image: undefined
  },
  {
    id: '4',
    name: 'Juice',
    price: 2000,
    category: 'Beverages',
    stock: 25,
    status: 'active' as const,
    lowStockThreshold: 15,
    image: undefined
  },
  {
    id: '5',
    name: 'Pastry',
    price: 1800,
    category: 'Food',
    stock: 3,
    status: 'active' as const,
    lowStockThreshold: 5,
    image: undefined
  },
  {
    id: '6',
    name: 'Salad',
    price: 3500,
    category: 'Food',
    stock: 12,
    status: 'active' as const,
    lowStockThreshold: 8,
    image: undefined
  },
  {
    id: '7',
    name: 'Smoothie',
    price: 2800,
    category: 'Beverages',
    stock: 18,
    status: 'active' as const,
    lowStockThreshold: 10,
    image: undefined
  }
];

export default function MobileProductsPage() {
  const [products, setProducts] = useState(mockProducts);
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate API refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  const handleEdit = (product: any) => {
    console.log('Edit product:', product);
    // TODO: Navigate to edit page or open edit modal
  };

  const handleDelete = (productId: string) => {
    console.log('Delete product:', productId);
    // TODO: Show confirmation dialog and delete product
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleCreate = () => {
    console.log('Create new product');
    // TODO: Navigate to create page or open create modal
  };

  return (
    <div className="h-screen">
      <MobileProductManagement
        products={products}
        onRefresh={handleRefresh}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        isLoading={isLoading}
      />
    </div>
  );
}
