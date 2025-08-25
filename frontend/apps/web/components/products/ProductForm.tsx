'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Minus, Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().min(1, 'Brand is required'),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  wholesalePrice: z.number().min(0, 'Wholesale price must be positive'),
  retailPrice: z.number().min(0, 'Retail price must be positive'),
  stockQuantity: z.number().int().min(0, 'Stock quantity must be non-negative'),
  minStockLevel: z.number().int().min(0, 'Minimum stock level must be non-negative'),
  imageUrl: z.string().url().optional().or(z.literal('')),
  status: z.string().default('active'),
  variations: z.array(z.object({
    name: z.string().min(1, 'Variation name required'),
    value: z.string().min(1, 'Variation value required'),
    priceAdjustment: z.number().default(0),
  })).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Product extends ProductFormData {
  id: string;
  createdAt: string;
  updatedAt: string;
  variations?: Array<{
    id: string;
    name: string;
    value: string;
    priceAdjustment: number;
  }>;
}

interface ProductFormProps {
  product?: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const CATEGORIES = [
  'Phone Cases',
  'Screen Protectors',
  'Camera Protectors',
  'Chargers',
  'Earphones',
  'AirPods',
  'Accessories',
  'Other'
];

const BRANDS = [
  'Apple',
  'Samsung',
  'Huawei',
  'Xiaomi',
  'Tecno',
  'Infinix',
  'Oppo',
  'Vivo',
  'Generic',
  'Other'
];

async function saveProduct(data: ProductFormData & { id?: string }) {
  const url = data.id ? `/api/products/${data.id}` : '/api/products';
  const method = data.id ? 'PUT' : 'POST';
  
  const response = await fetch(url, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to save product');
  }
  
  return response.json();
}

export default function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const queryClient = useQueryClient();
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      category: product?.category || '',
      brand: product?.brand || '',
      sku: product?.sku || '',
      barcode: product?.barcode || '',
      wholesalePrice: product?.wholesalePrice || 0,
      retailPrice: product?.retailPrice || 0,
      stockQuantity: product?.stockQuantity || 0,
      minStockLevel: product?.minStockLevel || 5,
      imageUrl: product?.imageUrl || '',
      status: product?.status ?? 'active',
      variations: product?.variations?.map(v => ({
        name: v.name,
        value: v.value,
        priceAdjustment: v.priceAdjustment,
      })) || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variations',
  });

  const saveMutation = useMutation({
    mutationFn: (data: ProductFormData) => saveProduct({ ...data, id: product?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success(product ? 'Product updated successfully' : 'Product created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save product');
    },
  });

  const onSubmit = (data: ProductFormData) => {
    // Validate that retail price is not less than wholesale price
    if (data.retailPrice < data.wholesalePrice) {
      toast.error('Retail price cannot be less than wholesale price');
      return;
    }
    
    saveMutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="iPhone 15 Pro Case"
            />
            {form.formState.errors.name && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="sku">SKU *</Label>
            <Input
              id="sku"
              {...form.register('sku')}
              placeholder="IP15-CASE-001"
            />
            {form.formState.errors.sku && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.sku.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <select
              id="category"
              {...form.register('category')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {form.formState.errors.category && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.category.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="brand">Brand *</Label>
            <select
              id="brand"
              {...form.register('brand')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Brand</option>
              {BRANDS.map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
            {form.formState.errors.brand && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.brand.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="barcode">Barcode</Label>
            <Input
              id="barcode"
              {...form.register('barcode')}
              placeholder="123456789012"
            />
          </div>

          <div>
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              {...form.register('imageUrl')}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Product description..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing & Inventory */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing & Inventory</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="wholesalePrice">Wholesale Price (RWF) *</Label>
            <Input
              id="wholesalePrice"
              type="number"
              step="0.01"
              {...form.register('wholesalePrice', { valueAsNumber: true })}
              placeholder="5000"
            />
            {form.formState.errors.wholesalePrice && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.wholesalePrice.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="retailPrice">Retail Price (RWF) *</Label>
            <Input
              id="retailPrice"
              type="number"
              step="0.01"
              {...form.register('retailPrice', { valueAsNumber: true })}
              placeholder="8000"
            />
            {form.formState.errors.retailPrice && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.retailPrice.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="stockQuantity">Stock Quantity *</Label>
            <Input
              id="stockQuantity"
              type="number"
              {...form.register('stockQuantity', { valueAsNumber: true })}
              placeholder="50"
            />
            {form.formState.errors.stockQuantity && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.stockQuantity.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="minStockLevel">Minimum Stock Level *</Label>
            <Input
              id="minStockLevel"
              type="number"
              {...form.register('minStockLevel', { valueAsNumber: true })}
              placeholder="5"
            />
            {form.formState.errors.minStockLevel && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.minStockLevel.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Product Status</Label>
            <select
              id="status"
              {...form.register('status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Product Variations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Product Variations</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ name: '', value: '', priceAdjustment: 0 })}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Variation
          </Button>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No variations added. Click "Add Variation" to add size, color, or other variants.
            </p>
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end space-x-3 p-3 border rounded">
                  <div className="flex-1">
                    <Label>Variation Name</Label>
                    <Input
                      {...form.register(`variations.${index}.name`)}
                      placeholder="Color, Size, etc."
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Value</Label>
                    <Input
                      {...form.register(`variations.${index}.value`)}
                      placeholder="Red, Large, etc."
                    />
                  </div>
                  <div className="w-32">
                    <Label>Price Adjustment</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...form.register(`variations.${index}.priceAdjustment`, { 
                        valueAsNumber: true 
                      })}
                      placeholder="0"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={saveMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
        </Button>
      </div>
    </form>
  );
}
