'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  Plus,
  Edit,
  Trash2,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';
import { PullToRefresh } from './PullToRefresh';
import { SwipeCard } from './SwipeCard';
import { TouchButton } from './TouchButton';
import { formatCurrency } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
  status: 'active' | 'inactive';
  lowStockThreshold: number;
}

interface MobileProductManagementProps {
  products: Product[];
  onRefresh: () => Promise<void>;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onCreate: () => void;
  isLoading?: boolean;
}

export function MobileProductManagement({
  products,
  onRefresh,
  onEdit,
  onDelete,
  onCreate,
  isLoading = false
}: MobileProductManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'low-stock' | 'out-of-stock'>('all');

  // Get unique categories
  const categories = Array.from(new Set(products.map(p => p.category)));

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    
    let matchesFilter = true;
    if (filterType === 'low-stock') {
      matchesFilter = product.stock <= product.lowStockThreshold && product.stock > 0;
    } else if (filterType === 'out-of-stock') {
      matchesFilter = product.stock === 0;
    }
    
    return matchesSearch && matchesCategory && matchesFilter;
  });

  // Calculate stats
  const stats = {
    total: products.length,
    lowStock: products.filter(p => p.stock <= p.lowStockThreshold && p.stock > 0).length,
    outOfStock: products.filter(p => p.stock === 0).length,
    totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0)
  };

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (product.stock <= product.lowStockThreshold) return { label: 'Low Stock', variant: 'destructive' as const };
    return { label: 'In Stock', variant: 'secondary' as const };
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-xs text-gray-500">Total Products</p>
                  <p className="text-lg font-semibold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-xs text-gray-500">Total Value</p>
                  <p className="text-lg font-semibold">{formatCurrency(stats.totalValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-xs text-gray-500">Low Stock</p>
                  <p className="text-lg font-semibold">{stats.lowStock}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-xs text-gray-500">Out of Stock</p>
                  <p className="text-lg font-semibold">{stats.outOfStock}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <TouchButton
              variant={selectedCategory === 'all' ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className="whitespace-nowrap"
            >
              All Categories
            </TouchButton>
            {categories.map(category => (
              <TouchButton
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category}
              </TouchButton>
            ))}
          </div>

          {/* Stock Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <TouchButton
              variant={filterType === 'all' ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType('all')}
              className="whitespace-nowrap"
            >
              All Stock
            </TouchButton>
            <TouchButton
              variant={filterType === 'low-stock' ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType('low-stock')}
              className="whitespace-nowrap"
            >
              Low Stock
            </TouchButton>
            <TouchButton
              variant={filterType === 'out-of-stock' ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType('out-of-stock')}
              className="whitespace-nowrap"
            >
              Out of Stock
            </TouchButton>
          </div>
        </div>
      </div>

      {/* Product List */}
      <PullToRefresh
        onRefresh={onRefresh}
        className="flex-1"
        disabled={isLoading}
      >
        <div className="p-4 space-y-3">
          {filteredProducts.map(product => {
            const stockStatus = getStockStatus(product);
            
            return (
              <SwipeCard
                key={product.id}
                leftAction={
                  <TouchButton
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(product)}
                    className="bg-blue-50 text-blue-600 border-blue-200"
                  >
                    <Edit className="h-4 w-4" />
                  </TouchButton>
                }
                rightAction={
                  <TouchButton
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(product.id)}
                    className="bg-red-50 text-red-600 border-red-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </TouchButton>
                }
                onSwipeRight={() => onEdit(product)}
                onSwipeLeft={() => onDelete(product.id)}
              >
                <div className="flex space-x-3">
                  {/* Product Image */}
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-gray-400" />
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm leading-tight mb-1 truncate">
                      {product.name}
                    </h3>
                    
                    <p className="text-xs text-gray-500 mb-2">
                      {product.category}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-600">
                        {formatCurrency(product.price)}
                      </span>
                      
                      <div className="flex items-center space-x-2">
                        <Badge variant={stockStatus.variant} className="text-xs">
                          {product.stock} units
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {stockStatus.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </SwipeCard>
            );
          })}

          {filteredProducts.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || selectedCategory !== 'all' || filterType !== 'all'
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first product"
                }
              </p>
              {(!searchTerm && selectedCategory === 'all' && filterType === 'all') && (
                <TouchButton onClick={onCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </TouchButton>
              )}
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Add Product FAB */}
      <TouchButton
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="lg"
        onClick={onCreate}
      >
        <Plus className="h-6 w-6" />
      </TouchButton>
    </div>
  );
}
