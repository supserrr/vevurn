import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const tokens = localStorage.getItem('auth_tokens');
        if (tokens) {
          try {
            const parsedTokens = JSON.parse(tokens);
            config.headers.Authorization = `Bearer ${parsedTokens.accessToken}`;
          } catch (error) {
            localStorage.removeItem('auth_tokens');
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const tokens = localStorage.getItem('auth_tokens');
          if (tokens) {
            try {
              const parsedTokens = JSON.parse(tokens);
              const refreshResponse = await this.client.post('/auth/refresh-token', {
                refreshToken: parsedTokens.refreshToken,
              });

              if (refreshResponse.data.success) {
                const newTokens = refreshResponse.data.data;
                localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
                
                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
                return this.client(originalRequest);
              }
            } catch (refreshError) {
              // Refresh failed, redirect to login
              localStorage.removeItem('auth_tokens');
              localStorage.removeItem('auth_user');
              window.location.href = '/login';
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.client.get<T>(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.post<T>(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.put<T>(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.patch<T>(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.client.delete<T>(url, config);
  }

  // Upload file with progress
  async upload<T = any>(
    url: string, 
    formData: FormData, 
    onProgress?: (progressEvent: any) => void
  ) {
    return this.client.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    });
  }

  // Download file
  async download(url: string, filename?: string) {
    const response = await this.client.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }
}

export const api = new ApiClient();
