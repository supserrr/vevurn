import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Theme {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  accentColor: string;
}

interface Layout {
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  headerHeight: number;
  showBreadcrumbs: boolean;
}

interface Notifications {
  enabled: boolean;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  duration: number;
  showStockAlerts: boolean;
  showPaymentAlerts: boolean;
  soundEnabled: boolean;
}

interface DataTable {
  defaultPageSize: number;
  showRowNumbers: boolean;
  enableColumnResizing: boolean;
  enableSorting: boolean;
  enableFiltering: boolean;
}

interface POS {
  defaultView: 'grid' | 'list';
  showProductImages: boolean;
  enableBarcodeScanner: boolean;
  autoCalculateChange: boolean;
  enableQuickActions: boolean;
  defaultPaymentMethod: 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER';
}

interface UIState {
  // Theme settings
  theme: Theme;
  
  // Layout settings
  layout: Layout;
  
  // Notification settings
  notifications: Notifications;
  
  // Data table preferences
  dataTable: DataTable;
  
  // POS interface settings
  pos: POS;
  
  // Modal and dialog states
  modals: {
    productForm: boolean;
    customerForm: boolean;
    paymentModal: boolean;
    settingsModal: boolean;
    confirmDialog: boolean;
  };
  
  // Loading states
  loading: {
    products: boolean;
    customers: boolean;
    sales: boolean;
    reports: boolean;
  };
  
  // UI state
  selectedItems: string[];
  searchQuery: string;
  activeFilters: Record<string, any>;
  
  // Actions
  setTheme: (theme: Partial<Theme>) => void;
  setLayout: (layout: Partial<Layout>) => void;
  setNotifications: (notifications: Partial<Notifications>) => void;
  setDataTable: (dataTable: Partial<DataTable>) => void;
  setPOS: (pos: Partial<POS>) => void;
  
  // Modal actions
  openModal: (modalName: keyof UIState['modals']) => void;
  closeModal: (modalName: keyof UIState['modals']) => void;
  closeAllModals: () => void;
  
  // Loading actions
  setLoading: (section: keyof UIState['loading'], loading: boolean) => void;
  
  // Selection actions
  setSelectedItems: (items: string[]) => void;
  toggleSelectedItem: (item: string) => void;
  clearSelection: () => void;
  
  // Search and filter actions
  setSearchQuery: (query: string) => void;
  setActiveFilters: (filters: Record<string, any>) => void;
  clearFilters: () => void;
  
  // Reset functions
  resetToDefaults: () => void;
  resetTheme: () => void;
  resetLayout: () => void;
}

const defaultTheme: Theme = {
  mode: 'light',
  primaryColor: '#16a34a', // Green
  accentColor: '#ea580c'   // Orange
};

const defaultLayout: Layout = {
  sidebarCollapsed: false,
  sidebarWidth: 280,
  headerHeight: 64,
  showBreadcrumbs: true
};

const defaultNotifications: Notifications = {
  enabled: true,
  position: 'top-right',
  duration: 5000,
  showStockAlerts: true,
  showPaymentAlerts: true,
  soundEnabled: false
};

const defaultDataTable: DataTable = {
  defaultPageSize: 20,
  showRowNumbers: true,
  enableColumnResizing: true,
  enableSorting: true,
  enableFiltering: true
};

const defaultPOS: POS = {
  defaultView: 'grid',
  showProductImages: true,
  enableBarcodeScanner: true,
  autoCalculateChange: true,
  enableQuickActions: true,
  defaultPaymentMethod: 'CASH'
};

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: defaultTheme,
      layout: defaultLayout,
      notifications: defaultNotifications,
      dataTable: defaultDataTable,
      pos: defaultPOS,
      
      modals: {
        productForm: false,
        customerForm: false,
        paymentModal: false,
        settingsModal: false,
        confirmDialog: false
      },
      
      loading: {
        products: false,
        customers: false,
        sales: false,
        reports: false
      },
      
      selectedItems: [],
      searchQuery: '',
      activeFilters: {},

      // Settings actions
      setTheme: (theme) => set((state) => ({
        theme: { ...state.theme, ...theme }
      })),

      setLayout: (layout) => set((state) => ({
        layout: { ...state.layout, ...layout }
      })),

      setNotifications: (notifications) => set((state) => ({
        notifications: { ...state.notifications, ...notifications }
      })),

      setDataTable: (dataTable) => set((state) => ({
        dataTable: { ...state.dataTable, ...dataTable }
      })),

      setPOS: (pos) => set((state) => ({
        pos: { ...state.pos, ...pos }
      })),

      // Modal actions
      openModal: (modalName) => set((state) => ({
        modals: { ...state.modals, [modalName]: true }
      })),

      closeModal: (modalName) => set((state) => ({
        modals: { ...state.modals, [modalName]: false }
      })),

      closeAllModals: () => set({
        modals: {
          productForm: false,
          customerForm: false,
          paymentModal: false,
          settingsModal: false,
          confirmDialog: false
        }
      }),

      // Loading actions
      setLoading: (section, loading) => set((state) => ({
        loading: { ...state.loading, [section]: loading }
      })),

      // Selection actions
      setSelectedItems: (items) => set({ selectedItems: items }),

      toggleSelectedItem: (item) => set((state) => {
        const isSelected = state.selectedItems.includes(item);
        return {
          selectedItems: isSelected
            ? state.selectedItems.filter(i => i !== item)
            : [...state.selectedItems, item]
        };
      }),

      clearSelection: () => set({ selectedItems: [] }),

      // Search and filter actions
      setSearchQuery: (query) => set({ searchQuery: query }),

      setActiveFilters: (filters) => set({ activeFilters: filters }),

      clearFilters: () => set({ 
        activeFilters: {},
        searchQuery: ''
      }),

      // Reset functions
      resetToDefaults: () => set({
        theme: defaultTheme,
        layout: defaultLayout,
        notifications: defaultNotifications,
        dataTable: defaultDataTable,
        pos: defaultPOS,
        selectedItems: [],
        searchQuery: '',
        activeFilters: {}
      }),

      resetTheme: () => set({ theme: defaultTheme }),

      resetLayout: () => set({ layout: defaultLayout })
    }),
    {
      name: 'vevurn-ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        layout: state.layout,
        notifications: state.notifications,
        dataTable: state.dataTable,
        pos: state.pos
      })
    }
  )
);

// Selectors for common use cases
export const selectTheme = (state: UIState) => state.theme;
export const selectLayout = (state: UIState) => state.layout;
export const selectNotifications = (state: UIState) => state.notifications;
export const selectPOSSettings = (state: UIState) => state.pos;
export const selectIsLoading = (section: keyof UIState['loading']) => (state: UIState) => state.loading[section];
export const selectSelectedItems = (state: UIState) => state.selectedItems;
export const selectSearchQuery = (state: UIState) => state.searchQuery;
export const selectActiveFilters = (state: UIState) => state.activeFilters;
