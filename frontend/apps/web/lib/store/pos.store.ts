import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Customer {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  totalSpent: number;
  totalPurchases: number;
  lastPurchaseAt?: string;
  preferredPaymentMethod?: string;
}

interface CashDrawer {
  isOpen: boolean;
  openingBalance: number;
  currentBalance: number;
  transactions: Array<{
    id: string;
    type: 'SALE' | 'REFUND' | 'CASH_IN' | 'CASH_OUT';
    amount: number;
    timestamp: string;
    reference?: string;
  }>;
  openedAt?: string;
  openedBy?: string;
}

interface Receipt {
  shouldPrint: boolean;
  copies: number;
  showLogo: boolean;
  showAddress: boolean;
  showTaxInfo: boolean;
  showThankYouMessage: boolean;
  customMessage?: string;
}

interface QuickActions {
  enabled: boolean;
  actions: Array<{
    id: string;
    label: string;
    icon: string;
    action: string;
    params?: any;
  }>;
}

interface POSState {
  // Session info
  sessionId: string | null;
  cashierId: string | null;
  sessionStartTime: string | null;
  lastActivity: string | null;
  
  // Current sale
  currentSaleId: string | null;
  saleNumber: string | null;
  
  // Customer context
  selectedCustomer: Customer | null;
  recentCustomers: Customer[];
  
  // Payment processing
  paymentInProgress: boolean;
  paymentMethod: 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CREDIT' | null;
  paymentAmount: number;
  changeAmount: number;
  splitPayments: Array<{
    method: string;
    amount: number;
    status: string;
  }>;
  
  // Cash drawer
  cashDrawer: CashDrawer;
  
  // Receipt settings
  receipt: Receipt;
  
  // Quick actions
  quickActions: QuickActions;
  
  // Barcode scanner
  scannerEnabled: boolean;
  lastScannedCode: string | null;
  scanHistory: Array<{
    code: string;
    timestamp: string;
    found: boolean;
    productId?: string;
  }>;
  
  // Sale stats for current session
  sessionStats: {
    totalSales: number;
    totalAmount: number;
    averageOrderValue: number;
    salesByMethod: Record<string, { count: number; amount: number }>;
  };
  
  // Display settings
  showCustomerDisplay: boolean;
  customerDisplayMessage: string;
  
  // Actions
  // Session management
  startSession: (cashierId: string, openingBalance: number) => void;
  endSession: () => void;
  updateLastActivity: () => void;
  
  // Sale management
  startSale: (saleNumber: string) => void;
  completeSale: (saleId: string) => void;
  cancelSale: () => void;
  
  // Customer management
  setSelectedCustomer: (customer: Customer | null) => void;
  addRecentCustomer: (customer: Customer) => void;
  clearRecentCustomers: () => void;
  
  // Payment management
  setPaymentInProgress: (inProgress: boolean) => void;
  setPaymentMethod: (method: POSState['paymentMethod']) => void;
  setPaymentAmount: (amount: number) => void;
  calculateChange: (amountPaid: number, total: number) => void;
  addSplitPayment: (method: string, amount: number) => void;
  clearSplitPayments: () => void;
  
  // Cash drawer management
  openCashDrawer: (reason?: string) => void;
  closeCashDrawer: () => void;
  addCashTransaction: (type: CashDrawer['transactions'][0]['type'], amount: number, reference?: string) => void;
  setCashBalance: (balance: number) => void;
  
  // Receipt settings
  setReceiptSettings: (settings: Partial<Receipt>) => void;
  
  // Quick actions
  setQuickActions: (actions: QuickActions['actions']) => void;
  executeQuickAction: (actionId: string) => void;
  
  // Barcode scanner
  toggleScanner: () => void;
  processScan: (code: string) => void;
  clearScanHistory: () => void;
  
  // Stats
  updateSessionStats: (saleAmount: number, paymentMethod: string) => void;
  resetSessionStats: () => void;
  
  // Display
  setCustomerDisplayMessage: (message: string) => void;
  toggleCustomerDisplay: () => void;
  
  // Utility
  resetPOSState: () => void;
}

const defaultCashDrawer: CashDrawer = {
  isOpen: false,
  openingBalance: 0,
  currentBalance: 0,
  transactions: []
};

const defaultReceipt: Receipt = {
  shouldPrint: true,
  copies: 1,
  showLogo: true,
  showAddress: true,
  showTaxInfo: true,
  showThankYouMessage: true,
  customMessage: 'Thank you for shopping with us!'
};

const defaultQuickActions: QuickActions = {
  enabled: true,
  actions: [
    { id: 'void-sale', label: 'Void Sale', icon: 'X', action: 'VOID_SALE' },
    { id: 'price-check', label: 'Price Check', icon: 'Search', action: 'PRICE_CHECK' },
    { id: 'open-drawer', label: 'Open Drawer', icon: 'DollarSign', action: 'OPEN_DRAWER' },
    { id: 'reprint-receipt', label: 'Reprint', icon: 'Printer', action: 'REPRINT_RECEIPT' }
  ]
};

export const usePOSStore = create<POSState>()(
  persist(
    (set, get) => ({
      // Initial state
      sessionId: null,
      cashierId: null,
      sessionStartTime: null,
      lastActivity: null,
      
      currentSaleId: null,
      saleNumber: null,
      
      selectedCustomer: null,
      recentCustomers: [],
      
      paymentInProgress: false,
      paymentMethod: null,
      paymentAmount: 0,
      changeAmount: 0,
      splitPayments: [],
      
      cashDrawer: defaultCashDrawer,
      receipt: defaultReceipt,
      quickActions: defaultQuickActions,
      
      scannerEnabled: false,
      lastScannedCode: null,
      scanHistory: [],
      
      sessionStats: {
        totalSales: 0,
        totalAmount: 0,
        averageOrderValue: 0,
        salesByMethod: {}
      },
      
      showCustomerDisplay: false,
      customerDisplayMessage: 'Welcome to VEVURN POS',

      // Session management
      startSession: (cashierId, openingBalance) => {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        set({
          sessionId,
          cashierId,
          sessionStartTime: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          cashDrawer: {
            ...defaultCashDrawer,
            isOpen: true,
            openingBalance,
            currentBalance: openingBalance,
            openedAt: new Date().toISOString(),
            openedBy: cashierId
          },
          sessionStats: {
            totalSales: 0,
            totalAmount: 0,
            averageOrderValue: 0,
            salesByMethod: {}
          }
        });
      },

      endSession: () => set({
        sessionId: null,
        cashierId: null,
        sessionStartTime: null,
        currentSaleId: null,
        saleNumber: null,
        selectedCustomer: null,
        paymentInProgress: false,
        paymentMethod: null,
        paymentAmount: 0,
        changeAmount: 0,
        splitPayments: [],
        cashDrawer: defaultCashDrawer,
        sessionStats: {
          totalSales: 0,
          totalAmount: 0,
          averageOrderValue: 0,
          salesByMethod: {}
        }
      }),

      updateLastActivity: () => set({
        lastActivity: new Date().toISOString()
      }),

      // Sale management
      startSale: (saleNumber) => set({
        currentSaleId: null, // Will be set when sale is created
        saleNumber,
        paymentInProgress: false,
        paymentMethod: null,
        paymentAmount: 0,
        changeAmount: 0,
        splitPayments: []
      }),

      completeSale: (saleId) => {
        const state = get();
        set({
          currentSaleId: null,
          saleNumber: null,
          selectedCustomer: null,
          paymentInProgress: false,
          paymentMethod: null,
          paymentAmount: 0,
          changeAmount: 0,
          splitPayments: []
        });
      },

      cancelSale: () => set({
        currentSaleId: null,
        saleNumber: null,
        paymentInProgress: false,
        paymentMethod: null,
        paymentAmount: 0,
        changeAmount: 0,
        splitPayments: []
      }),

      // Customer management
      setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),

      addRecentCustomer: (customer) => {
        const state = get();
        const filtered = state.recentCustomers.filter(c => c.id !== customer.id);
        set({
          recentCustomers: [customer, ...filtered].slice(0, 10) // Keep last 10
        });
      },

      clearRecentCustomers: () => set({ recentCustomers: [] }),

      // Payment management
      setPaymentInProgress: (inProgress) => set({ paymentInProgress: inProgress }),

      setPaymentMethod: (method) => set({ paymentMethod: method }),

      setPaymentAmount: (amount) => set({ paymentAmount: amount }),

      calculateChange: (amountPaid, total) => {
        const change = Math.max(0, amountPaid - total);
        set({ changeAmount: change });
      },

      addSplitPayment: (method, amount) => {
        const state = get();
        set({
          splitPayments: [...state.splitPayments, {
            method,
            amount,
            status: 'pending'
          }]
        });
      },

      clearSplitPayments: () => set({ splitPayments: [] }),

      // Cash drawer management
      openCashDrawer: (reason = 'Manual open') => {
        const state = get();
        set({
          cashDrawer: {
            ...state.cashDrawer,
            isOpen: true,
            transactions: [...state.cashDrawer.transactions, {
              id: `tx_${Date.now()}`,
              type: 'CASH_OUT',
              amount: 0,
              timestamp: new Date().toISOString(),
              reference: reason
            }]
          }
        });
      },

      closeCashDrawer: () => {
        const state = get();
        set({
          cashDrawer: {
            ...state.cashDrawer,
            isOpen: false
          }
        });
      },

      addCashTransaction: (type, amount, reference) => {
        const state = get();
        const newBalance = type === 'CASH_IN' ? 
          state.cashDrawer.currentBalance + amount :
          state.cashDrawer.currentBalance - amount;

        set({
          cashDrawer: {
            ...state.cashDrawer,
            currentBalance: newBalance,
            transactions: [...state.cashDrawer.transactions, {
              id: `tx_${Date.now()}`,
              type,
              amount,
              timestamp: new Date().toISOString(),
              reference
            }]
          }
        });
      },

      setCashBalance: (balance) => {
        const state = get();
        set({
          cashDrawer: {
            ...state.cashDrawer,
            currentBalance: balance
          }
        });
      },

      // Receipt settings
      setReceiptSettings: (settings) => {
        const state = get();
        set({
          receipt: { ...state.receipt, ...settings }
        });
      },

      // Quick actions
      setQuickActions: (actions) => {
        const state = get();
        set({
          quickActions: { ...state.quickActions, actions }
        });
      },

      executeQuickAction: (actionId) => {
        const state = get();
        const action = state.quickActions.actions.find(a => a.id === actionId);
        // Implementation would depend on the specific action
        console.log('Executing quick action:', action);
      },

      // Barcode scanner
      toggleScanner: () => {
        const state = get();
        set({ scannerEnabled: !state.scannerEnabled });
      },

      processScan: (code) => {
        const state = get();
        set({
          lastScannedCode: code,
          scanHistory: [...state.scanHistory, {
            code,
            timestamp: new Date().toISOString(),
            found: false // This would be updated based on product lookup
          }].slice(-50) // Keep last 50 scans
        });
      },

      clearScanHistory: () => set({ scanHistory: [] }),

      // Stats
      updateSessionStats: (saleAmount, paymentMethod) => {
        const state = get();
        const newTotalSales = state.sessionStats.totalSales + 1;
        const newTotalAmount = state.sessionStats.totalAmount + saleAmount;
        const newAverageOrderValue = newTotalAmount / newTotalSales;

        const currentMethodStats = state.sessionStats.salesByMethod[paymentMethod] || { count: 0, amount: 0 };

        set({
          sessionStats: {
            totalSales: newTotalSales,
            totalAmount: newTotalAmount,
            averageOrderValue: newAverageOrderValue,
            salesByMethod: {
              ...state.sessionStats.salesByMethod,
              [paymentMethod]: {
                count: currentMethodStats.count + 1,
                amount: currentMethodStats.amount + saleAmount
              }
            }
          }
        });
      },

      resetSessionStats: () => set({
        sessionStats: {
          totalSales: 0,
          totalAmount: 0,
          averageOrderValue: 0,
          salesByMethod: {}
        }
      }),

      // Display
      setCustomerDisplayMessage: (message) => set({ customerDisplayMessage: message }),

      toggleCustomerDisplay: () => {
        const state = get();
        set({ showCustomerDisplay: !state.showCustomerDisplay });
      },

      // Utility
      resetPOSState: () => set({
        sessionId: null,
        cashierId: null,
        sessionStartTime: null,
        lastActivity: null,
        currentSaleId: null,
        saleNumber: null,
        selectedCustomer: null,
        recentCustomers: [],
        paymentInProgress: false,
        paymentMethod: null,
        paymentAmount: 0,
        changeAmount: 0,
        splitPayments: [],
        cashDrawer: defaultCashDrawer,
        receipt: defaultReceipt,
        quickActions: defaultQuickActions,
        scannerEnabled: false,
        lastScannedCode: null,
        scanHistory: [],
        sessionStats: {
          totalSales: 0,
          totalAmount: 0,
          averageOrderValue: 0,
          salesByMethod: {}
        },
        showCustomerDisplay: false,
        customerDisplayMessage: 'Welcome to VEVURN POS'
      })
    }),
    {
      name: 'vevurn-pos-storage',
      partialize: (state) => ({
        receipt: state.receipt,
        quickActions: state.quickActions,
        scannerEnabled: state.scannerEnabled,
        showCustomerDisplay: state.showCustomerDisplay,
        customerDisplayMessage: state.customerDisplayMessage
      })
    }
  )
);

// Selectors
export const selectCurrentSession = (state: POSState) => ({
  sessionId: state.sessionId,
  cashierId: state.cashierId,
  sessionStartTime: state.sessionStartTime,
  lastActivity: state.lastActivity
});

export const selectCurrentSale = (state: POSState) => ({
  currentSaleId: state.currentSaleId,
  saleNumber: state.saleNumber,
  selectedCustomer: state.selectedCustomer
});

export const selectPaymentState = (state: POSState) => ({
  paymentInProgress: state.paymentInProgress,
  paymentMethod: state.paymentMethod,
  paymentAmount: state.paymentAmount,
  changeAmount: state.changeAmount,
  splitPayments: state.splitPayments
});

export const selectCashDrawer = (state: POSState) => state.cashDrawer;
export const selectSessionStats = (state: POSState) => state.sessionStats;
export const selectScannerState = (state: POSState) => ({
  enabled: state.scannerEnabled,
  lastScanned: state.lastScannedCode,
  history: state.scanHistory
});
