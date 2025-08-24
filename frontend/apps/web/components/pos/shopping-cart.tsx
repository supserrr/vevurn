'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/lib/store/cart';
import { Trash2, Plus, Minus, Package, ShoppingCart as CartIcon } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface ShoppingCartProps {
  onCheckout: () => void;
}

export function ShoppingCart({ onCheckout }: ShoppingCartProps) {
  const { 
    items, 
    updateQuantity, 
    removeItem, 
    getTotal, 
    getSubtotal,
    getTaxAmount,
    getItemCount, 
    clearCart 
  } = useCart();

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = (productId: string, productName: string) => {
    removeItem(productId);
    toast.success(`Removed ${productName} from cart`);
  };

  const handleClearCart = () => {
    clearCart();
    toast.success('Cart cleared');
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4 flex-shrink-0">
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CartIcon className="h-5 w-5" />
            <span>Cart ({getItemCount()})</span>
          </div>
          {items.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearCart}
              className="text-red-600 hover:text-red-700"
            >
              Clear All
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center text-gray-500 py-8">
            <div>
              <Package className="mx-auto h-12 w-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">Cart is empty</p>
              <p className="text-sm">Add products to get started</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto mb-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50">
                  {item.product.images && item.product.images.length > 0 && item.product.images[0] ? (
                    <div className="relative w-12 h-12 bg-white rounded overflow-hidden flex-shrink-0">
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{item.product.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-green-600 font-medium">
                        {item.unitPrice.toLocaleString()} RWF
                      </span>
                      {item.discount && item.discount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          -{item.discount}%
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Stock: {item.product.currentStock}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const newQty = parseInt(e.target.value) || 1;
                        if (newQty <= item.product.currentStock) {
                          handleQuantityChange(item.product.id, newQty);
                        } else {
                          toast.error(`Only ${item.product.currentStock} items available`);
                        }
                      }}
                      className="w-16 text-center text-sm h-8"
                      min="1"
                      max={item.product.currentStock}
                    />
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.currentStock}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveItem(item.product.id, item.product.name)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4 space-y-3 flex-shrink-0">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{getSubtotal().toLocaleString()} RWF</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (18%):</span>
                  <span>{getTaxAmount().toLocaleString()} RWF</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-green-600">{getTotal().toLocaleString()} RWF</span>
                </div>
              </div>
              
              <Button 
                onClick={onCheckout}
                className="w-full"
                size="lg"
                disabled={items.length === 0}
              >
                Proceed to Checkout
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
