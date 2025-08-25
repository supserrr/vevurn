'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Package,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  costPrice: string;
  wholesalePrice: string;
  retailPrice: string;
  stockQuantity: number;
  minStockLevel: number;
  brand: string;
  color?: string;
  size?: string;
  status: string;
  isActive?: boolean;
  category: {
    id: string;
    name: string;
    description?: string;
  };
  supplier: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  variations?: Array<{
    id: string;
    name: string;
    sku: string;
    attributes: Record<string, any>;
    stockQuantity: number;
    isActive: boolean;
  }>;
  images?: Array<any>;
  createdAt: string;
  updatedAt: string;
}

interface ProductListProps {
  onEdit: (product: Product) => void;
  onAdd: () => void;
}

async function fetchProducts(search?: string, category?: string): Promise<Product[]> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category) params.append('category', category);
  
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const response = await fetch(`${baseUrl}/api/products?${params.toString()}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  
  const data = await response.json();
  return data.data || []; // Backend returns data in 'data' field
}

async function deleteProduct(productId: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const response = await fetch(`${baseUrl}/api/products/${productId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete product');
  }
}

export default function ProductList({ onEdit, onAdd }: ProductListProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const queryClient = useQueryClient();

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products', search, selectedCategory],
    queryFn: () => fetchProducts(search, selectedCategory),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete product');
    },
  });

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(numAmount);
  };

  const getStockStatus = (product: Product) => {
    if (product.stockQuantity === 0) {
      return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    } else if (product.stockQuantity <= product.minStockLevel) {
      return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
    }
  };

  const categories = Array.from(new Set(products.map(p => p.category.name)));

  if (error) {
    return (
      <div className="text-center text-red-600 p-8">
        Error loading products. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Products</h2>
          <p className="text-gray-600">{products.length} products in inventory</p>
        </div>
        <Button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search products by name, SKU, or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => {
            const stockStatus = getStockStatus(product);
            
            return (
              <Card key={product.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Product Image */}
                  <div className="relative h-48 bg-gray-100">
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0].url || '/placeholder-product.jpg'}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge className={stockStatus.color}>
                        {stockStatus.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg truncate">
                        {product.name}
                      </h3>
                      <div className="flex space-x-1 ml-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEdit(product)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteMutation.mutate(product.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{product.category.name}</p>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>SKU:</span>
                        <span className="font-mono">{product.sku}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Stock:</span>
                        <span className={product.stockQuantity <= product.minStockLevel ? 'text-orange-600 font-medium' : ''}>
                          {product.stockQuantity} units
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Wholesale:</span>
                        <span>{formatCurrency(product.wholesalePrice)}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Retail:</span>
                        <span>{formatCurrency(product.retailPrice)}</span>
                      </div>
                    </div>

                    {/* Variations */}
                    {product.variations && product.variations.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">Variations:</p>
                        <div className="flex flex-wrap gap-1">
                          {product.variations.map((variation) => (
                            <Badge key={variation.id} variant="outline" className="text-xs">
                              {Object.entries(variation.attributes).map(([key, value]) => `${key}: ${value}`).join(', ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Low Stock Warning */}
                    {product.stockQuantity <= product.minStockLevel && (
                      <div className="mt-3 p-2 bg-orange-50 rounded border border-orange-200">
                        <div className="flex items-center text-orange-700 text-sm">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Stock running low
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {products.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500 mb-4">
            {search || selectedCategory ? 'Try adjusting your search or filters' : 'Get started by adding your first product'}
          </p>
          <Button onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      )}
    </div>
  );
}
