'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft,
  CreditCard,
  Smartphone,
  Banknote,
  Calculator,
  Check,
  X,
  Receipt,
  Printer,
  Send,
  Phone,
  DollarSign,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Types
interface CartItem {
  product: {
    id: string;
    name: string;
    brand?: string;
    category: string;
    sku?: string;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  priceType: 'retail' | 'wholesale';
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  type: 'RETAIL' | 'WHOLESALE';
}

interface PaymentMethod {
  id: string;
  name: string;
  type: 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER';
  icon: React.ComponentType<any>;
  description: string;
  enabled: boolean;
}

// Mock data - in real app, this would come from props or state management
const mockCart: CartItem[] = [
  {
    product: {
      id: '1',
      name: 'iPhone 14 Pro Case - Silicone',
      brand: 'Apple',
      category: 'Phone Cases',
      sku: 'IPH14P-CASE-SIL-001',
    },
    quantity: 2,
    unitPrice: 18000,
    totalPrice: 36000,
    priceType: 'retail',
  },
  {
    product: {
      id: '3',
      name: 'USB-C Fast Charger 25W',
      brand: 'Anker',
      category: 'Chargers',
      sku: 'ANK-USBC-25W-001',
    },
    quantity: 1,
    unitPrice: 15000,
    totalPrice: 15000,
    priceType: 'retail',
  },
];

const mockCustomer: Customer = {
  id: '1',
  name: 'John Doe',
  phone: '+250788123456',
  email: 'john@example.com',
  type: 'RETAIL',
};

const paymentMethods: PaymentMethod[] = [
  {
    id: 'cash',
    name: 'Cash',
    type: 'CASH',
    icon: Banknote,
    description: 'Cash payment',
    enabled: true,
  },
  {
    id: 'mtn_momo',
    name: 'MTN Mobile Money',
    type: 'MOBILE_MONEY',
    icon: Smartphone,
    description: 'MTN MoMo payment',
    enabled: true,
  },
  {
    id: 'airtel_money',
    name: 'Airtel Money',
    type: 'MOBILE_MONEY',
    icon: Smartphone,
    description: 'Airtel Money payment',
    enabled: true,
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    type: 'BANK_TRANSFER',
    icon: CreditCard,
    description: 'Bank account transfer',
    enabled: false,
  },
];

export default function PaymentPage() {
  const [cart] = useState<CartItem[]>(mockCart);
  const [customer] = useState<Customer>(mockCustomer);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  
  // Cash payment states
  const [cashReceived, setCashReceived] = useState<string>('');
  const [showCalculator, setShowCalculator] = useState(false);
  
  // Mobile money states
  const [momoPhone, setMomoPhone] = useState(customer.phone);
  const [momoReference, setMomoReference] = useState('');
  
  const router = useRouter();

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxRate = 0.18; // 18% VAT for Rwanda
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Cash calculations
  const cashReceivedAmount = parseFloat(cashReceived) || 0;
  const change = cashReceivedAmount - total;

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      alert('Please select a payment method');
      return;
    }

    setIsProcessing(true);

    try {
      if (selectedPaymentMethod === 'cash') {
        if (cashReceivedAmount < total) {
          alert('Insufficient cash amount');
          setIsProcessing(false);
          return;
        }
        
        // Process cash payment
        console.log('Processing cash payment:', {
          total,
          received: cashReceivedAmount,
          change,
        });
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } else if (selectedPaymentMethod.includes('momo') || selectedPaymentMethod === 'airtel_money') {
        if (!momoPhone) {
          alert('Please enter a valid phone number');
          setIsProcessing(false);
          return;
        }
        
        // Process mobile money payment
        console.log('Processing mobile money payment:', {
          provider: selectedPaymentMethod,
          phone: momoPhone,
          amount: total,
        });
        
        // Simulate mobile money processing
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Simulate reference number
        setMomoReference(`MM${Date.now().toString().slice(-8)}`);
        
      } else {
        // Other payment methods
        console.log('Processing payment:', {
          method: selectedPaymentMethod,
          amount: total,
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Payment successful
      setPaymentCompleted(true);
      
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    console.log('Printing receipt...');
    // In real app, this would trigger receipt printing
  };

  const handleSendReceiptSMS = () => {
    console.log('Sending receipt via SMS...');
    // In real app, this would send SMS receipt
  };

  const handleNewSale = () => {
    router.push('/pos');
  };

  if (paymentCompleted) {
    return (
      <div className="min-h-screen bg-muted/30 p-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-green-600 mb-2">
                Payment Successful!
              </h2>
              
              <p className="text-muted-foreground mb-6">
                Transaction completed successfully
              </p>

              <div className="space-y-3 text-left bg-muted p-4 rounded-lg mb-6">
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-semibold">{formatCurrency(total)}</span>
                </div>
                
                {selectedPaymentMethod === 'cash' && (
                  <>
                    <div className="flex justify-between">
                      <span>Cash Received:</span>
                      <span>{formatCurrency(cashReceivedAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Change:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(change)}
                      </span>
                    </div>
                  </>
                )}
                
                {(selectedPaymentMethod.includes('momo') || selectedPaymentMethod === 'airtel_money') && (
                  <>
                    <div className="flex justify-between">
                      <span>Phone:</span>
                      <span>{momoPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reference:</span>
                      <span className="font-mono">{momoReference}</span>
                    </div>
                  </>
                )}
                
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{customer.name}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button className="w-full" onClick={handlePrintReceipt}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
                
                <Button variant="outline" className="w-full" onClick={handleSendReceiptSMS}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Receipt via SMS
                </Button>
                
                <Button variant="outline" className="w-full" onClick={handleNewSale}>
                  <Receipt className="h-4 w-4 mr-2" />
                  New Sale
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to POS
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Payment Processing</h1>
            <p className="text-muted-foreground">Complete the transaction</p>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-6xl mx-auto">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>
                  {totalItems} items for {customer.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.map((item, index) => (
                  <div key={index} className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.product.brand} • Qty: {item.quantity}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(item.unitPrice)} each
                      </p>
                    </div>
                    <p className="font-semibold">
                      {formatCurrency(item.totalPrice)}
                    </p>
                  </div>
                ))}

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT (18%):</span>
                    <span>{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-green-600">{formatCurrency(total)}</span>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Name:</span> {customer.name}</p>
                    <p><span className="text-muted-foreground">Phone:</span> {customer.phone}</p>
                    <p><span className="text-muted-foreground">Type:</span> {customer.type}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Select Payment Method</CardTitle>
                <CardDescription>
                  Choose how the customer wants to pay
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Payment Method Selection */}
                <div className="grid gap-3 md:grid-cols-2">
                  {paymentMethods.map((method) => {
                    const IconComponent = method.icon;
                    return (
                      <div
                        key={method.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedPaymentMethod === method.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-primary/50'
                        } ${!method.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => method.enabled && setSelectedPaymentMethod(method.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            selectedPaymentMethod === method.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{method.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {method.description}
                            </p>
                          </div>
                          {!method.enabled && (
                            <Badge variant="secondary">Coming Soon</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Payment Details */}
                {selectedPaymentMethod === 'cash' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Cash Payment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="cashReceived">Amount Received (RWF)</Label>
                          <Input
                            id="cashReceived"
                            type="number"
                            placeholder="Enter amount received"
                            value={cashReceived}
                            onChange={(e) => setCashReceived(e.target.value)}
                            min="0"
                            step="100"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Quick Amounts</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {[total, 60000, 70000, 100000].map((amount) => (
                              <Button
                                key={amount}
                                variant="outline"
                                size="sm"
                                onClick={() => setCashReceived(amount.toString())}
                              >
                                {formatCurrency(amount)}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {cashReceived && (
                        <div className="bg-muted p-4 rounded-lg">
                          <div className="grid gap-2 md:grid-cols-3">
                            <div>
                              <p className="text-sm text-muted-foreground">Total Due</p>
                              <p className="font-semibold">{formatCurrency(total)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Amount Received</p>
                              <p className="font-semibold">{formatCurrency(cashReceivedAmount)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Change</p>
                              <p className={`font-semibold text-lg ${
                                change >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatCurrency(change)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {(selectedPaymentMethod === 'mtn_momo' || selectedPaymentMethod === 'airtel_money') && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Smartphone className="h-5 w-5" />
                        {selectedPaymentMethod === 'mtn_momo' ? 'MTN Mobile Money' : 'Airtel Money'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="momoPhone">Customer Phone Number</Label>
                        <Input
                          id="momoPhone"
                          type="tel"
                          placeholder="+250788123456"
                          value={momoPhone}
                          onChange={(e) => setMomoPhone(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Customer will receive a payment prompt on their phone
                        </p>
                      </div>

                      <Alert>
                        <Phone className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Payment Amount: {formatCurrency(total)}</strong>
                          <br />
                          The customer will receive a payment request and needs to approve it on their mobile device.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                )}

                {/* Process Payment Button */}
                <div className="flex gap-4">
                  <Button
                    className="flex-1"
                    size="lg"
                    onClick={handlePayment}
                    disabled={
                      !selectedPaymentMethod || 
                      isProcessing ||
                      (selectedPaymentMethod === 'cash' && cashReceivedAmount < total) ||
                      ((selectedPaymentMethod === 'mtn_momo' || selectedPaymentMethod === 'airtel_money') && !momoPhone)
                    }
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Process Payment {formatCurrency(total)}
                      </>
                    )}
                  </Button>
                  
                  <Button variant="outline" size="lg" onClick={() => router.back()}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
