/**
 * Better Auth React Hooks and Components for Vevurn POS
 * 
 * This file provides React hooks and utilities for Better Auth integration
 * in the Vevurn POS system with POS-specific functionality.
 */

'use client';

import { useSession, signIn, signOut } from './auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { VevurnUser, VevurnSession } from './auth';

// Hook to get current user with POS-specific data
export function useVevurnAuth() {
  const session = useSession();
  
  return {
    user: session.data?.user as VevurnUser | null,
    session: session.data as VevurnSession | null,
    isLoading: session.isPending,
    isAuthenticated: !!session.data?.user,
    error: session.error
  };
}

// Hook to require authentication
export function useRequireAuth(redirectTo: string = '/login') {
  const { isAuthenticated, isLoading } = useVevurnAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`${redirectTo}?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return { isAuthenticated, isLoading };
}

// Hook to require specific role
export function useRequireRole(requiredRoles: string | string[], redirectTo: string = '/dashboard') {
  const { user, isLoading } = useVevurnAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      
      if (!roles.includes(user.role)) {
        router.push(`${redirectTo}?error=insufficient_permissions`);
      }

      if (!user.isActive) {
        router.push('/login?error=account_inactive');
      }
    }
  }, [user, isLoading, requiredRoles, router, redirectTo]);

  return { user, isLoading, hasPermission: user ? (Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]).includes(user.role) : false };
}

// POS-specific permission hooks
export function useDiscountPermission() {
  const { user } = useVevurnAuth();
  
  return {
    maxDiscountAllowed: user?.maxDiscountAllowed || 0,
    canApplyDiscount: (discount: number) => {
      if (!user || !user.isActive) return false;
      return discount <= user.maxDiscountAllowed;
    }
  };
}

export function useBelowMinimumPermission() {
  const { user } = useVevurnAuth();
  
  return {
    canSellBelowMin: user?.canSellBelowMin || false,
    isActive: user?.isActive || false
  };
}

// Authentication action hooks
export function useAuthActions() {
  const router = useRouter();

  const handleSignIn = async (email: string, password: string, callbackUrl?: string) => {
    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Redirect after successful sign in
      router.push(callbackUrl || '/dashboard');
      router.refresh();
      
      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sign in failed' 
      };
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
      router.refresh();
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sign out failed' 
      };
    }
  };

  return {
    signIn: handleSignIn,
    signOut: handleSignOut
  };
}

// Component wrapper for protected content
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallback = <div className="flex justify-center items-center h-64">Loading...</div> 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useRequireAuth();
  
  if (requiredRole) {
    const { hasPermission, isLoading: roleLoading } = useRequireRole(requiredRole);
    
    if (isLoading || roleLoading) {
      return <>{fallback}</>;
    }
    
    if (!isAuthenticated || !hasPermission) {
      return null; // Redirect will be handled by hooks
    }
  } else {
    if (isLoading) {
      return <>{fallback}</>;
    }
    
    if (!isAuthenticated) {
      return null; // Redirect will be handled by hook
    }
  }

  return <>{children}</>;
}

// Component for showing user info
export function UserProfile() {
  const { user, isLoading } = useVevurnAuth();
  const { signOut } = useAuthActions();

  if (isLoading) {
    return <div className="animate-pulse">Loading user...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {user.firstName} {user.lastName}
          </h3>
          <p className="text-sm text-gray-500">{user.email}</p>
          <p className="text-sm text-gray-500 capitalize">Role: {user.role}</p>
          {user.employeeId && (
            <p className="text-sm text-gray-500">Employee ID: {user.employeeId}</p>
          )}
        </div>
        
        <div className="text-right">
          <p className="text-xs text-gray-400">Max Discount: {user.maxDiscountAllowed}%</p>
          <p className="text-xs text-gray-400">Below Min Sales: {user.canSellBelowMin ? 'Yes' : 'No'}</p>
          <div className={`inline-flex px-2 py-1 text-xs rounded-full ${
            user.isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {user.isActive ? 'Active' : 'Inactive'}
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <button
          onClick={signOut}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
