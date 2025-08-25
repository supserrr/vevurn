'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Smartphone, 
  Banknote,
  Receipt,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CartItem {
  productId: string;
  product: {
    id: string;
    name: string;
    retailPrice: number;
    wholesalePrice: number;
  };
  quantity: number;
  unitPrice: number;
  variationId?: string;
  variation?: {
    id: string;
    name: string;
    value: string;
  };
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  customer?: Customer | null;
  total: number;
  onSuccess: () => void;
}

type PaymentMethod = 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER';

interface ProcessSaleRequest {
  items: Array<{
    productId: string;
    variationId?: string;
    quantity: number;
    unitPrice: number;
  }>;
  customerId?: string;
  paymentMethod: PaymentMethod;
  paidAmount: number;
  momoPhoneNumber?: string;
  notes?: string;
}

async function processSale(data: ProcessSaleRequest) {
  const response = await fetch('/api/sales', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to process sale');
  }

  return response.json();
}

export default function PaymentModal({
  isOpen,
  onClose,
  cartItems,
  customer,
  total,
  onSuccess
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paidAmount, setPaidAmount] = useState<number>(total);
  const [momoPhoneNumber, setMomoPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');

  const processSaleMutation = useMutation({
    mutationFn: processSale,
    onSuccess: (data) => {
      toast.success('Sale processed successfully!');
      
      // Show receipt or payment confirmation
      if (data.payment?.requiresConfirmation) {
        toast('Mobile Money payment initiated. Please confirm on your phone.', { 
          icon: 'ℹ️' 
        });
      }
      
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to process sale');
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const change = paymentMethod === 'CASH' ? Math.max(0, paidAmount - total) : 0;
  const isValidPayment = paymentMethod === 'CASH' 
    ? paidAmount >= total 
    : (paymentMethod === 'MOBILE_MONEY' ? momoPhoneNumber.length >= 10 : true);

  const handleSubmit = () => {
    if (!isValidPayment) {
      toast.error('Please check payment details');
      return;
    }

    const saleData: ProcessSaleRequest = {
      items: cartItems.map(item => ({
        productId: item.productId,
        variationId: item.variationId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      customerId: customer?.id,
      paymentMethod,
      paidAmount: paymentMethod === 'CASH' ? paidAmount : total,
      momoPhoneNumber: paymentMethod === 'MOBILE_MONEY' ? momoPhoneNumber : undefined,
      notes: notes || undefined,
    };

    processSaleMutation.mutate(saleData);
  };

  const paymentMethods = [
    {
      id: 'CASH' as PaymentMethod,
      name: 'Cash',
      icon: Banknote,
      description: 'Cash payment',
    },
    {
      id: 'MOBILE_MONEY' as PaymentMethod,
      name: 'Mobile Money',
      icon: Smartphone,
      description: 'MTN Mobile Money',
    },
    {
      id: 'BANK_TRANSFER' as PaymentMethod,
      name: 'Bank Transfer',
      icon: CreditCard,
      description: 'Bank transfer',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Receipt className="w-5 h-5 mr-2" />
            Process Payment
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order Summary */}
          <div>
            <h3 className="font-semibold mb-3">Order Summary</h3>
            <Card>
              <CardContent className="p-4 space-y-3">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <div>{item.product.name}</div>
                      {item.variation && (
                        <div className="text-gray-500 text-xs">
                          {item.variation.name}: {item.variation.value}
                        </div>
                      )}
                      <div className="text-gray-500">
                        {item.quantity} × {formatCurrency(item.unitPrice)}
                      </div>
                    </div>
                    <div className="font-medium">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </div>
                  </div>
                ))}
                
                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                {customer && (
                  <div className="border-t pt-3">
                    <div className="text-sm text-gray-600">
                      <strong>Customer:</strong> {customer.name}
                      {customer.phone && <div>Phone: {customer.phone}</div>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payment Details */}
          <div>
            <h3 className="font-semibold mb-3">Payment Method</h3>
            
            {/* Payment Method Selection */}
            <div className="space-y-2 mb-4">
              {paymentMethods.map((method) => {
                const IconComponent = method.icon;
                return (
                  <Card 
                    key={method.id}
                    className={`cursor-pointer transition-colors ${
                      paymentMethod === method.id 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setPaymentMethod(method.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-3">
                        <IconComponent className="w-5 h-5 text-gray-600" />
                        <div className="flex-1">
                          <div className="font-medium">{method.name}</div>
                          <div className="text-sm text-gray-500">{method.description}</div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          paymentMethod === method.id 
                            ? 'bg-blue-500 border-blue-500' 
                            : 'border-gray-300'
                        }`}>
                          {paymentMethod === method.id && (
                            <div className="w-full h-full rounded-full bg-white transform scale-50"></div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Payment-Specific Fields */}
            <div className="space-y-4">
              {paymentMethod === 'CASH' && (
                <div>
                  <Label htmlFor="paidAmount">Amount Received (RWF)</Label>
                  <Input
                    id="paidAmount"
                    type="number"
                    step="0.01"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="text-lg font-mono"
                  />
                  {change > 0 && (
                    <div className="mt-2 p-3 bg-green-50 rounded border border-green-200">
                      <div className="text-green-700 font-semibold">
                        Change: {formatCurrency(change)}
                      </div>
                    </div>
                  )}
                  {paidAmount < total && (
                    <div className="mt-2 text-red-500 text-sm">
                      Amount received is less than total
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'MOBILE_MONEY' && (
                <div>
                  <Label htmlFor="momoPhone">MTN Mobile Money Phone Number</Label>
                  <Input
                    id="momoPhone"
                    type="tel"
                    placeholder="078xxxxxxx"
                    value={momoPhoneNumber}
                    onChange={(e) => setMomoPhoneNumber(e.target.value)}
                    className="font-mono"
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    Payment request will be sent to this number
                  </div>
                  {momoPhoneNumber && momoPhoneNumber.length < 10 && (
                    <div className="mt-2 text-red-500 text-sm">
                      Please enter a valid phone number
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'BANK_TRANSFER' && (
                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                  <div className="text-blue-700 text-sm">
                    Bank transfer will be recorded as pending. Mark as paid when transfer is confirmed.
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  placeholder="Add any notes about this sale..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={processSaleMutation.isPending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isValidPayment || processSaleMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {processSaleMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {paymentMethod === 'MOBILE_MONEY' 
                  ? 'Send Payment Request' 
                  : 'Complete Sale'
                }
              </Button>
            </div>

            {/* Payment Summary */}
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <Badge variant="outline">
                    {paymentMethods.find(m => m.id === paymentMethod)?.name}
                  </Badge>
                </div>
                {paymentMethod === 'CASH' && change > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Change:</span>
                    <span>{formatCurrency(change)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
