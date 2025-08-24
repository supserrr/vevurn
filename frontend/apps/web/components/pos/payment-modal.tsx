'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/lib/api/client';
import { useCart } from '@/lib/store/cart';
import { CreateSaleRequest } from '@/types';

type PaymentMethodType = 'CASH' | 'MOMO_MTN' | 'MOMO_AIRTEL' | 'CARD' | 'BANK_TRANSFER';
import { CreditCard, Smartphone, Building, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
}

export function PaymentModal({ isOpen, onClose, total }: PaymentModalProps) {
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CASH');
  const [cashAmount, setCashAmount] = useState(total);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const { items, clearCart } = useCart();

  const change = cashAmount - total;

  const validateInputs = (): boolean => {
    if (paymentMethod === 'CASH' && cashAmount < total) {
      toast.error('Insufficient cash amount');
      return false;
    }

    if ((paymentMethod === 'MOMO_MTN' || paymentMethod === 'MOMO_AIRTEL') && !phoneNumber) {
      toast.error('Phone number is required for Mobile Money');
      return false;
    }

    if ((paymentMethod === 'MOMO_MTN' || paymentMethod === 'MOMO_AIRTEL') && 
        !phoneNumber.match(/^(078|079|072|073)\d{7}$/)) {
      toast.error('Please enter a valid Rwandan phone number');
      return false;
    }

    return true;
  };

  const processSale = async () => {
    if (!validateInputs()) return;

    setProcessing(true);
    
    try {
      const saleData: CreateSaleRequest = {
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0
        })),
        paymentMethod: paymentMethod as any,
        momoPhone: (paymentMethod === 'MOMO_MTN' || paymentMethod === 'MOMO_AIRTEL') ? phoneNumber : undefined,
        notes: customerName ? `Customer: ${customerName}${notes ? ' | ' + notes : ''}` : notes || undefined
      };

      // Create sale
      const saleResponse = await api.sales.create(saleData);
      
      if (!saleResponse.success) {
        throw new Error(saleResponse.message || 'Failed to create sale');
      }

      const saleId = saleResponse.data?.id;
      
      if (!saleId) {
        throw new Error('Sale created but no ID returned');
      }

      // Process payment based on method
      let paymentResponse;
      
      if (paymentMethod === 'CASH') {
        paymentResponse = await api.payments.cash({
          saleId: saleId,
          amount: cashAmount,
          changeAmount: change
        });
      } else if (paymentMethod === 'MOMO_MTN' || paymentMethod === 'MOMO_AIRTEL') {
        paymentResponse = await api.payments.momo({
          saleId: saleId,
          amount: total,
          phoneNumber: phoneNumber,
          method: paymentMethod
        });
      } else {
        // Bank transfer - just record the sale
        paymentResponse = { success: true };
      }

      if (paymentResponse.success) {
        toast.success(
          `Sale completed successfully! ${
            paymentMethod === 'CASH' && change > 0 
              ? `Change: ${change.toLocaleString()} RWF` 
              : paymentMethod === 'MOMO_MTN' || paymentMethod === 'MOMO_AIRTEL'
              ? 'Mobile Money request sent'
              : ''
          }`
        );
        clearCart();
        onClose();
        
        // Reset form
        setCashAmount(0);
        setPhoneNumber('');
        setCustomerName('');
        setNotes('');
      } else {
        throw new Error(paymentResponse.message || 'Payment processing failed');
      }
      
    } catch (error) {
      console.error('Sale processing error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process sale. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    if (!processing) {
      onClose();
    }
  };

  // Update cash amount when total changes
  useEffect(() => {
    setCashAmount(total);
  }, [total]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Payment - {total.toLocaleString()} RWF</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="customerName">Customer Name (Optional)</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
              disabled={processing}
            />
          </div>
          
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes"
              disabled={processing}
            />
          </div>
          
          <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethodType)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="CASH" className="flex items-center gap-1">
                <CreditCard className="h-4 w-4" />
                Cash
              </TabsTrigger>
              <TabsTrigger value="MOMO_MTN" className="flex items-center gap-1">
                <Smartphone className="h-4 w-4" />
                MTN
              </TabsTrigger>
              <TabsTrigger value="BANK_TRANSFER" className="flex items-center gap-1">
                <Building className="h-4 w-4" />
                Bank
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="CASH" className="space-y-3">
              <div>
                <Label htmlFor="cashAmount">Cash Amount (RWF)</Label>
                <Input
                  id="cashAmount"
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(Number(e.target.value))}
                  min={total}
                  disabled={processing}
                />
              </div>
              {change >= 0 && (
                <div className="p-3 bg-green-50 rounded border">
                  <p className="text-green-800">
                    Change: <strong>{change.toLocaleString()} RWF</strong>
                  </p>
                </div>
              )}
              {change < 0 && (
                <div className="p-3 bg-red-50 rounded border">
                  <p className="text-red-800">
                    Insufficient amount: <strong>{Math.abs(change).toLocaleString()} RWF short</strong>
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="MOMO_MTN" className="space-y-3">
              <div>
                <Label htmlFor="phoneNumber">MTN Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="078XXXXXXX"
                  disabled={processing}
                />
              </div>
              <div className="p-3 bg-blue-50 rounded border">
                <p className="text-blue-800 text-sm">
                  Customer will receive a payment request on their phone
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="BANK_TRANSFER" className="space-y-3">
              <div className="p-3 bg-gray-50 rounded border">
                <p className="text-gray-800 text-sm">
                  Record bank transfer payment manually
                </p>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              className="flex-1"
              disabled={processing}
            >
              Cancel
            </Button>
            <Button 
              onClick={processSale} 
              disabled={processing}
              className="flex-1"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Complete Sale'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
