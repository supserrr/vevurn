import { authClient } from './auth-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
                    process.env.NEXT_PUBLIC_BACKEND_URL || 
                    'https://vevurn.onrender.com';

class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Better Auth handles auth headers automatically via cookies
      return headers;
    } catch (error) {
      return {
        'Content-Type': 'application/json',
      };
    }
  }

  async get(url: string): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'GET',
      headers,
      credentials: 'include', // Important for Better Auth cookies
    });

    if (!response.ok) {
      throw new Error(`GET ${url} failed: ${response.statusText}`);
    }

    return response.json();
  }

  async post(url: string, data: any): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'POST',
      headers,
      credentials: 'include', // Important for Better Auth cookies
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`POST ${url} failed: ${response.statusText}`);
    }

    return response.json();
  }

  async put(url: string, data: any): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`PUT ${url} failed: ${response.statusText}`);
    }

    return response.json();
  }

  async delete(url: string): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`DELETE ${url} failed: ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiClient = new APIClient(API_BASE_URL);
