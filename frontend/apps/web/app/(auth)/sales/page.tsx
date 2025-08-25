'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  ShoppingCart, 
  User,
  CreditCard,
  Plus,
  Minus,
  X,
  Package
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import PaymentModal from '@/components/sales/PaymentModal';
import CustomerSelector from '@/components/sales/CustomerSelector';

interface ProductVariation {
  id: string;
  name: string;
  value: string;
  stock: number;
  price?: number;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  retailPrice: number;
  wholesalePrice: number;
  currentStock: number;
  minStockLevel: number;
  barcode?: string;
  variations?: ProductVariation[];
}

interface CartItem {
  productId: string;
  product: Product;
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
  type: 'REGULAR' | 'WHOLESALE' | 'WALK_IN';
  createdAt: string;
}

async function fetchProducts() {
  const response = await fetch('/api/products?includeVariations=true', {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  return response.json();
}

export default function SalesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const {
    data: productsData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const products: Product[] = productsData?.products || [];
  const categories = Array.from(new Set(products.map((p: Product) => p.category))).filter(Boolean);

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    return products.filter((product: Product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.barcode?.includes(searchTerm);
      
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getProductPrice = (product: Product, variationId?: string) => {
    const isWholesale = selectedCustomer?.type === 'WHOLESALE';
    
    if (variationId && product.variations) {
      const variation = product.variations.find(v => v.id === variationId);
      if (variation?.price) {
        return variation.price;
      }
    }
    
    return isWholesale ? product.wholesalePrice : product.retailPrice;
  };

  const addToCart = (product: Product, variationId?: string) => {
    const variation = variationId && product.variations
      ? product.variations.find(v => v.id === variationId)
      : undefined;
    
    const availableStock = variation?.stock ?? product.currentStock;
    
    if (availableStock <= 0) {
      toast.error('Product is out of stock');
      return;
    }

    const existingItemIndex = cart.findIndex(item => 
      item.productId === product.id && item.variationId === variationId
    );

    if (existingItemIndex >= 0) {
      const existingItem = cart[existingItemIndex];
      if (existingItem && existingItem.quantity >= availableStock) {
        toast.error('Not enough stock available');
        return;
      }
      
      const newCart = [...cart];
      if (newCart[existingItemIndex]) {
        newCart[existingItemIndex]!.quantity += 1;
      }
      setCart(newCart);
    } else {
      const newItem: CartItem = {
        productId: product.id,
        product,
        quantity: 1,
        unitPrice: getProductPrice(product, variationId),
        variationId,
        variation: variation ? {
          id: variation.id,
          name: variation.name,
          value: variation.value,
        } : undefined,
      };
      setCart([...cart, newItem]);
    }

    toast.success('Added to cart');
  };

  const updateCartItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(index);
      return;
    }

    const item = cart[index];
    if (!item) return;
    
    const availableStock = item.variation ? 
      (item.product.variations?.find(v => v.id === item.variationId)?.stock ?? 0) : 
      item.product.currentStock;
    
    if (newQuantity > availableStock) {
      toast.error('Not enough stock available');
      return;
    }

    const newCart = [...cart];
    if (newCart[index]) {
      newCart[index]!.quantity = newQuantity;
    }
    setCart(newCart);
  };

  const removeFromCart = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    toast.success('Removed from cart');
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    toast.success('Cart cleared');
  };

  const cartTotal = cart.reduce((total, item) => 
    total + (item.quantity * item.unitPrice), 0
  );

  const cartItemsCount = cart.reduce((count, item) => count + item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    clearCart();
    toast.success('Sale completed successfully!');
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Point of Sale</h1>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setShowCustomerSelector(true)}
              className="flex items-center"
            >
              <User className="w-4 h-4 mr-2" />
              {selectedCustomer ? selectedCustomer.name : 'Select Customer'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
          {/* Products Section */}
          <div className="lg:col-span-3 flex flex-col">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search products or scan barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Products Grid */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="text-gray-500">Loading products...</div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-40">
                  <div className="text-red-500">Failed to load products</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProducts.map((product: Product) => (
                    <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-medium text-sm mb-1">{product.name}</h3>
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                              {product.description}
                            </p>
                          </div>
                          <Badge variant={product.currentStock > product.minStockLevel ? 'default' : 'destructive'}>
                            {product.currentStock}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm">
                            <div className="font-semibold">
                              {formatCurrency(getProductPrice(product))}
                            </div>
                            {selectedCustomer?.type === 'WHOLESALE' && (
                              <div className="text-xs text-gray-500">
                                Retail: {formatCurrency(product.retailPrice)}
                              </div>
                            )}
                          </div>

                          {/* Product Variations */}
                          {product.variations && product.variations.length > 0 ? (
                            <div className="space-y-1">
                              <div className="text-xs text-gray-600">Variations:</div>
                              {product.variations.map(variation => (
                                <Button
                                  key={variation.id}
                                  size="sm"
                                  variant="outline"
                                  className="w-full text-xs justify-between"
                                  onClick={() => addToCart(product, variation.id)}
                                  disabled={variation.stock <= 0}
                                >
                                  <span>{variation.value}</span>
                                  <span>({variation.stock})</span>
                                </Button>
                              ))}
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => addToCart(product)}
                              disabled={product.currentStock <= 0}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add to Cart
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Cart ({cartItemsCount})
                  </span>
                  {cart.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearCart}>
                      Clear
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0">
                {/* Customer Info */}
                {selectedCustomer && (
                  <div className="px-4 py-2 bg-blue-50 border-b">
                    <div className="text-sm">
                      <div className="font-medium">{selectedCustomer.name}</div>
                      <div className="text-blue-600 text-xs">
                        {selectedCustomer.type === 'WHOLESALE' ? 'Wholesale Customer' : 'Regular Customer'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto px-4 py-2">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                      <Package className="w-8 h-8 mb-2" />
                      <p className="text-sm">Cart is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((item, index) => (
                        <div key={`${item.productId}-${item.variationId}`} className="border-b pb-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium truncate">{item.product.name}</h4>
                              {item.variation && (
                                <p className="text-xs text-gray-500">
                                  {item.variation.name}: {item.variation.value}
                                </p>
                              )}
                              <p className="text-xs text-gray-600">
                                {formatCurrency(item.unitPrice)} each
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(index)}
                              className="p-1 h-6 w-6"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => updateCartItemQuantity(index, item.quantity - 1)}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="text-sm font-medium w-8 text-center">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => updateCartItemQuantity(index, item.quantity + 1)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="text-sm font-semibold">
                              {formatCurrency(item.quantity * item.unitPrice)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cart Total and Checkout */}
                {cart.length > 0 && (
                  <div className="border-t p-4 space-y-3">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span>{formatCurrency(cartTotal)}</span>
                    </div>
                    
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={handleCheckout}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Checkout
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CustomerSelector
        isOpen={showCustomerSelector}
        onClose={() => setShowCustomerSelector(false)}
        onSelect={setSelectedCustomer}
        selectedCustomer={selectedCustomer}
      />

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        cartItems={cart}
        customer={selectedCustomer}
        total={cartTotal}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
