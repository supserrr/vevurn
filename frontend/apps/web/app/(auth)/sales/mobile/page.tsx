'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MobilePOS } from '@/components/mobile/MobilePOS';
import realApiService from '@/lib/real-api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Smartphone, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  quantity: number;
}

export default function MobileSalesPage() {
  const [saleStatus, setSaleStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [saleError, setSaleError] = useState<string | null>(null);

  // Fetch products from real API
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const result = await realApiService.getProducts();
      return result.data || [];
    }
  });

  // Transform backend data to component format
  const products = productsData?.map((product: any) => ({
    id: product.id,
    name: product.name,
    price: product.retailPrice,
    category: product.category?.name || 'General',
    stock: product.stockQuantity,
    image: product.images?.[0]?.url
  })) || [];

  const handleSaleComplete = async (
    items: CartItem[], 
    total: number, 
    paymentMethod: string
  ) => {
    setSaleStatus('processing');
    setSaleError(null);

    try {
      // Create sale through real API
      const saleData = {
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity
        })),
        totalAmount: total,
        paymentMethod,
        status: 'COMPLETED'
      };

      const result = await realApiService.createSale(saleData);
      
      console.log('Sale completed:', result);

      setSaleStatus('success');
      
      // Reset status after showing success message
      setTimeout(() => {
        setSaleStatus('idle');
      }, 3000);

    } catch (error) {
      console.error('Sale creation failed:', error);
      setSaleStatus('error');
      setSaleError(error instanceof Error ? error.message : 'Failed to process sale');
    }
  };

  return (
    <div className="h-screen bg-gray-50">
      {/* Sale Status Notifications */}
      {saleStatus === 'processing' && (
        <div className="fixed top-4 left-4 right-4 z-50">
          <Alert className="bg-blue-50 border-blue-200">
            <Smartphone className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Processing sale...
            </AlertDescription>
          </Alert>
        </div>
      )}

      {saleStatus === 'success' && (
        <div className="fixed top-4 left-4 right-4 z-50">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Sale completed successfully!
            </AlertDescription>
          </Alert>
        </div>
      )}

      {saleStatus === 'error' && (
        <div className="fixed top-4 left-4 right-4 z-50">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {saleError || 'Failed to process sale. Please try again.'}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Mobile POS Interface */}
      <MobilePOS
        products={products}
        onSaleComplete={handleSaleComplete}
      />
    </div>
  );
}
