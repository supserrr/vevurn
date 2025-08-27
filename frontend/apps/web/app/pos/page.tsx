'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  ShoppingCart, 
  Minus, 
  Plus, 
  Trash2, 
  CreditCard,
  Package,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { toast } from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  retailPrice: number;
  stockQuantity: number;
  category: { name: string };
  images: { url: string }[];
  minStockLevel: number;
}

interface CartItem extends Product {
  quantity: number;
  total: number;
}

export default function POSPage() {
  const { user, loading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [processingSale, setProcessingSale] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user && user.role !== 'CASHIER') {
      router.push('/dashboard');
      return;
    }

    loadProducts();
    loadCategories();
  }, [user, loading, router]);

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const addToCart = (product: Product) => {
    if (product.stockQuantity <= 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }

    setCart(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      
      if (existingItem) {
        if (existingItem.quantity >= product.stockQuantity) {
          toast.error(`Only ${product.stockQuantity} units available`);
          return prev;
        }
        
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.retailPrice }
            : item
        );
      }
      
      return [...prev, {
        ...product,
        quantity: 1,
        total: product.retailPrice
      }];
    });
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prev =>
      prev.map(item => {
        if (item.id === productId) {
          const maxQty = Math.min(newQuantity, item.stockQuantity);
          return {
            ...item,
            quantity: maxQty,
            total: maxQty * item.retailPrice
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const processSale = async () => {
    if (cart.length === 0) return;

    setProcessingSale(true);
    try {
      const saleData = {
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.retailPrice
        })),
        paymentMethod: 'CASH'
      };

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(saleData)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Sale completed successfully!`);
        
        // Clear cart and reload products
        setCart([]);
        loadProducts();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Sale failed');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setProcessingSale(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user || user.role !== 'CASHIER') {
    return null;
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">Vevurn POS</h1>
            <Badge variant="secondary">{user.name} - Cashier</Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <NotificationCenter userId={user.id} />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/dashboard')}
            >
              Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex pt-20">
        {/* Products Section */}
        <div className="flex-1 p-6">
          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>

            {/* Category Filter */}
            <div className="flex space-x-2 overflow-x-auto">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                All Categories
              </Button>
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.name ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.name)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <Card
                key={product.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  product.stockQuantity <= 0 ? 'opacity-50' : ''
                }`}
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-4">
                  {product.images?.length > 0 && (
                    <img
                      src={product.images[0].url}
                      alt={product.name}
                      className="w-full h-32 object-cover rounded-md mb-3"
                    />
                  )}
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1 truncate">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{product.category.name}</p>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-green-600">
                        {product.retailPrice.toLocaleString('en-RW', {
                          style: 'currency',
                          currency: 'RWF'
                        })}
                      </span>
                      
                      {product.stockQuantity <= product.minStockLevel && product.stockQuantity > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Low
                        </Badge>
                      )}
                      
                      {product.stockQuantity <= 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Out of Stock
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      Stock: {product.stockQuantity} units
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart Section */}
        <div className="w-96 bg-white border-l border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <ShoppingCart className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold">Cart ({cart.length})</h2>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto mb-6">
            {cart.length === 0 ? (
              <div className="text-center text-gray-500 mt-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p>Cart is empty</p>
                <p className="text-sm">Add products to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                        <p className="text-sm text-gray-600">{item.category.name}</p>
                        <p className="text-sm font-medium text-green-600">
                          {item.retailPrice.toLocaleString('en-RW', {
                            style: 'currency',
                            currency: 'RWF'
                          })} each
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stockQuantity}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {item.total.toLocaleString('en-RW', {
                            style: 'currency',
                            currency: 'RWF'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Summary & Checkout */}
          {cart.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{calculateSubtotal().toLocaleString('en-RW', {
                    style: 'currency',
                    currency: 'RWF'
                  })}</span>
                </div>
              </div>

              <Button
                onClick={processSale}
                disabled={processingSale}
                className="w-full h-12 text-lg"
              >
                {processingSale ? (
                  'Processing...'
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Complete Sale
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
