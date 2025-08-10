import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Cart {
  items: CartItem[];
  total: number;
  customerId?: string;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface AppStore {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Cart state
  cart: Cart;
  addToCart: (product: any, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setCustomer: (customerId: string) => void;
  
  // UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useStore = create<AppStore>((set) => ({
  // User state
  user: null,
  setUser: (user) => set({ user }),
  
  // Cart state
  cart: {
    items: [],
    total: 0,
    customerId: undefined,
  },
  
  addToCart: (product, quantity) =>
    set((state) => {
      const existingItem = state.cart.items.find(
        (item) => item.productId === product.id
      );
      
      let newItems;
      if (existingItem) {
        newItems = state.cart.items.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                subtotal: (item.quantity + quantity) * item.price,
              }
            : item
        );
      } else {
        newItems = [
          ...state.cart.items,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity,
            subtotal: product.price * quantity,
          },
        ];
      }
      
      const total = newItems.reduce((sum, item) => sum + item.subtotal, 0);
      
      return {
        cart: {
          ...state.cart,
          items: newItems,
          total,
        },
      };
    }),
    
  removeFromCart: (productId) =>
    set((state) => {
      const newItems = state.cart.items.filter(
        (item) => item.productId !== productId
      );
      const total = newItems.reduce((sum, item) => sum + item.subtotal, 0);
      
      return {
        cart: {
          ...state.cart,
          items: newItems,
          total,
        },
      };
    }),
    
  updateQuantity: (productId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return state;
      }
      
      const newItems = state.cart.items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.price,
            }
          : item
      );
      
      const total = newItems.reduce((sum, item) => sum + item.subtotal, 0);
      
      return {
        cart: {
          ...state.cart,
          items: newItems,
          total,
        },
      };
    }),
    
  clearCart: () =>
    set({
      cart: {
        items: [],
        total: 0,
        customerId: undefined,
      },
    }),
    
  setCustomer: (customerId) =>
    set((state) => ({
      cart: {
        ...state.cart,
        customerId,
      },
    })),
  
  // UI state
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
