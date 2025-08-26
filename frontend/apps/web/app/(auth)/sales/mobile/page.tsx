'use client';

import { useState, useEffect } from 'react';
import { MobilePOS } from '@/components/mobile/MobilePOS';
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

// Mock products data for now
const mockProducts = [
  {
    id: '1',
    name: 'Coffee',
    price: 1500,
    category: 'Beverages',
    stock: 50,
    image: undefined
  },
  {
    id: '2',
    name: 'Tea',
    price: 1000,
    category: 'Beverages',
    stock: 30,
    image: undefined
  },
  {
    id: '3',
    name: 'Sandwich',
    price: 2500,
    category: 'Food',
    stock: 20,
    image: undefined
  },
  {
    id: '4',
    name: 'Juice',
    price: 2000,
    category: 'Beverages',
    stock: 25,
    image: undefined
  },
  {
    id: '5',
    name: 'Pastry',
    price: 1800,
    category: 'Food',
    stock: 15,
    image: undefined
  }
];

export default function MobileSalesPage() {
  const [products] = useState(mockProducts);
  const [saleStatus, setSaleStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [saleError, setSaleError] = useState<string | null>(null);

  const handleSaleComplete = async (
    items: CartItem[], 
    total: number, 
    paymentMethod: string
  ) => {
    setSaleStatus('processing');
    setSaleError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Sale completed:', {
        items,
        total,
        paymentMethod,
        timestamp: new Date().toISOString()
      });

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
