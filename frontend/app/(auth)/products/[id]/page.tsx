'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft,
  Edit,
  Package,
  Trash2,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Tag,
  DollarSign,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

// Mock product data with additional details
const mockProduct = {
  id: '1',
  name: 'iPhone 14 Pro Case - Silicone',
  description: 'Premium silicone case with MagSafe compatibility for iPhone 14 Pro. Provides excellent protection while maintaining wireless charging capabilities.',
  category: 'Phone Cases',
  brand: 'Apple',
  model: 'A2650',
  costPrice: 8000,
  wholesalePrice: 12000,
  retailPrice: 18000,
  stockQuantity: 25,
  minStockLevel: 5,
  sku: 'IPH14P-CASE-SIL-001',
  barcode: '1234567890123',
  status: 'ACTIVE' as const,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-20T14:30:00Z',
  totalSold: 156,
  revenue: 2808000, // 156 * 18000
  lastSaleDate: '2024-01-20T16:45:00Z',
};

// Mock sales history
const mockSalesHistory = [
  { date: '2024-01-20', quantity: 3, revenue: 54000, type: 'retail' },
  { date: '2024-01-19', quantity: 2, revenue: 36000, type: 'retail' },
  { date: '2024-01-18', quantity: 5, revenue: 60000, type: 'wholesale' },
  { date: '2024-01-17', quantity: 1, revenue: 18000, type: 'retail' },
  { date: '2024-01-16', quantity: 4, revenue: 72000, type: 'retail' },
];

// Mock stock movements
const mockStockMovements = [
  { 
    date: '2024-01-20T16:45:00Z', 
    type: 'SALE', 
    quantity: -3, 
    reason: 'Sale #S-2024-0120-003',
    user: 'John Doe' 
  },
  { 
    date: '2024-01-20T14:30:00Z', 
    type: 'ADJUSTMENT', 
    quantity: 2, 
    reason: 'Stock count correction',
    user: 'Admin' 
  },
  { 
    date: '2024-01-18T09:15:00Z', 
    type: 'PURCHASE', 
    quantity: 50, 
    reason: 'Purchase Order #PO-2024-0118-001',
    user: 'System' 
  },
];

export default function ProductDetailsPage() {
  const [product, setProduct] = useState(mockProduct);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true);
      try {
        // In real app, fetch product by ID from API
        // const response = await ApiClient.request(`/products/${params.id}`);
        // setProduct(response.data);
        
        // Using mock data for now
        await new Promise(resolve => setTimeout(resolve, 500));
        setProduct(mockProduct);
      } catch (error: any) {
        console.error('Failed to load product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);

    try {
      // In real app, call API to delete product
      console.log('Deleting product:', params.id);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to products list
      router.push('/products');
    } catch (error: any) {
      console.error('Failed to delete product:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate metrics
  const grossMargin = product.retailPrice && product.costPrice 
    ? ((product.retailPrice - product.costPrice) / product.retailPrice * 100).toFixed(1)
    : '0';

  const wholesaleMargin = product.wholesalePrice && product.costPrice
    ? ((product.wholesalePrice - product.costPrice) / product.wholesalePrice * 100).toFixed(1)
    : '0';

  const stockStatus = product.stockQuantity === 0 ? 'Out of Stock' :
    product.stockQuantity <= product.minStockLevel ? 'Low Stock' : 'In Stock';

  const stockStatusColor = product.stockQuantity === 0 ? 'destructive' :
    product.stockQuantity <= product.minStockLevel ? 'secondary' : 'default';

  const statusColor = product.status === 'ACTIVE' ? 'default' :
    product.status === 'INACTIVE' ? 'secondary' : 'destructive';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Link>
          </Button>
          <div>
            <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-32 bg-muted animate-pulse rounded mt-2"></div>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
            <div className="h-48 bg-muted animate-pulse rounded-lg"></div>
          </div>
          <div className="space-y-6">
            <div className="h-32 bg-muted animate-pulse rounded-lg"></div>
            <div className="h-24 bg-muted animate-pulse rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">
              {product.brand && `${product.brand} • `}
              {product.category}
              {product.model && ` • ${product.model}`}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/products/${product.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Product Overview</CardTitle>
                <div className="flex gap-2">
                  <Badge variant={statusColor}>
                    {product.status}
                  </Badge>
                  <Badge variant={stockStatusColor}>
                    {stockStatus}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">
                  {product.description || 'No description provided'}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">SKU</p>
                  <p className="font-mono">{product.sku || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Barcode</p>
                  <p className="font-mono">{product.barcode || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p>{new Date(product.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p>{new Date(product.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Inventory */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost Price:</span>
                    <span className="font-medium">{formatCurrency(product.costPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Wholesale Price:</span>
                    <span className="font-medium">{formatCurrency(product.wholesalePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Retail Price:</span>
                    <span className="font-semibold text-lg">{formatCurrency(product.retailPrice)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Wholesale Margin:</span>
                    <span className="text-green-600 font-medium">{wholesaleMargin}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Retail Margin:</span>
                    <span className="text-green-600 font-medium">{grossMargin}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Inventory
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Stock:</span>
                    <span className="font-semibold text-xl">{product.stockQuantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Minimum Level:</span>
                    <span>{product.minStockLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Sold:</span>
                    <span className="font-medium">{product.totalSold}</span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Stock Status:</span>
                    <Badge variant={stockStatusColor} className="text-xs">
                      {stockStatus}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span>Last Sale:</span>
                    <span>{new Date(product.lastSaleDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sales Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Sales Performance
              </CardTitle>
              <CardDescription>Recent sales activity and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(product.revenue)}
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Units Sold</p>
                  <p className="text-2xl font-bold">{product.totalSold}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Avg. Sale Price</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(Math.round(product.revenue / product.totalSold))}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Recent Sales</h4>
                <div className="space-y-2">
                  {mockSalesHistory.map((sale, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{new Date(sale.date).toLocaleDateString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {sale.quantity} units • {sale.type}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(sale.revenue)}</p>
                        <div className="flex items-center gap-1 text-green-600">
                          <TrendingUp className="h-3 w-3" />
                          <span className="text-xs">+{sale.quantity}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock Movements */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Movements</CardTitle>
              <CardDescription>Recent inventory changes and transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockStockMovements.map((movement, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        movement.type === 'SALE' ? 'bg-red-100 text-red-600' :
                        movement.type === 'PURCHASE' ? 'bg-green-100 text-green-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {movement.quantity > 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{movement.type}</p>
                        <p className="text-sm text-muted-foreground">{movement.reason}</p>
                        <p className="text-xs text-muted-foreground">by {movement.user}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(movement.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" asChild>
                <Link href={`/products/${product.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Product
                </Link>
              </Button>
              <Button variant="outline" className="w-full">
                <Package className="h-4 w-4 mr-2" />
                Adjust Stock
              </Button>
              <Button variant="outline" className="w-full">
                <Tag className="h-4 w-4 mr-2" />
                Create Sale
              </Button>
            </CardContent>
          </Card>

          {/* Product Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Product ID</p>
                <p className="font-mono text-sm">{product.id}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Current Price</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(product.retailPrice)}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Stock Level</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">{product.stockQuantity}</p>
                  <Badge variant={stockStatusColor} className="text-xs">
                    {stockStatus}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={statusColor}>
                  {product.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Stock Alert */}
          {product.stockQuantity <= product.minStockLevel && (
            <Alert variant={product.stockQuantity === 0 ? 'destructive' : 'default'}>
              <Package className="h-4 w-4" />
              <AlertDescription>
                {product.stockQuantity === 0 
                  ? 'This product is out of stock!'
                  : `Stock is running low. Only ${product.stockQuantity} units remaining.`
                }
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
