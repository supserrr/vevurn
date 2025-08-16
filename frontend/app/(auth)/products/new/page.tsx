'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Package,
  Upload,
  X,
  Plus,
  Minus,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { z } from 'zod';

// Product form schema
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
}).refine(data => data.costPrice <= data.wholesalePrice, {
  message: 'Cost price cannot be higher than wholesale price',
  path: ['wholesalePrice'],
}).refine(data => data.wholesalePrice <= data.retailPrice, {
  message: 'Wholesale price cannot be higher than retail price',
  path: ['retailPrice'],
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductVariation {
  id: string;
  name: string;
  value: string;
  priceAdjustment: number;
  stockQuantity: number;
}

export default function NewProductPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [newVariationName, setNewVariationName] = useState('');
  const [newVariationValue, setNewVariationValue] = useState('');
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    setValue,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      costPrice: 0,
      wholesalePrice: 0,
      retailPrice: 0,
      stockQuantity: 0,
      minStockLevel: 0,
    },
  });

  const watchedValues = watch();
  
  // Calculate profit margins
  const grossMargin = watchedValues.retailPrice && watchedValues.costPrice 
    ? ((watchedValues.retailPrice - watchedValues.costPrice) / watchedValues.retailPrice * 100).toFixed(1)
    : '0';

  const wholesaleMargin = watchedValues.wholesalePrice && watchedValues.costPrice
    ? ((watchedValues.wholesalePrice - watchedValues.costPrice) / watchedValues.wholesalePrice * 100).toFixed(1)
    : '0';

  // Mock categories - in real app, fetch from API
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

  const onSubmit = async (data: ProductFormData) => {
    setIsLoading(true);

    try {
      // In real app, call API to create product
      console.log('Product data:', data);
      console.log('Variations:', variations);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Redirect to products list
      router.push('/products');
    } catch (error: any) {
      setError('root', { 
        message: error.message || 'Failed to create product. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addVariation = () => {
    if (newVariationName && newVariationValue) {
      const newVariation: ProductVariation = {
        id: Date.now().toString(),
        name: newVariationName,
        value: newVariationValue,
        priceAdjustment: 0,
        stockQuantity: 0,
      };
      setVariations([...variations, newVariation]);
      setNewVariationName('');
      setNewVariationValue('');
    }
  };

  const removeVariation = (id: string) => {
    setVariations(variations.filter(v => v.id !== id));
  };

  const updateVariation = (id: string, field: keyof ProductVariation, value: any) => {
    setVariations(variations.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/products">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add New Product</h1>
          <p className="text-muted-foreground">
            Create a new product for your inventory
          </p>
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
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
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
                    {errors.brand && (
                      <p className="text-sm text-destructive">{errors.brand.message}</p>
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
                    {errors.model && (
                      <p className="text-sm text-destructive">{errors.model.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      placeholder="Enter SKU"
                      {...register('sku')}
                      disabled={isLoading}
                    />
                    {errors.sku && (
                      <p className="text-sm text-destructive">{errors.sku.message}</p>
                    )}
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
                  {errors.barcode && (
                    <p className="text-sm text-destructive">{errors.barcode.message}</p>
                  )}
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
                <Button type="submit" className="w-full" disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Creating...' : 'Create Product'}
                </Button>
                <Button type="button" variant="outline" className="w-full" asChild>
                  <Link href="/products">
                    Cancel
                  </Link>
                </Button>
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
                    <p className="font-semibold">{watchedValues.name || 'Product Name'}</p>
                    <p className="text-sm text-muted-foreground">
                      {watchedValues.brand && `${watchedValues.brand} • `}
                      {watchedValues.category || 'Category'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(watchedValues.retailPrice || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Wholesale: {formatCurrency(watchedValues.wholesalePrice || 0)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={watchedValues.stockQuantity === 0 ? 'destructive' : 
                      (watchedValues.stockQuantity || 0) <= (watchedValues.minStockLevel || 0) ? 'secondary' : 'default'}>
                      Stock: {watchedValues.stockQuantity || 0}
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
