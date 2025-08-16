'use client';

import { useState } from 'react';
import { 
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Mock data for demonstration - would be replaced with React Query hooks
  const products = [
    {
      id: '1',
      name: 'Samsung Galaxy S24',
      sku: 'SGS24-128-BLK',
      categoryId: '1',
      basePrice: 899999,
      stockQuantity: 25,
      minStockLevel: 5,
      status: 'ACTIVE' as const,
      description: 'Latest Samsung flagship smartphone',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'iPhone 15 Case',
      sku: 'IP15-CASE-CLR',
      categoryId: '2',
      basePrice: 29999,
      stockQuantity: 2,
      minStockLevel: 10,
      status: 'ACTIVE' as const,
      description: 'Protective clear case for iPhone 15',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      name: 'MacBook Pro M3',
      sku: 'MBP-M3-14-SLV',
      categoryId: '3',
      basePrice: 1999999,
      stockQuantity: 0,
      minStockLevel: 3,
      status: 'ACTIVE' as const,
      description: '14-inch MacBook Pro with M3 chip',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const lowStockProducts = products.filter(p => p.stockQuantity <= p.minStockLevel && p.stockQuantity > 0);

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (amount: number) => {
    return `RWF ${amount.toLocaleString()}`;
  };

  const getStockStatus = (product: typeof products[0]) => {
    if (product.stockQuantity === 0) {
      return { status: 'Out of Stock', variant: 'destructive' as const, icon: AlertTriangle };
    }
    if (product.stockQuantity <= product.minStockLevel) {
      return { status: 'Low Stock', variant: 'secondary' as const, icon: TrendingDown };
    }
    return { status: 'In Stock', variant: 'default' as const, icon: TrendingUp };
  };

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: '1', name: 'Electronics' },
    { id: '2', name: 'Accessories' },
    { id: '3', name: 'Computers' },
    { id: '4', name: 'Mobile Phones' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your inventory and product catalog
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              {filteredProducts.length} matching filters
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground">
              Need immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {products.filter(p => p.stockQuantity === 0).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Unavailable items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(products.reduce((sum, p) => sum + (p.basePrice * p.stockQuantity), 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Inventory worth
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Products</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-10 px-3 border border-input bg-background rounded-md text-sm"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product);
                const IconComponent = stockStatus.icon;
                
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-[200px]">
                          {product.description || 'No description'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{product.sku}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {categories.find(c => c.id === product.categoryId)?.name || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(product.basePrice)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{product.stockQuantity}</span>
                        <span className="text-sm text-gray-500">
                          / {product.minStockLevel} min
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={stockStatus.variant} className="flex items-center gap-1">
                        <IconComponent className="h-3 w-3" />
                        {stockStatus.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Product
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Package className="mr-2 h-4 w-4" />
                            Update Stock
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Product
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No products found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchQuery || selectedCategory !== 'all' 
                  ? 'Try adjusting your filters to see more results.'
                  : 'Get started by adding your first product.'
                }
              </p>
              {!searchQuery && selectedCategory === 'all' && (
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Product
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
