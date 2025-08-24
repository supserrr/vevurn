'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api/client';
import { Product } from '@/types';
import { useCart } from '@/lib/store/cart';
import { Search, Plus, Package } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

export function ProductSearch() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await api.products.getAll({ limit: 50 });
      if (response.success && response.data) {
        setProducts(response.data);
      } else {
        toast.error('Failed to load products');
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchTerm(query);
    if (!query.trim()) {
      loadProducts();
      return;
    }

    setLoading(true);
    try {
      const response = await api.products.search(query);
      if (response.success && response.data) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    if (product.currentStock <= 0) {
      toast.error('Product is out of stock');
      return;
    }
    
    addItem(product);
    toast.success(`Added ${product.name} to cart`);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search products by name, category, or SKU..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">
          <Package className="mx-auto h-8 w-8 mb-2 animate-pulse" />
          Loading products...
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[70vh] overflow-y-auto">
          {filteredProducts.map(product => (
            <Card 
              key={product.id} 
              className="cursor-pointer hover:shadow-md transition-shadow bg-white"
            >
              <CardContent className="p-4">
                {product.images && product.images.length > 0 && product.images[0] ? (
                  <div className="relative h-32 mb-3 bg-gray-100 rounded overflow-hidden">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-32 mb-3 bg-gray-100 rounded flex items-center justify-center">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                
                <h3 className="font-semibold text-sm mb-1 line-clamp-2 min-h-[2.5rem]">
                  {product.name}
                </h3>
                
                <div className="flex justify-between items-center mb-2">
                  <span className="text-green-600 font-bold text-sm">
                    {product.unitPrice.toLocaleString()} RWF
                  </span>
                  <Badge 
                    variant={product.currentStock > 10 ? 'default' : 
                            product.currentStock > 0 ? 'secondary' : 'destructive'}
                    className="text-xs"
                  >
                    {product.currentStock}
                  </Badge>
                </div>
                
                {product.category && (
                  <Badge variant="outline" className="mb-3 text-xs">
                    {product.category.name}
                  </Badge>
                )}
                
                <Button 
                  onClick={() => handleAddToCart(product)}
                  disabled={product.currentStock === 0 || !product.isActive}
                  className="w-full"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {product.currentStock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>
              </CardContent>
            </Card>
          ))}
          
          {filteredProducts.length === 0 && !loading && (
            <div className="col-span-full text-center py-8 text-gray-500">
              <Package className="mx-auto h-12 w-12 mb-2" />
              <p>No products found</p>
              {searchTerm && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => {
                    setSearchTerm('');
                    loadProducts();
                  }}
                >
                  Clear search
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
