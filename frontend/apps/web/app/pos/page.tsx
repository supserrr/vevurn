'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from "sonner"
import { Search, ShoppingCart, User, CreditCard, Receipt, Minus, Plus, X } from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  stockQuantity: number
  category?: { name: string }
  sku: string
}

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  total: number
}

interface Customer {
  id: string
  firstName: string
  lastName?: string
  email?: string
  phone?: string
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
  const [isProcessingSale, setIsProcessingSale] = useState(false)

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const tax = subtotal * 0.18 // 18% VAT
  const total = subtotal + tax

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts()
  }, [])

  // Filter products based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products)
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredProducts(filtered)
    }
  }, [searchTerm, products])

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products?status=ACTIVE&limit=100', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch products')
      const data = await response.json()
      setProducts(data.data || [])
      setFilteredProducts(data.data || [])
    } catch (error) {
      toast.error("Failed to load products")
    }
  }

  const searchCustomers = async (query: string) => {
    if (query.trim().length < 2) {
      setCustomers([])
      return
    }

    try {
      const response = await fetch(`http://localhost:5000/api/customers/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      })
      if (!response.ok) throw new Error('Failed to search customers')
      const data = await response.json()
      setCustomers(data.data || [])
    } catch (error) {
      toast.error("Failed to search customers")
    }
  }

  const addToCart = (product: Product) => {
    if (product.stockQuantity <= 0) {
      toast.error(`${product.name} is currently out of stock`)
      return
    }

    const existingItem = cart.find(item => item.id === product.id)
    
    if (existingItem) {
      if (existingItem.quantity >= product.stockQuantity) {
        toast.error(`Only ${product.stockQuantity} units available`)
        return
      }
      
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ))
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        total: product.price
      }])
    }
  }

  const updateCartItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId)
      return
    }

    const product = products.find(p => p.id === itemId)
    if (product && newQuantity > product.stockQuantity) {
      toast.error(`Only ${product.stockQuantity} units available`)
      return
    }

    setCart(cart.map(item =>
      item.id === itemId
        ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
        : item
    ))
  }

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId))
  }

  const clearCart = () => {
    setCart([])
    setSelectedCustomer(null)
  }

  const processSale = async () => {
    if (cart.length === 0) {
      toast.error("Please add items to cart before processing sale")
      return
    }

    setIsProcessingSale(true)

    try {
      const saleData = {
        customerId: selectedCustomer?.id || undefined,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
          productName: item.name,
          productSku: item.name // Using name as SKU for now
        })),
        subtotal: subtotal,
        taxAmount: tax,
        totalAmount: total,
        notes: 'POS Sale'
      }

      const response = await fetch('http://localhost:5000/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify(saleData),
      })

      if (!response.ok) throw new Error('Failed to process sale')

      const result = await response.json()

      toast.success(`Sale ${result.data.saleNumber} completed successfully`)

      // Clear cart and refresh products
      clearCart()
      fetchProducts()
      
    } catch (error) {
      toast.error("Failed to process sale")
    } finally {
      setIsProcessingSale(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Point of Sale</h1>
          <p className="text-gray-600">Process sales and manage transactions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Products
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search products by name, SKU, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredProducts.map((product) => (
                      <Card
                        key={product.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => addToCart(product)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                            <Badge variant={product.stockQuantity > 0 ? "default" : "destructive"}>
                              {product.stockQuantity}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">{product.sku}</p>
                          {product.category && (
                            <Badge variant="secondary" className="text-xs mb-2">
                              {product.category.name}
                            </Badge>
                          )}
                          <p className="font-bold text-lg text-green-600">
                            {new Intl.NumberFormat('en-RW', {
                              style: 'currency',
                              currency: 'RWF'
                            }).format(product.price)}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {filteredProducts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No products found
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Cart Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Cart ({cart.length} items)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Customer Selection */}
                <div>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    {selectedCustomer 
                      ? `${selectedCustomer.firstName} ${selectedCustomer.lastName || ''}`.trim()
                      : 'Select Customer (Optional)'
                    }
                  </Button>
                  
                  {showCustomerSearch && (
                    <div className="mt-2 space-y-2">
                      <Input
                        placeholder="Search customers..."
                        value={customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value)
                          searchCustomers(e.target.value)
                        }}
                      />
                      {customers.length > 0 && (
                        <ScrollArea className="h-32 border rounded">
                          {customers.map((customer) => (
                            <div
                              key={customer.id}
                              className="p-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => {
                                setSelectedCustomer(customer)
                                setShowCustomerSearch(false)
                                setCustomerSearch('')
                              }}
                            >
                              <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                              <p className="text-sm text-gray-500">{customer.phone || customer.email}</p>
                            </div>
                          ))}
                        </ScrollArea>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Cart Items */}
                <ScrollArea className="h-64">
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Cart is empty
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.name}</p>
                            <p className="text-xs text-gray-500">
                              {new Intl.NumberFormat('en-RW', {
                                style: 'currency',
                                currency: 'RWF'
                              }).format(item.price)} each
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <Separator />

                {/* Order Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{new Intl.NumberFormat('en-RW', {
                      style: 'currency',
                      currency: 'RWF'
                    }).format(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax (18%):</span>
                    <span>{new Intl.NumberFormat('en-RW', {
                      style: 'currency',
                      currency: 'RWF'
                    }).format(tax)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>{new Intl.NumberFormat('en-RW', {
                      style: 'currency',
                      currency: 'RWF'
                    }).format(total)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={processSale}
                    disabled={cart.length === 0 || isProcessingSale}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {isProcessingSale ? 'Processing...' : 'Process Sale'}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={clearCart}
                    disabled={cart.length === 0}
                  >
                    Clear Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
