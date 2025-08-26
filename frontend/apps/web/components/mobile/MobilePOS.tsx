'use client';

import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus,
  X,
  CreditCard,
  Smartphone,
  DollarSign
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface MobilePOSProps {
  products: Product[];
  onSaleComplete: (items: CartItem[], total: number, paymentMethod: string) => void;
}

export function MobilePOS({ products, onSaleComplete }: MobilePOSProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory && product.stock > 0;
    });
  }, [products, searchTerm, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(products.map(p => p.category)));
    return ['all', ...uniqueCategories];
  }, [products]);

  // Calculate cart totals
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Add product to cart
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // Update cart item quantity
  const updateCartQuantity = (productId: string, change: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === productId) {
          const newQuantity = Math.max(0, Math.min(item.quantity + change, item.stock));
          return newQuantity === 0 ? null : { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  // Remove item from cart
  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setShowCart(false);
  };

  // Handle payment
  const handlePayment = (paymentMethod: string) => {
    onSaleComplete(cart, cartTotal, paymentMethod);
    clearCart();
    setShowPayment(false);
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header with search */}
      <div className="p-4 border-b bg-white sticky top-0 z-40">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-lg"
          />
        </div>
      </div>

      {/* Category filters */}
      <div className="p-4 border-b bg-white">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="whitespace-nowrap min-w-[80px] h-10"
            >
              {category === 'all' ? 'All' : category}
            </Button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map(product => (
            <Card 
              key={product.id}
              className="cursor-pointer hover:shadow-lg transition-shadow touch-manipulation"
              onClick={() => addToCart(product)}
            >
              <CardContent className="p-4">
                <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-gray-400 text-2xl font-bold">
                      {product.name.charAt(0)}
                    </div>
                  )}
                </div>
                
                <h3 className="font-semibold text-sm leading-tight mb-2 line-clamp-2">
                  {product.name}
                </h3>
                
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(product.price)}
                  </span>
                  <Badge variant={product.stock < 10 ? "destructive" : "secondary"}>
                    {product.stock}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No products found</div>
            <div className="text-gray-500 text-sm">
              Try adjusting your search or category filter
            </div>
          </div>
        )}
      </div>

      {/* Cart FAB */}
      {cartItemCount > 0 && (
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
          onClick={() => setShowCart(true)}
        >
          <div className="relative">
            <ShoppingCart className="h-6 w-6" />
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {cartItemCount}
            </Badge>
          </div>
        </Button>
      )}

      {/* Cart Slide-up Panel */}
      {showCart && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowCart(false)}
          />
          
          {/* Cart Panel */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl max-h-[80vh] flex flex-col">
            {/* Cart Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                Cart ({cartItemCount} items)
              </h2>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowCart(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-3 py-3 border-b last:border-b-0">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{item.name}</h3>
                    <p className="text-gray-500 text-sm">
                      {formatCurrency(item.price)} each
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => updateCartQuantity(item.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => updateCartQuantity(item.id, 1)}
                      disabled={item.quantity >= item.stock}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-500"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="text-right min-w-[80px]">
                    <div className="font-semibold">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Footer */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-xl font-bold text-blue-600">
                  {formatCurrency(cartTotal)}
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={clearCart}
                  className="flex-1"
                >
                  Clear Cart
                </Button>
                <Button 
                  onClick={() => {
                    setShowCart(false);
                    setShowPayment(true);
                  }}
                  className="flex-1"
                  disabled={cart.length === 0}
                >
                  Checkout
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowPayment(false)}
          />
          
          {/* Payment Panel */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Payment</h2>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowPayment(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="mb-6">
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-1">Total Amount</div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(cartTotal)}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full h-14 text-lg"
                onClick={() => handlePayment('cash')}
              >
                <DollarSign className="mr-2 h-5 w-5" />
                Cash Payment
              </Button>
              
              <Button
                variant="outline"
                className="w-full h-14 text-lg"
                onClick={() => handlePayment('momo')}
              >
                <Smartphone className="mr-2 h-5 w-5" />
                Mobile Money
              </Button>
              
              <Button
                variant="outline"
                className="w-full h-14 text-lg"
                onClick={() => handlePayment('card')}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Card Payment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
