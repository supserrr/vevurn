'use client';

import { useEffect } from 'react';
import { Calculator, ShoppingCart, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePOSStore } from '@/lib/store';
import ProductCatalog from './components/ProductCatalog';
import ShoppingCartComponent from './components/ShoppingCart';
import CustomerSelector from './components/CustomerSelector';
import PaymentProcessor from './components/PaymentProcessor';
import ReceiptGenerator from './components/ReceiptGenerator';

export default function POSPage() {
  const { cart, totalAmount, resetTransaction } = usePOSStore();

  // Calculate totals when cart changes
  useEffect(() => {
    // This will be handled by the store automatically
  }, [cart]);

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
                <h1 className="text-2xl font-bold">Point of Sale</h1>
                <p className="text-sm text-muted-foreground">
                  Fast and efficient sales processing
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
            <ProductCatalog />
          </div>

          {/* Right Column - Cart & Payment */}
          <div className="space-y-6">
            {/* Customer Selection */}
            <CustomerSelector />
            
            {/* Shopping Cart */}
            <ShoppingCartComponent />
            
            {/* Payment Processor */}
            <PaymentProcessor />
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      <ReceiptGenerator />
    </div>
  );
}
