'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft,
  Save,
  Package,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ApiClient } from '@/lib/api-client';
import Link from 'next/link';
import toast from 'react-hot-toast';

// Temporary interfaces until we can import from shared
interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Brand {
  id: string;
  name: string;
  logo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateProductRequest {
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  brandId: string;
  unitPrice: number;
  costPrice: number;
  minStock?: number;
  reorderLevel?: number;
  warranty?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const apiClient = new ApiClient(API_BASE);

export default function NewProductPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Form state
  const [formData, setFormData] = useState<CreateProductRequest>({
    name: '',
    description: '',
    sku: '',
    barcode: '',
    categoryId: '',
    brandId: '',
    unitPrice: 0,
    costPrice: 0,
    minStock: 5,
    reorderLevel: 10,
    warranty: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'Product name is required';
        if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
        if (!formData.categoryId) newErrors.categoryId = 'Category is required';
        if (!formData.brandId) newErrors.brandId = 'Brand is required';
        break;
      case 2:
        if (formData.costPrice < 0) newErrors.costPrice = 'Cost price must be positive';
        if (formData.unitPrice < 0) newErrors.unitPrice = 'Unit price must be positive';
        if (formData.costPrice > formData.unitPrice) {
          newErrors.unitPrice = 'Unit price must be greater than or equal to cost price';
        }
        break;
      case 3:
        if (formData.minStock !== undefined && formData.minStock < 0) {
          newErrors.minStock = 'Minimum stock must be positive';
        }
        if (formData.reorderLevel !== undefined && formData.reorderLevel < 0) {
          newErrors.reorderLevel = 'Reorder level must be positive';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculate profit margin
  const profitMargin = formData.unitPrice && formData.costPrice
    ? ((formData.unitPrice - formData.costPrice) / formData.unitPrice * 100).toFixed(1)
    : '0';

  // Fetch categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiClient.request<Category[]>('/api/categories');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch categories');
      }
      return response.data;
    },
  });

  // Fetch brands
  const { data: brands, isLoading: isLoadingBrands } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const response = await apiClient.request<Brand[]>('/api/brands');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch brands');
      }
      return response.data;
    },
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: CreateProductRequest) => {
      const response = await apiClient.request('/api/products', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to create product');
      }
      
      return response.data;
    },
    onSuccess: () => {
      toast.success('Product created successfully');
      router.push('/products');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create product');
    },
  });

  const handleInputChange = (field: keyof CreateProductRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (validateStep(currentStep)) {
      try {
        await createProductMutation.mutateAsync(formData);
      } catch (error) {
        console.error('Failed to create product:', error);
      }
    }
  };

  if (isLoadingCategories || isLoadingBrands) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading form data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
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
            <h1 className="text-3xl font-bold tracking-tight">Add New Product</h1>
            <p className="text-muted-foreground">
              Create a new product in your inventory
            </p>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center space-x-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} className="flex items-center">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
              i + 1 <= currentStep 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {i + 1}
            </div>
            {i < totalSteps - 1 && (
              <div className={`h-0.5 w-12 ${
                i + 1 < currentStep ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Information */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Enter the basic details of your product
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter product name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  placeholder="Enter SKU"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  className={errors.sku ? 'border-destructive' : ''}
                />
                {errors.sku && (
                  <p className="text-sm text-destructive">{errors.sku}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">Category *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => handleInputChange('categoryId', value)}
                >
                  <SelectTrigger className={errors.categoryId ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && (
                  <p className="text-sm text-destructive">{errors.categoryId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="brandId">Brand *</Label>
                <Select
                  value={formData.brandId}
                  onValueChange={(value) => handleInputChange('brandId', value)}
                >
                  <SelectTrigger className={errors.brandId ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands?.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.brandId && (
                  <p className="text-sm text-destructive">{errors.brandId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  placeholder="Enter barcode"
                  value={formData.barcode}
                  onChange={(e) => handleInputChange('barcode', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="warranty">Warranty</Label>
                <Input
                  id="warranty"
                  placeholder="e.g., 1 year, 6 months"
                  value={formData.warranty}
                  onChange={(e) => handleInputChange('warranty', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description"
                placeholder="Enter product description" 
                className="min-h-[100px]"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Pricing */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Pricing Information</CardTitle>
            <CardDescription>
              Set the pricing details for your product
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price *</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.costPrice}
                  onChange={(e) => handleInputChange('costPrice', parseFloat(e.target.value) || 0)}
                  className={errors.costPrice ? 'border-destructive' : ''}
                />
                {errors.costPrice && (
                  <p className="text-sm text-destructive">{errors.costPrice}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitPrice">Unit Price *</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.unitPrice}
                  onChange={(e) => handleInputChange('unitPrice', parseFloat(e.target.value) || 0)}
                  className={errors.unitPrice ? 'border-destructive' : ''}
                />
                {errors.unitPrice && (
                  <p className="text-sm text-destructive">{errors.unitPrice}</p>
                )}
              </div>
            </div>

            {/* Profit Margin Display */}
            {formData.unitPrice > 0 && formData.costPrice > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p><strong>Cost Price:</strong> {formatCurrency(formData.costPrice)}</p>
                    <p><strong>Unit Price:</strong> {formatCurrency(formData.unitPrice)}</p>
                    <p><strong>Profit Margin:</strong> {profitMargin}%</p>
                    <p><strong>Profit per Unit:</strong> {formatCurrency(formData.unitPrice - formData.costPrice)}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Inventory */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Inventory Settings</CardTitle>
            <CardDescription>
              Configure stock levels and inventory management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="minStock">Minimum Stock Level *</Label>
                <Input
                  id="minStock"
                  type="number"
                  placeholder="5"
                  value={formData.minStock}
                  onChange={(e) => handleInputChange('minStock', parseInt(e.target.value) || 0)}
                  className={errors.minStock ? 'border-destructive' : ''}
                />
                {errors.minStock && (
                  <p className="text-sm text-destructive">{errors.minStock}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reorderLevel">Reorder Level *</Label>
                <Input
                  id="reorderLevel"
                  type="number"
                  placeholder="10"
                  value={formData.reorderLevel}
                  onChange={(e) => handleInputChange('reorderLevel', parseInt(e.target.value) || 0)}
                  className={errors.reorderLevel ? 'border-destructive' : ''}
                />
                {errors.reorderLevel && (
                  <p className="text-sm text-destructive">{errors.reorderLevel}</p>
                )}
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                The system will alert you when stock falls below the minimum level. 
                The reorder level helps you plan inventory replenishment.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <div>
          {currentStep > 1 && (
            <Button type="button" variant="outline" onClick={prevStep}>
              Previous
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {currentStep < totalSteps ? (
            <Button type="button" onClick={nextStep}>
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={createProductMutation.isPending}
              className="min-w-[120px]"
            >
              {createProductMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Product
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
