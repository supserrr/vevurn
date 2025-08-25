'use client';

import { useState } from 'react';
import ProductList from '@/components/products/ProductList';
import ProductForm from '@/components/products/ProductForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  brand: string;
  sku: string;
  barcode?: string;
  wholesalePrice: number;
  retailPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  variations?: Array<{
    id: string;
    name: string;
    value: string;
    priceAdjustment: number;
  }>;
}

export default function ProductsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleClose = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <ProductList onEdit={handleEdit} onAdd={handleAdd} />
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            product={editingProduct}
            onSuccess={handleClose}
            onCancel={handleClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
