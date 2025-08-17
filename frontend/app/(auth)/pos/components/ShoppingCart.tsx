'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { usePOSStore } from '@/lib/store';

interface ShoppingCartProps {
  className?: string;
}

export default function ShoppingCartComponent({ className }: ShoppingCartProps) {
  const {
    cart,
    subtotal,
    taxAmount,
    totalAmount,
    updateCartItemQuantity,
    updateCartItemPrice,
    removeFromCart,
    clearCart
  } = usePOSStore();

  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    updateCartItemQuantity(productId, newQuantity);
  };

  const startPriceEdit = (productId: string, currentPrice: number) => {
    setEditingPrice(productId);
    setTempPrice(currentPrice.toString());
  };

  const savePriceEdit = (productId: string) => {
    const newPrice = parseFloat(tempPrice);
    if (!isNaN(newPrice) && newPrice > 0) {
      updateCartItemPrice(productId, newPrice);
    }
    setEditingPrice(null);
    setTempPrice('');
  };

  const cancelPriceEdit = () => {
    setEditingPrice(null);
    setTempPrice('');
  };

  const CartItem = ({ item }: { item: any }) => {
    const isEditingThisPrice = editingPrice === item.productId;
    
    return (
      <div className="flex items-center gap-3 py-3 border-b border-border/40 last:border-b-0">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{item.name}</h4>
          <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
          {item.discount > 0 && (
            <Badge variant="secondary" className="text-xs mt-1">
              Discounted: {formatCurrency(item.discount)} off
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Quantity Controls */}
          <div className="flex items-center border rounded">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="px-2 text-sm font-medium min-w-[2rem] text-center">
              {item.quantity}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
              disabled={item.quantity >= item.stockQuantity}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Price */}
          <div className="text-right min-w-[80px]">
            {isEditingThisPrice ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={tempPrice}
                  onChange={(e) => setTempPrice(e.target.value)}
                  className="h-8 w-20 text-xs"
                  step="0.01"
                  min="0"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => savePriceEdit(item.productId)}
                >
                  <Check className="h-3 w-3 text-green-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={cancelPriceEdit}
                >
                  <X className="h-3 w-3 text-red-600" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <div className="text-sm font-medium">
                  {formatCurrency(item.unitPrice)}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => startPriceEdit(item.productId, item.unitPrice)}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="text-sm font-semibold min-w-[80px] text-right">
            {formatCurrency(item.totalPrice)}
          </div>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => removeFromCart(item.productId)}
          >
            <Trash2 className="h-3 w-3 text-red-600" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Cart ({cart.length})
          </CardTitle>
          {cart.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearCart}
            >
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {cart.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Your cart is empty</p>
            <p className="text-sm text-muted-foreground">Add products to get started</p>
          </div>
        ) : (
          <div className="space-y-0">
            {/* Cart Items */}
            <div className="max-h-96 overflow-y-auto">
              {cart.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>

            <Separator className="my-4" />

            {/* Cart Summary */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>VAT (18%):</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-base font-semibold">
                <span>Total:</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
