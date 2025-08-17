'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search,
  Plus,
  Package,
  Grid3x3,
  List,
  Filter,
  Scan,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { usePOSStore } from '@/lib/store';
import { apiClient } from '@/lib/api-client';
import type { Product } from '../../../../../shared/src/types';

interface ProductCatalogProps {
  className?: string;
}

export default function ProductCatalog({ className }: ProductCatalogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { addToCart } = usePOSStore();

  // Load products from API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiClient.get<Product[]>('/api/products');
        
        if (response.success && response.data) {
          setProducts(response.data);
        } else {
          setError(response.message || 'Failed to load products');
        }
      } catch (err) {
        setError('Network error occurred');
        console.error('Error loading products:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    
    const query = searchQuery.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(query) ||
      product.sku?.toLowerCase().includes(query) ||
      product.barcode?.toLowerCase().includes(query) ||
      product.category?.name?.toLowerCase().includes(query) ||
      product.brand?.name?.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const handleAddToCart = (product: Product) => {
    if (product.currentStock <= 0) {
      alert('Product is out of stock');
      return;
    }
    
    addToCart(product);
  };

  const ProductCard = ({ product }: { product: Product }) => {
    const isOutOfStock = product.currentStock <= 0;
    const isLowStock = product.currentStock <= product.minStock;
    
    return (
      <Card className={`transition-all duration-200 hover:shadow-md ${isOutOfStock ? 'opacity-60' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-sm font-medium line-clamp-2">
              {product.name}
            </CardTitle>
            {isOutOfStock && (
              <Badge variant="destructive" className="text-xs">
                Out of Stock
              </Badge>
            )}
            {!isOutOfStock && isLowStock && (
              <Badge variant="secondary" className="text-xs">
                Low Stock
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              {product.brand?.name} • {product.category?.name}
            </div>
            
            <div className="text-xs text-muted-foreground">
              SKU: {product.sku}
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm font-semibold">
                {formatCurrency(product.unitPrice)}
              </div>
              <div className="text-xs text-muted-foreground">
                Stock: {product.currentStock}
              </div>
            </div>
            
            <Button 
              onClick={() => handleAddToCart(product)}
              disabled={isOutOfStock}
              size="sm" 
              className="w-full"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add to Cart
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ProductListItem = ({ product }: { product: Product }) => {
    const isOutOfStock = product.currentStock <= 0;
    const isLowStock = product.currentStock <= product.minStock;
    
    return (
      <Card className={`transition-all duration-200 hover:shadow-md ${isOutOfStock ? 'opacity-60' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-sm truncate">{product.name}</h3>
                {isOutOfStock && (
                  <Badge variant="destructive" className="text-xs">
                    Out of Stock
                  </Badge>
                )}
                {!isOutOfStock && isLowStock && (
                  <Badge variant="secondary" className="text-xs">
                    Low Stock
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {product.brand?.name} • {product.category?.name} • SKU: {product.sku}
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="font-semibold">{formatCurrency(product.unitPrice)}</span>
                <span className="text-xs text-muted-foreground">Stock: {product.currentStock}</span>
              </div>
            </div>
            <Button 
              onClick={() => handleAddToCart(product)}
              disabled={isOutOfStock}
              size="sm"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Products</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Products ({filteredProducts.length})</h2>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products by name, SKU, barcode..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Products Grid/List */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-8">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No products found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'Try adjusting your search terms' : 'Add some products to get started'}
          </p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
            : "space-y-2"
        }>
          {filteredProducts.map((product) => 
            viewMode === 'grid' ? (
              <ProductCard key={product.id} product={product} />
            ) : (
              <ProductListItem key={product.id} product={product} />
            )
          )}
        </div>
      )}
    </div>
  );
}
