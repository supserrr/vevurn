'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Save,
  Trash2,
  Package,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { z } from 'zod';

// Product form schema (same as new product)
const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().optional(),
  model: z.string().optional(),
  costPrice: z.number().min(0, 'Cost price must be positive'),
  wholesalePrice: z.number().min(0, 'Wholesale price must be positive'),
  retailPrice: z.number().min(0, 'Retail price must be positive'),
  stockQuantity: z.number().int().min(0, 'Stock quantity must be a positive integer'),
  minStockLevel: z.number().int().min(0, 'Minimum stock level must be a positive integer'),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DISCONTINUED']),
}).refine(data => data.costPrice <= data.wholesalePrice, {
  message: 'Cost price cannot be higher than wholesale price',
  path: ['wholesalePrice'],
}).refine(data => data.wholesalePrice <= data.retailPrice, {
  message: 'Wholesale price cannot be higher than retail price',
  path: ['retailPrice'],
});

type ProductFormData = z.infer<typeof productSchema>;

// Mock product data - in real app, fetch from API
const mockProduct = {
  id: '1',
  name: 'iPhone 14 Pro Case - Silicone',
  description: 'Premium silicone case with MagSafe compatibility for iPhone 14 Pro',
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
};

export default function EditProductPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [product, setProduct] = useState(mockProduct);
  const router = useRouter();
  const params = useParams();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setError,
    watch,
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product,
  });

  const watchedValues = watch();
  
  // Calculate profit margins
  const grossMargin = watchedValues.retailPrice && watchedValues.costPrice 
    ? ((watchedValues.retailPrice - watchedValues.costPrice) / watchedValues.retailPrice * 100).toFixed(1)
    : '0';

  const wholesaleMargin = watchedValues.wholesalePrice && watchedValues.costPrice
    ? ((watchedValues.wholesalePrice - watchedValues.costPrice) / watchedValues.wholesalePrice * 100).toFixed(1)
    : '0';

  // Mock categories
  const categories = [
    'Phone Cases',
    'Chargers',
    'Screen Protectors',
    'Headphones',
    'Accessories',
    'Batteries',
    'Memory Cards',
    'Cables',
    'Power Banks',
    'Stands & Mounts',
  ];

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'INACTIVE', label: 'Inactive', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'DISCONTINUED', label: 'Discontinued', color: 'bg-red-100 text-red-800' },
  ];

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      try {
        // In real app, fetch product by ID from API
        // const response = await ApiClient.request(`/products/${params.id}`);
        // setProduct(response.data);
        // reset(response.data);
        
        // Using mock data for now
        reset(product);
      } catch (error: any) {
        setError('root', { 
          message: 'Failed to load product. Please try again.' 
        });
      }
    };

    loadProduct();
  }, [params.id, reset, product]);

  const onSubmit = async (data: ProductFormData) => {
    setIsLoading(true);

    try {
      // In real app, call API to update product
      console.log('Updated product data:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Redirect to products list
      router.push('/products');
    } catch (error: any) {
      setError('root', { 
        message: error.message || 'Failed to update product. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

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
      setError('root', { 
        message: error.message || 'Failed to delete product. Please try again.' 
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    reset(product);
  };

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
            <h1 className="text-3xl font-bold">Edit Product</h1>
            <p className="text-muted-foreground">
              Update product information and inventory
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={resetForm} 
            disabled={!isDirty || isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isLoading || isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {errors.root && (
          <Alert variant="destructive">
            <AlertDescription>{errors.root.message}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Product Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Essential product details and description
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter product name"
                    {...register('name')}
                    disabled={isLoading}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    placeholder="Enter product description"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register('description')}
                    disabled={isLoading}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <select
                      id="category"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...register('category')}
                      disabled={isLoading}
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-sm text-destructive">{errors.category.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      placeholder="Enter brand name"
                      {...register('brand')}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <select
                      id="status"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...register('status')}
                      disabled={isLoading}
                    >
                      {statusOptions.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                    {errors.status && (
                      <p className="text-sm text-destructive">{errors.status.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      placeholder="Enter model number"
                      {...register('model')}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      placeholder="Enter SKU"
                      {...register('sku')}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Costs</CardTitle>
                <CardDescription>
                  Set pricing structure and calculate margins
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="costPrice">Cost Price (RWF) *</Label>
                    <Input
                      id="costPrice"
                      type="number"
                      min="0"
                      step="100"
                      placeholder="0"
                      {...register('costPrice', { valueAsNumber: true })}
                      disabled={isLoading}
                    />
                    {errors.costPrice && (
                      <p className="text-sm text-destructive">{errors.costPrice.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wholesalePrice">Wholesale Price (RWF) *</Label>
                    <Input
                      id="wholesalePrice"
                      type="number"
                      min="0"
                      step="100"
                      placeholder="0"
                      {...register('wholesalePrice', { valueAsNumber: true })}
                      disabled={isLoading}
                    />
                    {errors.wholesalePrice && (
                      <p className="text-sm text-destructive">{errors.wholesalePrice.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="retailPrice">Retail Price (RWF) *</Label>
                    <Input
                      id="retailPrice"
                      type="number"
                      min="0"
                      step="100"
                      placeholder="0"
                      {...register('retailPrice', { valueAsNumber: true })}
                      disabled={isLoading}
                    />
                    {errors.retailPrice && (
                      <p className="text-sm text-destructive">{errors.retailPrice.message}</p>
                    )}
                  </div>
                </div>

                {/* Margin calculation */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Wholesale Margin</p>
                    <p className="text-2xl font-bold text-green-600">{wholesaleMargin}%</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Retail Margin</p>
                    <p className="text-2xl font-bold text-green-600">{grossMargin}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inventory */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory Management</CardTitle>
                <CardDescription>
                  Stock levels and inventory tracking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="stockQuantity">Current Stock *</Label>
                    <Input
                      id="stockQuantity"
                      type="number"
                      min="0"
                      placeholder="0"
                      {...register('stockQuantity', { valueAsNumber: true })}
                      disabled={isLoading}
                    />
                    {errors.stockQuantity && (
                      <p className="text-sm text-destructive">{errors.stockQuantity.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minStockLevel">Minimum Stock Level *</Label>
                    <Input
                      id="minStockLevel"
                      type="number"
                      min="0"
                      placeholder="0"
                      {...register('minStockLevel', { valueAsNumber: true })}
                      disabled={isLoading}
                    />
                    {errors.minStockLevel && (
                      <p className="text-sm text-destructive">{errors.minStockLevel.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    placeholder="Enter or scan barcode"
                    {...register('barcode')}
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Buttons */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button type="submit" className="w-full" disabled={isLoading || !isDirty}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button type="button" variant="outline" className="w-full" asChild>
                  <Link href="/products">
                    Cancel
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Product Info */}
            <Card>
              <CardHeader>
                <CardTitle>Product Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Product ID</p>
                  <p className="font-mono text-sm">{product.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-sm">{new Date(product.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-sm">{new Date(product.updatedAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Product Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold">{watchedValues.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {watchedValues.brand && `${watchedValues.brand} • `}
                      {watchedValues.category}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(watchedValues.retailPrice)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Wholesale: {formatCurrency(watchedValues.wholesalePrice)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge 
                      variant={watchedValues.status === 'ACTIVE' ? 'default' : 
                        watchedValues.status === 'INACTIVE' ? 'secondary' : 'destructive'}
                    >
                      {watchedValues.status}
                    </Badge>
                    <Badge variant={watchedValues.stockQuantity === 0 ? 'destructive' : 
                      watchedValues.stockQuantity <= watchedValues.minStockLevel ? 'secondary' : 'default'}>
                      Stock: {watchedValues.stockQuantity}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
