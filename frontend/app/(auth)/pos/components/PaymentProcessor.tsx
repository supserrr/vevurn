'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard,
  Smartphone,
  Banknote,
  Building2,
  CheckCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { usePOSStore } from '@/lib/store';
import { apiClient } from '@/lib/api-client';

interface PaymentProcessorProps {
  className?: string;
  onPaymentComplete?: () => void;
}

export default function PaymentProcessor({ className, onPaymentComplete }: PaymentProcessorProps) {
  const {
    cart,
    totalAmount,
    currentCustomer,
    paymentMethod,
    momoPhone,
    cashReceived,
    changeAmount,
    isProcessingPayment,
    setPaymentMethod,
    setMomoPhone,
    setCashReceived,
    setProcessingPayment,
    setCurrentSale,
    setShowReceipt,
    resetTransaction
  } = usePOSStore();

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const paymentMethods = [
    {
      id: 'CASH' as const,
      label: 'Cash',
      icon: Banknote,
      description: 'Cash payment'
    },
    {
      id: 'MOMO_MTN' as const,
      label: 'MTN MoMo',
      icon: Smartphone,
      description: 'MTN Mobile Money'
    },
    {
      id: 'MOMO_AIRTEL' as const,
      label: 'Airtel Money',
      icon: Smartphone,
      description: 'Airtel Mobile Money'
    },
    {
      id: 'BANK_TRANSFER' as const,
      label: 'Bank Transfer',
      icon: Building2,
      description: 'Bank transfer'
    },
    {
      id: 'CARD' as const,
      label: 'Card',
      icon: CreditCard,
      description: 'Credit/Debit card'
    }
  ];

  const canProcessPayment = () => {
    if (cart.length === 0) return false;
    if (!paymentMethod) return false;
    
    switch (paymentMethod) {
      case 'CASH':
        return cashReceived >= totalAmount;
      case 'MOMO_MTN':
      case 'MOMO_AIRTEL':
        return momoPhone.length >= 10;
      case 'BANK_TRANSFER':
      case 'CARD':
        return true;
      default:
        return false;
    }
  };

  const processPayment = async () => {
    if (!canProcessPayment()) return;
    
    try {
      setProcessingPayment(true);
      setError(null);
      setSuccess(null);

      // Prepare sale data
      const saleData = {
        customerId: currentCustomer?.id,
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount
        })),
        paymentMethod,
        momoPhone: paymentMethod?.includes('MOMO') ? momoPhone : undefined,
        notes: `POS Sale - ${new Date().toISOString()}`
      };

      // Create the sale
      const saleResponse = await apiClient.post('/api/sales', saleData);
      
      if (!saleResponse.success) {
        throw new Error(saleResponse.message || 'Failed to create sale');
      }

      const sale = saleResponse.data;
      setCurrentSale(sale);

      // Handle different payment methods
      if (paymentMethod?.includes('MOMO')) {
        // Process mobile money payment
        const momoResponse = await apiClient.post('/api/payments/momo', {
          saleId: sale.id,
          phone: momoPhone,
          amount: totalAmount,
          method: paymentMethod
        });

        if (!momoResponse.success) {
          throw new Error(momoResponse.message || 'Mobile money payment failed');
        }

        setSuccess('Mobile money payment initiated. Please complete on your phone.');
      } else {
        // For cash, card, and bank transfer - mark as completed
        const paymentResponse = await apiClient.post('/api/payments', {
          saleId: sale.id,
          amount: totalAmount,
          method: paymentMethod,
          status: 'COMPLETED'
        });

        if (!paymentResponse.success) {
          throw new Error(paymentResponse.message || 'Payment processing failed');
        }

        setSuccess('Payment completed successfully!');
      }

      // Show receipt and reset
      setTimeout(() => {
        setShowReceipt(true);
        onPaymentComplete?.();
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment processing failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (cart.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Add items to cart to proceed with payment</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Payment ({formatCurrency(totalAmount)})</CardTitle>
        {currentCustomer && (
          <div className="text-sm text-muted-foreground">
            Customer: {currentCustomer.name}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Payment Method Selection */}
        <div>
          <Label className="text-sm font-medium">Payment Method</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const isSelected = paymentMethod === method.id;
              
              return (
                <Button
                  key={method.id}
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod(method.id)}
                  className="h-auto p-3 flex flex-col items-center gap-1"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{method.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Payment Method Specific Fields */}
        {paymentMethod === 'CASH' && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="cashReceived">Cash Received</Label>
              <Input
                id="cashReceived"
                type="number"
                value={cashReceived || ''}
                onChange={(e) => setCashReceived(Number(e.target.value))}
                placeholder="0"
                step="0.01"
                min="0"
              />
            </div>
            {cashReceived > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cash Received:</span>
                  <span>{formatCurrency(cashReceived)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Change:</span>
                  <span className={changeAmount >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(changeAmount)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {(paymentMethod === 'MOMO_MTN' || paymentMethod === 'MOMO_AIRTEL') && (
          <div>
            <Label htmlFor="momoPhone">Mobile Number</Label>
            <Input
              id="momoPhone"
              type="tel"
              value={momoPhone}
              onChange={(e) => setMomoPhone(e.target.value)}
              placeholder="0781234567"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter the mobile number to receive payment request
            </p>
          </div>
        )}

        {paymentMethod === 'BANK_TRANSFER' && (
          <Alert>
            <Building2 className="h-4 w-4" />
            <AlertDescription>
              Customer will transfer {formatCurrency(totalAmount)} to the business account. 
              Confirm receipt before completing the sale.
            </AlertDescription>
          </Alert>
        )}

        {paymentMethod === 'CARD' && (
          <Alert>
            <CreditCard className="h-4 w-4" />
            <AlertDescription>
              Process card payment using the POS terminal and enter amount: {formatCurrency(totalAmount)}
            </AlertDescription>
          </Alert>
        )}

        {/* Error/Success Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Process Payment Button */}
        <Button
          onClick={processPayment}
          disabled={!canProcessPayment() || isProcessingPayment}
          className="w-full"
          size="lg"
        >
          {isProcessingPayment ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Payment
            </>
          )}
        </Button>

        {/* Payment Summary */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Items:</span>
            <span>{cart.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(totalAmount / 1.18)}</span>
          </div>
          <div className="flex justify-between">
            <span>VAT (18%):</span>
            <span>{formatCurrency(totalAmount - (totalAmount / 1.18))}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Total:</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
