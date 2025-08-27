import React from 'react';

// Simple auth client for Vevurn POS
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthSession {
  user: User | null;
  isAuthenticated: boolean;
}

class SimpleAuthClient {
  private session: AuthSession = {
    user: null,
    isAuthenticated: false
  };

  async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.session = {
          user: data.data.user,
          isAuthenticated: true
        };
        return { success: true, user: data.data.user };
      } else {
        return { success: false, error: data.message || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.session = {
        user: null,
        isAuthenticated: false
      };
    }
  }

  async getSession(): Promise<AuthSession> {
    try {
      const response = await fetch(`${API_BASE}/api/auth/session`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.user) {
          this.session = {
            user: data.data.user,
            isAuthenticated: true
          };
        } else {
          this.session = {
            user: null,
            isAuthenticated: false
          };
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
      this.session = {
        user: null,
        isAuthenticated: false
      };
    }
    
    return this.session;
  }

  getCurrentSession(): AuthSession {
    return this.session;
  }
}

export const simpleAuth = new SimpleAuthClient();

// Legacy exports for compatibility
export const signIn = {
  email: async (credentials: { email: string; password: string }, options?: any) => {
    const result = await simpleAuth.login(credentials.email, credentials.password);
    
    if (options?.onRequest) options.onRequest({});
    if (options?.onResponse) options.onResponse({});
    
    if (result.success) {
      if (options?.onSuccess) options.onSuccess();
    } else {
      if (options?.onError) options.onError({ error: { message: result.error } });
    }
    
    return result;
  }
};

export const signOut = async () => {
  await simpleAuth.logout();
};

export const useSession = () => {
  const [session, setSession] = React.useState<AuthSession>({ user: null, isAuthenticated: false });
  
  React.useEffect(() => {
    simpleAuth.getSession().then(setSession);
  }, []);
  
  return { data: session };
};
