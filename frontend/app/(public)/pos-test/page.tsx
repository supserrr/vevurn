'use client';

import { useEffect } from 'react';
import { Calculator, ShoppingCart, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePOSStore } from '@/lib/store';

// Simple test components to avoid auth dependency
function TestProductCatalog() {
  const { addToCart } = usePOSStore();

  const mockProducts = [
    {
      id: '1',
      name: 'iPhone 15 Pro Case',
      sku: 'IPH15-CASE-001',
      barcode: '123456789',
      categoryId: 'cat-1',
      brandId: 'brand-1',
      unitPrice: 25000,
      costPrice: 15000,
      minStock: 5,
      currentStock: 10,
      reorderLevel: 5,
      isActive: true,
      images: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: { id: 'cat-1', name: 'Cases', isActive: true, createdAt: '', updatedAt: '' },
      brand: { id: 'brand-1', name: 'Apple', isActive: true, createdAt: '', updatedAt: '' }
    },
    {
      id: '2', 
      name: 'Samsung Galaxy Screen Protector',
      sku: 'SAM-SP-001',
      barcode: '123456790',
      categoryId: 'cat-2',
      brandId: 'brand-2',
      unitPrice: 8000,
      costPrice: 5000,
      minStock: 10,
      currentStock: 15,
      reorderLevel: 10,
      isActive: true,
      images: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: { id: 'cat-2', name: 'Screen Protectors', isActive: true, createdAt: '', updatedAt: '' },
      brand: { id: 'brand-2', name: 'Samsung', isActive: true, createdAt: '', updatedAt: '' }
    },
    {
      id: '3',
      name: 'USB-C Fast Charger',
      sku: 'USBC-CHAR-001',
      barcode: '123456791',
      categoryId: 'cat-3',
      brandId: 'brand-3',
      unitPrice: 18000,
      costPrice: 12000,
      minStock: 5,
      currentStock: 8,
      reorderLevel: 5,
      isActive: true,
      images: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: { id: 'cat-3', name: 'Chargers', isActive: true, createdAt: '', updatedAt: '' },
      brand: { id: 'brand-3', name: 'Anker', isActive: true, createdAt: '', updatedAt: '' }
    }
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Test Products</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockProducts.map((product) => (
          <div key={product.id} className="border rounded-lg p-4 space-y-2">
            <h3 className="font-medium">{product.name}</h3>
            <p className="text-sm text-muted-foreground">
              {product.brand.name} • {product.category.name}
            </p>
            <p className="text-sm">SKU: {product.sku}</p>
            <p className="text-lg font-semibold text-green-600">
              {product.unitPrice.toLocaleString('en-RW', { style: 'currency', currency: 'RWF' })}
            </p>
            <p className="text-sm">Stock: {product.currentStock}</p>
            <Button 
              onClick={() => addToCart(product)}
              className="w-full"
            >
              Add to Cart
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TestShoppingCart() {
  const { cart, subtotal, taxAmount, totalAmount, updateCartItemQuantity, removeFromCart, clearCart } = usePOSStore();

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Cart ({cart.length})</h2>
        {cart.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearCart}>
            Clear
          </Button>
        )}
      </div>
      
      {cart.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Cart is empty</p>
      ) : (
        <div className="space-y-3">
          {cart.map((item) => (
            <div key={item.id} className="flex items-center justify-between border-b pb-2">
              <div className="flex-1">
                <h4 className="font-medium">{item.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {item.unitPrice.toLocaleString('en-RW', { style: 'currency', currency: 'RWF' })} each
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => updateCartItemQuantity(item.productId, item.quantity - 1)}
                >
                  -
                </Button>
                <span className="w-8 text-center">{item.quantity}</span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => updateCartItemQuantity(item.productId, item.quantity + 1)}
                >
                  +
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => removeFromCart(item.productId)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
          
          <div className="space-y-2 pt-3 border-t">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{subtotal.toLocaleString('en-RW', { style: 'currency', currency: 'RWF' })}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT (18%):</span>
              <span>{taxAmount.toLocaleString('en-RW', { style: 'currency', currency: 'RWF' })}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg">
              <span>Total:</span>
              <span>{totalAmount.toLocaleString('en-RW', { style: 'currency', currency: 'RWF' })}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function POSTestPage() {
  const { cart, totalAmount, resetTransaction } = usePOSStore();

  const handleNewTransaction = () => {
    if (cart.length > 0) {
      const confirmed = confirm('Are you sure you want to start a new transaction? Current cart will be cleared.');
      if (!confirmed) return;
    }
    resetTransaction();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calculator className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">POS Test Interface</h1>
                <p className="text-sm text-muted-foreground">
                  Testing the POS functionality without authentication
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {cart.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                  <ShoppingCart className="h-4 w-4" />
                  {cart.length} items • {totalAmount.toLocaleString('en-RW', { style: 'currency', currency: 'RWF' })}
                </div>
              )}
              
              <Button
                variant="outline"
                onClick={handleNewTransaction}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                New Transaction
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Product Catalog */}
          <div className="lg:col-span-2">
            <TestProductCatalog />
          </div>

          {/* Right Column - Cart */}
          <div className="space-y-6">
            <TestShoppingCart />
            
            {/* Simple Payment Button */}
            {cart.length > 0 && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">Payment</h3>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => {
                    alert(`Payment of ${totalAmount.toLocaleString('en-RW', { style: 'currency', currency: 'RWF' })} completed!`);
                    resetTransaction();
                  }}
                >
                  Complete Payment ({totalAmount.toLocaleString('en-RW', { style: 'currency', currency: 'RWF' })})
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
