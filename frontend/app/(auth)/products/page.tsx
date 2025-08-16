'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Filter,
  ChevronLeft,
  ChevronRight,
  Package,
  Folder,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  model?: string;
  retailPrice: number;
  wholesalePrice: number;
  costPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  createdAt: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  const itemsPerPage = 10;

  // Mock data for demonstration
  useEffect(() => {
    const mockProducts: Product[] = [
      {
        id: 'P001',
        name: 'iPhone 15 Pro Max Case',
        description: 'Premium silicone case for iPhone 15 Pro Max',
        category: 'Phone Cases',
        brand: 'Apple',
        model: 'iPhone 15 Pro Max',
        retailPrice: 45000,
        wholesalePrice: 35000,
        costPrice: 25000,
        stockQuantity: 25,
        minStockLevel: 10,
        status: 'ACTIVE',
        createdAt: '2024-01-15',
      },
      {
        id: 'P002',
        name: 'Samsung Galaxy S24 Charger',
        description: 'Fast charging cable USB-C',
        category: 'Chargers',
        brand: 'Samsung',
        model: 'Galaxy S24',
        retailPrice: 18000,
        wholesalePrice: 14000,
        costPrice: 10000,
        stockQuantity: 5,
        minStockLevel: 15,
        status: 'ACTIVE',
        createdAt: '2024-01-20',
      },
      {
        id: 'P003',
        name: 'AirPods Pro 2 Case',
        description: 'Protective case for AirPods Pro 2nd generation',
        category: 'Accessories',
        brand: 'Apple',
        model: 'AirPods Pro 2',
        retailPrice: 25000,
        wholesalePrice: 20000,
        costPrice: 15000,
        stockQuantity: 15,
        minStockLevel: 8,
        status: 'ACTIVE',
        createdAt: '2024-01-25',
      },
      {
        id: 'P004',
        name: 'Universal Phone Stand',
        description: 'Adjustable phone stand for all devices',
        category: 'Accessories',
        brand: 'Generic',
        retailPrice: 12000,
        wholesalePrice: 9000,
        costPrice: 6000,
        stockQuantity: 30,
        minStockLevel: 10,
        status: 'ACTIVE',
        createdAt: '2024-02-01',
      },
      {
        id: 'P005',
        name: 'Huawei P60 Screen Protector',
        description: 'Tempered glass screen protector',
        category: 'Screen Protectors',
        brand: 'Huawei',
        model: 'P60',
        retailPrice: 8000,
        wholesalePrice: 6000,
        costPrice: 4000,
        stockQuantity: 2,
        minStockLevel: 20,
        status: 'ACTIVE',
        createdAt: '2024-02-05',
      },
    ];

    setTimeout(() => {
      setProducts(mockProducts);
      setFilteredProducts(mockProducts);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Filter and search functionality
  useEffect(() => {
    let filtered = products;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(product => product.status === selectedStatus);
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedStatus, products]);

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      // In real app, call API to delete product
      console.log('Deleting product:', productId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remove from mock data (in real app, refetch from API)
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error: any) {
      console.error('Failed to delete product:', error);
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Get unique categories
  const categories = Array.from(new Set(products.map(p => p.category)));

  const getStockStatus = (product: Product) => {
    if (product.stockQuantity === 0) return 'Out of Stock';
    if (product.stockQuantity <= product.minStockLevel) return 'Low Stock';
    return 'In Stock';
  };

  const getStockBadgeVariant = (product: Product) => {
    if (product.stockQuantity === 0) return 'destructive';
    if (product.stockQuantity <= product.minStockLevel) return 'secondary';
    return 'default';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Products</h1>
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            Manage your inventory and product catalog
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/products/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/categories">
              <Folder className="h-4 w-4 mr-2" />
              Manage Categories
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products, brands, categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="DISCONTINUED">Discontinued</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Products ({filteredProducts.length})</span>
            <Badge variant="secondary">
              <Package className="h-3 w-3 mr-1" />
              {filteredProducts.length} items
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No products found</p>
              <Button asChild className="mt-4">
                <Link href="/products/new">Add your first product</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {currentProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{product.name}</h3>
                      <Badge variant={getStockBadgeVariant(product)}>
                        {getStockStatus(product)}
                      </Badge>
                      <Badge variant="outline">{product.status}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>{product.description}</p>
                      <p className="mt-1">
                        {product.brand && `${product.brand} • `}
                        {product.category} • Stock: {product.stockQuantity}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right mr-4">
                    <p className="font-semibold">{formatCurrency(product.retailPrice)}</p>
                    <p className="text-sm text-muted-foreground">
                      Wholesale: {formatCurrency(product.wholesalePrice)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/products/${product.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/products/${product.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredProducts.length)} of{' '}
                {filteredProducts.length} products
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
