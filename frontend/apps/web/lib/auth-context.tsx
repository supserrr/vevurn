'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useSession } from '@/lib/auth-client';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();

  const value: AuthContextType = {
    user: session?.user ? {
      id: session.user.id,
      name: session.user.name || '',
      email: session.user.email,
      role: (session.user as any).role || 'CASHIER', // Better Auth additional fields
    } : null,
    isAuthenticated: !!session?.user,
    isLoading: isPending,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
