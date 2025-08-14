'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoginCredentials, AuthTokens, ApiResponse } from '@/lib/types';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
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
      
      const response = await apiClient.post<ApiResponse<{ user: User; tokens: AuthTokens }>>('/auth/login', credentials);
      
      if (response.data.success && response.data.data) {
        const { user: userData, tokens: userTokens } = response.data.data;
        
        setUser(userData);
        setTokens(userTokens);
        
        // Store in localStorage
        localStorage.setItem('authUser', JSON.stringify(userData));
        localStorage.setItem('authTokens', JSON.stringify(userTokens));
        
        toast.success('Login successful!');
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
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
