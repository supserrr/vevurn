'use client';

import { useState } from 'react';
import { ProductSearch } from '@/components/pos/product-search';
import { ShoppingCart } from '@/components/pos/shopping-cart';
import { PaymentModal } from '@/components/pos/payment-modal';
import { useCart } from '@/lib/store/cart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart as CartIcon, Package, CreditCard } from 'lucide-react';

export default function POSPage() {
  const [showPayment, setShowPayment] = useState(false);
  const { getTotal, getItemCount } = useCart();

  const handleCheckout = () => {
    if (getItemCount() === 0) {
      return;
    }
    setShowPayment(true);
  };

  return (
    <div className="flex h-[calc(100vh-3rem)] bg-gray-50 -m-6">
      {/* Left Panel - Product Search */}
      <div className="flex-1 p-6 overflow-hidden">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Point of Sale</h1>
          <p className="text-gray-600">Search and add products to cart</p>
        </div>
        
        {/* Quick Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="flex items-center p-4">
              <Package className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Products</p>
                <p className="text-2xl font-bold">Available</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-4">
              <CartIcon className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Cart Items</p>
                <p className="text-2xl font-bold">{getItemCount()}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-4">
              <CreditCard className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-green-600">
                  {getTotal().toLocaleString()} RWF
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <ProductSearch />
        </div>
      </div>
      
      {/* Right Panel - Shopping Cart */}
      <div className="w-96 bg-white border-l border-gray-200">
        <ShoppingCart onCheckout={handleCheckout} />
      </div>
      
      {/* Payment Modal */}
      <PaymentModal 
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        total={getTotal()}
      />
    </div>
  );
}
