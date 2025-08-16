'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  User,
  Calculator,
  Scan,
  Grid3x3,
  List,
  Filter,
  X,
  Package,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import CustomerSelector from '@/components/pos/CustomerSelector';
import { Product, CartItem, Customer } from '@/types/pos';

// Mock data
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'iPhone 14 Pro Case - Silicone',
    brand: 'Apple',
    category: 'Phone Cases',
    retailPrice: 18000,
    wholesalePrice: 12000,
    stockQuantity: 25,
    sku: 'IPH14P-CASE-SIL-001',
    barcode: '1234567890123',
  },
  {
    id: '2',
    name: 'Samsung Galaxy S23 Screen Protector',
    brand: 'Samsung',
    category: 'Screen Protectors',
    retailPrice: 8000,
    wholesalePrice: 5000,
    stockQuantity: 50,
    sku: 'SAM-S23-SCREEN-001',
  },
  {
    id: '3',
    name: 'USB-C Fast Charger 25W',
    brand: 'Anker',
    category: 'Chargers',
    retailPrice: 15000,
    wholesalePrice: 10000,
    stockQuantity: 30,
    sku: 'ANK-USBC-25W-001',
  },
  {
    id: '4',
    name: 'Wireless Earbuds Pro',
    brand: 'Sony',
    category: 'Headphones',
    retailPrice: 45000,
    wholesalePrice: 32000,
    stockQuantity: 12,
    sku: 'SNY-EARBUDS-PRO-001',
  },
  {
    id: '5',
    name: 'Power Bank 10000mAh',
    brand: 'Xiaomi',
    category: 'Power Banks',
    retailPrice: 25000,
    wholesalePrice: 18000,
    stockQuantity: 8,
    sku: 'XIA-PB-10K-001',
  },
];

const mockCustomer: Customer = {
  id: '1',
  name: 'John Doe',
  phone: '+250788123456',
  email: 'john@example.com',
  type: 'RETAIL',
  totalPurchases: 450000,
  lastPurchase: '2024-01-15',
};

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);

  const router = useRouter();

  // Get unique categories
  const categories = Array.from(new Set(products.map(p => p.category)));

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.includes(searchTerm)
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    return filtered.filter(product => product.stockQuantity > 0);
  }, [products, searchTerm, selectedCategory]);

  // Add product to cart
  const addToCart = (product: Product, quantity: number = 1) => {
    const priceType = customer?.type === 'WHOLESALE' ? 'wholesale' : 'retail';
    const unitPrice = priceType === 'wholesale' ? product.wholesalePrice : product.retailPrice;

    setCart(prevCart => {
      const existingItem = prevCart.find(item => 
        item.product.id === product.id && item.priceType === priceType
      );

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stockQuantity) {
          alert(`Only ${product.stockQuantity} units available in stock`);
          return prevCart;
        }

        return prevCart.map(item =>
          item.product.id === product.id && item.priceType === priceType
            ? {
                ...item,
                quantity: newQuantity,
                totalPrice: newQuantity * unitPrice,
              }
            : item
        );
      } else {
        if (quantity > product.stockQuantity) {
          alert(`Only ${product.stockQuantity} units available in stock`);
          return prevCart;
        }

        return [...prevCart, {
          product,
          quantity,
          unitPrice,
          totalPrice: quantity * unitPrice,
          priceType,
        }];
      }
    });
  };

  // Update cart item quantity
  const updateCartQuantity = (productId: string, newQuantity: number, priceType: 'retail' | 'wholesale') => {
    if (newQuantity <= 0) {
      removeFromCart(productId, priceType);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (newQuantity > product.stockQuantity) {
      alert(`Only ${product.stockQuantity} units available in stock`);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId && item.priceType === priceType
          ? {
              ...item,
              quantity: newQuantity,
              totalPrice: newQuantity * item.unitPrice,
            }
          : item
      )
    );
  };

  // Remove from cart
  const removeFromCart = (productId: string, priceType: 'retail' | 'wholesale') => {
    setCart(prevCart => 
      prevCart.filter(item => 
        !(item.product.id === productId && item.priceType === priceType)
      )
    );
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
  };

  // Add product by barcode
  const addByBarcode = () => {
    const product = products.find(p => p.barcode === barcodeInput);
    if (product) {
      addToCart(product);
      setBarcodeInput('');
    } else {
      alert('Product not found with this barcode');
    }
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxRate = 0.18; // 18% VAT for Rwanda
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Point of Sale</h1>
            <p className="text-muted-foreground">Process customer transactions</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Customer Selection */}
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm">
                {customer ? `${customer.name} (${customer.type})` : 'Walk-in Customer'}
              </span>
              <Button variant="outline" size="sm" onClick={() => setShowCustomerSelector(true)}>
                Change
              </Button>
            </div>

            {/* Calculator */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCalculator(!showCalculator)}
            >
              <Calculator className="h-4 w-4" />
            </Button>

            {/* View Mode Toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Product Selection Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search and Filters */}
          <div className="border-b bg-muted/30 p-4">
            <div className="flex gap-4 items-center">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search products by name, brand, SKU, or barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              {/* Barcode Scanner */}
              <div className="flex gap-2">
                <Input
                  placeholder="Scan/Enter barcode"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addByBarcode()}
                  className="w-48"
                />
                <Button onClick={addByBarcode} disabled={!barcodeInput}>
                  <Scan className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Product Grid/List */}
          <div className="flex-1 overflow-auto p-4">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredProducts.map((product) => (
                  <Card 
                    key={product.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => addToCart(product)}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                        {product.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        {product.brand} • {product.category}
                      </p>
                      <div className="space-y-1">
                        <p className="font-bold text-green-600">
                          {formatCurrency(customer?.type === 'WHOLESALE' ? product.wholesalePrice : product.retailPrice)}
                        </p>
                        <div className="flex items-center justify-between text-xs">
                          <Badge variant={product.stockQuantity < 10 ? 'secondary' : 'default'}>
                            {product.stockQuantity} left
                          </Badge>
                          <span className="text-muted-foreground">
                            {product.sku}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProducts.map((product) => (
                  <Card 
                    key={product.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => addToCart(product)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {product.brand} • {product.category} • {product.sku}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-green-600">
                            {formatCurrency(customer?.type === 'WHOLESALE' ? product.wholesalePrice : product.retailPrice)}
                          </p>
                          <Badge variant={product.stockQuantity < 10 ? 'secondary' : 'default'}>
                            {product.stockQuantity} in stock
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No products found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Shopping Cart Sidebar */}
        <div className="w-96 border-l bg-background flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Cart ({totalItems})
              </h2>
              {cart.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearCart}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Cart is empty</p>
                <p className="text-sm text-muted-foreground">
                  Click on products to add them
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item, index) => (
                  <Card key={`${item.product.id}-${item.priceType}`}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">
                            {item.product.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {item.product.brand} • {item.priceType}
                          </p>
                          <p className="text-sm font-semibold text-green-600">
                            {formatCurrency(item.unitPrice)} each
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.product.id, item.priceType)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1, item.priceType)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1, item.priceType)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatCurrency(item.totalPrice)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Cart Summary */}
          {cart.length > 0 && (
            <div className="border-t p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>VAT (18%):</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-green-600">{formatCurrency(total)}</span>
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={() => router.push('/pos/payment')}>
                <CreditCard className="h-4 w-4 mr-2" />
                Proceed to Payment ({totalItems} items)
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Customer Selector Modal */}
      {showCustomerSelector && (
        <CustomerSelector
          selectedCustomer={customer}
          onCustomerSelect={setCustomer}
          onClose={() => setShowCustomerSelector(false)}
        />
      )}
    </div>
  );
}
