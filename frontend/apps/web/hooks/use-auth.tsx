'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoginCredentials, SignupCredentials, AuthTokens, ApiResponse } from '@/lib/types';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!tokens;

  // Load stored auth data on mount
  useEffect(() => {
    const loadStoredAuth = () => {
      try {
        const storedTokens = localStorage.getItem('authTokens');
        const storedUser = localStorage.getItem('authUser');

        if (storedTokens && storedUser) {
          setTokens(JSON.parse(storedTokens));
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error loading stored auth data:', error);
        localStorage.removeItem('authTokens');
        localStorage.removeItem('authUser');
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  // Setup API client interceptors when tokens change
  useEffect(() => {
    if (tokens?.accessToken) {
      // Add auth header to requests
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
    }
  }, [tokens]);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      
      const response = await apiClient.post('/api/auth/sign-in/email', {
        email: credentials.email,
        password: credentials.password,
      });
      
      // Better Auth typically returns user data directly
      if (response.data && response.data.user) {
        const userData = response.data.user;
        
        setUser(userData);
        // For Better Auth, we might not get explicit tokens, but the session is handled by cookies
        setTokens({
          accessToken: 'session-based',
          refreshToken: 'session-based',
          tokenType: 'Bearer',
          expiresIn: 604800 // 7 days as configured in auth.ts
        });
        
        // Store in localStorage
        localStorage.setItem('authUser', JSON.stringify(userData));
        localStorage.setItem('authTokens', JSON.stringify({
          accessToken: 'session-based',
          refreshToken: 'session-based',
          tokenType: 'Bearer',
          expiresIn: 604800
        }));
        
        toast.success('Login successful!');
      } else {
        throw new Error('Login failed - no user data received');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Login failed';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    try {
      setIsLoading(true);
      
      const response = await apiClient.post('/api/auth/sign-up/email', {
        email: credentials.email,
        password: credentials.password,
        name: credentials.name,
        phoneNumber: credentials.phoneNumber,
      });
      
      // Better Auth signup typically returns success or user data
      if (response.data) {
        toast.success('Account created successfully! Please sign in.');
      } else {
        throw new Error('Signup failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Signup failed';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setTokens(null);
    
    // Clear localStorage
    localStorage.removeItem('authUser');
    localStorage.removeItem('authTokens');
    
    // Remove auth header
    delete apiClient.defaults.headers.common['Authorization'];
    
    toast.success('Logged out successfully');
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      if (!tokens?.refreshToken) {
        return false;
      }

      const response = await apiClient.post<ApiResponse<{ tokens: AuthTokens }>>('/auth/refresh-token', {
        refreshToken: tokens.refreshToken,
      });

      if (response.data.success && response.data.data) {
        const newTokens = response.data.data.tokens;
        setTokens(newTokens);
        localStorage.setItem('authTokens', JSON.stringify(newTokens));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
