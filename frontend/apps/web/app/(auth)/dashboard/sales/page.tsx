'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, Calculator, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Product, SaleItem, Customer } from '@/lib/types';
import toast from 'react-hot-toast';

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'MOBILE_MONEY'>('CASH');
  const [amountPaid, setAmountPaid] = useState<string>('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    // Mock products data
    setProducts([
      {
        id: '1',
        name: 'Samsung Galaxy S24',
        description: 'Latest Samsung smartphone',
        sku: 'SGS24-128-BLK',
        categoryId: '1',
        basePrice: 899.99,
        stockQuantity: 25,
        minStockLevel: 5,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'iPhone 15 Case',
        description: 'Protective case for iPhone 15',
        sku: 'IP15-CASE-CLR',
        categoryId: '2',
        basePrice: 29.99,
        stockQuantity: 150,
        minStockLevel: 20,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        name: 'Wireless Charger',
        description: 'Fast wireless charging pad',
        sku: 'WC-FAST-15W',
        categoryId: '2',
        basePrice: 49.99,
        stockQuantity: 75,
        minStockLevel: 10,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stockQuantity) {
        toast.error('Not enough stock available');
        return;
      }
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
          : item
      ));
    } else {
      const newItem: SaleItem = {
        id: `${Date.now()}`,
        saleId: '',
        productId: product.id,
        product,
        quantity: 1,
        unitPrice: product.basePrice,
        totalPrice: product.basePrice,
      };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart(cart.map(item =>
      item.id === itemId
        ? { ...item, quantity: newQuantity, totalPrice: newQuantity * item.unitPrice }
        : item
    ));
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.18; // 18% VAT for Rwanda
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const processPayment = async () => {
    const { total } = calculateTotals();
    const paidAmount = parseFloat(amountPaid) || 0;

    if (paymentMethod === 'CASH' && paidAmount < total) {
      toast.error('Insufficient payment amount');
      return;
    }

    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    try {
      // Here you would process the payment and create the sale
      toast.success('Sale completed successfully!');
      
      // Reset the cart and form
      setCart([]);
      setAmountPaid('');
      setSelectedCustomer(null);
    } catch (error) {
      toast.error('Failed to process sale');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { subtotal, tax, total } = calculateTotals();
  const change = paymentMethod === 'CASH' ? Math.max(0, parseFloat(amountPaid) - total) : 0;

  return (
    <div className="h-screen flex">
      {/* Products Section */}
      <div className="flex-1 p-6 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Point of Sale
            </h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <Card 
                  key={product.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-4">
                    <div className="mb-2">
                      <h3 className="font-medium text-sm">{product.name}</h3>
                      <p className="text-xs text-gray-500">{product.sku}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-primary">
                        RWF {product.basePrice.toFixed(0)}
                      </span>
                      <Badge variant={product.stockQuantity > 0 ? 'default' : 'destructive'}>
                        {product.stockQuantity > 0 ? `${product.stockQuantity} left` : 'Out of stock'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 border-l bg-white dark:bg-gray-800 p-6 flex flex-col">
        <div className="flex-1">
          <h2 className="text-lg font-bold mb-4">Cart ({cart.length} items)</h2>
          
          {/* Customer Selection */}
          <Card className="mb-4">
            <CardContent className="p-3">
              <div className="text-sm font-medium mb-2">Customer</div>
              {selectedCustomer ? (
                <div className="flex justify-between items-center">
                  <span>{selectedCustomer.firstName} {selectedCustomer.lastName}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedCustomer(null)}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="w-full">
                  Select Customer (Optional)
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Cart Items */}
          <div className="flex-1 overflow-auto mb-4">
            {cart.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Cart is empty
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.product?.name}</h4>
                          <p className="text-xs text-gray-500">RWF {item.unitPrice.toFixed(0)} each</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="font-bold">
                          RWF {item.totalPrice.toFixed(0)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Totals and Payment */}
        <div className="border-t pt-4">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>RWF {subtotal.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (18%):</span>
              <span>RWF {tax.toFixed(0)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>RWF {total.toFixed(0)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-4">
            <div className="text-sm font-medium mb-2">Payment Method</div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPaymentMethod('CASH')}
              >
                <Banknote className="h-4 w-4 mr-1" />
                Cash
              </Button>
              <Button
                variant={paymentMethod === 'CARD' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPaymentMethod('CARD')}
              >
                <CreditCard className="h-4 w-4 mr-1" />
                Card
              </Button>
              <Button
                variant={paymentMethod === 'MOBILE_MONEY' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPaymentMethod('MOBILE_MONEY')}
              >
                <Smartphone className="h-4 w-4 mr-1" />
                Mobile
              </Button>
            </div>
          </div>

          {/* Amount Paid (Cash only) */}
          {paymentMethod === 'CASH' && (
            <div className="mb-4">
              <div className="text-sm font-medium mb-2">Amount Paid</div>
              <Input
                type="number"
                placeholder="Enter amount..."
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
              />
              {change > 0 && (
                <div className="text-sm text-green-600 mt-1">
                  Change: RWF {change.toFixed(0)}
                </div>
              )}
            </div>
          )}

          <Button 
            className="w-full" 
            size="lg"
            onClick={processPayment}
            disabled={cart.length === 0}
          >
            <Calculator className="h-4 w-4 mr-2" />
            Complete Sale
          </Button>
        </div>
      </div>
    </div>
  );
}
