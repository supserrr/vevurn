import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  employeeId?: string;
  department?: string;
  phoneNumber?: string;
  lastLoginAt?: Date;
}

interface Session {
  user: User;
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  };
}

interface AuthState {
  // State
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (user: User, session: Session) => void;
  logout: () => void;
  clearError: () => void;
  updateUser: (updates: Partial<User>) => void;
  
  // Computed properties
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
  isCashier: () => boolean;
  canManageProducts: () => boolean;
  canManageUsers: () => boolean;
  canViewReports: () => boolean;
  canProcessRefunds: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),

      setSession: (session) => set({ session }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      login: (user, session) => set({
        user,
        session,
        isAuthenticated: true,
        error: null,
        isLoading: false
      }),

      logout: () => set({
        user: null,
        session: null,
        isAuthenticated: false,
        error: null,
        isLoading: false
      }),

      clearError: () => set({ error: null }),

      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates }
          });
        }
      },

      // Role-based permissions
      hasRole: (role) => {
        const user = get().user;
        return user?.role === role;
      },

      hasAnyRole: (roles) => {
        const user = get().user;
        return user ? roles.includes(user.role) : false;
      },

      isAdmin: () => {
        return get().hasRole('ADMIN');
      },

      isManager: () => {
        return get().hasRole('MANAGER');
      },

      isCashier: () => {
        return get().hasRole('CASHIER');
      },

      canManageProducts: () => {
        return get().hasAnyRole(['ADMIN', 'MANAGER']);
      },

      canManageUsers: () => {
        return get().isAdmin();
      },

      canViewReports: () => {
        return get().hasAnyRole(['ADMIN', 'MANAGER']);
      },

      canProcessRefunds: () => {
        return get().hasAnyRole(['ADMIN', 'MANAGER']);
      }
    }),
    {
      name: 'vevurn-auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// Selectors for common use cases
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectUserRole = (state: AuthState) => state.user?.role;
export const selectUserName = (state: AuthState) => state.user?.name;
export const selectCanManageProducts = (state: AuthState) => state.canManageProducts();
export const selectCanViewReports = (state: AuthState) => state.canViewReports();
