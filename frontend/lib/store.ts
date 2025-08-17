import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Product, Customer, Sale } from '../../shared/src/types';

// Cart item with additional display info
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  discount: number;
  totalPrice: number;
  stockQuantity: number;
}

// Store interface
interface POSStore {
  // Cart state
  cart: CartItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  
  // Current transaction
  currentCustomer: Customer | null;
  paymentMethod: 'CASH' | 'MOMO_MTN' | 'MOMO_AIRTEL' | 'BANK_TRANSFER' | 'CARD' | null;
  momoPhone: string;
  cashReceived: number;
  changeAmount: number;
  
  // UI state
  isProcessingPayment: boolean;
  showReceipt: boolean;
  currentSale: Sale | null;
  
  // Actions
  addToCart: (product: Product, quantity?: number, customPrice?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  updateCartItemPrice: (productId: string, price: number) => void;
  clearCart: () => void;
  
  // Customer actions
  setCurrentCustomer: (customer: Customer | null) => void;
  
  // Payment actions
  setPaymentMethod: (method: POSStore['paymentMethod']) => void;
  setMomoPhone: (phone: string) => void;
  setCashReceived: (amount: number) => void;
  
  // Transaction actions
  setProcessingPayment: (processing: boolean) => void;
  setShowReceipt: (show: boolean) => void;
  setCurrentSale: (sale: Sale | null) => void;
  
  // Business logic
  calculateTotals: () => void;
  resetTransaction: () => void;
}

// VAT rate for Rwanda
const VAT_RATE = 0.18;

export const usePOSStore = create<POSStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        cart: [],
        subtotal: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: 0,
        
        currentCustomer: null,
        paymentMethod: null,
        momoPhone: '',
        cashReceived: 0,
        changeAmount: 0,
        
        isProcessingPayment: false,
        showReceipt: false,
        currentSale: null,
        
        // Cart actions
        addToCart: (product: Product, quantity = 1, customPrice?: number) => {
          const state = get();
          const existingItem = state.cart.find(item => item.productId === product.id);
          
          if (existingItem) {
            // Update quantity if item already exists
            get().updateCartItemQuantity(product.id, existingItem.quantity + quantity);
            return;
          }
          
          // Add new item
          const unitPrice = customPrice || product.unitPrice;
          const totalPrice = unitPrice * quantity;
          
          const cartItem: CartItem = {
            id: `cart_${product.id}_${Date.now()}`,
            productId: product.id,
            name: product.name,
            sku: product.sku,
            quantity,
            unitPrice,
            originalPrice: product.unitPrice,
            discount: 0,
            totalPrice,
            stockQuantity: product.currentStock,
          };
          
          set(state => ({
            cart: [...state.cart, cartItem]
          }));
          
          get().calculateTotals();
        },
        
        removeFromCart: (productId: string) => {
          set(state => ({
            cart: state.cart.filter(item => item.productId !== productId)
          }));
          get().calculateTotals();
        },
        
        updateCartItemQuantity: (productId: string, quantity: number) => {
          if (quantity <= 0) {
            get().removeFromCart(productId);
            return;
          }
          
          set(state => ({
            cart: state.cart.map(item => 
              item.productId === productId
                ? { 
                    ...item, 
                    quantity,
                    totalPrice: item.unitPrice * quantity
                  }
                : item
            )
          }));
          
          get().calculateTotals();
        },
        
        updateCartItemPrice: (productId: string, price: number) => {
          set(state => ({
            cart: state.cart.map(item => 
              item.productId === productId
                ? { 
                    ...item, 
                    unitPrice: price,
                    totalPrice: price * item.quantity,
                    discount: Math.max(0, item.originalPrice - price)
                  }
                : item
            )
          }));
          
          get().calculateTotals();
        },
        
        clearCart: () => {
          set({
            cart: [],
            subtotal: 0,
            taxAmount: 0,
            totalAmount: 0
          });
        },
        
        // Customer actions
        setCurrentCustomer: (customer: Customer | null) => {
          set({ currentCustomer: customer });
        },
        
        // Payment actions
        setPaymentMethod: (method: POSStore['paymentMethod']) => {
          set({ paymentMethod: method });
        },
        
        setMomoPhone: (phone: string) => {
          set({ momoPhone: phone });
        },
        
        setCashReceived: (amount: number) => {
          const state = get();
          const changeAmount = Math.max(0, amount - state.totalAmount);
          set({ 
            cashReceived: amount,
            changeAmount
          });
        },
        
        // Transaction actions
        setProcessingPayment: (processing: boolean) => {
          set({ isProcessingPayment: processing });
        },
        
        setShowReceipt: (show: boolean) => {
          set({ showReceipt: show });
        },
        
        setCurrentSale: (sale: Sale | null) => {
          set({ currentSale: sale });
        },
        
        // Business logic
        calculateTotals: () => {
          const state = get();
          const subtotal = state.cart.reduce((sum, item) => sum + item.totalPrice, 0);
          const taxAmount = subtotal * VAT_RATE;
          const totalAmount = subtotal + taxAmount - state.discountAmount;
          
          set({
            subtotal,
            taxAmount,
            totalAmount: Math.max(0, totalAmount)
          });
        },
        
        resetTransaction: () => {
          set({
            cart: [],
            subtotal: 0,
            taxAmount: 0,
            discountAmount: 0,
            totalAmount: 0,
            currentCustomer: null,
            paymentMethod: null,
            momoPhone: '',
            cashReceived: 0,
            changeAmount: 0,
            isProcessingPayment: false,
            showReceipt: false,
            currentSale: null,
          });
        },
      }),
      {
        name: 'pos-store',
        partialize: (state) => ({
          cart: state.cart,
          currentCustomer: state.currentCustomer,
          paymentMethod: state.paymentMethod,
          momoPhone: state.momoPhone,
        }),
      }
    ),
    {
      name: 'pos-store',
    }
  )
);
