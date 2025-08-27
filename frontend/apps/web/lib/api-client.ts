import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from './types';

// Create axios instance with default config
export const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add any additional request configuration here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle token refresh logic
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('authTokens');
        if (refreshToken) {
          const tokens = JSON.parse(refreshToken);
          
          const response = await axios.post('/auth/refresh-token', {
            refreshToken: tokens.refreshToken,
          });

          if (response.data.success) {
            const newTokens = response.data.data.tokens;
            localStorage.setItem('authTokens', JSON.stringify(newTokens));
            
            // Update the authorization header
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${newTokens.accessToken}`;
            originalRequest.headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
            
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('authTokens');
        localStorage.removeItem('authUser');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
