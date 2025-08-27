'use client';
import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER';
  businessId?: string;
  isActive: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/sign-in/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      await checkAuth();
      return { success: true };
    } else {
      const error = await response.json();
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await fetch('/api/auth/sign-out', {
      method: 'POST',
      credentials: 'include'
    });
    setUser(null);
  };

  return { user, loading, login, logout, refetch: checkAuth };
}
