'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  ShoppingCart, 
  Plus,
  Minus,
  X,
  Package,
  User,
  CreditCard
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  costPrice: string;
  wholesalePrice: string;
  retailPrice: string;
  stockQuantity: number;
  minStockLevel: number;
  brand: string;
  status: string;
  category: {
    id: string;
    name: string;
  };
  variations?: Array<{
    id: string;
    name: string;
    sku: string;
    attributes: Record<string, any>;
    stockQuantity: number;
    isActive: boolean;
  }>;
}

interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  type: 'REGULAR' | 'WHOLESALE' | 'WALK_IN';
}

async function fetchProducts() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const response = await fetch(`${baseUrl}/api/products`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  const data = await response.json();
  return data.data || [];
}

export default function SalesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>({
    id: 'walk-in',
    name: 'Walk-in Customer',
    type: 'REGULAR'
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  const filteredProducts = products.filter((product: Product) => {
    return product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
           product.barcode?.includes(searchTerm);
  });

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(numAmount);
  };

  const getProductPrice = (product: Product) => {
    const isWholesale = selectedCustomer?.type === 'WHOLESALE';
    return parseFloat(isWholesale ? product.wholesalePrice : product.retailPrice);
  };

  const addToCart = (product: Product) => {
    if (product.stockQuantity <= 0) {
      toast.error('Product is out of stock');
      return;
    }

    const existingItemIndex = cart.findIndex(item => item.productId === product.id);
    const unitPrice = getProductPrice(product);

    if (existingItemIndex >= 0) {
      const existingItem = cart[existingItemIndex];
      if (existingItem && existingItem.quantity >= product.stockQuantity) {
        toast.error('Not enough stock available');
        return;
      }

      const updatedCart = [...cart];
      if (existingItem) {
        updatedCart[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + 1,
          total: (existingItem.quantity + 1) * unitPrice
        };
        setCart(updatedCart);
      }
    } else {
      const newItem: CartItem = {
        productId: product.id,
        product,
        quantity: 1,
        unitPrice,
        total: unitPrice
      };
      setCart([...cart, newItem]);
    }

    toast.success(`${product.name} added to cart`);
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const updatedCart = cart.map(item => {
      if (item.productId === productId) {
        const maxQuantity = item.product.stockQuantity;
        const quantity = Math.min(newQuantity, maxQuantity);
        return {
          ...item,
          quantity,
          total: quantity * item.unitPrice
        };
      }
      return item;
    });
    setCart(updatedCart);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const getCartTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const vatRate = 0.18; // 18% VAT for Rwanda
    const vat = subtotal * vatRate;
    const total = subtotal + vat;

    return { subtotal, vat, total };
  };

  const { subtotal, vat, total } = getCartTotals();

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setShowPaymentModal(true);
  };

  const clearCart = () => {
    setCart([]);
    toast.success('Cart cleared');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Product Selection - Left Side */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Point of Sale</h1>
          <p className="text-gray-600">Select products to add to cart</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search products by name, SKU, or barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product: Product) => (
            <Card key={product.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                  <Badge 
                    variant={product.stockQuantity > product.minStockLevel ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {product.stockQuantity}
                  </Badge>
                </div>
                
                <p className="text-xs text-gray-600 mb-2">{product.category.name}</p>
                <p className="text-xs text-gray-500 mb-3">SKU: {product.sku}</p>
                
                <div className="space-y-1 text-sm mb-4">
                  <div className="flex justify-between">
                    <span>Price:</span>
                    <span className="font-semibold">{formatCurrency(product.retailPrice)}</span>
                  </div>
                  {selectedCustomer?.type === 'WHOLESALE' && (
                    <div className="flex justify-between text-blue-600">
                      <span>Wholesale:</span>
                      <span className="font-semibold">{formatCurrency(product.wholesalePrice)}</span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => addToCart(product)}
                  disabled={product.stockQuantity <= 0}
                  className="w-full"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No products found</p>
          </div>
        )}
      </div>

      {/* Cart - Right Side */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Cart</h2>
            <Badge variant="secondary">{cart.length} items</Badge>
          </div>

          {/* Customer Selection */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Customer</label>
            <div className="flex items-center p-2 bg-gray-50 rounded-md">
              <User className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-sm">{selectedCustomer?.name}</span>
            </div>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-6">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.productId} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm">{item.product.name}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.productId)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-2">
                    {formatCurrency(item.unitPrice)} each
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="h-8 w-8 p-0"
                        disabled={item.quantity >= item.product.stockQuantity}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <span className="font-semibold text-sm">{formatCurrency(item.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Totals & Checkout */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-gray-200">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>VAT (18%):</span>
                <span>{formatCurrency(vat)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={handleCheckout}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Checkout
              </Button>
              <Button
                onClick={clearCart}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Clear Cart
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal Placeholder */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Payment</h3>
            <p className="text-gray-600 mb-4">Total: {formatCurrency(total)}</p>
            <div className="flex space-x-2">
              <Button
                onClick={() => {
                  toast.success('Sale completed!');
                  setCart([]);
                  setShowPaymentModal(false);
                }}
                className="flex-1"
              >
                Cash Payment
              </Button>
              <Button
                onClick={() => setShowPaymentModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
