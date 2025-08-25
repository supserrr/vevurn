import { create } from 'zustand';
import { CartItem, Product, PaymentMethod } from '../../types';

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getSubtotal: () => number;
  getTaxAmount: () => number;
  getItemCount: () => number;
  applyDiscount: (productId: string, discount: number) => void;
}

const TAX_RATE = 0.18; // 18% VAT for Rwanda

export const useCart = create<CartStore>((set, get) => ({
  items: [],
  
  addItem: (product, quantity = 1) => {
    const items = get().items;
    const existingIndex = items.findIndex(item => item.product.id === product.id);
    
    if (existingIndex >= 0) {
      const newItems = [...items];
      const existingItem = newItems[existingIndex];
      if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.totalPrice = existingItem.quantity * existingItem.unitPrice;
      }
      set({ items: newItems });
    } else {
      const unitPrice = parseFloat(product.retailPrice);
      const newItem: CartItem = {
        product,
        quantity,
        unitPrice,
        totalPrice: unitPrice * quantity,
        discount: 0
      };
      set({ items: [...items, newItem] });
    }
  },
  
  removeItem: (productId) => {
    set({
      items: get().items.filter(item => item.product.id !== productId)
    });
  },
  
  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    
    const items = get().items.map(item => {
      if (item.product.id === productId) {
        const discountAmount = (item.discount || 0) / 100 * item.unitPrice;
        const discountedPrice = item.unitPrice - discountAmount;
        return {
          ...item,
          quantity,
          totalPrice: quantity * discountedPrice
        };
      }
      return item;
    });
    set({ items });
  },
  
  applyDiscount: (productId, discount) => {
    const items = get().items.map(item => {
      if (item.product.id === productId) {
        const discountAmount = (discount / 100) * item.unitPrice;
        const discountedPrice = item.unitPrice - discountAmount;
        return {
          ...item,
          discount,
          totalPrice: item.quantity * discountedPrice
        };
      }
      return item;
    });
    set({ items });
  },
  
  clearCart: () => set({ items: [] }),
  
  getSubtotal: () => {
    return get().items.reduce((total, item) => total + item.totalPrice, 0);
  },
  
  getTaxAmount: () => {
    const subtotal = get().getSubtotal();
    return subtotal * TAX_RATE;
  },
  
  getTotal: () => {
    const subtotal = get().getSubtotal();
    const tax = get().getTaxAmount();
    return subtotal + tax;
  },
  
  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  }
}));
