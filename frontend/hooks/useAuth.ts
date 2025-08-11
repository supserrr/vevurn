/**
 * Custom Auth Hooks for Vevurn POS
 * 
 * Enhanced hooks built on top of Better Auth for POS-specific functionality
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, type POSUser, hasAdminAccess, hasManagerAccess, canApplyDiscount, canSellBelowMinimum } from '@/lib/auth-client';
import { toast } from 'sonner';

/**
 * Enhanced session hook with POS-specific permissions
 */
export function usePOSSession() {
  const session = useSession();
  
  return {
    ...session,
    user: session.data?.user as POSUser | undefined,
    isAuthenticated: !!session.data?.user,
    isAdmin: session.data?.user ? hasAdminAccess(session.data.user as POSUser) : false,
    isManager: session.data?.user ? hasManagerAccess(session.data.user as POSUser) : false,
    canApplyDiscount: (amount: number) => 
      session.data?.user ? canApplyDiscount(session.data.user as POSUser, amount) : false,
    canSellBelowMinimum: () => 
      session.data?.user ? canSellBelowMinimum(session.data.user as POSUser) : false,
  };
}

/**
 * Hook for requiring authentication - redirects to login if not authenticated
 */
export function useRequireAuth(redirectTo: string = '/auth/signin') {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session?.user) {
      toast.error('Please sign in to access this page');
      router.push(redirectTo);
    }
  }, [session, isPending, router, redirectTo]);

  return { session, isPending, isAuthenticated: !!session?.user };
}

/**
 * Hook for requiring admin access
 */
export function useRequireAdmin(redirectTo: string = '/dashboard') {
  const { user, isPending } = usePOSSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending) {
      if (!user) {
        toast.error('Please sign in to access this page');
        router.push('/auth/signin');
      } else if (!hasAdminAccess(user)) {
        toast.error('Admin access required');
        router.push(redirectTo);
      }
    }
  }, [user, isPending, router, redirectTo]);

  return { user, isPending, isAdmin: user ? hasAdminAccess(user) : false };
}

/**
 * Hook for requiring manager access (admin or manager)
 */
export function useRequireManager(redirectTo: string = '/dashboard') {
  const { user, isPending } = usePOSSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending) {
      if (!user) {
        toast.error('Please sign in to access this page');
        router.push('/auth/signin');
      } else if (!hasManagerAccess(user)) {
        toast.error('Manager access required');
        router.push(redirectTo);
      }
    }
  }, [user, isPending, router, redirectTo]);

  return { user, isPending, isManager: user ? hasManagerAccess(user) : false };
}

/**
 * Hook for handling session expiration
 */
export function useSessionExpiration() {
  const { data: session, error } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (error && error.message?.includes('session')) {
      toast.error('Your session has expired. Please sign in again.');
      router.push('/auth/signin');
    }
  }, [error, router]);

  return { session, error };
}
